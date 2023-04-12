import { __index_get, __index_set, __slice, panic } from "./runtime"
import { generateTSImport, importScope } from "./tboot"
// import goes here
import { class_Statement, Statement, StatementKind, class_ParsedType, ParsedType, TypeKind, class_Expression, Expression, ExpressionKind} from "./parser"
export enum IdentifierOriginKind {
Field, Parameter, Class, Enum, Function
};
export function IdentifierOrigin(kind:IdentifierOriginKind,type:class_ParsedType,owner:class_Statement,isMutable:boolean) {
const _o = {} as class_IdentifierOrigin;
_o.kind = kind;
_o.type = type;
_o.owner = owner;
_o.isMutable = isMutable;
return _o;
}
export interface class_IdentifierOrigin {
kind:IdentifierOriginKind;
type:class_ParsedType;
owner:class_Statement;
isMutable:boolean;
}
export function cloneScope(scope:Map<string,class_IdentifierOrigin> | null):Map<string,class_IdentifierOrigin> {
 // unknown
const newScope: Map<string,class_IdentifierOrigin> = new Map<string,class_IdentifierOrigin>();
if (scope == null) {
return newScope;
}
for (const key of scope.keys()) {
newScope.set(key, scope.get(key)!);
}
return newScope;
}
export function getBlockDefinitions(block:class_Statement[],outerScope:Map<string,class_IdentifierOrigin> | null):Map<string,class_IdentifierOrigin> {
 // unknown
const scope: Map<string,class_IdentifierOrigin> = cloneScope(outerScope);
for (const stmt of block) {
if (stmt.kind == StatementKind.FunctionStatement) {
scope.set(stmt.identifier!, IdentifierOrigin(IdentifierOriginKind.Function, ParsedType(TypeKind.functionType, null, stmt), stmt, false));
} else if (stmt.kind == StatementKind.ClassStatement) {
scope.set(stmt.identifier!, IdentifierOrigin(IdentifierOriginKind.Class, ParsedType(TypeKind.classType, null, stmt), stmt, false));
} else if (stmt.kind == StatementKind.EnumStatement) {
scope.set(stmt.identifier!, IdentifierOrigin(IdentifierOriginKind.Enum, ParsedType(TypeKind.enumDefinitionType, null, stmt), stmt, false));
}
}
return scope;
}
export function inferPublicInterface(module:class_Statement[],outerScope:Map<string,class_IdentifierOrigin>):Map<string,class_IdentifierOrigin> {
 // unknown
const scope: Map<string,class_IdentifierOrigin> = getBlockDefinitions(module, outerScope);
for (const stmt of module) {
if (stmt.kind == StatementKind.ClassStatement || stmt.kind == StatementKind.FunctionStatement) {
inferClassFunctionInterface(scope, stmt);
} else if (stmt.kind == StatementKind.LetStatement || stmt.kind == StatementKind.ConstStatement) {
if (stmt.type.kind == TypeKind.unknownType) {
stmt.type = inferPublicExpressionType(stmt.value!, scope);
} else if (stmt.type != null) {
resolveType(stmt.type, scope);
}
}
}
return scope;
}
export function effectiveType(type:class_ParsedType):class_ParsedType {
if (type.kind == TypeKind.pointerType) {
return effectiveType(type.ref!);
}
return type;
}
export function applyScopeToBlock(block:class_Statement[],scope:Map<string,class_IdentifierOrigin>,owner:class_Statement):void {
for (const stmt of block) {
if (stmt.kind == StatementKind.ClassStatement || stmt.kind == StatementKind.FunctionStatement) {
inferClassFunctionInterface(scope, stmt);
}
}
for (const stmt of block) {
if (stmt.kind == StatementKind.ClassStatement || stmt.kind == StatementKind.FunctionStatement) {
 // unknown
const innerScope: Map<string,class_IdentifierOrigin> = cloneScope(scope);
for (const arg of stmt.defnArguments) {
if (stmt.kind == StatementKind.ClassStatement && arg.isPublic) {
innerScope.set(arg.identifier, IdentifierOrigin(IdentifierOriginKind.Field, arg.type, stmt, true));
} else {
innerScope.set(arg.identifier, IdentifierOrigin(IdentifierOriginKind.Parameter, arg.type, stmt, true));
}
}
inferBlock(stmt.block, innerScope, stmt);
} else if (stmt.kind == StatementKind.LetStatement || stmt.kind == StatementKind.ConstStatement) {
if (stmt.value != null) {
inferExpressionType(stmt.value!, scope);
}
if (stmt.type.kind == TypeKind.unknownType) {
stmt.type = inferExpressionType(stmt.value!, scope);
if (stmt.type.kind == TypeKind.unknownType) {
panic("Could not infer type of " + stmt.identifier!);
}
} else {
resolveType(stmt.type, scope);
}
if (owner.kind == StatementKind.ClassStatement && stmt.isPublic) {
scope.set(stmt.identifier!, IdentifierOrigin(IdentifierOriginKind.Field, stmt.type, owner, stmt.kind == StatementKind.LetStatement));
} else {
scope.set(stmt.identifier!, IdentifierOrigin(IdentifierOriginKind.Parameter, stmt.type, owner, stmt.kind == StatementKind.LetStatement));
}
} else if (stmt.kind == StatementKind.ReturnStatement) {
if (stmt.value != null) {
stmt.value.type = inferExpressionType(stmt.value!, scope);
}
} else if (stmt.kind == StatementKind.WhileStatement) {
inferExpressionType(stmt.value!, scope);
inferBlock(stmt.block, scope, owner);
} else if (stmt.kind == StatementKind.RepeatStatement) {
inferBlock(stmt.block, scope, owner);
inferExpressionType(stmt.value!, scope);
} else if (stmt.kind == StatementKind.ForStatement) {
inferExpressionType(stmt.value!, scope);
 // object<ParsedType>
const sequenceType: class_ParsedType = effectiveType(stmt.value!.type);
if (sequenceType.kind != TypeKind.arrayType) {
panic("For loop must iterate over an array");
}
 // unknown
const innerScope: Map<string,class_IdentifierOrigin> = cloneScope(scope);
innerScope.set(stmt.identifier!, IdentifierOrigin(IdentifierOriginKind.Field, sequenceType.ref!, owner, true));
inferBlock(stmt.block, innerScope, owner);
} else if (stmt.kind == StatementKind.IfStatement) {
inferExpressionType(stmt.value!, scope);
inferBlock(stmt.block, scope, owner);
for (const ei of stmt.elseIf) {
inferExpressionType(ei.value, scope);
inferBlock(ei.block, scope, owner);
}
inferBlock(stmt.elseBlock!, scope, owner);
} else if (stmt.kind == StatementKind.ExpressionStatement) {
inferExpressionType(stmt.value!, scope);
} else if (stmt.kind == StatementKind.AssignStatement) {
inferExpressionType(stmt.lhs!, scope);
inferExpressionType(stmt.value!, scope);
}
}
}
export function flattenObjectType(type:class_ParsedType):class_ParsedType {
if (type.kind == TypeKind.pointerType || type.kind == TypeKind.nullableType) {
return flattenObjectType(type.ref!);
}
return type;
}
export function inferPublicExpressionType(expr:class_Expression,scope:Map<string,class_IdentifierOrigin>):class_ParsedType {
if (expr.kind == ExpressionKind.IntConstant) {
return ParsedType(TypeKind.intType, null, null);
} else if (expr.kind == ExpressionKind.StringConstant) {
return ParsedType(TypeKind.stringType, null, null);
} else if (expr.kind == ExpressionKind.BoolConstant) {
return ParsedType(TypeKind.boolType, null, null);
}
return ParsedType(TypeKind.unknownType, null, null);
}
export function inferExpressionType(expr:class_Expression,scope:Map<string,class_IdentifierOrigin>):class_ParsedType {
 // nullable<object<ParsedType>>
let returnType: class_ParsedType | null = null;
if (expr.kind == ExpressionKind.Identifier) {
if (scope.has(expr.value!)) {
expr.origin = scope.get(expr.value!)!;
expr.type = expr.origin!.type;
} else {
panic("Could not resolve identifier " + expr.value);
}
} else if (expr.kind == ExpressionKind.IntConstant) {
expr.type = ParsedType(TypeKind.intType, null, null);
} else if (expr.kind == ExpressionKind.StringConstant) {
expr.type = ParsedType(TypeKind.stringType, null, null);
} else if (expr.kind == ExpressionKind.BoolConstant) {
expr.type = ParsedType(TypeKind.boolType, null, null);
} else if (expr.kind == ExpressionKind.Not) {
inferExpressionType(expr.left!, scope);
expr.type = ParsedType(TypeKind.boolType, null, null);
} else if (expr.kind == ExpressionKind.And || expr.kind == ExpressionKind.Or || expr.kind == ExpressionKind.Equals || expr.kind == ExpressionKind.NotEquals || expr.kind == ExpressionKind.LessThan || expr.kind == ExpressionKind.LessThanEquals || expr.kind == ExpressionKind.GreaterThan || expr.kind == ExpressionKind.GreaterThanEquals) {
inferExpressionType(expr.left!, scope);
inferExpressionType(expr.right!, scope);
expr.type = ParsedType(TypeKind.boolType, null, null);
} else if (expr.kind == ExpressionKind.Add) {
inferExpressionType(expr.left!, scope);
inferExpressionType(expr.right!, scope);
if (expr.left!.type.kind == TypeKind.intType && expr.right!.type.kind == TypeKind.intType) {
expr.type = ParsedType(TypeKind.intType, null, null);
} else {
expr.type = ParsedType(TypeKind.stringType, null, null);
}
} else if (expr.kind == ExpressionKind.Subtract || expr.kind == ExpressionKind.Multiply || expr.kind == ExpressionKind.Divide || expr.kind == ExpressionKind.Modulo) {
inferExpressionType(expr.left!, scope);
inferExpressionType(expr.right!, scope);
expr.type = ParsedType(TypeKind.intType, null, null);
} else if (expr.kind == ExpressionKind.Dot || expr.kind == ExpressionKind.OptDot) {
 // object<ParsedType>
const type: class_ParsedType = flattenObjectType(inferExpressionType(expr.left!, scope));
if (type.kind == TypeKind.objectType && type.stmt?.kind == StatementKind.ClassStatement) {
expr.type = getFieldType(type.stmt, expr.value!);
} else if (type.kind == TypeKind.enumDefinitionType) {
returnType = ParsedType(TypeKind.enumType, null, type.stmt);
returnType.identifier = type.stmt!.identifier;
expr.type = returnType;
} else if (type.kind == TypeKind.stringType && expr.value == "length") {
expr.type = ParsedType(TypeKind.intType, null, null);
} else if (type.kind == TypeKind.arrayType && expr.value == "length") {
expr.type = ParsedType(TypeKind.intType, null, null);
} else if (type.kind == TypeKind.arrayType && expr.value == "push") {
 // object<Statement>
const fakeStmt: class_Statement = Statement(StatementKind.FunctionStatement);
fakeStmt.type = ParsedType(TypeKind.voidType, null, null);
expr.type = ParsedType(TypeKind.functionType, null, fakeStmt);
} else if (type.kind == TypeKind.mapType && expr.value == "has") {
 // object<Statement>
const fakeStmt: class_Statement = Statement(StatementKind.FunctionStatement);
fakeStmt.type = ParsedType(TypeKind.boolType, null, null);
expr.type = ParsedType(TypeKind.functionType, null, fakeStmt);
} else if (type.kind == TypeKind.mapType && expr.value == "delete") {
 // object<Statement>
const fakeStmt: class_Statement = Statement(StatementKind.FunctionStatement);
fakeStmt.type = ParsedType(TypeKind.voidType, null, null);
expr.type = ParsedType(TypeKind.functionType, null, fakeStmt);
} else if (type.kind == TypeKind.mapType && expr.value == "get") {
 // object<Statement>
const fakeStmt: class_Statement = Statement(StatementKind.FunctionStatement);
fakeStmt.type = type.ref!;
expr.type = ParsedType(TypeKind.functionType, null, fakeStmt);
} else if (type.kind == TypeKind.mapType && expr.value == "set") {
 // object<Statement>
const fakeStmt: class_Statement = Statement(StatementKind.FunctionStatement);
fakeStmt.type = ParsedType(TypeKind.voidType, null, null);
expr.type = ParsedType(TypeKind.functionType, null, fakeStmt);
} else if (type.kind == TypeKind.mapType && expr.value == "keys") {
 // object<Statement>
const fakeStmt: class_Statement = Statement(StatementKind.FunctionStatement);
fakeStmt.type = ParsedType(TypeKind.arrayType, type.mapKeyRef!, null);
expr.type = ParsedType(TypeKind.functionType, null, fakeStmt);
} else {
panic("Not an object type");
}
} else if (expr.kind == ExpressionKind.Bang) {
inferExpressionType(expr.left!, scope);
if (expr.left!.type.kind == TypeKind.nullableType) {
expr.type = expr.left!.type.ref!;
} else {
expr.type = expr.left!.type;
}
} else if (expr.kind == ExpressionKind.Invoke) {
 // object<ParsedType>
const type: class_ParsedType = inferExpressionType(expr.left!, scope);
if (type.kind == TypeKind.functionType) {
expr.type = type.stmt!.type!;
if (expr.type.kind == TypeKind.unknownType) {
panic("Could not infer return type of function");
}
} else if (type.kind == TypeKind.classType) {
returnType = ParsedType(TypeKind.objectType, null, type.stmt);
returnType.identifier = type.stmt!.identifier;
expr.type = returnType;
} else {
panic("Not a function or class type");
}
for (const arg of expr.indexes) {
inferExpressionType(arg, scope);
}
} else if (expr.kind == ExpressionKind.Slice) {
 // object<ParsedType>
const type: class_ParsedType = flattenObjectType(inferExpressionType(expr.left!, scope));
if (type.kind == TypeKind.arrayType) {
expr.type = type;
} else if (type.kind == TypeKind.stringType) {
expr.type = type;
} else {
panic("Not an array type");
}
for (const arg of expr.indexes) {
inferExpressionType(arg, scope);
}
} else if (expr.kind == ExpressionKind.ArrayConstant) {
expr.type = ParsedType(TypeKind.arrayInitType, null, null);
} else if (expr.kind == ExpressionKind.Index) {
 // object<ParsedType>
const type: class_ParsedType = flattenObjectType(inferExpressionType(expr.left!, scope));
if (type.kind == TypeKind.arrayType || type.kind == TypeKind.mapType) {
expr.type = type.ref!;
} else if (type.kind == TypeKind.stringType) {
expr.type = ParsedType(TypeKind.intType, null, null);
} else {
panic("Not an array type");
}
for (const arg of expr.indexes) {
inferExpressionType(arg, scope);
}
}
if (expr.type.kind == TypeKind.unknownType && expr.kind != ExpressionKind.NilConstant) {
panic("Could not infer type of expression");
}
return expr.type;
}
export function getFieldType(classDefinition:class_Statement,identifier:string):class_ParsedType {
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
export function inferBlock(block:class_Statement[],outerScope:Map<string,class_IdentifierOrigin>,owner:class_Statement):Map<string,class_IdentifierOrigin> {
 // unknown
const scope: Map<string,class_IdentifierOrigin> = getBlockDefinitions(block, outerScope);
applyScopeToBlock(block, scope, owner);
return scope;
}
export function inferClassFunctionInterface(scope:Map<string,class_IdentifierOrigin>,stmt:class_Statement):void {
resolveType(stmt.type, scope);
for (const arg of stmt.defnArguments) {
resolveType(arg.type, scope);
}
if (stmt.kind == StatementKind.ClassStatement) {
inferPublicInterface(stmt.block, scope);
}
}
export function resolveType(type:class_ParsedType,scope:Map<string,class_IdentifierOrigin>):void {
if (type.kind == TypeKind.objectType) {
if (scope.has(type.identifier!)) {
 // object<ParsedType>
const resolvedType: class_ParsedType = scope.get(type.identifier!)!.type;
if (resolvedType.kind == TypeKind.classType || resolvedType.kind == TypeKind.enumDefinitionType) {
type.stmt = resolvedType.stmt;
} else {
panic("Not a class or enum type " + type.identifier);
}
} else {
panic("Could not resolve type " + type.identifier);
}
} else if (type.kind == TypeKind.nullableType || type.kind == TypeKind.pointerType) {
resolveType(type.ref!, scope);
} else if (type.kind == TypeKind.arrayType) {
resolveType(type.ref!, scope);
} else if (type.kind == TypeKind.mapType) {
resolveType(type.ref!, scope);
resolveType(type.mapKeyRef!, scope);
}
}