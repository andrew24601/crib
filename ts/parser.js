import { __index_get, __index_set, __slice, panic } from "./runtime"
import { generateTSImport } from "./tboot"
// import goes here
import { Token, Tokeniser} from "./tokeniser"
// import goes here
import { IdentifierOrigin} from "./infer"
export const StatementKind = {
ConstStatement: 0, LetStatement:1, EnumStatement:2, ClassStatement:3, FunctionStatement:4, ReturnStatement:5, IfStatement:6, WhileStatement:7, ImportStatement:8, AssignStatement:9, ExpressionStatement:10, RepeatStatement:11, ForStatement:12, ForRangeStatement:13, ForRangeExclusiveStatement:14, ModuleStatement:15
};
export const ExpressionKind = {
IntConstant: 0, DoubleConstant:1, StringConstant:2, NilConstant:3, ArrayConstant:4, Identifier:5, Multiply:6, Divide:7, Modulo:8, Add:9, Subtract:10, LessThan:11, LessThanEquals:12, Equals:13, NotEquals:14, GreaterThan:15, GreaterThanEquals:16, And:17, Or:18, OptDot:19, Dot:20, Bang:21, Invoke:22, Index:23, IntrinsicType:24, Slice:25, BoolConstant:26, Not:27, Negate:28, Take:29, Invalid:30
};
export const TypeKind = {
intType: 0, doubleType:1, boolType:2, stringType:3, objectType:4, arrayType:5, mapType:6, nullableType:7, pointerType:8, classType:9, enumType:10, enumDefinitionType:11, functionType:12, voidType:13, arrayInitType:14, closureType:15, unknownType:16, invalidType:17
};
const sharedUnknownType = ParsedType(16, null, null);
export function Expression(kind,left,right,tokeniser) {
const _o = {};
_o.kind = kind;
_o.left = left;
_o.right = right;
_o.value = null;
_o.indexes = [];
_o.identifiers = [];
_o.type = sharedUnknownType;
_o.line = 0;
_o.tokenPos = 0;
_o.tokenLength = 0;
_o.origin = null;
if (tokeniser != null) {
_o.line = tokeniser.line;
_o.tokenPos = tokeniser.start();
_o.tokenLength = tokeniser.tokenLength();
}
return _o;
}
export function ParsedType(kind,ref,stmt) {
const _o = {};
_o.kind = kind;
_o.ref = ref;
_o.stmt = stmt;
_o.identifier = null;
_o.mapKeyRef = null;
return _o;
}
export function DefnArgument(identifier,type,isPublic) {
const _o = {};
_o.identifier = identifier;
_o.type = type;
_o.isPublic = isPublic;
_o.value = null;
return _o;
}
export function ElseIfClause(value,block) {
const _o = {};
_o.value = value;
_o.block = block;
return _o;
}
export function Statement(kind) {
const _o = {};
_o.kind = kind;
_o.identifier = null;
_o.type = sharedUnknownType;
_o.value = null;
_o.lhs = null;
_o.block = [];
_o.elseIf = [];
_o.elseBlock = [];
_o.identifierList = [];
_o.defnArguments = [];
_o.isPublic = false;
_o.async = false;
_o.referencedBy = new Map();
return _o;
}
export function World() {
const _o = {};
_o.allCode = [];
return _o;
}
export function Parser(tokeniser,world) {
const _o = {};
function acceptToken(token) {
const tk = tokeniser.nextToken();
if (tk == token) {
return true;
}
tokeniser.putback();
return false;
}
function acceptIdentifierToken(token,text) {
const tk = tokeniser.nextToken();
if (tk == 0 && tokeniser.value() == text) {
return true;
}
tokeniser.putback();
return false;
}
function expectToken(expected) {
const tk = tokeniser.nextToken();
if (tk != expected) {
panic("expected " + tokeniser.line);
}
return tokeniser.value();
}
function expectIdentifier() {
return expectToken(0);
}
function parseType() {
let reference = false;
const tk = tokeniser.nextToken();
let type = sharedUnknownType;
const identifier = tokeniser.value();
if (tk == 30) {
type = ParsedType(0, null, null);
} else if (tk == 32) {
type = ParsedType(2, null, null);
} else if (tk == 33) {
type = ParsedType(3, null, null);
} else if (tk == 0) {
type = ParsedType(4, null, null);
type.identifier = identifier;
}
while (true) {
if (acceptToken(12)) {
if (acceptToken(13)) {
type = ParsedType(5, type, null);
} else {
type = ParsedType(6, type, null);
type.mapKeyRef = parseType();
expectToken(13);
}
} else if (acceptToken(14)) {
type = ParsedType(8, type, null);
} else if (acceptToken(46)) {
type = ParsedType(7, type, null);
} else {
return type;
}
}
return type;
}
function parseStatement() {
let stmt = null;
let identifier = null;
let type = sharedUnknownType;
let value = null;
let block = [];
let isPublic = false;
let tk = tokeniser.nextToken();
if (tk == 27 || tk == 28 || tk == 29 || tk == 40 || tk == 61) {
tokeniser.putback();
return null;
}
if (tk == 44) {
isPublic = true;
tk = tokeniser.nextToken();
}
if (tk == 0) {
identifier = tokeniser.value();
if (identifier == "var") {
tk = 26;
}
}
if (tk == 25 || tk == 26) {
identifier = expectIdentifier();
if (acceptToken(21)) {
type = parseType();
}
if (acceptToken(22)) {
value = parseExpression();
} else {
value = null;
}
if (tk == 25) {
stmt = Statement(0);
} else {
stmt = Statement(1);
}
stmt.value = value;
stmt.identifier = identifier;
stmt.type = type;
stmt.isPublic = isPublic;
return stmt;
} else if (tk == 36) {
stmt = Statement(2);
stmt.identifier = expectIdentifier();
stmt.isPublic = isPublic;
expectToken(8);
stmt.identifierList.push(expectIdentifier());
while (acceptToken(11)) {
stmt.identifierList.push(expectIdentifier());
}
expectToken(9);
return stmt;
} else if (tk == 5) {
stmt = Statement(StatementKind.ClassStatement);
stmt.identifier = expectIdentifier();
if (acceptToken(8)) {
stmt.defnArguments = parseDefnArguments();
}
stmt.block = parseBlock();
expectToken(29);
stmt.isPublic = isPublic;
world.allCode.push(stmt);
return stmt;
} else if (tk == 6) {
stmt = Statement(StatementKind.FunctionStatement);
stmt.identifier = expectIdentifier();
if (acceptToken(8)) {
stmt.defnArguments = parseDefnArguments();
}
if (acceptToken(21)) {
type = parseType();
} else {
type = ParsedType(13, null, null);
}
stmt.block = parseBlock();
expectToken(29);
stmt.isPublic = isPublic;
stmt.type = type;
world.allCode.push(stmt);
return stmt;
} else if (tk == 7) {
stmt = Statement(5);
stmt.value = parseExpression();
return stmt;
} else if (tk == 37) {
stmt = Statement(6);
stmt.value = parseExpression();
stmt.block = parseBlock();
while (acceptToken(28)) {
stmt.elseIf.push(ElseIfClause(parseExpression(), parseBlock()));
}
if (acceptToken(27)) {
stmt.elseBlock = parseBlock();
}
expectToken(29);
return stmt;
} else if (tk == 38) {
stmt = Statement(7);
stmt.value = parseExpression();
stmt.block = parseBlock();
expectToken(29);
return stmt;
} else if (tk == 39) {
stmt = Statement(11);
stmt.block = parseBlock();
expectToken(40);
stmt.value = parseExpression();
return stmt;
} else if (tk == 42) {
stmt = Statement(StatementKind.ForStatement);
stmt.identifier = expectIdentifier();
expectToken(41);
stmt.value = parseExpression();
if (acceptToken(19)) {
stmt.lhs = stmt.value;
stmt.value = parseExpression();
stmt.kind = 13;
} else if (acceptToken(18)) {
stmt.lhs = stmt.value;
stmt.value = parseExpression();
stmt.kind = 14;
}
stmt.block = parseBlock();
expectToken(29);
return stmt;
} else if (tk == 34) {
stmt = Statement(8);
stmt.identifierList.push(expectIdentifier());
while (acceptToken(11)) {
stmt.identifierList.push(expectIdentifier());
}
expectToken(35);
expectToken(4);
stmt.identifier = tokeniser.value();
return stmt;
}
tokeniser.putback();
value = parseExpression();
if (acceptToken(22)) {
stmt = Statement(StatementKind.AssignStatement);
stmt.value = parseExpression();
stmt.lhs = value;
return stmt;
}
stmt = Statement(StatementKind.ExpressionStatement);
if (value.kind == 13) {
panic("Probably meant to write := here");
} else if (value.kind != 22) {
panic("Statement does not do anything with the result of an expression");
}
stmt.value = value;
return stmt;
}
function parseBlock() {
const result = [];
let stmt = parseStatement();
while (stmt != null) {
result.push(stmt);
stmt = parseStatement();
}
return result;
}
_o.parseBlock = parseBlock;
function parseDefnArgument() {
let isPublic = false;
if (acceptToken(44)) {
isPublic = true;
}
const identifier = expectIdentifier();
expectToken(21);
const type = parseType();
const arg = DefnArgument(identifier, type, isPublic);
if (acceptToken(22)) {
arg.value = parseExpression();
}
return arg;
}
function parseDefnArguments() {
const result = [];
if (acceptToken(9)) {
return result;
}
result.push(parseDefnArgument());
while (acceptToken(11)) {
result.push(parseDefnArgument());
}
expectToken(9);
return result;
}
function parseExpression() {
let left = parseAndExpression();
let tk = tokeniser.nextToken();
while (tk == 24) {
left = Expression(18, left, parseAndExpression(), null);
tk = tokeniser.nextToken();
}
tokeniser.putback();
return left;
}
function parseAndExpression() {
let left = parseComparisonExpression();
let tk = tokeniser.nextToken();
while (tk == 23) {
left = Expression(17, left, parseComparisonExpression(), null);
tk = tokeniser.nextToken();
}
tokeniser.putback();
return left;
}
function parseComparisonExpression() {
let left = parseAddSub();
let tk = tokeniser.nextToken();
if (tk == 54) {
left = Expression(11, left, parseAddSub(), null);
} else if (tk == 53) {
left = Expression(12, left, parseAddSub(), null);
} else if (tk == 15) {
left = Expression(13, left, parseAddSub(), null);
} else if (tk == 52) {
left = Expression(14, left, parseAddSub(), null);
} else if (tk == 55) {
left = Expression(15, left, parseAddSub(), null);
} else if (tk == 56) {
left = Expression(16, left, parseAddSub(), null);
} else {
tokeniser.putback();
}
return left;
}
function parseAddSub() {
let left = parseTerm();
let tk = tokeniser.nextToken();
while (tk == 48 || tk == 49) {
if (tk == 48) {
left = Expression(9, left, parseTerm(), null);
} else {
left = Expression(10, left, parseTerm(), null);
}
tk = tokeniser.nextToken();
}
tokeniser.putback();
return left;
}
function parseTerm() {
let left = parseFactor();
let tk = tokeniser.nextToken();
while (tk == 50 || tk == 51) {
if (tk == 50) {
left = Expression(6, left, parseFactor(), null);
} else {
left = Expression(7, left, parseFactor(), null);
}
tk = tokeniser.nextToken();
}
tokeniser.putback();
return left;
}
function parseFactor() {
const tk = tokeniser.nextToken();
let e = null;
let p = null;
let ident = null;
if (tk == 1) {
e = Expression(0, null, null, tokeniser);
e.value = tokeniser.value();
} else if (tk == 3) {
e = Expression(1, null, null, tokeniser);
e.value = tokeniser.value();
} else if (tk == 4) {
e = Expression(2, null, null, tokeniser);
e.value = tokeniser.value();
} else if (tk == 0) {
e = Expression(5, null, null, tokeniser);
e.value = tokeniser.value();
} else if (tk == 8) {
e = parseExpression();
expectToken(9);
} else if (tk == 45) {
e = Expression(27, parseFactor(), null, null);
} else if (tk == 49) {
e = Expression(28, parseFactor(), null, null);
} else if (tk == 59) {
e = Expression(29, parseFactor(), null, null);
} else if (tk == 2) {
e = Expression(26, null, null, null);
e.value = tokeniser.value();
} else if (tk == 33) {
e = Expression(24, null, null, null);
e.value = tokeniser.value();
} else if (tk == 43) {
e = Expression(3, null, null, null);
e.value = tokeniser.value();
} else if (tk == 12) {
expectToken(13);
e = Expression(4, null, null, null);
} else {
panic("Unexpected token: " + tokeniser.value());
e = Expression(30, null, null, null);
}
while (true) {
if (acceptToken(16)) {
e = Expression(20, e, null, null);
e.line = tokeniser.line;
e.value = expectIdentifier();
e.tokenPos = tokeniser.start();
e.tokenLength = tokeniser.tokenLength();
} else if (acceptToken(17)) {
e = Expression(19, e, null, null);
e.line = tokeniser.line;
e.value = expectIdentifier();
} else if (acceptToken(47)) {
e = Expression(21, e, null, null);
} else if (acceptToken(8)) {
e = Expression(22, e, null, null);
e.line = tokeniser.line;
if (!acceptToken(9)) {
do {
ident = expectIdentifier();
if (acceptToken(21)) {
e.identifiers.push(ident);
e.indexes.push(parseExpression());
} else {
p = Expression(5, null, null, null);
p.value = ident;
e.indexes.push(p);
e.identifiers.push(ident);
}
} while (!(!acceptToken(11)))
expectToken(9);
}
} else if (acceptToken(12)) {
e = Expression(23, e, null, null);
e.line = tokeniser.line;
if (!acceptToken(13)) {
e.indexes.push(parseExpression());
if (acceptToken(19)) {
e.kind = 25;
} else if (acceptToken(18)) {
e.kind = 25;
e.indexes.push(parseExpression());
} else {
while (acceptToken(11)) {
e.indexes.push(parseExpression());
}
}
expectToken(13);
}
} else {
return e;
}
}
return e;
}
return _o;
}