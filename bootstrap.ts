import { __index_get, __index_set, __slice, panic } from "./runtime"
import { generateTSImport, importScope } from "./tboot"
// import goes here
import { Token, class_Tokeniser, Tokeniser} from "./tokeniser"
// import goes here
import { class_Statement, Statement, StatementKind, class_ParsedType, ParsedType, ExpressionKind, TypeKind, class_Expression, Expression, class_DefnArgument, DefnArgument} from "./parser"
export function descopeCode(args:class_DefnArgument[],block:class_Statement[],outerScope:Map<string,string> | null,forClass:boolean):void {
 // unknown
const scopeSet: Map<string,string> = new Map<string,string>();
if (outerScope != null) {
for (const key of outerScope.keys()) {
scopeSet.set(key, outerScope.get(key)!);
}
}
for (const arg of args) {
if (arg.isPublic && forClass) {
scopeSet.set(arg.identifier, "_o." + arg.identifier);
} else {
scopeSet.delete(arg.identifier);
}
}
for (const stmt of block) {
if (stmt.kind == StatementKind.ConstStatement || stmt.kind == StatementKind.LetStatement) {
if (stmt.isPublic && forClass) {
scopeSet.set(stmt.identifier!, "_o." + stmt.identifier);
} else {
scopeSet.delete(stmt.identifier!);
}
}
}
descopeBlock(block);
function descopeBlock(block:class_Statement[]):void {
 // int
let idx: number = 0;
while (idx < block.length) {
 // object<Statement>
const stmt: class_Statement = block[idx];
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
stmt.value = descopeExpression(stmt.value!);
descopeBlock(stmt.block);
} else if (stmt.kind == StatementKind.ExpressionStatement) {
stmt.value = descopeExpression(stmt.value!);
} else if (stmt.kind == StatementKind.ReturnStatement) {
stmt.value = descopeExpression(stmt.value!);
} else if (stmt.kind == StatementKind.LetStatement || stmt.kind == StatementKind.ConstStatement) {
if (stmt.value != null) {
stmt.value = descopeExpression(stmt.value!);
}
} else if (stmt.kind == StatementKind.AssignStatement) {
stmt.value = descopeExpression(stmt.value!);
stmt.lhs = descopeExpression(stmt.lhs!);
}
}
}
function descopeExpression(expr:class_Expression):class_Expression {
if (expr.kind == ExpressionKind.Identifier) {
if (scopeSet.has(expr.value!)) {
expr.value = scopeSet.get(expr.value!)!;
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
 // int
let idx: number = 0;
while (idx < expr.indexes.length) {
expr.indexes[idx] = descopeExpression(expr.indexes[idx]);
idx = idx + 1;
}
} else if (expr.kind == ExpressionKind.Invoke) {
expr.left = descopeExpression(expr.left!);
 // int
let idx: number = 0;
while (idx < expr.indexes.length) {
expr.indexes[idx] = descopeExpression(expr.indexes[idx]);
idx = idx + 1;
}
}
return expr;
}
}