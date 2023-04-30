import { __index_get, __index_set, __slice, panic } from "./runtime"
import { generateTSImport } from "./tboot"
// import goes here
import { class_Statement, Statement, StatementKind, class_ParsedType, ParsedType, ExpressionKind, TypeKind, class_Expression, Expression, class_DefnArgument, DefnArgument} from "./parser"
// import goes here
import { IdentifierOriginKind} from "./infer"
export function generateTS(block:class_Statement[]):class_generateTS {
const _o = {} as class_generateTS;
_o.result = [];
_o.result.push('import { __index_get, __index_set, __slice, panic } from "./runtime"');
_o.result.push('import { generateTSImport } from "./tboot"');
function getInitValue(expr:class_Expression | null,type:class_ParsedType | null):string {
if (expr != null) {
return generateJSExpression(expr);
} else if (type?.kind == 0) {
return "0";
} else if (type?.kind == 5) {
return "[]";
} else if (type?.kind == 2) {
return "false";
} else if (type?.kind == 6) {
return "new " + generateTSType(type!) + "()";
} else {
return "null";
}
}
function generateBlock(block:class_Statement[],forClass:boolean,atRoot:boolean):void {
let exportClassifier: string = "";
if (atRoot) {
exportClassifier = "export ";
}
for (const stmt of block) {
if (stmt.kind == 0 || stmt.kind == 1) {
const initValue: string = getInitValue(stmt.value, stmt.type);
let declaration: string = "let";
if (stmt.kind == 0) {
declaration = "const";
}
if (forClass && stmt.isPublic) {
_o.result.push("_o." + stmt.identifier + " = " + initValue + ";");
} else if (stmt.type != null) {
_o.result.push(declaration + " " + stmt.identifier + ": " + generateTSType(stmt.type) + " = " + initValue + ";");
} else {
_o.result.push(declaration + " " + stmt.identifier + " = " + initValue + ";");
}
} else if (stmt.kind == 6) {
_o.result.push("if (" + generateJSExpression(stmt.value!) + ") {");
generateBlock(stmt.block, false, false);
for (const ei of stmt.elseIf) {
_o.result.push("} else if (" + generateJSExpression(ei.value) + ") {");
generateBlock(ei.block, false, false);
}
if (stmt.elseBlock.length > 0) {
_o.result.push("} else {");
generateBlock(stmt.elseBlock, false, false);
}
_o.result.push("}");
} else if (stmt.kind == 7) {
_o.result.push("while (" + generateJSExpression(stmt.value!) + ") {");
generateBlock(stmt.block, false, false);
_o.result.push("}");
} else if (stmt.kind == 11) {
_o.result.push("do {");
generateBlock(stmt.block, false, false);
_o.result.push("} while (!(" + generateJSExpression(stmt.value!) + "))");
} else if (stmt.kind == 12) {
_o.result.push("for (const " + stmt.identifier + " of " + generateJSExpression(stmt.value!) + ") {");
generateBlock(stmt.block, false, false);
_o.result.push("}");
} else if (stmt.kind == 13) {
_o.result.push("for (let " + stmt.identifier + " = " + generateJSExpression(stmt.lhs!) + "; " + stmt.identifier + " <= " + generateJSExpression(stmt.value!) + "; " + stmt.identifier + "++) {");
generateBlock(stmt.block, false, false);
_o.result.push("}");
} else if (stmt.kind == 14) {
_o.result.push("for (let " + stmt.identifier + " = " + generateJSExpression(stmt.lhs!) + "; " + stmt.identifier + " <= " + generateJSExpression(stmt.value!) + "; " + stmt.identifier + "++) {");
generateBlock(stmt.block, false, false);
_o.result.push("}");
} else if (stmt.kind == 9) {
if (stmt.lhs!.kind == 23) {
if (effectiveType(stmt.lhs!.left!.type).kind == 6) {
_o.result.push(generateJSExpression(stmt.lhs!.left!) + ".set(" + generateJSExpression(stmt.lhs!.indexes[0]) + ", " + generateJSExpression(stmt.value!) + ");");
} else {
_o.result.push(generateJSExpression(stmt.lhs!.left!) + "[" + generateJSExpression(stmt.lhs!.indexes[0]) + "] = " + generateJSExpression(stmt.value!) + ";");
}
} else {
_o.result.push(generateJSExpression(stmt.lhs!) + " = " + generateJSExpression(stmt.value!) + ";");
}
} else if (stmt.kind == 3) {
let prefix: string = "";
let returnDecl: string = "class_" + stmt.identifier;
if (stmt.async) {
prefix = "async ";
returnDecl = "Promise<" + returnDecl + ">";
}
_o.result.push(exportClassifier + prefix + "function " + stmt.identifier + "(" + generateDefnArguments(stmt.defnArguments) + "):" + returnDecl + " {");
_o.result.push("const _o = {} as class_" + stmt.identifier + ";");
for (const arg of stmt.defnArguments) {
if (arg.isPublic) {
_o.result.push("_o." + arg.identifier + " = " + arg.identifier + ";");
}
}
generateBlock(stmt.block, true, false);
_o.result.push("return _o;");
_o.result.push("}");
generateTSInterface(stmt);
} else if (stmt.kind == 4) {
let prefix: string = "";
let returnDecl: string = generateTSType(stmt.type);
if (stmt.async) {
prefix = "async ";
returnDecl = "Promise<" + returnDecl + ">";
}
_o.result.push(exportClassifier + prefix + "function " + stmt.identifier + "(" + generateDefnArguments(stmt.defnArguments) + "):" + returnDecl + " {");
generateBlock(stmt.block, false, false);
_o.result.push("}");
if (forClass && stmt.isPublic) {
_o.result.push("_o." + stmt.identifier + " = " + stmt.identifier + ";");
}
} else if (stmt.kind == 2) {
_o.result.push("export enum " + stmt.identifier + " {");
_o.result.push(generateJSEnumValues(stmt));
_o.result.push("};");
} else if (stmt.kind == 5) {
_o.result.push("return " + generateJSExpression(stmt.value!) + ";");
} else if (stmt.kind == 8) {
_o.result.push("// import goes here");
_o.result.push(generateTSImport(stmt));
} else if (stmt.kind == 10) {
_o.result.push(generateJSExpression(stmt.value!) + ";");
} else {
_o.result.push("unknown");
}
}
}
function generateTSInterface(definition:class_Statement):void {
if (definition.kind == 3) {
_o.result.push("export interface class_" + definition.identifier + " {");
for (const arg of definition.defnArguments) {
if (arg.isPublic) {
_o.result.push(arg.identifier + ":" + generateTSType(arg.type) + ";");
}
}
for (const stmt of definition.block) {
if (stmt.kind == 4) {
if (stmt.isPublic) {
_o.result.push(stmt.identifier + "(" + generateDefnArguments(stmt.defnArguments) + "):" + generateTSType(stmt.type) + ";");
}
} else if (stmt.kind == 1 || stmt.kind == 0) {
if (stmt.isPublic) {
_o.result.push(stmt.identifier + ":" + generateTSType(stmt.type) + ";");
}
}
}
_o.result.push("}");
}
}
generateBlock(block, false, true);
return _o;
}
export interface class_generateTS {
result:string[];
}
export function generateJSExpression(expr:class_Expression):string {
if (expr == null) {
return "*nil";
}
if (expr.type.kind == 16 && expr.kind != 3) {
panic("expression not inferred");
}
if (expr.kind == 11) {
return generateJSExpression(expr.left!) + " < " + generateJSExpression(expr.right!);
} else if (expr.kind == 15) {
return generateJSExpression(expr.left!) + " > " + generateJSExpression(expr.right!);
} else if (expr.kind == 13) {
return generateJSExpression(expr.left!) + " == " + generateJSExpression(expr.right!);
} else if (expr.kind == 14) {
return generateJSExpression(expr.left!) + " != " + generateJSExpression(expr.right!);
} else if (expr.kind == 16) {
return generateJSExpression(expr.left!) + " >= " + generateJSExpression(expr.right!);
} else if (expr.kind == 12) {
return generateJSExpression(expr.left!) + " <= " + generateJSExpression(expr.right!);
} else if (expr.kind == 9) {
return generateJSExpression(expr.left!) + " + " + generateJSExpression(expr.right!);
} else if (expr.kind == 10) {
return generateJSExpression(expr.left!) + " - " + generateJSExpression(expr.right!);
} else if (expr.kind == 6) {
return generateJSExpression(expr.left!) + " * " + generateJSExpression(expr.right!);
} else if (expr.kind == 7) {
return generateJSExpression(expr.left!) + " / " + generateJSExpression(expr.right!);
} else if (expr.kind == 18) {
return generateJSExpression(expr.left!) + " || " + generateJSExpression(expr.right!);
} else if (expr.kind == 17) {
return generateJSExpression(expr.left!) + " && " + generateJSExpression(expr.right!);
} else if (expr.kind == 20) {
return generateJSExpression(expr.left!) + "." + expr.value;
} else if (expr.kind == 19) {
return generateJSExpression(expr.left!) + "?." + expr.value;
} else if (expr.kind == 27) {
return "!" + generateJSExpression(expr.left!);
} else if (expr.kind == 21) {
return generateJSExpression(expr.left!) + "!";
} else if (expr.kind == 0) {
return expr.value!;
} else if (expr.kind == 3) {
return "null";
} else if (expr.kind == 26) {
return expr.value!;
} else if (expr.kind == 2) {
return expr.value!;
} else if (expr.kind == 5) {
if (expr.origin!.kind == 0) {
return "_o." + expr.value!;
} else {
return expr.value!;
}
} else if (expr.kind == 22) {
const functionDecl: class_Statement = expr.left!.type.stmt!;
let prefix: string = "";
if (functionDecl.async) {
prefix = "await ";
}
return prefix + generateJSExpression(expr.left!) + "(" + generateNamedArguments(expr.left!.type, expr.indexes, expr.identifiers) + ")";
} else if (expr.kind == 25) {
return "__slice(" + generateJSExpression(expr.left!) + ", " + generateArguments(expr.indexes) + ")";
} else if (expr.kind == 23) {
if (expr.indexes.length == 0) {
return "[]";
}
if (effectiveType(expr.left!.type).kind == 3) {
return generateJSExpression(expr.left!) + ".charCodeAt(" + generateArguments(expr.indexes) + ")";
} else if (effectiveType(expr.left!.type).kind == 6) {
return generateJSExpression(expr.left!) + ".get(" + generateArguments(expr.indexes) + ")";
} else if (effectiveType(expr.left!.type).kind == 5) {
return generateJSExpression(expr.left!) + "[" + generateArguments(expr.indexes) + "]";
} else {
return "__index_get(" + generateJSExpression(expr.left!) + ", " + generateArguments(expr.indexes) + ")";
}
} else if (expr.kind == 29) {
const left: class_Expression = expr.left!;
if (left.kind == 5) {
return "(__taker=" + generateJSExpression(left) + "," + generateJSExpression(left) + "=null,__taker)";
} else if (left.kind == 20 || left.kind == 19) {
return "(__taker2=" + generateJSExpression(left.left!) + ",__taker=__taker2." + left.value + ",__taker2." + left.value + "=null,__taker)";
} else {
return "*takeexpression*";
}
} else {
return "*expression*";
}
}
export function effectiveType(type:class_ParsedType):class_ParsedType {
if (type.kind == 8 || type.kind == 7) {
return effectiveType(type.ref!);
}
return type;
}
export function generateTSType(type:class_ParsedType | null):string {
if (type == null) {
return "any";
}
if (type.kind == 0) {
return "number";
} else if (type.kind == 2) {
return "boolean";
} else if (type.kind == 3) {
return "string";
} else if (type.kind == 5) {
return generateTSType(type.ref) + "[]";
} else if (type.kind == 8) {
return generateTSType(type.ref);
} else if (type.kind == 7) {
return generateTSType(type.ref) + " | null";
} else if (type.kind == 4) {
if (type.stmt?.kind == 3) {
return "class_" + type.identifier!;
} else if (type.stmt?.kind == 2) {
return type.identifier!;
}
return "any";
} else if (type.kind == 6) {
return "Map<" + generateTSType(type.mapKeyRef) + "," + generateTSType(type.ref) + ">";
} else if (type.kind == 12) {
return "Function";
} else if (type.kind == 13) {
return "void";
} else if (type.kind == 10) {
return type.identifier!;
} else {
return "any";
}
}
export function generateDefnArgument(arg:class_DefnArgument):string {
return arg.identifier + ":" + generateTSType(arg.type);
}
export function generateDefnArguments(args:class_DefnArgument[]):string {
if (args.length == 0) {
return "";
}
let result: string = generateDefnArgument(args[0]);
let idx: number = 1;
while (idx < args.length) {
result = result + "," + generateDefnArgument(args[idx]);
idx = idx + 1;
}
return result;
}
export function generateNamedArguments(type:class_ParsedType,args:class_Expression[],argNames:string[]):string {
if (type.kind != 12 && type.kind != 9) {
panic("not a function type");
}
const defnArguments: class_DefnArgument[] = type.stmt!.defnArguments;
if (defnArguments.length == 0) {
return "";
}
function generateClosureParams(args:class_DefnArgument[]):string {
if (args.length == 0) {
return "";
}
let result: string = args[0].identifier;
let idx: number = 1;
while (idx < args.length) {
result = result + "," + args[idx].identifier;
idx = idx + 1;
}
return result;
}
function generateArg(idx:number):string {
const argType: class_ParsedType = defnArguments[idx].type;
let aidx: number = 0;
while (aidx < argNames.length) {
if (argNames[aidx] == defnArguments[idx].identifier) {
if (argType.kind == 12) {
return "(" + generateClosureParams(argType.stmt!.defnArguments) + ")=>" + generateJSExpression(args[aidx]);
}
return generateJSExpression(args[aidx]);
}
aidx = aidx + 1;
}
if (defnArguments[idx].value != null) {
return generateJSExpression(defnArguments[idx].value!);
}
panic("missing argument " + defnArguments[idx].identifier + " in call to " + type.stmt!.identifier!);
return "";
}
let result: string = generateArg(0);
let idx: number = 1;
while (idx < defnArguments.length) {
result = result + ", " + generateArg(idx);
idx = idx + 1;
}
let aidx: number = 0;
while (aidx < argNames.length) {
let found: boolean = false;
let didx: number = 0;
while (didx < defnArguments.length) {
if (argNames[aidx] == defnArguments[didx].identifier) {
found = true;
}
didx = didx + 1;
}
if (!found) {
panic("unknown argument " + argNames[aidx] + " in call to " + type.stmt!.identifier!);
}
aidx = aidx + 1;
}
return result;
}
export function generateArguments(args:class_Expression[]):string {
if (args.length == 0) {
return "";
}
let result: string = generateJSExpression(args[0]);
let idx: number = 1;
while (idx < args.length) {
result = result + ", " + generateJSExpression(args[idx]);
idx = idx + 1;
}
return result;
}
export function generateJSEnumValues(stmt:class_Statement):string {
let result: string = stmt.identifierList[0];
let idx: number = 1;
while (idx < stmt.identifierList.length) {
result = result + ", " + stmt.identifierList[idx];
idx = idx + 1;
}
return result;
}
export function formatParsedType(type:class_ParsedType | null):string {
if (type == null) {
return "no type";
} else if (type.kind == 4) {
if (type.stmt == null) {
return "object";
} else {
return "object<" + type.stmt.identifier + ">";
}
} else if (type.kind == 5) {
return "array<" + formatParsedType(type.ref) + ">";
} else if (type.kind == 3) {
return "string";
} else if (type.kind == 0) {
return "int";
} else if (type.kind == 2) {
return "bool";
} else if (type.kind == 7) {
return "nullable<" + formatParsedType(type.ref) + ">";
} else {
return "unknown";
}
}