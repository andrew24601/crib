import { __index_get, __index_set, __slice, StringMap, panic, class_StringMap } from "./runtime"
import { generateTSImport, importScope } from "./tboot"
// import goes here
import { class_Statement, Statement, StatementKind, class_ParsedType, ParsedType, TypeKind, class_Expression, Expression, ExpressionKind} from "./parser"
export function getBlockDefinitions(block:class_Statement[],outerScope:class_StringMap | null):class_StringMap {
 // object<StringMap>
const scope: class_StringMap = StringMap(outerScope);
for (const stmt of block) {
if (stmt.kind == StatementKind.FunctionStatement) {
scope.set(stmt.identifier!, ParsedType(TypeKind.functionType, null, stmt));
} else if (stmt.kind == StatementKind.ClassStatement) {
scope.set(stmt.identifier!, ParsedType(TypeKind.classType, null, stmt));
} else if (stmt.kind == StatementKind.EnumStatement) {
scope.set(stmt.identifier!, ParsedType(TypeKind.enumDefinitionType, null, stmt));
}
}
return scope;
}
export function inferPublicInterface(module:class_Statement[],outerScope:class_StringMap):class_StringMap {
 // object<StringMap>
const scope: class_StringMap = getBlockDefinitions(module, outerScope);
for (const stmt of module) {
if (stmt.kind == StatementKind.ClassStatement || stmt.kind == StatementKind.FunctionStatement) {
inferClassFunctionInterface(scope, stmt);
} else if (stmt.kind == StatementKind.LetStatement || stmt.kind == StatementKind.ConstStatement) {
if (stmt.type == null) {
stmt.type = inferPublicExpressionType(stmt.value!, scope);
} else if (stmt.type != null) {
resolveType(stmt.type, scope);
}
}
}
return scope;
}
export function applyScopeToBlock(block:class_Statement[],scope:class_StringMap):void {
for (const stmt of block) {
if (stmt.kind == StatementKind.ClassStatement || stmt.kind == StatementKind.FunctionStatement) {
inferClassFunctionInterface(scope, stmt);
 // unknown
const innerScope: any = StringMap(scope);
for (const arg of stmt.defnArguments) {
innerScope.set(arg.identifier, arg.type);
}
inferBlock(stmt.block, innerScope);
} else if (stmt.kind == StatementKind.LetStatement || stmt.kind == StatementKind.ConstStatement) {
if (stmt.type.kind == TypeKind.unknownType) {
stmt.type = inferExpressionType(stmt.value!, scope);
} else {
resolveType(stmt.type, scope);
}
}
}
}
export function flattenObjectType(type:class_ParsedType):class_ParsedType {
if (type.kind == TypeKind.pointerType || type.kind == TypeKind.nullableType) {
return flattenObjectType(type.ref!);
}
return type;
}
export function inferPublicExpressionType(expr:class_Expression,scope:class_StringMap):class_ParsedType {
if (expr.kind == ExpressionKind.IntConstant) {
return ParsedType(TypeKind.intType, null, null);
} else if (expr.kind == ExpressionKind.StringConstant) {
return ParsedType(TypeKind.stringType, null, null);
} else if (expr.kind == ExpressionKind.BoolConstant) {
return ParsedType(TypeKind.boolType, null, null);
}
return ParsedType(TypeKind.unknownType, null, null);
}
export function inferExpressionType(expr:class_Expression,scope:class_StringMap):class_ParsedType {
 // nullable<object<ParsedType>>
let returnType: class_ParsedType | null = null;
if (expr.kind == ExpressionKind.Identifier) {
if (scope.has(expr.value!)) {
return scope.get(expr.value!)!;
} else {
panic("Could not resolve identifier " + expr.value);
}
} else if (expr.kind == ExpressionKind.IntConstant) {
return ParsedType(TypeKind.intType, null, null);
} else if (expr.kind == ExpressionKind.StringConstant) {
return ParsedType(TypeKind.stringType, null, null);
} else if (expr.kind == ExpressionKind.BoolConstant) {
return ParsedType(TypeKind.boolType, null, null);
} else if (expr.kind == ExpressionKind.Dot) {
 // unknown
const type: any = flattenObjectType(inferExpressionType(expr.left!, scope));
if (type.kind == TypeKind.objectType && type.stmt?.kind == StatementKind.ClassStatement) {
return getFieldType(type.stmt, expr.value!);
} else if (type.kind == TypeKind.enumDefinitionType) {
returnType = ParsedType(TypeKind.enumType, null, type.stmt);
returnType.identifier = type.stmt!.identifier;
return returnType;
} else if (type.kind == TypeKind.stringType && expr.value == "length") {
return ParsedType(TypeKind.intType, null, null);
} else if (type.kind == TypeKind.arrayType && expr.value == "length") {
return ParsedType(TypeKind.intType, null, null);
} else {
panic("Not an object type");
}
} else if (expr.kind == ExpressionKind.Invoke) {
 // unknown
const type: any = inferExpressionType(expr.left!, scope);
if (type.kind == TypeKind.functionType) {
return type.stmt.type;
} else if (type.kind == TypeKind.classType) {
returnType = ParsedType(TypeKind.objectType, null, type.stmt);
returnType.identifier = type.stmt.identifier;
return returnType;
} else {
panic("Not a function or class type");
}
} else if (expr.kind == ExpressionKind.Index) {
 // unknown
const type: any = flattenObjectType(inferExpressionType(expr.left!, scope));
if (type.kind == TypeKind.arrayType) {
return type.ref!;
} else if (type.kind == TypeKind.stringType) {
return ParsedType(TypeKind.intType, null, null);
} else {
panic("Not an array type");
}
}
return ParsedType(TypeKind.unknownType, null, null);
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
export function inferBlock(block:class_Statement[],outerScope:class_StringMap):class_StringMap {
 // object<StringMap>
const scope: class_StringMap = getBlockDefinitions(block, outerScope);
applyScopeToBlock(block, scope);
return scope;
}
export function inferClassFunctionInterface(scope:class_StringMap,stmt:class_Statement):void {
resolveType(stmt.type, scope);
for (const arg of stmt.defnArguments) {
resolveType(arg.type, scope);
}
if (stmt.kind == StatementKind.ClassStatement) {
inferPublicInterface(stmt.block, scope);
}
}
export function resolveType(type:class_ParsedType,scope:class_StringMap):void {
if (type.kind == TypeKind.objectType) {
if (scope.has(type.identifier!)) {
 // unknown
const resolvedType: any = scope.get(type.identifier!);
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
}
}