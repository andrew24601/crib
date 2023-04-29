import { Tokeniser } from "./tokeniser"
import { Parser, class_Statement, StatementKind, Statement, ParsedType, TypeKind, class_ParsedType, DefnArgument, class_World, World } from "./parser"
import { readFileSync, writeFileSync } from "fs";
import { generateTS } from "./generateTS"
import { getBlockDefinitions, inferPublicInterface, inferBlock,IdentifierOrigin,  IdentifierOriginKind, class_IdentifierOrigin, inferAsync } from "./infer"
import { basename, extname, join } from "path"

interface CribModule {
    path: string;
    block: class_Statement[];
    definitions: Map<string, class_IdentifierOrigin>;
    scope?: Map<string, class_IdentifierOrigin>;
}

let world: class_World

function parseModule(path: string): class_Statement[] {
    const text = readFileSync(path, "utf-8");
    const tokeniser = Tokeniser(text);
    const parser = Parser(tokeniser, world);
    const block = parser.parseBlock();
    return block;
}

type IntrinsicModule = {[index: string]: class_Statement};

const intrinsicModules: {[index: string]: IntrinsicModule} = {
    "fs": {
        "readFile": intrinsicAsyncFunction("readFile", ParsedType(TypeKind.stringType, null, null), {path: ParsedType(TypeKind.stringType, null, null)})
    }
}

function intrinsicFunction(name: string, type: class_ParsedType, params: { [name: string]: class_ParsedType }) {
    const stmt = Statement(StatementKind.FunctionStatement);
    stmt.identifier = name;
    stmt.type = type;
    return stmt;
}

function intrinsicAsyncFunction(name: string, type: class_ParsedType, params: { [name: string]: class_ParsedType }) {
    const stmt = Statement(StatementKind.FunctionStatement);
    stmt.identifier = name;
    stmt.type = type;
    stmt.async = true;

    for (const [name, type] of Object.entries(params)) {
        stmt.defnArguments.push(DefnArgument(name, type, false));
    }

    return stmt;
}


export function generateTSImport(stmt: class_Statement) {
    const path = stmt.identifier!.substring(1, stmt.identifier!.length - 1)

    if (!path.startsWith(".")) {
        return `import { ${stmt.identifierList.join(", ")}} from "./runtime"`

    }

    const module = parseModule("./" + path + ".crib")
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
        }
        if (defn.kind === StatementKind.ClassStatement)
            imports.push("class_" + ident);
        imports.push(ident);
    }

    return `import { ${imports.join(", ")}} from "${path}"`
}

const modules = new Map<string, CribModule>();

const systemModule = Statement(StatementKind.ModuleStatement)

world = World();

function load(path: string) {
    const loading: CribModule[] = [];
    
    function loadModule(path: string):CribModule {
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
        fakePanicStatement.defnArguments.push(DefnArgument("message", ParsedType(TypeKind.stringType, null, null), false));

        moduleScope.set("panic", IdentifierOrigin(IdentifierOriginKind.Function, ParsedType(TypeKind.functionType, null, fakePanicStatement), false));

        const fakeImportStatement = Statement(StatementKind.FunctionStatement);
        fakeImportStatement.identifier = "panic";
        fakeImportStatement.type = ParsedType(TypeKind.stringType, null, null);
        fakeImportStatement.defnArguments.push(DefnArgument("stmt", ParsedType(TypeKind.stringType, null, null), false));

        moduleScope.set("generateTSImport", IdentifierOrigin(IdentifierOriginKind.Function, ParsedType(TypeKind.functionType, null, fakeImportStatement), false));

        for (const stmt of module.block) {
            if (stmt.kind === StatementKind.ImportStatement) {
                const path = stmt.identifier!.substring(1, stmt.identifier!.length - 1)

                if (!path.startsWith(".")) {
                    const intrinsic = intrinsicModules[path];
                    if (!intrinsic) {
                        throw new Error(`Module ${path} does not exist`)
                    }
                    for (const ident of stmt.identifierList) {
                        const defn = intrinsic[ident];
                        if (!defn) {
                            throw new Error(`Module ${path} does not export ${ident}`)
                        }
                        moduleScope.set(ident, IdentifierOrigin(IdentifierOriginKind.Function, ParsedType(TypeKind.functionType, null, defn), false));
                    }
                } else {
                    const ref = loadModule(join(module.path, "..", path + ".crib"));

                    for (const ident of stmt.identifierList) {
                        const defn = ref.definitions.get(ident)
                        if (!defn) {
                            throw new Error(`Module ${stmt.identifier} does not export ${ident}`)
                        }
                        moduleScope.set(ident, defn);
                    }
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
}

inferAsync(world)

for (const m of modules.values()) {

//const validator = ResolveTypes(block, initialScope);

    const generated = generateTS(m.block);

    writeFileSync("ts/" + basename(m.path, extname(m.path)) + ".ts", generated.result.join("\n"));
}
