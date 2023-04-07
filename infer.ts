import { __index_get, __index_set, __slice, StringMap, panic, class_StringMap } from "./runtime"
import { generateTSImport, importScope } from "./tboot"
// import goes here
import { class_Statement, Statement, StatementKind, class_ParsedType, ParsedType, TypeKind, ExpressionKind} from "./parser"
export function getBlockDefinitions(block:class_Statement[],outerScope:class_StringMap | null):class_StringMap {
 // unknown
const scope: any = StringMap(outerScope);
for (const stmt of block) {
if (stmt.kind == StatementKind.FunctionStatement || stmt.kind == StatementKind.ClassStatement || stmt.kind == StatementKind.EnumStatement || stmt.kind == StatementKind.LetStatement || stmt.kind == StatementKind.ConstStatement) {
scope.set(stmt.identifier, stmt);
}
}
return scope;
}
export function inferPublicInterface(module:class_Statement[],outerScope:class_StringMap):class_StringMap {
 // unknown
const scope: any = getBlockDefinitions(module, outerScope);
for (const stmt of module) {
if (stmt.kind == StatementKind.ImportStatement) {
importScope(scope, stmt);
}
}
applyScopeToBlock(module, scope);
return scope;
}
export function applyScopeToBlock(block:class_Statement[],scope:class_StringMap):void {
for (const stmt of block) {
if (stmt.kind == StatementKind.ClassStatement || stmt.kind == StatementKind.FunctionStatement) {
inferClassFunctionInterface(scope, stmt);
} else if (stmt.kind == StatementKind.LetStatement || stmt.kind == StatementKind.ConstStatement) {
if (stmt.type != null) {
resolveType(stmt.type, scope);
} else if (stmt.value?.kind == ExpressionKind.BoolConstant) {
stmt.type = ParsedType(TypeKind.boolType, null, null);
}
}
}
}
export function inferBlock(block:class_Statement[],outerScope:class_StringMap):void {
 // unknown
const blockScope: any = getBlockDefinitions(block, outerScope);
}
export function inferClassFunctionInterface(scope:class_StringMap,stmt:class_Statement):void {
resolveType(stmt.type, scope);
for (const arg of stmt.defnArguments) {
resolveType(arg.type, scope);
}
}
export function resolveType(type:class_ParsedType,scope:class_StringMap):void {
if (type.kind == TypeKind.objectType) {
if (scope.has(type.identifier!)) {
type.stmt = scope.get(type.identifier!);
} else {
panic("Could not resolve type " + type.identifier);
}
} else if (type.kind == TypeKind.nullableType || type.kind == TypeKind.pointerType) {
resolveType(type.ref!, scope);
} else if (type.kind == TypeKind.arrayType) {
resolveType(type.ref!, scope);
}
}