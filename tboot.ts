import { Tokeniser, Parser, generateTS, descopeCode, ParsedType } from "./bootstrap"
import { readFileSync, writeFileSync } from "fs";
import { StringMap } from "./runtime"

const text = readFileSync("./simple.crib", "utf-8");
const tokeniser = Tokeniser(text);
const parser = Parser(tokeniser);
const block = parser.parseBlock();

const initialScope = StringMap();

//const validator = ResolveTypes(block, initialScope);

descopeCode([], block, null, false)

const generated = generateTS(block);

writeFileSync("bootstrap.ts", generated.result.join("\n"));
