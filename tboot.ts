import { Tokeniser } from "./tokeniser"
import { Parser, class_Statement, StatementKind, Statement, ParsedType, TypeKind, class_ParsedType } from "./parser"
import { readFileSync, writeFileSync } from "fs";
import { generateTS } from "./generateTS"
import { getBlockDefinitions, inferPublicInterface, inferBlock,IdentifierOrigin,  IdentifierOriginKind, class_IdentifierOrigin } from "./infer"
import { join } from "path"

interface CribModule {
    path: string;
    block: class_Statement[];
    definitions: Map<string, class_IdentifierOrigin>;
    scope?: Map<string, class_IdentifierOrigin>;
}

function parseModule(path: string): class_Statement[] {
    const text = readFileSync(path, "utf-8");
    const tokeniser = Tokeniser(text);
    const parser = Parser(tokeniser);
    const block = parser.parseBlock();
    return block;
}

export function importScope(scope: Map<string, class_IdentifierOrigin>, stmt: class_Statement) {
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
        if (!defn.isPublic) {
            console.log(`Module ${stmt.identifier} does not export ${ident} publicly`)
//            throw new Error(`Module ${stmt.identifier} does not export ${ident} publicly`)
        }
        if (defn.kind === StatementKind.ClassStatement)
            imports.push("class_" + ident);
        imports.push(ident);
    }

    return `import { ${imports.join(", ")}} from "${stmt.identifier}"`
}

const modules = new Map<string, CribModule>();

const systemModule = Statement(StatementKind.ModuleStatement)

function load(path: string) {
    const loading: CribModule[] = [];

    function loadModule(path: string):CribModule {
//        console.log("loading", path)
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

        const moduleScope = new Map<string, class_IdentifierOrigin>();
        
        const fakePanicStatement = Statement(StatementKind.FunctionStatement);
        fakePanicStatement.identifier = "panic";
        fakePanicStatement.type = ParsedType(TypeKind.voidType, null, null);
        moduleScope.set("panic", IdentifierOrigin(IdentifierOriginKind.Function, ParsedType(TypeKind.functionType, null, fakePanicStatement), systemModule, false));

        const fakeImportStatement = Statement(StatementKind.FunctionStatement);
        fakeImportStatement.identifier = "panic";
        fakeImportStatement.type = ParsedType(TypeKind.stringType, null, null);
        moduleScope.set("generateTSImport", IdentifierOrigin(IdentifierOriginKind.Function, ParsedType(TypeKind.functionType, null, fakeImportStatement), systemModule, false));

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

const path = join(process.cwd(), filename);
load(path)

const moduleStatement = Statement(StatementKind.ModuleStatement);

for (const m of modules.values()) {
    inferBlock(m.block, m.scope!, moduleStatement);

//const validator = ResolveTypes(block, initialScope);

    const generated = generateTS(m.block);

    writeFileSync(m.path.substring(0, m.path.length - 5) + ".ts", generated.result.join("\n"));
}
