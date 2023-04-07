import { __index_get, __index_set, __slice, StringMap, panic, class_StringMap } from "./runtime"
import { generateTSImport, importScope } from "./tboot"
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
export function descopeCode(args:class_DefnArgument[],block:class_Statement[],outerScope:class_StringMap | null,forClass:boolean):void {
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