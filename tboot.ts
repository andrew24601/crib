import { descopeCode } from "./bootstrap"
import { Tokeniser } from "./tokeniser"
import { Parser, class_Statement, StatementKind, Statement, ParsedType, TypeKind } from "./parser"
import { readFileSync, writeFileSync } from "fs";
import { StringMap, class_StringMap } from "./runtime"
import { generateTS } from "./generateTS"
import { getBlockDefinitions, inferPublicInterface, inferBlock } from "./infer"
import { join } from "path"

interface CribModule {
    path: string;
    block: class_Statement[];
    definitions: class_StringMap;
    scope?: class_StringMap;
}

function parseModule(path: string): class_Statement[] {
    const text = readFileSync(path, "utf-8");
    const tokeniser = Tokeniser(text);
    const parser = Parser(tokeniser);
    const block = parser.parseBlock();
    return block;
}

export function importScope(scope: class_StringMap, stmt: class_Statement) {
    const module = parseModule("./" + stmt.identifier + ".crib")
    const definitions = getBlockDefinitions(module, null)

    for (const ident of stmt.identifierList) {
        const defn = definitions.get(ident)
        if (!defn) {
            throw new Error(`Module ${stmt.identifier} does not export ${ident}`)
        }
        scope.set(ident, defn);
    }
}

export function generateTSImport(stmt: class_Statement) {
    const module = parseModule("./" + stmt.identifier + ".crib")
    const exports = new Map<string, class_Statement>();
    const imports: string[] = [];

    for (const stmt of module) {
        if (stmt.kind === StatementKind.FunctionStatement || stmt.kind === StatementKind.ClassStatement || stmt.kind === StatementKind.EnumStatement) {
            exports.set(stmt.identifier!, stmt)
        }
    }

    for (const ident of stmt.identifierList) {
        const defn = exports.get(ident)
        if (!defn) {
            throw new Error(`Module ${stmt.identifier} does not export ${ident}`)
        }
        if (defn.kind === StatementKind.ClassStatement)
            imports.push("class_" + ident);
        imports.push(ident);
    }

    return `import { ${imports.join(", ")}} from "${stmt.identifier}"`
}


function load(path: string) {
    const modules = new Map<string, CribModule>();
    const loading: CribModule[] = [];

    function loadModule(path: string):CribModule {
        console.log("loading", path)
        if (modules.has(path)) {
            return modules.get(path)!;
        }
        const block = parseModule(path);
        const definitions = getBlockDefinitions(block, null)
        const module: CribModule = {
            path,
            block,
            definitions
        }
        modules.set(path, module);
        loading.push(module);
        return module;
    }

    const mainModule = loadModule(path);
    while (loading.length > 0) {
        const module = loading.pop()!;

        const moduleScope = StringMap(null);
        const stringMapType = ParsedType(TypeKind.classType, null, Statement(StatementKind.ClassStatement))
        stringMapType.stmt!.identifier = "StringMap";
        moduleScope.set("StringMap", stringMapType);
        
        for (const stmt of module.block) {
            if (stmt.kind === StatementKind.ImportStatement) {
                const ref = loadModule(join(module.path, "..", stmt.identifier + ".crib"));

                for (const ident of stmt.identifierList) {
                    const defn = ref.definitions.get(ident)
                    if (!defn) {
                        throw new Error(`Module ${stmt.identifier} does not export ${ident}`)
                    }
                    moduleScope.set(ident, defn);
                }
            }
        }

        inferPublicInterface(module.block, moduleScope);

        module.scope = moduleScope;
    }

    return mainModule;
}

const filename = process.argv[2];

const path = join(process.cwd(), filename + ".crib");
const mainModule = load(path)

console.log(inferBlock(mainModule.block, mainModule.scope!).v.keys());

//const validator = ResolveTypes(block, initialScope);

descopeCode([], mainModule.block, null, false)

const generated = generateTS(mainModule.block);

writeFileSync(`${filename}.ts`, generated.result.join("\n"));
