import { __index_get, __index_set, __slice, panic } from "./runtime"
import { generateTSImport } from "./tboot"
// import goes here
import { World, Statement, StatementKind, ParsedType, TypeKind, Expression, ExpressionKind, DefnArgument} from "./parser"
export const IdentifierOriginKind = {
Field: 0, Parameter:1, Class:2, Enum:3, Function:4
};
export function IdentifierOrigin(kind,type,isMutable) {
const _o = {};
_o.kind = kind;
_o.type = type;
_o.isMutable = isMutable;
return _o;
}
export function cloneScope(scope) {
const newScope = new Map();
if (scope == null) {
return newScope;
}
for (const key of scope.keys()) {
newScope.set(key, scope.get(key));
}
return newScope;
}
export function getBlockDefinitions(block,outerScope) {
const scope = cloneScope(outerScope);
for (const stmt of block) {
if (stmt.kind == 4) {
scope.set(stmt.identifier, IdentifierOrigin(IdentifierOriginKind.Function, ParsedType(12, null, stmt), false));
} else if (stmt.kind == 3) {
scope.set(stmt.identifier, IdentifierOrigin(IdentifierOriginKind.Class, ParsedType(9, null, stmt), false));
} else if (stmt.kind == 2) {
scope.set(stmt.identifier, IdentifierOrigin(IdentifierOriginKind.Enum, ParsedType(11, null, stmt), false));
}
}
return scope;
}
export function inferAsync(world) {
function spread(sources) {
const nextGen = [];
for (const fn of sources) {
for (const ref of fn.referencedBy.keys()) {
if (!ref.async) {
ref.async = true;
nextGen.push(ref);
}
}
}
return nextGen;
}
let nextGen = spread(world.allCode.filter((it)=>it.async));
while (nextGen.length > 0) {
nextGen = spread(nextGen);
}
}
export function inferPublicInterface(module,outerScope) {
const scope = getBlockDefinitions(module, outerScope);
for (const stmt of module) {
if (stmt.kind == 3 || stmt.kind == 4) {
inferClassFunctionInterface(scope, stmt);
} else if (stmt.kind == 1 || stmt.kind == 0) {
if (stmt.type.kind == 16) {
stmt.type = inferPublicExpressionType(stmt.value, scope);
} else if (stmt.type != null) {
resolveType(stmt.type, scope);
}
}
}
return scope;
}
export function effectiveType(type) {
if (type.kind == 8) {
return effectiveType(type.ref);
}
return type;
}
export function applyScopeToBlock(block,scope,owner) {
const forClass = owner.kind == 3;
for (const stmt of block) {
if (stmt.kind == 3 || stmt.kind == 4) {
inferClassFunctionInterface(scope, stmt);
}
}
for (const stmt of block) {
if (stmt.kind == 3 || stmt.kind == 4) {
const innerScope = cloneScope(scope);
for (const arg of stmt.defnArguments) {
if (stmt.kind == 3 && arg.isPublic) {
innerScope.set(arg.identifier, IdentifierOrigin(IdentifierOriginKind.Field, arg.type, true));
} else {
innerScope.set(arg.identifier, IdentifierOrigin(IdentifierOriginKind.Parameter, arg.type, true));
}
}
inferBlock(stmt.block, innerScope, stmt);
} else if (stmt.kind == 1 || stmt.kind == 0) {
if (stmt.value != null) {
resolveType(stmt.type, scope);
inferExpressionType(stmt.value, scope, stmt.type, owner);
}
if (stmt.type.kind == 16) {
stmt.type = inferExpressionType(stmt.value, scope, null, owner);
if (stmt.type.kind == 16) {
panic("Could not infer type of " + stmt.identifier);
}
} else {
resolveType(stmt.type, scope);
}
if (forClass && stmt.isPublic) {
scope.set(stmt.identifier, IdentifierOrigin(IdentifierOriginKind.Field, stmt.type, stmt.kind == 1));
} else {
scope.set(stmt.identifier, IdentifierOrigin(IdentifierOriginKind.Parameter, stmt.type, stmt.kind == 1));
}
} else if (stmt.kind == 5) {
if (stmt.value != null) {
stmt.value.type = inferExpressionType(stmt.value, scope, owner.type, owner);
}
} else if (stmt.kind == 7) {
inferExpressionType(stmt.value, scope, null, owner);
inferBlock(stmt.block, scope, owner);
} else if (stmt.kind == 11) {
inferBlock(stmt.block, scope, owner);
inferExpressionType(stmt.value, scope, null, owner);
} else if (stmt.kind == 12) {
inferExpressionType(stmt.value, scope, null, owner);
const sequenceType = effectiveType(stmt.value.type);
if (sequenceType.kind != 5) {
panic("For loop must iterate over an array");
}
const innerScope = cloneScope(scope);
innerScope.set(stmt.identifier, IdentifierOrigin(IdentifierOriginKind.Parameter, sequenceType.ref, true));
inferBlock(stmt.block, innerScope, owner);
} else if (stmt.kind == 6) {
inferExpressionType(stmt.value, scope, null, owner);
inferBlock(stmt.block, scope, owner);
for (const ei of stmt.elseIf) {
inferExpressionType(ei.value, scope, null, owner);
inferBlock(ei.block, scope, owner);
}
inferBlock(stmt.elseBlock, scope, owner);
} else if (stmt.kind == 10) {
inferExpressionType(stmt.value, scope, null, owner);
} else if (stmt.kind == 9) {
inferExpressionType(stmt.lhs, scope, null, owner);
inferExpressionType(stmt.value, scope, stmt.lhs.type, owner);
}
}
}
export function flattenObjectType(type) {
if (type.kind == 8 || type.kind == 7) {
return flattenObjectType(type.ref);
}
return type;
}
export function inferPublicExpressionType(expr,scope) {
if (expr.kind == 0) {
return ParsedType(0, null, null);
} else if (expr.kind == 2) {
return ParsedType(3, null, null);
} else if (expr.kind == 26) {
return ParsedType(2, null, null);
}
return ParsedType(16, null, null);
}
export function inferExpressionType(expr,scope,impliedType,owner) {
let returnType = null;
if (expr.kind == 5) {
if (impliedType != null) {
const implied = flattenObjectType(impliedType);
if (implied.kind == 10) {
const enumDef = implied.stmt;
const enumValue = enumDef.identifierList.indexOf(expr.value);
if (enumValue >= 0) {
expr.kind = 0;
expr.value = "" + enumValue;
expr.type = ParsedType(10, null, enumDef);
return expr.type;
}
}
}
if (scope.has(expr.value)) {
expr.origin = scope.get(expr.value);
expr.type = expr.origin.type;
if (expr.type.kind == 12 || expr.type.kind == 9) {
expr.type.stmt.referencedBy.set(owner, true);
}
} else {
panic("Could not resolve identifier " + expr.value);
}
} else if (expr.kind == 0) {
expr.type = ParsedType(0, null, null);
} else if (expr.kind == 2) {
expr.type = ParsedType(3, null, null);
} else if (expr.kind == 26) {
expr.type = ParsedType(2, null, null);
} else if (expr.kind == 27) {
inferExpressionType(expr.left, scope, null, owner);
expr.type = ParsedType(2, null, null);
} else if (expr.kind == 28) {
inferExpressionType(expr.left, scope, null, owner);
expr.type = expr.left.type;
} else if (expr.kind == 29) {
inferExpressionType(expr.left, scope, null, owner);
expr.type = expr.left.type;
} else if (expr.kind == 13 || expr.kind == 14) {
const leftType = inferExpressionType(expr.left, scope, null, owner);
inferExpressionType(expr.right, scope, leftType, owner);
expr.type = ParsedType(2, null, null);
} else if (expr.kind == 17 || expr.kind == 18 || expr.kind == 11 || expr.kind == 12 || expr.kind == 15 || expr.kind == 16) {
inferExpressionType(expr.left, scope, null, owner);
inferExpressionType(expr.right, scope, null, owner);
expr.type = ParsedType(2, null, null);
} else if (expr.kind == 9) {
inferExpressionType(expr.left, scope, null, owner);
inferExpressionType(expr.right, scope, null, owner);
if (expr.left.type.kind == 0 && expr.right.type.kind == 0) {
expr.type = ParsedType(0, null, null);
} else {
expr.type = ParsedType(3, null, null);
}
} else if (expr.kind == 10 || expr.kind == 6 || expr.kind == 7 || expr.kind == 8) {
inferExpressionType(expr.left, scope, null, owner);
inferExpressionType(expr.right, scope, null, owner);
expr.type = ParsedType(0, null, null);
} else if (expr.kind == 20 || expr.kind == 19) {
const type = flattenObjectType(inferExpressionType(expr.left, scope, null, owner));
if (type.kind == 4 && type.stmt?.kind == 3) {
expr.type = getFieldType(type.stmt, expr.value);
} else if (type.kind == 11) {
const enumStmt = type.stmt;
if (enumStmt.identifierList.indexOf(expr.value) < 0) {
panic("Could not find enum value " + expr.value);
}
returnType = ParsedType(10, null, type.stmt);
returnType.identifier = type.stmt.identifier;
expr.type = returnType;
} else if (type.kind == 3 && expr.value == "length") {
expr.type = ParsedType(0, null, null);
} else if (type.kind == 5 && expr.value == "length") {
expr.type = ParsedType(0, null, null);
} else if (type.kind == 5 && expr.value == "push") {
const fakeStmt = Statement(4);
fakeStmt.type = ParsedType(13, null, null);
fakeStmt.defnArguments.push(DefnArgument("value", type.ref, false));
expr.type = ParsedType(12, null, fakeStmt);
} else if (type.kind == 5 && expr.value == "indexOf") {
const fakeStmt = Statement(4);
fakeStmt.type = ParsedType(0, null, null);
fakeStmt.defnArguments.push(DefnArgument("value", type.ref, false));
expr.type = ParsedType(12, null, fakeStmt);
} else if (type.kind == 5 && expr.value == "filter") {
const callbackTypeStmt = Statement(4);
callbackTypeStmt.identifier = "where";
callbackTypeStmt.type = ParsedType(2, null, null);
callbackTypeStmt.defnArguments.push(DefnArgument("it", type.ref, false));
const callbackType = ParsedType(12, null, callbackTypeStmt);
const fakeStmt = Statement(4);
fakeStmt.type = type;
fakeStmt.identifier = "filter";
fakeStmt.defnArguments.push(DefnArgument("where", callbackType, false));
expr.type = ParsedType(12, null, fakeStmt);
} else if (type.kind == 5 && expr.value == "join") {
const fakeStmt = Statement(4);
fakeStmt.type = ParsedType(3, null, null);
expr.type = ParsedType(12, null, fakeStmt);
} else if (type.kind == 6 && expr.value == "has") {
const fakeStmt = Statement(4);
fakeStmt.type = ParsedType(2, null, null);
fakeStmt.defnArguments.push(DefnArgument("key", type.ref, false));
expr.type = ParsedType(12, null, fakeStmt);
} else if (type.kind == 6 && expr.value == "delete") {
const fakeStmt = Statement(4);
fakeStmt.type = ParsedType(13, null, null);
fakeStmt.defnArguments.push(DefnArgument("key", type.ref, false));
expr.type = ParsedType(12, null, fakeStmt);
} else if (type.kind == 6 && expr.value == "keys") {
const fakeStmt = Statement(4);
fakeStmt.type = ParsedType(5, type.mapKeyRef, null);
expr.type = ParsedType(12, null, fakeStmt);
} else {
panic("Not an object type");
}
} else if (expr.kind == 21) {
inferExpressionType(expr.left, scope, null, owner);
if (expr.left.type.kind == 7) {
expr.type = expr.left.type.ref;
} else {
expr.type = expr.left.type;
}
} else if (expr.kind == 22) {
const type = inferExpressionType(expr.left, scope, null, owner);
if (type.kind == 12) {
expr.type = type.stmt.type;
if (expr.type.kind == 16) {
panic("Could not infer return type of function");
}
type.stmt.referencedBy.set(owner, true);
} else if (type.kind == 9) {
returnType = ParsedType(4, null, type.stmt);
returnType.identifier = type.stmt.identifier;
expr.type = returnType;
type.stmt.referencedBy.set(owner, true);
} else {
panic("Not a function or class type");
}
const functionDecl = type.stmt;
if (functionDecl.async) {
owner.async = true;
}
const argumentDefs = functionDecl.defnArguments;
let aidx = 0;
while (aidx < expr.indexes.length) {
const arg = expr.indexes[aidx];
const name = expr.identifiers[aidx];
let didx = 0;
let found = false;
while (didx < argumentDefs.length) {
const defn = argumentDefs[didx];
if (defn.identifier == name) {
found = true;
if (defn.type.kind == 12) {
const lambdaScope = cloneScope(scope);
const scopeArgs = defn.type.stmt.defnArguments;
for (const scopeArg of scopeArgs) {
lambdaScope.set(scopeArg.identifier, IdentifierOrigin(IdentifierOriginKind.Parameter, scopeArg.type, true));
}
inferExpressionType(arg, lambdaScope, null, owner);
} else {
inferExpressionType(arg, scope, defn.type, owner);
}
}
didx = didx + 1;
}
aidx = aidx + 1;
}
} else if (expr.kind == 25) {
const type = flattenObjectType(inferExpressionType(expr.left, scope, null, owner));
if (type.kind == 5) {
expr.type = type;
} else if (type.kind == 3) {
expr.type = type;
} else {
panic("Not an array type");
}
for (const arg of expr.indexes) {
inferExpressionType(arg, scope, null, owner);
}
} else if (expr.kind == 4) {
expr.type = ParsedType(14, null, null);
} else if (expr.kind == 23) {
const type = flattenObjectType(inferExpressionType(expr.left, scope, null, owner));
if (type.kind == 5 || type.kind == 6) {
expr.type = type.ref;
} else if (type.kind == 3) {
expr.type = ParsedType(0, null, null);
} else {
panic("Not an array type");
}
for (const arg of expr.indexes) {
inferExpressionType(arg, scope, null, owner);
}
}
if (expr.type.kind == 16 && expr.kind != 3) {
panic("Could not infer type of expression");
}
return expr.type;
}
export function getFieldType(classDefinition,identifier) {
for (const arg of classDefinition.defnArguments) {
if (arg.identifier == identifier) {
return arg.type;
}
}
for (const stmt of classDefinition.block) {
if (stmt.kind == 0 || stmt.kind == 1) {
if (stmt.identifier == identifier) {
return stmt.type;
}
} else if (stmt.kind == 4) {
if (stmt.identifier == identifier) {
return ParsedType(12, null, stmt);
}
}
}
panic("Field " + identifier + " not found in class " + classDefinition.identifier);
return ParsedType(17, null, null);
}
export function inferBlock(block,outerScope,owner) {
const scope = getBlockDefinitions(block, outerScope);
applyScopeToBlock(block, scope, owner);
return scope;
}
export function inferClassFunctionInterface(scope,stmt) {
resolveType(stmt.type, scope);
for (const arg of stmt.defnArguments) {
resolveType(arg.type, scope);
}
if (stmt.kind == 3) {
inferPublicInterface(stmt.block, scope);
}
}
export function resolveType(type,scope) {
if (type.kind == 4) {
if (scope.has(type.identifier)) {
const resolvedType = scope.get(type.identifier).type;
if (resolvedType.kind == 9) {
type.stmt = resolvedType.stmt;
} else if (resolvedType.kind == 11) {
type.stmt = resolvedType.stmt;
type.kind = 10;
} else {
panic("Not a class or enum type " + type.identifier);
}
} else {
panic("Could not resolve type " + type.identifier);
}
} else if (type.kind == 7 || type.kind == 8) {
resolveType(type.ref, scope);
} else if (type.kind == 5) {
resolveType(type.ref, scope);
} else if (type.kind == 6) {
resolveType(type.ref, scope);
resolveType(type.mapKeyRef, scope);
}
}