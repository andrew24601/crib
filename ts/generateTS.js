import { __index_get, __index_set, __slice, panic } from "./runtime"
import { generateTSImport, generateCImport } from "./tboot"
// import goes here
import { Statement, StatementKind, ParsedType, ExpressionKind, TypeKind, Expression, DefnArgument} from "./parser"
// import goes here
import { IdentifierOriginKind} from "./infer"
export function generateTS(block) {
const _o = {};
_o.result = [];
_o.result.push('import { __index_get, __index_set, __slice, panic } from "./runtime"');
_o.result.push('import { generateTSImport, generateCImport } from "./tboot"');
function getInitValue(expr,type) {
if (expr != null) {
return generateJSExpression(expr);
} else if (type?.kind == 0) {
return "0";
} else if (type?.kind == 5) {
return "[]";
} else if (type?.kind == 2) {
return "false";
} else if (type?.kind == 6) {
return "new Map()";
} else {
return "null";
}
}
function generateBlock(block,forClass,atRoot) {
let exportClassifier = "";
if (atRoot) {
exportClassifier = "export ";
}
for (const stmt of block) {
if (stmt.kind == 0 || stmt.kind == 1) {
const initValue = getInitValue(stmt.value, stmt.type);
let declaration = "let";
if (stmt.kind == 0) {
declaration = "const";
}
if (forClass && stmt.isPublic) {
_o.result.push("_o." + stmt.identifier + " = " + initValue + ";");
} else {
_o.result.push(declaration + " " + stmt.identifier + " = " + initValue + ";");
}
} else if (stmt.kind == 6) {
_o.result.push("if (" + generateJSExpression(stmt.value) + ") {");
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
_o.result.push("while (" + generateJSExpression(stmt.value) + ") {");
generateBlock(stmt.block, false, false);
_o.result.push("}");
} else if (stmt.kind == 11) {
_o.result.push("do {");
generateBlock(stmt.block, false, false);
_o.result.push("} while (!(" + generateJSExpression(stmt.value) + "))");
} else if (stmt.kind == 12) {
_o.result.push("for (const " + stmt.identifier + " of " + generateJSExpression(stmt.value) + ") {");
generateBlock(stmt.block, false, false);
_o.result.push("}");
} else if (stmt.kind == 13) {
_o.result.push("for (let " + stmt.identifier + " = " + generateJSExpression(stmt.lhs) + "; " + stmt.identifier + " <= " + generateJSExpression(stmt.value) + "; " + stmt.identifier + "++) {");
generateBlock(stmt.block, false, false);
_o.result.push("}");
} else if (stmt.kind == 14) {
_o.result.push("for (let " + stmt.identifier + " = " + generateJSExpression(stmt.lhs) + "; " + stmt.identifier + " <= " + generateJSExpression(stmt.value) + "; " + stmt.identifier + "++) {");
generateBlock(stmt.block, false, false);
_o.result.push("}");
} else if (stmt.kind == 9) {
if (stmt.lhs.kind == 23) {
if (effectiveType(stmt.lhs.left.type).kind == 6) {
_o.result.push(generateJSExpression(stmt.lhs.left) + ".set(" + generateJSExpression(stmt.lhs.indexes[0]) + ", " + generateJSExpression(stmt.value) + ");");
} else {
_o.result.push(generateJSExpression(stmt.lhs.left) + "[" + generateJSExpression(stmt.lhs.indexes[0]) + "] = " + generateJSExpression(stmt.value) + ";");
}
} else {
_o.result.push(generateJSExpression(stmt.lhs) + " = " + generateJSExpression(stmt.value) + ";");
}
} else if (stmt.kind == 3) {
let prefix = "";
if (stmt.async) {
prefix = "async ";
}
_o.result.push(exportClassifier + prefix + "function " + stmt.identifier + "(" + generateDefnArguments(stmt.defnArguments) + ")" + " {");
_o.result.push("const _o = {};");
for (const arg of stmt.defnArguments) {
if (arg.isPublic) {
_o.result.push("_o." + arg.identifier + " = " + arg.identifier + ";");
}
}
generateBlock(stmt.block, true, false);
_o.result.push("return _o;");
_o.result.push("}");
} else if (stmt.kind == 4) {
let prefix = "";
if (stmt.async) {
prefix = "async ";
}
_o.result.push(exportClassifier + prefix + "function " + stmt.identifier + "(" + generateDefnArguments(stmt.defnArguments) + ")" + " {");
generateBlock(stmt.block, false, false);
_o.result.push("}");
if (forClass && stmt.isPublic) {
_o.result.push("_o." + stmt.identifier + " = " + stmt.identifier + ";");
}
} else if (stmt.kind == 2) {
_o.result.push("export const " + stmt.identifier + " = {");
_o.result.push(generateJSEnumValues(stmt));
_o.result.push("};");
} else if (stmt.kind == 5) {
_o.result.push("return " + generateJSExpression(stmt.value) + ";");
} else if (stmt.kind == 8) {
_o.result.push("// import goes here");
_o.result.push(generateTSImport(stmt));
} else if (stmt.kind == 10) {
_o.result.push(generateJSExpression(stmt.value) + ";");
} else {
_o.result.push("unknown");
}
}
}
generateBlock(block, false, true);
return _o;
}
export function generateJSExpression(expr) {
if (expr == null) {
return "*nil";
}
if (expr.type.kind == 16 && expr.kind != 3) {
panic("expression not inferred");
}
if (expr.kind == 11) {
return generateJSExpression(expr.left) + " < " + generateJSExpression(expr.right);
} else if (expr.kind == 15) {
return generateJSExpression(expr.left) + " > " + generateJSExpression(expr.right);
} else if (expr.kind == 13) {
return generateJSExpression(expr.left) + " == " + generateJSExpression(expr.right);
} else if (expr.kind == 14) {
return generateJSExpression(expr.left) + " != " + generateJSExpression(expr.right);
} else if (expr.kind == 16) {
return generateJSExpression(expr.left) + " >= " + generateJSExpression(expr.right);
} else if (expr.kind == 12) {
return generateJSExpression(expr.left) + " <= " + generateJSExpression(expr.right);
} else if (expr.kind == 9) {
return generateJSExpression(expr.left) + " + " + generateJSExpression(expr.right);
} else if (expr.kind == 10) {
return generateJSExpression(expr.left) + " - " + generateJSExpression(expr.right);
} else if (expr.kind == 6) {
return generateJSExpression(expr.left) + " * " + generateJSExpression(expr.right);
} else if (expr.kind == 7) {
return generateJSExpression(expr.left) + " / " + generateJSExpression(expr.right);
} else if (expr.kind == 18) {
return generateJSExpression(expr.left) + " || " + generateJSExpression(expr.right);
} else if (expr.kind == 17) {
return generateJSExpression(expr.left) + " && " + generateJSExpression(expr.right);
} else if (expr.kind == 20) {
return generateJSExpression(expr.left) + "." + expr.value;
} else if (expr.kind == 19) {
return generateJSExpression(expr.left) + "?." + expr.value;
} else if (expr.kind == 27) {
return "!" + generateJSExpression(expr.left);
} else if (expr.kind == 21) {
return generateJSExpression(expr.left);
} else if (expr.kind == 0) {
return expr.value;
} else if (expr.kind == 3) {
return "null";
} else if (expr.kind == 26) {
return expr.value;
} else if (expr.kind == 2) {
return expr.value;
} else if (expr.kind == 5) {
if (expr.origin.kind == 0) {
return "_o." + expr.value;
} else {
return expr.value;
}
} else if (expr.kind == 22) {
const functionDecl = expr.left.type.stmt;
let prefix = "";
if (functionDecl.async) {
prefix = "await ";
}
return prefix + generateJSExpression(expr.left) + "(" + generateNamedArguments(expr.left.type, expr.indexes, expr.identifiers) + ")";
} else if (expr.kind == 25) {
return "__slice(" + generateJSExpression(expr.left) + ", " + generateArguments(expr.indexes) + ")";
} else if (expr.kind == 23) {
if (expr.indexes.length == 0) {
return "[]";
}
if (effectiveType(expr.left.type).kind == 3) {
return generateJSExpression(expr.left) + ".charCodeAt(" + generateArguments(expr.indexes) + ")";
} else if (effectiveType(expr.left.type).kind == 6) {
return generateJSExpression(expr.left) + ".get(" + generateArguments(expr.indexes) + ")";
} else if (effectiveType(expr.left.type).kind == 5) {
return generateJSExpression(expr.left) + "[" + generateArguments(expr.indexes) + "]";
} else {
return "__index_get(" + generateJSExpression(expr.left) + ", " + generateArguments(expr.indexes) + ")";
}
} else if (expr.kind == 29) {
const left = expr.left;
if (left.kind == 5) {
return "(__taker=" + generateJSExpression(left) + "," + generateJSExpression(left) + "=null,__taker)";
} else if (left.kind == 20 || left.kind == 19) {
return "(__taker2=" + generateJSExpression(left.left) + ",__taker=__taker2." + left.value + ",__taker2." + left.value + "=null,__taker)";
} else {
return "*takeexpression*";
}
} else {
return "*expression*";
}
}
export function effectiveType(type) {
if (type.kind == 8 || type.kind == 7) {
return effectiveType(type.ref);
}
return type;
}
export function generateDefnArgument(arg) {
return arg.identifier;
}
export function generateDefnArguments(args) {
if (args.length == 0) {
return "";
}
let result = generateDefnArgument(args[0]);
let idx = 1;
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
return "(" + generateClosureParams(argType.stmt.defnArguments) + ")=>" + generateJSExpression(args[aidx]);
}
return generateJSExpression(args[aidx]);
}
aidx = aidx + 1;
}
if (defnArguments[idx].value != null) {
return generateJSExpression(defnArguments[idx].value);
}
panic("missing argument " + defnArguments[idx].identifier + " in call to " + type.stmt.identifier);
return "";
}
let result = generateArg(0);
let idx = 1;
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
if (args.length == 0) {
return "";
}
let result = generateJSExpression(args[0]);
let idx = 1;
while (idx < args.length) {
result = result + ", " + generateJSExpression(args[idx]);
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