import { Tokeniser } from "./tokeniser"
import { Parser, StatementKind, Statement, ParsedType, TypeKind, DefnArgument, World } from "./parser"
import { readFileSync, writeFileSync } from "fs";
import { generateTS } from "./generateTS"
import { generateC } from "./generateC"
import { getBlockDefinitions, inferPublicInterface, inferBlock,IdentifierOrigin,  IdentifierOriginKind, inferAsync } from "./infer"
import { basename, extname, join } from "path"

let world
let target = "js"

function parseModule(path) {
    const text = readFileSync(path, "utf-8");
    const tokeniser = Tokeniser(text);
    const parser = Parser(tokeniser, world);
    const block = parser.parseBlock();
    return block;
}

const intrinsicModules = {
    "fs": {
        "readFile": intrinsicAsyncFunction("readFile", ParsedType(TypeKind.stringType, null, null), {path: ParsedType(TypeKind.stringType, null, null)})
    }
}

function intrinsicFunction(name, type, params) {
    const stmt = Statement(StatementKind.FunctionStatement);
    stmt.identifier = name;
    stmt.type = type;
    return stmt;
}

function intrinsicAsyncFunction(name, type, params) {
    const stmt = Statement(StatementKind.FunctionStatement);
    stmt.identifier = name;
    stmt.type = type;
    stmt.async = true;

    for (const [name, type] of Object.entries(params)) {
        stmt.defnArguments.push(DefnArgument(name, type, false));
    }

    return stmt;
}

export function generateCImport(stmt) {
    const path = stmt.identifier.substring(1, stmt.identifier.length - 1)

    if (!path.startsWith(".")) {
        return "";
    }
    return `#include "${path}.h"`
}

export function generateTSImport(stmt) {
    const path = stmt.identifier.substring(1, stmt.identifier.length - 1)

    if (!path.startsWith(".")) {
        return `import { ${stmt.identifierList.join(", ")}} from "./runtime"`

    }

    const module = parseModule("./" + path + ".crib")
    const exports = new Map();
    const imports = [];

    for (const stmt of module) {
        if (stmt.kind === StatementKind.FunctionStatement || stmt.kind === StatementKind.ClassStatement || stmt.kind === StatementKind.EnumStatement) {
            exports.set(stmt.identifier, stmt)
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
        imports.push(ident);
    }

    return `import { ${imports.join(", ")}} from "${path}"`
}

const modules = new Map();

const systemModule = Statement(StatementKind.ModuleStatement)

world = World();

function load(path) {
    const loading = [];
    
    function loadModule(path) {
        if (modules.has(path)) {
            return modules.get(path);
        }
        const block = parseModule(path);
        const definitions = getBlockDefinitions(block, null)
        const moduleStatement = Statement(StatementKind.ModuleStatement);

        const name = basename(path, extname(path));
        moduleStatement.identifier = name;
        moduleStatement.compileIdentifier = name;

        const module = {
            path,
            block,
            definitions,
            moduleStatement
        }
        modules.set(path, module);
        loading.push(module);
        return module;
    }

    const mainModule = loadModule(path);
    while (loading.length > 0) {
        const module = loading.pop();

        const moduleScope = new Map();
        
        const fakePanicStatement = Statement(StatementKind.FunctionStatement);
        fakePanicStatement.identifier = "panic";
        fakePanicStatement.type = ParsedType(TypeKind.voidType, null, null);
        fakePanicStatement.defnArguments.push(DefnArgument("message", ParsedType(TypeKind.stringType, null, null), false));
        fakePanicStatement.compileIdentifier = "__panic";

        moduleScope.set("panic", IdentifierOrigin(IdentifierOriginKind.Function, ParsedType(TypeKind.functionType, null, fakePanicStatement), false));

        const fakeImportStatement = Statement(StatementKind.FunctionStatement);
        fakeImportStatement.identifier = "panic";
        fakeImportStatement.type = ParsedType(TypeKind.stringType, null, null);
        fakeImportStatement.defnArguments.push(DefnArgument("stmt", ParsedType(TypeKind.stringType, null, null), false));

        moduleScope.set("generateTSImport", IdentifierOrigin(IdentifierOriginKind.Function, ParsedType(TypeKind.functionType, null, fakeImportStatement), false));
        moduleScope.set("generateCImport", IdentifierOrigin(IdentifierOriginKind.Function, ParsedType(TypeKind.functionType, null, fakeImportStatement), false));

        for (const stmt of module.block) {
            if (stmt.kind === StatementKind.ImportStatement) {
                const path = stmt.identifier.substring(1, stmt.identifier.length - 1)

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

let idx = 2;

if (process.argv[2].startsWith("--target=")) {
    target = process.argv[2].substring(9);
    idx = 3;
}

const filename = process.argv[idx];

const path = join(process.cwd(), filename);
load(path)

for (const m of modules.values()) {
    inferBlock(m.block, m.scope, m.moduleStatement);
}

inferAsync(world)

for (const m of modules.values()) {

//const validator = ResolveTypes(block, initialScope);
    const name = basename(m.path, extname(m.path));

    if (target == "c") {
        const generated = generateC(m.block, name, m.moduleStatement);
        writeFileSync("c/" + name + ".c", generated.declarations.join("\n") + "\n" + generated.result.join("\n"));
        writeFileSync("c/" + name + ".h", generated.header.join("\n"));
    } else {
        const generated = generateTS(m.block);

        writeFileSync("ts/" + name + ".js", generated.result.join("\n"));
    }
}
