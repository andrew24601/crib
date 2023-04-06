import { __index_get, __index_set, __slice, StringMap, panic, class_StringMap } from "./runtime"
import { generateTSImport } from "./tboot"
// import goes here
import { Token, class_Tokeniser, Tokeniser} from "./tokeniser"
// import goes here
import { class_Statement, Statement, StatementKind, class_ParsedType, ParsedType, ExpressionKind, TypeKind, class_Expression, Expression, class_DefnArgument, DefnArgument} from "./parser"
export function InferTypes(block:class_Statement[],parent:class_StringMap):void {
 // unknown
const scope: any = StringMap(parent);
for (const stmt of block) {
if (stmt.kind == StatementKind.ClassStatement) {
scope.set(stmt.identifier, ParsedType(TypeKind.classType, null, stmt));
} else if (stmt.kind == StatementKind.EnumStatement) {
scope.set(stmt.identifier, ParsedType(TypeKind.enumDefinitionType, null, stmt));
} else if (stmt.kind == StatementKind.FunctionStatement) {
scope.set(stmt.identifier, ParsedType(TypeKind.functionType, null, stmt));
}
}
for (const stmt of block) {
if (stmt.kind == StatementKind.ClassStatement || stmt.kind == StatementKind.FunctionStatement) {
 // unknown
const blockScope: any = StringMap(scope);
for (const arg of stmt.defnArguments) {
arg.type = resolve(arg.type);
}
}
}
for (const stmt of block) {
if (stmt.kind == StatementKind.LetStatement) {
if (stmt.type == null) {
stmt.type = infer(stmt.value!);
}
if (stmt.type != null) {
stmt.type = resolve(stmt.type);
}
} else if (stmt.kind == StatementKind.ConstStatement) {
if (stmt.type == null) {
stmt.type = infer(stmt.value!);
}
if (stmt.type != null) {
stmt.type = resolve(stmt.type);
}
} else if (stmt.kind == StatementKind.ClassStatement || stmt.kind == StatementKind.FunctionStatement) {
 // unknown
const blockScope: any = StringMap(scope);
for (const arg of stmt.defnArguments) {
arg.type = resolve(arg.type);
blockScope.set(arg.identifier, arg.type);
}
InferTypes(stmt.block, blockScope);
}
}
function infer(expr:class_Expression):class_ParsedType {
expr.type = ParsedType(TypeKind.invalidType, null, null);
if (expr.kind == ExpressionKind.IntConstant) {
expr.type = ParsedType(TypeKind.intType, null, null);
} else if (expr.kind == ExpressionKind.StringConstant) {
expr.type = ParsedType(TypeKind.stringType, null, null);
} else if (expr.kind == ExpressionKind.BoolConstant) {
expr.type = ParsedType(TypeKind.boolType, null, null);
} else if (expr.kind == ExpressionKind.DoubleConstant) {
expr.type = ParsedType(TypeKind.doubleType, null, null);
} else if (expr.kind == ExpressionKind.LessThan || expr.kind == ExpressionKind.LessThanEquals || expr.kind == ExpressionKind.GreaterThan || expr.kind == ExpressionKind.GreaterThanEquals || expr.kind == ExpressionKind.Equals || expr.kind == ExpressionKind.NotEquals) {
infer(expr.left!);
infer(expr.right!);
expr.type = ParsedType(TypeKind.boolType, null, null);
} else if (expr.kind == ExpressionKind.And || expr.kind == ExpressionKind.Or) {
infer(expr.left!);
infer(expr.right!);
expr.type = ParsedType(TypeKind.boolType, null, null);
} else if (expr.kind == ExpressionKind.Add) {
infer(expr.left!);
infer(expr.right!);
if (expr.left!.type.kind == TypeKind.stringType || expr.right!.type.kind == TypeKind.stringType) {
expr.type = ParsedType(TypeKind.stringType, null, null);
} else if (expr.left!.type.kind == TypeKind.doubleType || expr.right!.type.kind == TypeKind.doubleType) {
expr.type = ParsedType(TypeKind.doubleType, null, null);
} else {
expr.type = ParsedType(TypeKind.intType, null, null);
}
} else if (expr.kind == ExpressionKind.Subtract || expr.kind == ExpressionKind.Multiply || expr.kind == ExpressionKind.Divide || expr.kind == ExpressionKind.Modulo) {
infer(expr.left!);
infer(expr.right!);
if (expr.left!.type.kind == TypeKind.doubleType || expr.right!.type.kind == TypeKind.doubleType) {
expr.type = ParsedType(TypeKind.doubleType, null, null);
} else {
expr.type = ParsedType(TypeKind.intType, null, null);
}
} else if (expr.kind == ExpressionKind.Not) {
infer(expr.left!);
expr.type = ParsedType(TypeKind.boolType, null, null);
} else if (expr.kind == ExpressionKind.Identifier) {
if (scope.has(expr.value)) {
expr.type = scope.get(expr.value);
}
} else if (expr.kind == ExpressionKind.Dot || expr.kind == ExpressionKind.OptDot) {
infer(expr.left!);
if (expr.left!.type.kind == TypeKind.enumDefinitionType) {
expr.type = ParsedType(TypeKind.enumType, null, null);
} else if (expr.left!.type.kind == TypeKind.objectType) {
expr.type = getFieldType(expr.left!.type.ref!.stmt!, expr.value!);
} else if (expr.left!.type.kind == TypeKind.stringType) {
if (expr.value == "length") {
expr.type = ParsedType(TypeKind.intType, null, null);
} else {
panic("Invalid srting field");
}
} else {
panic("Invalid type for dot expression");
}
} else if (expr.kind == ExpressionKind.Index) {
infer(expr.left!);
for (const index of expr.indexes) {
infer(index);
}
if (expr.left!.type.kind == TypeKind.arrayType) {
expr.type = expr.left!.type.ref!;
}
} else if (expr.kind == ExpressionKind.Bang) {
infer(expr.left!);
expr.type = expr.left!.type;
} else if (expr.kind == ExpressionKind.Slice) {
infer(expr.left!);
for (const index of expr.indexes) {
infer(index);
}
expr.type = expr.left!.type;
} else if (expr.kind == ExpressionKind.Invoke) {
infer(expr.left!);
for (const arg of expr.indexes) {
infer(arg);
}
if (expr.left!.type.kind == TypeKind.functionType) {
expr.type = expr.left!.type.stmt!.type;
} else if (expr.left!.type.kind == TypeKind.classType) {
expr.type = ParsedType(TypeKind.objectType, expr.left!.type, null);
} else {
panic("Cannot invoke non-function");
}
}
return expr.type;
}
function getFieldType(classDefinition:class_Statement,identifier:string):class_ParsedType {
for (const arg of classDefinition.defnArguments) {
if (arg.identifier == identifier) {
return arg.type;
}
}
for (const stmt of classDefinition.block) {
if (stmt.kind == StatementKind.ConstStatement || stmt.kind == StatementKind.LetStatement) {
if (stmt.identifier == identifier) {
return stmt.type;
}
} else if (stmt.kind == StatementKind.FunctionStatement) {
if (stmt.identifier == identifier) {
return ParsedType(TypeKind.functionType, null, stmt);
}
}
}
panic("Field " + identifier + " not found in class " + classDefinition.identifier);
return ParsedType(TypeKind.invalidType, null, null);
}
function resolve(t:class_ParsedType):class_ParsedType {
if (t.kind == TypeKind.objectType && t.ref == null) {
if (scope.has(t.identifier)) {
t = scope.get(t.identifier);
} else {
panic("Type " + t.identifier + " not found");
}
if (t.kind == TypeKind.classType) {
t = ParsedType(TypeKind.objectType, t, null);
} else if (t.kind == TypeKind.enumDefinitionType) {
t = ParsedType(TypeKind.enumType, t, null);
} else {
panic("Type " + t.identifier + " is not a class or enum");
}
}
return t;
}
}
export function descopeCode(args:class_DefnArgument[],block:class_Statement[],outerScope:class_StringMap,forClass:boolean):void {
 // unknown
let scopeSet: any = StringMap(outerScope);
for (const arg of args) {
if (arg.isPublic && forClass) {
scopeSet.add(arg.identifier, "_o." + arg.identifier);
} else {
scopeSet.delete(arg.identifier);
}
}
for (const stmt of block) {
if (stmt.kind == StatementKind.ConstStatement || stmt.kind == StatementKind.LetStatement) {
if (stmt.isPublic && forClass) {
scopeSet.add(stmt.identifier, "_o." + stmt.identifier);
} else {
scopeSet.delete(stmt.identifier);
}
}
}
descopeBlock(block);
function descopeBlock(block:class_Statement[]):void {
 // unknown
let idx: any = 0;
while (idx < block.length) {
 // unknown
const stmt: any = __index_get(block, idx);
idx = idx + 1;
if (stmt.kind == StatementKind.FunctionStatement || stmt.kind == StatementKind.ClassStatement) {
descopeCode(stmt.defnArguments, stmt.block, scopeSet, stmt.kind == StatementKind.ClassStatement);
} else if (stmt.kind == StatementKind.IfStatement) {
stmt.value = descopeExpression(stmt.value!);
for (const ei of stmt.elseIf) {
ei.value = descopeExpression(ei.value!);
descopeBlock(ei.block);
}
descopeBlock(stmt.block);
descopeBlock(stmt.elseBlock);
} else if (stmt.kind == StatementKind.ForStatement || stmt.kind == StatementKind.WhileStatement) {
stmt.value = descopeExpression(stmt.value);
descopeBlock(stmt.block);
} else if (stmt.kind == StatementKind.ExpressionStatement) {
stmt.value = descopeExpression(stmt.value);
} else if (stmt.kind == StatementKind.ReturnStatement) {
stmt.value = descopeExpression(stmt.value);
} else if (stmt.kind == StatementKind.LetStatement || stmt.kind == StatementKind.ConstStatement) {
stmt.value = descopeExpression(stmt.value);
} else if (stmt.kind == StatementKind.AssignStatement) {
stmt.value = descopeExpression(stmt.value);
stmt.lhs = descopeExpression(stmt.lhs!);
}
}
}
function descopeExpression(expr:class_Expression):class_Expression {
if (expr.kind == ExpressionKind.Identifier) {
if (scopeSet.has(expr.value!)) {
expr.value = scopeSet.get(expr.value!);
}
} else if (expr.kind == ExpressionKind.Equals || expr.kind == ExpressionKind.NotEquals || expr.kind == ExpressionKind.LessThan || expr.kind == ExpressionKind.LessThanEquals || expr.kind == ExpressionKind.GreaterThan || expr.kind == ExpressionKind.GreaterThanEquals || expr.kind == ExpressionKind.And || expr.kind == ExpressionKind.Or || expr.kind == ExpressionKind.Add || expr.kind == ExpressionKind.Subtract || expr.kind == ExpressionKind.Multiply || expr.kind == ExpressionKind.Divide) {
expr.left = descopeExpression(expr.left!);
expr.right = descopeExpression(expr.right!);
} else if (expr.kind == ExpressionKind.Dot) {
expr.left = descopeExpression(expr.left!);
} else if (expr.kind == ExpressionKind.OptDot) {
expr.left = descopeExpression(expr.left!);
} else if (expr.kind == ExpressionKind.Index || expr.kind == ExpressionKind.Slice) {
expr.left = descopeExpression(expr.left!);
 // unknown
let idx: any = 0;
while (idx < expr.indexes.length) {
__index_set(expr.indexes, idx, descopeExpression(__index_get(expr.indexes, idx)));
idx = idx + 1;
}
} else if (expr.kind == ExpressionKind.Invoke) {
expr.left = descopeExpression(expr.left!);
 // unknown
let idx: any = 0;
while (idx < expr.indexes.length) {
__index_set(expr.indexes, idx, descopeExpression(__index_get(expr.indexes, idx)));
idx = idx + 1;
}
}
return expr;
}
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
export function generateTS(block:class_Statement[]) {
const _o = {} as class_generateTS;
 // unknown
_o.result = [];
_o.result.push('import { __index_get, __index_set, __slice, StringMap, panic, class_StringMap } from "./runtime"');
_o.result.push('import { generateTSImport } from "./tboot"');
function dumpType(type:class_ParsedType):void {
_o.result.push(" // " + formatParsedType(type));
}
function generateBlock(block:class_Statement[],forClass:boolean,atRoot:boolean):void {
 // unknown
let exportClassifier: any = "";
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
dumpType(stmt.type);
if (forClass && stmt.isPublic) {
_o.result.push("_o." + stmt.identifier + " = " + generateJSExpression(stmt.value!) + ";");
} else {
if (stmt.type != null) {
_o.result.push("let " + stmt.identifier + ": " + generateTSType(stmt.type) + " = " + generateJSExpression(stmt.value!) + ";");
} else {
_o.result.push("let " + stmt.identifier + " = " + generateJSExpression(stmt.value!) + ";");
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
result:any;
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
if (type.identifier == "Token" || type.identifier == "StatementKind" || type.identifier == "ExpressionKind" || type.identifier == "TypeKind") {
return type.identifier;
}
return "class_" + type.identifier;
} else if (type.kind == TypeKind.functionType) {
return "Function";
} else if (type.kind == TypeKind.voidType) {
return "void";
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
 // unknown
let result: any = generateDefnArgument(__index_get(args, 0));
 // unknown
let idx: any = 1;
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
 // unknown
let result: any = generateJSExpression(__index_get(args, 0));
 // unknown
let idx: any = 1;
while (idx < args.length) {
result = result + ", " + generateJSExpression(__index_get(args, idx));
idx = idx + 1;
}
return result;
}
export function generateJSEnumValues(stmt:class_Statement):string {
 // unknown
let result: any = __index_get(stmt.identifierList, 0);
 // unknown
let idx: any = 1;
while (idx < stmt.identifierList.length) {
result = result + ", " + __index_get(stmt.identifierList, idx);
idx = idx + 1;
}
return result;
}