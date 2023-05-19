import { __index_get, __index_set, __slice, panic } from "./runtime"
import { generateTSImport, generateCImport } from "./tboot"
// import goes here
import { Statement, StatementKind, ParsedType, ExpressionKind, TypeKind, Expression, DefnArgument} from "./parser"
// import goes here
import { IdentifierOriginKind} from "./infer"
export function DeferredCode(stmt,context) {
const _o = {};
_o.stmt = stmt;
_o.context = context;
return _o;
}
export function generateC(block,name,module) {
const _o = {};
_o.result = [];
_o.declarations = [];
_o.header = [];
_o.deferred = [];
_o.declarations.push('#include "runtime.h"');
_o.declarations.push('#include "' + name + '.h"');
function getInitValue(expr,type) {
if (expr != null) {
return generateExpression(expr);
} else if (type?.kind == 0) {
return "0";
} else if (type?.kind == 5) {
return "_new_object_array()";
} else if (type?.kind == 2) {
return "false";
} else if (type?.kind == 6) {
return "_new_object_map()";
} else {
return "null";
}
}
function generateBlock(block,owner) {
const forClass = owner?.stmt.kind == 3;
for (const stmt of block) {
if (stmt.kind == 0 || stmt.kind == 1) {
const initValue = getInitValue(stmt.value, stmt.type);
let declaration = formatParsedType(stmt.type);
if (owner != null && owner.stmt.contextKind == 1) {
_o.result.push("_ctx_" + owner.stmt.identifier + "->" + stmt.identifier + " = " + initValue + ";");
} else {
_o.result.push(declaration + " " + stmt.identifier + " = " + initValue + ";");
}
} else if (stmt.kind == 6) {
_o.result.push("if (" + generateExpression(stmt.value) + ") {");
generateBlock(stmt.block, owner);
for (const ei of stmt.elseIf) {
_o.result.push("} else if (" + generateExpression(ei.value) + ") {");
generateBlock(ei.block, owner);
}
if (stmt.elseBlock.length > 0) {
_o.result.push("} else {");
generateBlock(stmt.elseBlock, owner);
}
_o.result.push("}");
} else if (stmt.kind == 7) {
_o.result.push("while (" + generateExpression(stmt.value) + ") {");
generateBlock(stmt.block, owner);
_o.result.push("}");
} else if (stmt.kind == 11) {
_o.result.push("do {");
generateBlock(stmt.block, owner);
_o.result.push("} while (!(" + generateExpression(stmt.value) + "));");
} else if (stmt.kind == 12) {
_o.result.push("for (const " + stmt.identifier + " of " + generateExpression(stmt.value) + ") {");
generateBlock(stmt.block, owner);
_o.result.push("}");
} else if (stmt.kind == 13) {
_o.result.push("for (let " + stmt.identifier + " = " + generateExpression(stmt.lhs) + "; " + stmt.identifier + " <= " + generateExpression(stmt.value) + "; " + stmt.identifier + "++) {");
generateBlock(stmt.block, owner);
_o.result.push("}");
} else if (stmt.kind == 14) {
_o.result.push("for (let " + stmt.identifier + " = " + generateExpression(stmt.lhs) + "; " + stmt.identifier + " <= " + generateExpression(stmt.value) + "; " + stmt.identifier + "++) {");
generateBlock(stmt.block, owner);
_o.result.push("}");
} else if (stmt.kind == 9) {
if (stmt.lhs.kind == 23) {
if (effectiveType(stmt.lhs.left.type).kind == 6) {
_o.result.push(generateExpression(stmt.lhs.left) + ".set(" + generateExpression(stmt.lhs.indexes[0]) + ", " + generateExpression(stmt.value) + ");");
} else {
_o.result.push(generateExpression(stmt.lhs.left) + "[" + generateExpression(stmt.lhs.indexes[0]) + "] = " + generateExpression(stmt.value) + ";");
}
} else {
_o.result.push(generateExpression(stmt.lhs) + " = " + generateExpression(stmt.value) + ";");
}
} else if (stmt.kind == 3) {
let parent = stmt.parentContext;
_o.deferred.push(DeferredCode(stmt, "struct _type_" + parent.identifier + " *_ctx_" + parent.identifier));
} else if (stmt.kind == 4) {
let parent = stmt.parentContext;
_o.deferred.push(DeferredCode(stmt, "struct _type_" + parent.identifier + " *_ctx_" + parent.identifier));
} else if (stmt.kind == 2) {
_o.result.push("// enum " + stmt.identifier);
} else if (stmt.kind == 5) {
_o.result.push("return " + generateExpression(stmt.value) + ";");
} else if (stmt.kind == 8) {
_o.declarations.push(generateCImport(stmt));
} else if (stmt.kind == 10) {
_o.result.push(generateExpression(stmt.value) + ";");
} else {
_o.result.push("unknown");
}
}
}
function generateStruct(block,context) {
for (const decl of block) {
if (decl.kind == 0 || decl.kind == 1) {
_o.header.push("    " + formatParsedType(decl.type) + " " + decl.identifier + ";");
}
}
let parent = context.parentContext;
while (parent != null) {
_o.header.push("    struct _type_" + parent.identifier + " *" + getContextIdentifier(parent) + ";");
parent = parent.parentContext;
}
}
function generateParentContext(context) {
if (context.parentContext != null) {
const parent = context.parentContext;
_o.result.push("struct _type_" + parent.identifier + " *" + getContextIdentifier(parent) + " = " + getContextIdentifier(context) + "->" + getContextIdentifier(parent) + ";");
generateParentContext(parent);
}
}
function generateFunction(code) {
const stmt = code.stmt;
const name = stmt.identifier;
if (stmt.kind == 4) {
const funcDecl = formatParsedType(stmt.type) + " " + stmt.compileIdentifier + "(" + code.context + generateDefnArguments(stmt.defnArguments) + ")";
_o.result.push(funcDecl + " {");
generateParentContext(stmt.parentContext);
_o.declarations.push(funcDecl + ";");
} else if (stmt.kind == 3) {
const classType = "struct _type_" + name;
const classDecl = classType + " *" + stmt.compileIdentifier + "(" + code.context + generateDefnArguments(stmt.defnArguments) + ")";
_o.result.push(classDecl + " {");
generateParentContext(stmt.parentContext);
_o.result.push("struct _type_" + name + " *_ctx_" + name + " = alloc(sizeof(struct _type_" + name + "));");
for (const arg of stmt.defnArguments) {
_o.result.push("_ctx_" + name + "->" + arg.identifier + " = " + arg.identifier + ";");
}
_o.declarations.push(classDecl + ";");
}
generateBlock(stmt.block, code);
if (stmt.kind == 3) {
_o.result.push("return _ctx_" + name + ";");
}
_o.result.push("}");
_o.result.push("");
}
_o.header.push("struct _type_" + name + " {");
generateStruct(block, module);
_o.header.push("};");
_o.result.push("struct _type_" + name + " *init_" + name + "() {");
_o.result.push("struct _type_" + name + " *_ctx_" + name + " = alloc(sizeof(struct _type_" + name + "));");
generateBlock(block, null);
_o.result.push("return _ctx_" + name + ";");
_o.result.push("}");
for (const stmt of block) {
if (stmt.kind == 3) {
_o.header.push("struct _type_" + stmt.identifier + " {");
for (const arg of stmt.defnArguments) {
_o.header.push("    " + formatParsedType(arg.type) + " " + arg.identifier + ";");
}
generateStruct(stmt.block, stmt);
_o.header.push("};");
}
}
let idx = 0;
while (idx < _o.deferred.length) {
const code = _o.deferred[idx];
idx = idx + 1;
generateFunction(code);
}
return _o;
}
export function generateExpression(expr) {
if (expr == null) {
return "*nil";
}
if (expr.type.kind == 16 && expr.kind != 3) {
panic("expression not inferred");
}
if (expr.kind == 11) {
return generateExpression(expr.left) + " < " + generateExpression(expr.right);
} else if (expr.kind == 15) {
return generateExpression(expr.left) + " > " + generateExpression(expr.right);
} else if (expr.kind == 13) {
return generateExpression(expr.left) + " == " + generateExpression(expr.right);
} else if (expr.kind == 14) {
return generateExpression(expr.left) + " != " + generateExpression(expr.right);
} else if (expr.kind == 16) {
return generateExpression(expr.left) + " >= " + generateExpression(expr.right);
} else if (expr.kind == 12) {
return generateExpression(expr.left) + " <= " + generateExpression(expr.right);
} else if (expr.kind == 9) {
return generateExpression(expr.left) + " + " + generateExpression(expr.right);
} else if (expr.kind == 10) {
return generateExpression(expr.left) + " - " + generateExpression(expr.right);
} else if (expr.kind == 6) {
return generateExpression(expr.left) + " * " + generateExpression(expr.right);
} else if (expr.kind == 7) {
return generateExpression(expr.left) + " / " + generateExpression(expr.right);
} else if (expr.kind == 18) {
return generateExpression(expr.left) + " || " + generateExpression(expr.right);
} else if (expr.kind == 17) {
return generateExpression(expr.left) + " && " + generateExpression(expr.right);
} else if (expr.kind == 20 || expr.kind == 19) {
if (effectiveType(expr.left.type).kind == 3 && expr.value == "length") {
return "_string_length(" + generateExpression(expr.left) + ")";
}
if (expr.left.type.kind == 11) {
const enumDef = expr.left.type.stmt;
const enumValue = enumDef.identifierList.indexOf(expr.value);
if (enumValue >= 0) {
return "" + enumValue;
}
panic(expr.value + " is not a member of the enumeration");
}
return generateExpression(expr.left) + "->" + expr.value;
} else if (expr.kind == 27) {
return "!" + generateExpression(expr.left);
} else if (expr.kind == 21) {
return generateExpression(expr.left);
} else if (expr.kind == 0) {
return expr.value;
} else if (expr.kind == 3) {
return "null";
} else if (expr.kind == 26) {
return expr.value;
} else if (expr.kind == 2) {
return expr.value;
} else if (expr.kind == 5) {
if (expr.origin.context != null) {
if (expr.origin.context.contextKind == 2) {
return expr.value;
} else {
return "_ctx_" + expr.origin.context.identifier + "->" + expr.value;
}
} else if (expr.origin.kind == 0 || expr.origin.kind == 5) {
return "this->" + expr.value;
} else {
return expr.value;
}
} else if (expr.kind == 22) {
const functionDecl = expr.left.type.stmt;
if (expr.left.kind == 20 || expr.left.kind == 19) {
return functionDecl.compileIdentifier + "(" + generateExpression(expr.left.left) + generateNamedArguments(expr.left.type, expr.indexes, expr.identifiers) + ")";
} else if (expr.left.kind == 5) {
return functionDecl.compileIdentifier + "(" + getFunctionContext(functionDecl) + generateNamedArguments(expr.left.type, expr.indexes, expr.identifiers) + ")";
}
return generateExpression(expr.left) + "(" + generateNamedArguments(expr.left.type, expr.indexes, expr.identifiers) + ")";
} else if (expr.kind == 25) {
return "__slice(" + generateExpression(expr.left) + generateArguments(expr.indexes) + ")";
} else if (expr.kind == 23) {
if (expr.indexes.length == 0) {
return "[]";
}
if (effectiveType(expr.left.type).kind == 3) {
return "_string_char_code_at(" + generateExpression(expr.left) + generateArguments(expr.indexes) + ")";
} else if (effectiveType(expr.left.type).kind == 6) {
return generateExpression(expr.left) + ".get(" + generateArguments(expr.indexes) + ")";
} else if (effectiveType(expr.left.type).kind == 5) {
return generateExpression(expr.left) + "[" + generateArguments(expr.indexes) + "]";
} else {
return "__index_get(" + generateExpression(expr.left) + generateArguments(expr.indexes) + ")";
}
} else if (expr.kind == 29) {
const left = expr.left;
if (left.kind == 5) {
return "(__taker=" + generateExpression(left) + "," + generateExpression(left) + "=null,__taker)";
} else if (left.kind == 20 || left.kind == 19) {
return "(__taker2=" + generateExpression(left.left) + ",__taker=__taker2." + left.value + ",__taker2." + left.value + "=null,__taker)";
} else {
return "*takeexpression*";
}
} else {
return "*expression*";
}
}
export function getContextIdentifier(context) {
return "_ctx_" + context.identifier;
}
export function getFunctionContext(stmt) {
if (stmt.parentContext == null) {
return "0";
}
return getContextIdentifier(stmt.parentContext);
}
export function effectiveType(type) {
if (type.kind == 8 || type.kind == 7) {
return effectiveType(type.ref);
}
return type;
}
export function generateDefnArgument(arg) {
return formatParsedType(arg.type) + " " + arg.identifier;
}
export function generateDefnArguments(args) {
let result = "";
let idx = 0;
while (idx < args.length) {
result = result + "," + generateDefnArgument(args[idx]);
idx = idx + 1;
}
return result;
}
export function generateNamedArguments(type,args,argNames) {
if (type.kind != 12 && type.kind != 9) {
panic("not a function type");
}
const defnArguments = type.stmt.defnArguments;
if (defnArguments.length == 0) {
return "";
}
function generateClosureParams(args) {
if (args.length == 0) {
return "";
}
let result = args[0].identifier;
let idx = 1;
while (idx < args.length) {
result = result + "," + args[idx].identifier;
idx = idx + 1;
}
return result;
}
function generateArg(idx) {
const argType = defnArguments[idx].type;
let aidx = 0;
while (aidx < argNames.length) {
if (argNames[aidx] == defnArguments[idx].identifier) {
if (argType.kind == 12) {
return "(" + generateClosureParams(argType.stmt.defnArguments) + ")=>" + generateExpression(args[aidx]);
}
return generateExpression(args[aidx]);
}
aidx = aidx + 1;
}
if (defnArguments[idx].value != null) {
return generateExpression(defnArguments[idx].value);
}
panic("missing argument " + defnArguments[idx].identifier + " in call to " + type.stmt.identifier);
return "";
}
let result = "";
let idx = 0;
while (idx < defnArguments.length) {
result = result + ", " + generateArg(idx);
idx = idx + 1;
}
let aidx = 0;
while (aidx < argNames.length) {
let found = false;
let didx = 0;
while (didx < defnArguments.length) {
if (argNames[aidx] == defnArguments[didx].identifier) {
found = true;
}
didx = didx + 1;
}
if (!found) {
panic("unknown argument " + argNames[aidx] + " in call to " + type.stmt.identifier);
}
aidx = aidx + 1;
}
return result;
}
export function generateArguments(args) {
let result = "";
let idx = 0;
while (idx < args.length) {
result = result + ", " + generateExpression(args[idx]);
idx = idx + 1;
}
return result;
}
export function generateJSEnumValues(stmt) {
let result = stmt.identifierList[0] + ": 0";
let idx = 1;
while (idx < stmt.identifierList.length) {
result = result + ", " + stmt.identifierList[idx] + ":" + idx;
idx = idx + 1;
}
return result;
}
export function formatParsedType(type) {
if (type == null) {
return "no type";
} else if (type.kind == 4) {
if (type.stmt == null) {
return "object";
} else {
return "struct _type_" + type.stmt.identifier + " *";
}
} else if (type.kind == 5) {
return "struct _object_array *";
} else if (type.kind == 6) {
return "struct _object_map *";
} else if (type.kind == 3) {
return "struct _type_string *";
} else if (type.kind == 0) {
return "int";
} else if (type.kind == 2) {
return "bool";
} else if (type.kind == 13) {
return "void";
} else if (type.kind == 10) {
return "short";
} else if (type.kind == 8) {
return formatParsedType(type.ref);
} else if (type.kind == 7) {
return formatParsedType(type.ref);
} else {
return "unknown";
}
}