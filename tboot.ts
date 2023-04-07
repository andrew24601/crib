import { descopeCode } from "./bootstrap"
import { Tokeniser } from "./tokeniser"
import { Parser, class_Statement, StatementKind, Statement } from "./parser"
import { readFileSync, writeFileSync } from "fs";
import { StringMap, class_StringMap } from "./runtime"
import { generateTS } from "./generateTS"
import { getBlockDefinitions, inferPublicInterface } from "./infer"

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

const filename = process.argv[2];

const block = parseModule(`./${filename}.crib`);

const initialScope = StringMap(null);

initialScope.set("StringMap", Statement(StatementKind.ClassStatement))

console.log(inferPublicInterface(block, initialScope).v.keys());

//const validator = ResolveTypes(block, initialScope);

descopeCode([], block, null, false)

const generated = generateTS(block);

writeFileSync(`${filename}.ts`, generated.result.join("\n"));
