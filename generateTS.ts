import { __index_get, __index_set, __slice, StringMap, panic, class_StringMap } from "./runtime"
import { generateTSImport, importScope } from "./tboot"
// import goes here
import { class_Statement, Statement, StatementKind, class_ParsedType, ParsedType, ExpressionKind, TypeKind, class_Expression, Expression, class_DefnArgument, DefnArgument} from "./parser"
export function generateTS(block:class_Statement[]) {
const _o = {} as class_generateTS;
 // array<string>
_o.result = [];
_o.result.push('import { __index_get, __index_set, __slice, StringMap, panic, class_StringMap } from "./runtime"');
_o.result.push('import { generateTSImport, importScope } from "./tboot"');
function dumpType(type:class_ParsedType):void {
_o.result.push(" // " + formatParsedType(type));
}
function generateBlock(block:class_Statement[],forClass:boolean,atRoot:boolean):void {
 // string
let exportClassifier: string = "";
if (atRoot) {
exportClassifier = "export ";
}
for (const stmt of block) {
if (stmt.kind == StatementKind.ConstStatement) {
dumpType(stmt.type);
if (forClass && stmt.isPublic) {
_o.result.push("_o." + stmt.identifier + " = " + generateJSExpression(stmt.value!) + ";");
} else if (stmt.type != null) {
_o.result.push("const " + stmt.identifier + ": " + generateTSType(stmt.type) + " = " + generateJSExpression(stmt.value!) + ";");
} else {
_o.result.push("const " + stmt.identifier + " = " + generateJSExpression(stmt.value!) + ";");
}
} else if (stmt.kind == StatementKind.LetStatement) {
 // unknown
let initValue: any = "";
dumpType(stmt.type);
if (stmt.value != null) {
initValue = generateJSExpression(stmt.value!);
} else if (stmt.type?.kind == TypeKind.intType) {
initValue = "0";
} else if (stmt.type?.kind == TypeKind.arrayType) {
initValue = "[]";
} else if (stmt.type?.kind == TypeKind.boolType) {
initValue = "false";
} else if (stmt.type?.kind == TypeKind.nullableType) {
initValue = "null";
} else if (stmt.type?.kind == TypeKind.mapType) {
initValue = "new " + generateTSType(stmt.type!) + "()";
}
if (forClass && stmt.isPublic) {
_o.result.push("_o." + stmt.identifier + " = " + initValue + ";");
} else {
if (stmt.type != null) {
_o.result.push("let " + stmt.identifier + ": " + generateTSType(stmt.type) + " = " + initValue + ";");
} else {
_o.result.push("let " + stmt.identifier + " = " + initValue + ";");
}
}
} else if (stmt.kind == StatementKind.IfStatement) {
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
} else if (stmt.kind == StatementKind.WhileStatement) {
_o.result.push("while (" + generateJSExpression(stmt.value!) + ") {");
generateBlock(stmt.block, false, false);
_o.result.push("}");
} else if (stmt.kind == StatementKind.RepeatStatement) {
_o.result.push("do {");
generateBlock(stmt.block, false, false);
_o.result.push("} while (!(" + generateJSExpression(stmt.value!) + "))");
} else if (stmt.kind == StatementKind.ForStatement) {
_o.result.push("for (const " + stmt.identifier + " of " + generateJSExpression(stmt.value!) + ") {");
generateBlock(stmt.block, false, false);
_o.result.push("}");
} else if (stmt.kind == StatementKind.ForRangeStatement) {
_o.result.push("for (let " + stmt.identifier + " = " + generateJSExpression(stmt.lhs!) + "; " + stmt.identifier + " <= " + generateJSExpression(stmt.value!) + "; " + stmt.identifier + "++) {");
generateBlock(stmt.block, false, false);
_o.result.push("}");
} else if (stmt.kind == StatementKind.ForRangeExclusiveStatement) {
_o.result.push("for (let " + stmt.identifier + " = " + generateJSExpression(stmt.lhs!) + "; " + stmt.identifier + " <= " + generateJSExpression(stmt.value!) + "; " + stmt.identifier + "++) {");
generateBlock(stmt.block, false, false);
_o.result.push("}");
} else if (stmt.kind == StatementKind.AssignStatement) {
if (stmt.lhs!.kind == ExpressionKind.Index) {
_o.result.push("__index_set(" + generateJSExpression(stmt.lhs!.left!) + ", " + generateJSExpression(__index_get(stmt.lhs!.indexes, 0)) + ", " + generateJSExpression(stmt.value!) + ");");
} else {
_o.result.push(generateJSExpression(stmt.lhs!) + " = " + generateJSExpression(stmt.value!) + ";");
}
} else if (stmt.kind == StatementKind.ClassStatement) {
_o.result.push(exportClassifier + "function " + stmt.identifier + "(" + generateDefnArguments(stmt.defnArguments) + ") {");
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
} else if (stmt.kind == StatementKind.FunctionStatement) {
_o.result.push(exportClassifier + "function " + stmt.identifier + "(" + generateDefnArguments(stmt.defnArguments) + "):" + generateTSType(stmt.type) + " {");
generateBlock(stmt.block, false, false);
_o.result.push("}");
if (forClass && stmt.isPublic) {
_o.result.push("_o." + stmt.identifier + " = " + stmt.identifier + ";");
}
} else if (stmt.kind == StatementKind.EnumStatement) {
_o.result.push("export enum " + stmt.identifier + " {");
_o.result.push(generateJSEnumValues(stmt));
_o.result.push("};");
} else if (stmt.kind == StatementKind.ReturnStatement) {
_o.result.push("return " + generateJSExpression(stmt.value!) + ";");
} else if (stmt.kind == StatementKind.ImportStatement) {
_o.result.push("// import goes here");
_o.result.push(generateTSImport(stmt));
} else if (stmt.kind == StatementKind.ExpressionStatement) {
_o.result.push(generateJSExpression(stmt.value!) + ";");
} else {
_o.result.push("unknown");
}
}
}
function generateTSInterface(definition:class_Statement):void {
if (definition.kind == StatementKind.ClassStatement) {
_o.result.push("export interface class_" + definition.identifier + " {");
for (const arg of definition.defnArguments) {
if (arg.isPublic) {
_o.result.push(arg.identifier + ":" + generateTSType(arg.type) + ";");
}
}
for (const stmt of definition.block) {
if (stmt.kind == StatementKind.FunctionStatement) {
if (stmt.isPublic) {
_o.result.push(stmt.identifier + "(" + generateDefnArguments(stmt.defnArguments) + "):" + generateTSType(stmt.type) + ";");
}
} else if (stmt.kind == StatementKind.LetStatement || stmt.kind == StatementKind.ConstStatement) {
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
if (expr.kind == ExpressionKind.LessThan) {
return generateJSExpression(expr.left!) + " < " + generateJSExpression(expr.right!);
} else if (expr.kind == ExpressionKind.GreaterThan) {
return generateJSExpression(expr.left!) + " > " + generateJSExpression(expr.right!);
} else if (expr.kind == ExpressionKind.Equals) {
return generateJSExpression(expr.left!) + " == " + generateJSExpression(expr.right!);
} else if (expr.kind == ExpressionKind.NotEquals) {
return generateJSExpression(expr.left!) + " != " + generateJSExpression(expr.right!);
} else if (expr.kind == ExpressionKind.GreaterThanEquals) {
return generateJSExpression(expr.left!) + " >= " + generateJSExpression(expr.right!);
} else if (expr.kind == ExpressionKind.LessThanEquals) {
return generateJSExpression(expr.left!) + " <= " + generateJSExpression(expr.right!);
} else if (expr.kind == ExpressionKind.Add) {
return generateJSExpression(expr.left!) + " + " + generateJSExpression(expr.right!);
} else if (expr.kind == ExpressionKind.Subtract) {
return generateJSExpression(expr.left!) + " - " + generateJSExpression(expr.right!);
} else if (expr.kind == ExpressionKind.Multiply) {
return generateJSExpression(expr.left!) + " * " + generateJSExpression(expr.right!);
} else if (expr.kind == ExpressionKind.Divide) {
return generateJSExpression(expr.left!) + " / " + generateJSExpression(expr.right!);
} else if (expr.kind == ExpressionKind.Or) {
return generateJSExpression(expr.left!) + " || " + generateJSExpression(expr.right!);
} else if (expr.kind == ExpressionKind.And) {
return generateJSExpression(expr.left!) + " && " + generateJSExpression(expr.right!);
} else if (expr.kind == ExpressionKind.Dot) {
return generateJSExpression(expr.left!) + "." + expr.value;
} else if (expr.kind == ExpressionKind.OptDot) {
return generateJSExpression(expr.left!) + "?." + expr.value;
} else if (expr.kind == ExpressionKind.Not) {
return "!" + generateJSExpression(expr.left!);
} else if (expr.kind == ExpressionKind.Bang) {
return generateJSExpression(expr.left!) + "!";
} else if (expr.kind == ExpressionKind.IntConstant) {
return expr.value!;
} else if (expr.kind == ExpressionKind.NilConstant) {
return "null";
} else if (expr.kind == ExpressionKind.BoolConstant) {
return expr.value!;
} else if (expr.kind == ExpressionKind.StringConstant) {
return expr.value!;
} else if (expr.kind == ExpressionKind.Identifier) {
return expr.value!;
} else if (expr.kind == ExpressionKind.Invoke) {
return generateJSExpression(expr.left!) + "(" + generateArguments(expr.indexes) + ")";
} else if (expr.kind == ExpressionKind.Slice) {
return "__slice(" + generateJSExpression(expr.left!) + ", " + generateArguments(expr.indexes) + ")";
} else if (expr.kind == ExpressionKind.Index) {
if (expr.indexes.length == 0) {
return "[]";
}
return "__index_get(" + generateJSExpression(expr.left!) + ", " + generateArguments(expr.indexes) + ")";
} else if (expr.kind == ExpressionKind.ArrayInit) {
return "[]";
} else {
return "*expression*";
}
}
export function generateTSType(type:class_ParsedType | null):string {
if (type == null) {
return "any";
}
if (type.kind == TypeKind.intType) {
return "number";
} else if (type.kind == TypeKind.boolType) {
return "boolean";
} else if (type.kind == TypeKind.stringType) {
return "string";
} else if (type.kind == TypeKind.arrayType) {
return generateTSType(type.ref) + "[]";
} else if (type.kind == TypeKind.pointerType) {
return generateTSType(type.ref);
} else if (type.kind == TypeKind.nullableType) {
return generateTSType(type.ref) + " | null";
} else if (type.kind == TypeKind.objectType) {
if (type.stmt?.kind == StatementKind.ClassStatement) {
return "class_" + type.identifier!;
} else if (type.stmt?.kind == StatementKind.EnumStatement) {
return type.identifier!;
}
return "any";
} else if (type.kind == TypeKind.mapType) {
return "Map<" + generateTSType(type.mapKeyRef) + "," + generateTSType(type.ref) + ">";
} else if (type.kind == TypeKind.functionType) {
return "Function";
} else if (type.kind == TypeKind.voidType) {
return "void";
} else if (type.kind == TypeKind.enumType) {
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
 // string
let result: string = generateDefnArgument(__index_get(args, 0));
 // int
let idx: number = 1;
while (idx < args.length) {
result = result + "," + generateDefnArgument(__index_get(args, idx));
idx = idx + 1;
}
return result;
}
export function generateArguments(args:class_Expression[]):string {
if (args.length == 0) {
return "";
}
 // string
let result: string = generateJSExpression(__index_get(args, 0));
 // int
let idx: number = 1;
while (idx < args.length) {
result = result + ", " + generateJSExpression(__index_get(args, idx));
idx = idx + 1;
}
return result;
}
export function generateJSEnumValues(stmt:class_Statement):string {
 // string
let result: string = __index_get(stmt.identifierList, 0);
 // int
let idx: number = 1;
while (idx < stmt.identifierList.length) {
result = result + ", " + __index_get(stmt.identifierList, idx);
idx = idx + 1;
}
return result;
}
export function formatParsedType(type:class_ParsedType | null):string {
if (type == null) {
return "no type";
} else if (type.kind == TypeKind.objectType) {
if (type.stmt == null) {
return "object";
} else {
return "object<" + type.stmt.identifier + ">";
}
} else if (type.kind == TypeKind.arrayType) {
return "array<" + formatParsedType(type.ref) + ">";
} else if (type.kind == TypeKind.stringType) {
return "string";
} else if (type.kind == TypeKind.intType) {
return "int";
} else if (type.kind == TypeKind.boolType) {
return "bool";
} else if (type.kind == TypeKind.nullableType) {
return "nullable<" + formatParsedType(type.ref) + ">";
} else {
return "unknown";
}
}