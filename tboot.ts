import { Tokeniser, Parser, generateTS, descopeCode, class_Statement, StatementKind } from "./bootstrap"
import { readFileSync, writeFileSync } from "fs";
import { StringMap } from "./runtime"

function parseModule(path: string): class_Statement[] {
    const text = readFileSync(path, "utf-8");
    const tokeniser = Tokeniser(text);
    const parser = Parser(tokeniser);
    const block = parser.parseBlock();
    return block;
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

    return `// import { ${imports.join(", ")}} from "${stmt.identifier}"`
}

const block = parseModule("./simple.crib");

const initialScope = StringMap();

//const validator = ResolveTypes(block, initialScope);

descopeCode([], block, initialScope, false)

const generated = generateTS(block);

writeFileSync("bootstrap.ts", generated.result.join("\n"));
