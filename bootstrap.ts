import { __index_get, __index_set, __slice, StringMap, panic, class_StringMap } from "./runtime"
enum Token {
tkIdentifier, tkIntConstant, tkBoolConstant, tkDoubleConstant, tkStringConstant, tkClass, tkFunction, tkReturn, tkLeftParen, tkRightParen, tkSemiColon, tkComma, tkLeftBracket, tkRightBracket, tkCaret, tkEquals, tkDot, tkOptDot, tkRangeExclusive, tkRangeInclusive, tkAmpersand, tkColon, tkAssign, tkAnd, tkOr, tkConst, tkLet, tkElse, tkElseif, tkEnd, tkInt, tkDouble, tkBool, tkString, tkEnum, tkIf, tkWhile, tkRepeat, tkUntil, tkOf, tkFor, tkNil, tkPublic, tkNot, tkQuestionMark, tkPlus, tkMinus, tkTimes, tkSlash, tkNotEquals, tkLessThanEquals, tkLessThan, tkGreaterThan, tkGreaterThanEquals, tkEOF, tkInvalid
};
enum StatementKind {
ConstStatement, LetStatement, EnumStatement, ClassStatement, FunctionStatement, ReturnStatement, IfStatement, WhileStatement, AssignStatement, ExpressionStatement, RepeatStatement, ForStatement
};
enum ExpressionKind {
IntConstant, DoubleConstant, StringConstant, NilConstant, Identifier, Multiply, Divide, Modulo, Add, Subtract, LessThan, LessThanEquals, Equals, NotEquals, GreaterThan, GreaterThanEquals, And, Or, OptDot, Dot, Invoke, Index, IntrinsicType, Slice, ArrayInit, BoolConstant, Not, Negate
};
enum TypeKind {
intType, doubleType, boolType, stringType, objectType, arrayType, nullableType, pointerType, classType, enumType, enumDefinitionType, functionType, voidType, invalidType
};
export function isWhitespace(ch:number) {
if (ch == 32 || ch == 13 || ch == 10 || ch == 9) {
return true;
}
return false;
}
export function isLeadingIdentifier(ch:number) {
return ch >= 65 && ch <= 90 || ch >= 97 && ch <= 122 || ch == 95;
}
export function isTrailingIdentifier(ch:number) {
return ch >= 48 && ch <= 57 || ch >= 65 && ch <= 90 || ch >= 97 && ch <= 122 || ch == 95;
}
export function isDigit(ch:number) {
return ch >= 48 && ch <= 57;
}
export function Tokeniser(text:string) {
const _o = {} as class_Tokeniser;
 // no type
const length = text.length;
 // no type
let pos = null;
 // no type
let tokenStart = null;
 // no type
let hasPutback = false;
 // object
let lastToken: Token = null;
 // no type
_o.line = 1;
function nextToken() {
if (hasPutback) {
hasPutback = false;
return lastToken;
}
lastToken = parseNextToken();
return lastToken;
}
_o.nextToken = nextToken;
function putback() {
hasPutback = true;
}
_o.putback = putback;
function value() {
return __slice(text, tokenStart, pos);
}
_o.value = value;
function parseNextToken() {
 // string
let ident: string = null;
while (pos < length && isWhitespace(__index_get(text, pos))) {
if (__index_get(text, pos) == 10) {
_o.line = _o.line + 1;
}
pos = pos + 1;
}
if (pos == length) {
return Token.tkEOF;
}
tokenStart = pos;
 // no type
let ch = __index_get(text, pos);
pos = pos + 1;
if (isLeadingIdentifier(ch)) {
while (pos < length && isTrailingIdentifier(__index_get(text, pos))) {
pos = pos + 1;
}
ident = __slice(text, tokenStart, pos);
if (ident == "let") {
return Token.tkLet;
} else if (ident == "const") {
return Token.tkConst;
} else if (ident == "function") {
return Token.tkFunction;
} else if (ident == "and") {
return Token.tkAnd;
} else if (ident == "or") {
return Token.tkOr;
} else if (ident == "else") {
return Token.tkElse;
} else if (ident == "elseif") {
return Token.tkElseif;
} else if (ident == "end") {
return Token.tkEnd;
} else if (ident == "bool") {
return Token.tkBool;
} else if (ident == "string") {
return Token.tkString;
} else if (ident == "double") {
return Token.tkDouble;
} else if (ident == "int") {
return Token.tkInt;
} else if (ident == "enum") {
return Token.tkEnum;
} else if (ident == "class") {
return Token.tkClass;
} else if (ident == "if") {
return Token.tkIf;
} else if (ident == "return") {
return Token.tkReturn;
} else if (ident == "while") {
return Token.tkWhile;
} else if (ident == "repeat") {
return Token.tkRepeat;
} else if (ident == "until") {
return Token.tkUntil;
} else if (ident == "of") {
return Token.tkOf;
} else if (ident == "for") {
return Token.tkFor;
} else if (ident == "nil") {
return Token.tkNil;
} else if (ident == "not") {
return Token.tkNot;
} else if (ident == "true" || ident == "false") {
return Token.tkBoolConstant;
} else if (ident == "public") {
return Token.tkPublic;
}
return Token.tkIdentifier;
}
if (isDigit(ch)) {
while (pos < length && isDigit(__index_get(text, pos))) {
pos = pos + 1;
}
return Token.tkIntConstant;
}
if (ch == 39 || ch == 34) {
while (pos < length && __index_get(text, pos) != ch) {
pos = pos + 1;
}
if (pos < length) {
pos = pos + 1;
}
return Token.tkStringConstant;
}
 // no type
let match = Token.tkInvalid;
if (ch == 40) {
match = Token.tkLeftParen;
} else if (ch == 41) {
match = Token.tkRightParen;
} else if (ch == 59) {
match = Token.tkSemiColon;
} else if (ch == 44) {
match = Token.tkComma;
} else if (ch == 91) {
match = Token.tkLeftBracket;
} else if (ch == 93) {
match = Token.tkRightBracket;
} else if (ch == 61) {
match = Token.tkEquals;
} else if (ch == 38) {
match = Token.tkAmpersand;
} else if (ch == 46) {
if (pos < length && __index_get(text, pos) == 46) {
pos = pos + 1;
if (pos < length && __index_get(text, pos) == 60) {
pos = pos + 1;
match = Token.tkRangeExclusive;
} else {
match = Token.tkRangeInclusive;
}
} else {
match = Token.tkDot;
}
} else if (ch == 58) {
if (pos < length && __index_get(text, pos) == 61) {
pos = pos + 1;
match = Token.tkAssign;
} else {
match = Token.tkColon;
}
} else if (ch == 63) {
if (pos < length && __index_get(text, pos) == 46) {
pos = pos + 1;
match = Token.tkOptDot;
} else {
match = Token.tkQuestionMark;
}
} else if (ch == 43) {
match = Token.tkPlus;
} else if (ch == 45) {
match = Token.tkMinus;
} else if (ch == 42) {
match = Token.tkTimes;
} else if (ch == 94) {
match = Token.tkCaret;
} else if (ch == 47) {
match = Token.tkSlash;
} else if (ch == 60) {
if (pos < length && __index_get(text, pos) == 61) {
pos = pos + 1;
match = Token.tkLessThanEquals;
} else if (pos < length && __index_get(text, pos) == 62) {
pos = pos + 1;
match = Token.tkNotEquals;
} else {
match = Token.tkLessThan;
}
} else if (ch == 62) {
if (pos < length && __index_get(text, pos) == 61) {
pos = pos + 1;
match = Token.tkGreaterThanEquals;
} else {
match = Token.tkGreaterThan;
}
}
return match;
}
return _o;
}
interface class_Tokeniser {
line:any;
nextToken():Token;
putback():any;
value():string;
}
export function Expression(kind:ExpressionKind,left:class_Expression,right:class_Expression) {
const _o = {} as class_Expression;
_o.kind = kind;
_o.left = left;
_o.right = right;
 // string
_o.value = null;
 // array<object>
_o.indexes = [];
 // array<string>
_o.identifiers = [];
 // object
_o.type = null;
 // no type
_o.line = 0;
return _o;
}
interface class_Expression {
kind:ExpressionKind;
left:class_Expression;
right:class_Expression;
value:string;
indexes:class_Expression[];
identifiers:string[];
type:class_ParsedType;
line:any;
}
export function ParsedType(kind:TypeKind,ref:class_ParsedType,stmt:class_Statement) {
const _o = {} as class_ParsedType;
_o.kind = kind;
_o.ref = ref;
_o.stmt = stmt;
 // string
_o.identifier = null;
 // array<object>
_o.parameters = [];
return _o;
}
interface class_ParsedType {
kind:TypeKind;
ref:class_ParsedType;
stmt:class_Statement;
identifier:string;
parameters:class_ParsedType[];
}
export function DefnArgument(identifier:string,type:class_ParsedType,isPublic:boolean) {
const _o = {} as class_DefnArgument;
_o.identifier = identifier;
_o.type = type;
_o.isPublic = isPublic;
return _o;
}
interface class_DefnArgument {
identifier:string;
type:class_ParsedType;
isPublic:boolean;
}
export function ElseIfClause() {
const _o = {} as class_ElseIfClause;
 // object
_o.value = null;
 // array<object>
_o.block = [];
return _o;
}
interface class_ElseIfClause {
value:class_Expression;
block:class_Statement[];
}
export function Statement(kind:StatementKind) {
const _o = {} as class_Statement;
_o.kind = kind;
 // string
_o.identifier = null;
 // object
_o.type = null;
 // object
_o.value = null;
 // object
_o.lhs = null;
 // array<object>
_o.block = [];
 // array<object>
_o.elseIf = [];
 // array<object>
_o.elseBlock = [];
 // array<string>
_o.identifierList = [];
 // array<object>
_o.defnArguments = [];
 // bool
_o.isPublic = null;
return _o;
}
interface class_Statement {
kind:StatementKind;
identifier:string;
type:class_ParsedType;
value:class_Expression;
lhs:class_Expression;
block:class_Statement[];
elseIf:class_ElseIfClause[];
elseBlock:class_Statement[];
identifierList:string[];
defnArguments:class_DefnArgument[];
isPublic:boolean;
}
export function Parser(tokeniser:class_Tokeniser) {
const _o = {} as class_Parser;
function acceptToken(token:Token) {
 // no type
const tk = tokeniser.nextToken();
if (tk == token) {
return true;
}
tokeniser.putback();
return false;
}
function expectToken(expected:Token) {
 // no type
const tk = tokeniser.nextToken();
if (tk != expected) {
panic("expected " + tokeniser.line);
}
return tokeniser.value();
}
function expectIdentifier() {
return expectToken(Token.tkIdentifier);
}
function parseType() {
 // no type
let reference = false;
 // no type
const tk = tokeniser.nextToken();
 // object
let type: class_ParsedType = null;
 // no type
const identifier = tokeniser.value();
if (acceptToken(Token.tkCaret)) {
reference = true;
}
if (tk == Token.tkInt) {
type = ParsedType(TypeKind.intType, null, null);
} else if (tk == Token.tkBool) {
type = ParsedType(TypeKind.boolType, null, null);
} else if (tk == Token.tkString) {
type = ParsedType(TypeKind.stringType, null, null);
} else if (tk == Token.tkIdentifier) {
type = ParsedType(TypeKind.objectType, null, null);
type.identifier = identifier;
if (acceptToken(Token.tkLessThan)) {
type.parameters = [];
type.parameters.push(parseType());
while (acceptToken(Token.tkComma)) {
type.parameters.push(parseType());
}
expectToken(Token.tkGreaterThan);
}
}
while (true) {
if (acceptToken(Token.tkLeftBracket)) {
expectToken(Token.tkRightBracket);
type = ParsedType(TypeKind.arrayType, type, null);
} else if (acceptToken(Token.tkCaret)) {
type = ParsedType(TypeKind.pointerType, type, null);
} else if (acceptToken(Token.tkQuestionMark)) {
type = ParsedType(TypeKind.nullableType, type, null);
} else {
return type;
}
}
return type;
}
function parseStatement() {
 // no type
let tk = tokeniser.nextToken();
 // object
let stmt: class_Statement = null;
 // string
let identifier: string = null;
 // object
let type: class_ParsedType = null;
 // object
let value: class_Expression = null;
 // array<object>
let block: class_Statement[] = [];
 // object
let clause: class_ElseIfClause = null;
 // no type
let isPublic = false;
if (tk == Token.tkElse || tk == Token.tkElseif || tk == Token.tkEnd || tk == Token.tkUntil || tk == Token.tkEOF) {
tokeniser.putback();
return null;
}
if (tk == Token.tkPublic) {
isPublic = true;
tk = tokeniser.nextToken();
}
if (tk == Token.tkConst || tk == Token.tkLet) {
identifier = expectIdentifier();
if (acceptToken(Token.tkColon)) {
type = parseType();
}
if (acceptToken(Token.tkAssign)) {
value = parseExpression();
} else {
if (type?.kind == TypeKind.arrayType) {
value = Expression(ExpressionKind.ArrayInit, null, null);
} else if (type?.kind == TypeKind.intType) {
value = Expression(ExpressionKind.IntConstant, null, null);
value.value = "0";
} else {
value = Expression(ExpressionKind.NilConstant, null, null);
}
}
if (tk == Token.tkConst) {
stmt = Statement(StatementKind.ConstStatement);
} else {
stmt = Statement(StatementKind.LetStatement);
}
stmt.value = value;
stmt.identifier = identifier;
stmt.type = type;
stmt.isPublic = isPublic;
return stmt;
} else if (tk == Token.tkEnum) {
stmt = Statement(StatementKind.EnumStatement);
stmt.identifier = expectIdentifier();
expectToken(Token.tkLeftParen);
stmt.identifierList = [];
stmt.identifierList.push(expectIdentifier());
while (acceptToken(Token.tkComma)) {
stmt.identifierList.push(expectIdentifier());
}
expectToken(Token.tkRightParen);
return stmt;
} else if (tk == Token.tkClass) {
stmt = Statement(StatementKind.ClassStatement);
stmt.identifier = expectIdentifier();
if (acceptToken(Token.tkLeftParen)) {
stmt.defnArguments = parseDefnArguments();
}
stmt.block = parseBlock();
expectToken(Token.tkEnd);
stmt.isPublic = isPublic;
return stmt;
} else if (tk == Token.tkFunction) {
stmt = Statement(StatementKind.FunctionStatement);
stmt.identifier = expectIdentifier();
if (acceptToken(Token.tkLeftParen)) {
stmt.defnArguments = parseDefnArguments();
}
if (acceptToken(Token.tkColon)) {
type = parseType();
} else {
type = ParsedType(TypeKind.voidType, null, null);
}
stmt.block = parseBlock();
expectToken(Token.tkEnd);
stmt.isPublic = isPublic;
stmt.type = type;
return stmt;
} else if (tk == Token.tkReturn) {
stmt = Statement(StatementKind.ReturnStatement);
stmt.value = parseExpression();
return stmt;
} else if (tk == Token.tkIf) {
stmt = Statement(StatementKind.IfStatement);
stmt.value = parseExpression();
stmt.block = parseBlock();
stmt.elseIf = [];
while (acceptToken(Token.tkElseif)) {
clause = ElseIfClause();
clause.value = parseExpression();
clause.block = parseBlock();
stmt.elseIf.push(clause);
}
if (acceptToken(Token.tkElse)) {
stmt.elseBlock = parseBlock();
}
expectToken(Token.tkEnd);
return stmt;
} else if (tk == Token.tkWhile) {
stmt = Statement(StatementKind.WhileStatement);
stmt.value = parseExpression();
stmt.block = parseBlock();
expectToken(Token.tkEnd);
return stmt;
} else if (tk == Token.tkRepeat) {
stmt = Statement(StatementKind.RepeatStatement);
stmt.block = parseBlock();
expectToken(Token.tkUntil);
stmt.value = parseExpression();
return stmt;
} else if (tk == Token.tkFor) {
stmt = Statement(StatementKind.ForStatement);
stmt.identifier = expectIdentifier();
expectToken(Token.tkOf);
stmt.value = parseExpression();
stmt.block = parseBlock();
expectToken(Token.tkEnd);
return stmt;
}
tokeniser.putback();
value = parseExpression();
if (acceptToken(Token.tkAssign)) {
stmt = Statement(StatementKind.AssignStatement);
stmt.value = parseExpression();
stmt.lhs = value;
return stmt;
}
stmt = Statement(StatementKind.ExpressionStatement);
stmt.value = value;
return stmt;
}
function parseBlock() {
 // no type
const result = [];
 // object
let stmt: class_Statement = null;
stmt = parseStatement();
while (stmt != null) {
result.push(stmt);
stmt = parseStatement();
}
return result;
}
_o.parseBlock = parseBlock;
function parseDefnArgument() {
 // no type
let isPublic = false;
if (acceptToken(Token.tkPublic)) {
isPublic = true;
}
 // no type
const identifier = expectIdentifier();
expectToken(Token.tkColon);
 // no type
const type = parseType();
return DefnArgument(identifier, type, isPublic);
}
function parseDefnArguments() {
 // no type
const result = [];
if (acceptToken(Token.tkRightParen)) {
return result;
}
result.push(parseDefnArgument());
while (acceptToken(Token.tkComma)) {
result.push(parseDefnArgument());
}
expectToken(Token.tkRightParen);
return result;
}
function parseExpression() {
 // no type
let left = parseAndExpression();
 // no type
let tk = tokeniser.nextToken();
while (tk == Token.tkOr) {
left = Expression(ExpressionKind.Or, left, parseAndExpression());
tk = tokeniser.nextToken();
}
tokeniser.putback();
return left;
}
function parseAndExpression() {
 // no type
let left = parseComparisonExpression();
 // no type
let tk = tokeniser.nextToken();
while (tk == Token.tkAnd) {
left = Expression(ExpressionKind.And, left, parseComparisonExpression());
tk = tokeniser.nextToken();
}
tokeniser.putback();
return left;
}
function parseComparisonExpression() {
 // no type
let left = parseAddSub();
 // no type
let tk = tokeniser.nextToken();
if (tk == Token.tkLessThan) {
left = Expression(ExpressionKind.LessThan, left, parseAddSub());
} else if (tk == Token.tkLessThanEquals) {
left = Expression(ExpressionKind.LessThanEquals, left, parseAddSub());
} else if (tk == Token.tkEquals) {
left = Expression(ExpressionKind.Equals, left, parseAddSub());
} else if (tk == Token.tkNotEquals) {
left = Expression(ExpressionKind.NotEquals, left, parseAddSub());
} else if (tk == Token.tkGreaterThan) {
left = Expression(ExpressionKind.GreaterThan, left, parseAddSub());
} else if (tk == Token.tkGreaterThanEquals) {
left = Expression(ExpressionKind.GreaterThanEquals, left, parseAddSub());
} else {
tokeniser.putback();
}
return left;
}
function parseAddSub() {
 // no type
let left = parseTerm();
 // no type
let tk = tokeniser.nextToken();
while (tk == Token.tkPlus || tk == Token.tkMinus) {
if (tk == Token.tkPlus) {
left = Expression(ExpressionKind.Add, left, parseTerm());
} else {
left = Expression(ExpressionKind.Subtract, left, parseTerm());
}
tk = tokeniser.nextToken();
}
tokeniser.putback();
return left;
}
function parseTerm() {
 // no type
let left = parseFactor();
 // no type
let tk = tokeniser.nextToken();
while (tk == Token.tkTimes || tk == Token.tkSlash) {
if (tk == Token.tkTimes) {
left = Expression(ExpressionKind.Multiply, left, parseFactor());
} else {
left = Expression(ExpressionKind.Divide, left, parseFactor());
}
tk = tokeniser.nextToken();
}
tokeniser.putback();
return left;
}
function parseFactor() {
 // no type
const tk = tokeniser.nextToken();
 // object
let e: class_Expression = null;
 // object
let p: class_Expression = null;
 // string
let ident: string = null;
if (tk == Token.tkIntConstant) {
e = Expression(ExpressionKind.IntConstant, null, null);
e.value = tokeniser.value();
} else if (tk == Token.tkDoubleConstant) {
e = Expression(ExpressionKind.DoubleConstant, null, null);
e.value = tokeniser.value();
} else if (tk == Token.tkStringConstant) {
e = Expression(ExpressionKind.StringConstant, null, null);
e.value = tokeniser.value();
} else if (tk == Token.tkIdentifier) {
e = Expression(ExpressionKind.Identifier, null, null);
e.value = tokeniser.value();
} else if (tk == Token.tkLeftParen) {
e = parseExpression();
expectToken(Token.tkRightParen);
} else if (tk == Token.tkNot) {
e = Expression(ExpressionKind.Not, parseFactor(), null);
} else if (tk == Token.tkMinus) {
e = Expression(ExpressionKind.Negate, parseFactor(), null);
} else if (tk == Token.tkBoolConstant) {
e = Expression(ExpressionKind.BoolConstant, null, null);
e.value = tokeniser.value();
} else if (tk == Token.tkString) {
e = Expression(ExpressionKind.IntrinsicType, null, null);
e.value = tokeniser.value();
} else if (tk == Token.tkNil) {
e = Expression(ExpressionKind.NilConstant, null, null);
e.value = tokeniser.value();
} else {
panic("Unexpected token: " + tokeniser.value());
}
while (true) {
if (acceptToken(Token.tkDot)) {
e = Expression(ExpressionKind.Dot, e, null);
e.line = tokeniser.line;
e.value = expectIdentifier();
} else if (acceptToken(Token.tkOptDot)) {
e = Expression(ExpressionKind.OptDot, e, null);
e.line = tokeniser.line;
e.value = expectIdentifier();
} else if (acceptToken(Token.tkLeftParen)) {
e = Expression(ExpressionKind.Invoke, e, null);
e.line = tokeniser.line;
e.indexes = [];
e.identifiers = [];
if (!acceptToken(Token.tkRightParen)) {
do {
ident = expectIdentifier();
if (acceptToken(Token.tkColon)) {
e.identifiers.push(ident);
e.indexes.push(parseExpression());
} else {
p = Expression(ExpressionKind.Identifier, null, null);
p.value = ident;
e.indexes.push(p);
e.identifiers.push(ident);
}
} while (!(!acceptToken(Token.tkComma)))
expectToken(Token.tkRightParen);
}
} else if (acceptToken(Token.tkLeftBracket)) {
e = Expression(ExpressionKind.Index, e, null);
e.line = tokeniser.line;
e.indexes = [];
if (!acceptToken(Token.tkRightBracket)) {
e.indexes.push(parseExpression());
if (acceptToken(Token.tkRangeInclusive)) {
e.kind = ExpressionKind.Slice;
} else if (acceptToken(Token.tkRangeExclusive)) {
e.kind = ExpressionKind.Slice;
e.indexes.push(parseExpression());
} else {
while (acceptToken(Token.tkComma)) {
e.indexes.push(parseExpression());
}
}
expectToken(Token.tkRightBracket);
}
} else {
return e;
}
}
return e;
}
return _o;
}
interface class_Parser {
parseBlock():class_Statement[];
}
export function TypeScope(parent:class_TypeScope) {
const _o = {} as class_TypeScope;
 // array<object>
_o.types = [];
function findType(identifier:string) {
for (const t of _o.types) {
if (t.identifier == identifier) {
return t;
}
}
if (parent != null) {
return parent.findType(identifier);
}
return null;
}
_o.findType = findType;
return _o;
}
interface class_TypeScope {
types:class_Statement[];
findType(identifier:string):class_Statement;
}
export function InferTypes(block:any,parent:class_StringMap) {
 // no type
const scope = StringMap(parent);
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
 // no type
const blockScope = StringMap(scope);
for (const arg of stmt.defnArguments) {
arg.type = resolve(arg.type);
}
}
}
for (const stmt of block) {
if (stmt.kind == StatementKind.LetStatement) {
if (stmt.type == null) {
stmt.type = infer(stmt.value);
}
if (stmt.type != null) {
stmt.type = resolve(stmt.type);
}
} else if (stmt.kind == StatementKind.ConstStatement) {
if (stmt.type == null) {
stmt.type = infer(stmt.value);
}
if (stmt.type != null) {
stmt.type = resolve(stmt.type);
}
} else if (stmt.kind == StatementKind.ClassStatement || stmt.kind == StatementKind.FunctionStatement) {
 // no type
const blockScope = StringMap(scope);
for (const arg of stmt.defnArguments) {
arg.type = resolve(arg.type);
blockScope.set(arg.identifier, arg.type);
}
InferTypes(stmt.block, blockScope);
}
}
function infer(expr:class_Expression) {
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
infer(expr.left);
infer(expr.right);
expr.type = ParsedType(TypeKind.boolType, null, null);
} else if (expr.kind == ExpressionKind.And || expr.kind == ExpressionKind.Or) {
infer(expr.left);
infer(expr.right);
expr.type = ParsedType(TypeKind.boolType, null, null);
} else if (expr.kind == ExpressionKind.Add) {
infer(expr.left);
infer(expr.right);
if (expr.left.type.kind == TypeKind.stringType || expr.right.type.kind == TypeKind.stringType) {
expr.type = ParsedType(TypeKind.stringType, null, null);
} else if (expr.left.type.kind == TypeKind.doubleType || expr.right.type.kind == TypeKind.doubleType) {
expr.type = ParsedType(TypeKind.doubleType, null, null);
} else {
expr.type = ParsedType(TypeKind.intType, null, null);
}
} else if (expr.kind == ExpressionKind.Subtract || expr.kind == ExpressionKind.Multiply || expr.kind == ExpressionKind.Divide || expr.kind == ExpressionKind.Modulo) {
infer(expr.left);
infer(expr.right);
if (expr.left.type.kind == TypeKind.doubleType || expr.right.type.kind == TypeKind.doubleType) {
expr.type = ParsedType(TypeKind.doubleType, null, null);
} else {
expr.type = ParsedType(TypeKind.intType, null, null);
}
} else if (expr.kind == ExpressionKind.Not) {
infer(expr.left);
expr.type = ParsedType(TypeKind.boolType, null, null);
} else if (expr.kind == ExpressionKind.Identifier) {
if (scope.has(expr.value)) {
expr.type = scope.get(expr.value);
}
} else if (expr.kind == ExpressionKind.Dot || expr.kind == ExpressionKind.OptDot) {
infer(expr.left);
if (expr.left.type.kind == TypeKind.enumDefinitionType) {
expr.type = ParsedType(TypeKind.enumType, null, null);
} else if (expr.left.type.kind == TypeKind.objectType) {
expr.type = getFieldType(expr.left.type.ref.stmt, expr.value);
} else if (expr.left.type.kind == TypeKind.stringType) {
if (expr.value == "length") {
expr.type = ParsedType(TypeKind.intType, null, null);
} else {
panic("Invalid srting field");
}
} else {
panic("Invalid type for dot expression");
}
} else if (expr.kind == ExpressionKind.Index) {
infer(expr.left);
for (const index of expr.indexes) {
infer(index);
}
if (expr.left.type.kind == TypeKind.arrayType) {
expr.type = expr.left.type.ref;
}
} else if (expr.kind == ExpressionKind.Slice) {
infer(expr.left);
for (const index of expr.indexes) {
infer(index);
}
expr.type = expr.left.type;
} else if (expr.kind == ExpressionKind.Invoke) {
infer(expr.left);
for (const arg of expr.indexes) {
infer(arg);
}
if (expr.left.type.kind == TypeKind.functionType) {
expr.type = expr.left.type.stmt.type;
} else if (expr.left.type.kind == TypeKind.classType) {
expr.type = ParsedType(TypeKind.objectType, expr.left.type, null);
} else {
panic("Cannot invoke non-function");
}
}
return expr.type;
}
function getFieldType(classDefinition:class_Statement,identifier:string) {
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
function resolve(t:class_ParsedType) {
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
export function descopeCode(args:any,block:any,outerScope:class_StringMap,forClass:boolean) {
 // no type
let scopeSet = StringMap(outerScope);
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
function descopeBlock(block:any) {
 // no type
let idx = 0;
while (idx < block.length) {
 // no type
const stmt = __index_get(block, idx);
idx = idx + 1;
if (stmt.kind == StatementKind.FunctionStatement || stmt.kind == StatementKind.ClassStatement) {
descopeCode(stmt.defnArguments, stmt.block, scopeSet, stmt.kind == StatementKind.ClassStatement);
} else if (stmt.kind == StatementKind.IfStatement) {
stmt.value = descopeExpression(stmt.value);
for (const ei of stmt.elseIf) {
ei.value = descopeExpression(ei.value);
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
stmt.lhs = descopeExpression(stmt.lhs);
}
}
}
function descopeExpression(expr:class_Expression) {
if (expr.kind == ExpressionKind.Identifier) {
if (scopeSet.has(expr.value)) {
expr.value = scopeSet.get(expr.value);
}
} else if (expr.kind == ExpressionKind.Equals || expr.kind == ExpressionKind.NotEquals || expr.kind == ExpressionKind.LessThan || expr.kind == ExpressionKind.LessThanEquals || expr.kind == ExpressionKind.GreaterThan || expr.kind == ExpressionKind.GreaterThanEquals || expr.kind == ExpressionKind.And || expr.kind == ExpressionKind.Or || expr.kind == ExpressionKind.Add || expr.kind == ExpressionKind.Subtract || expr.kind == ExpressionKind.Multiply || expr.kind == ExpressionKind.Divide) {
expr.left = descopeExpression(expr.left);
expr.right = descopeExpression(expr.right);
} else if (expr.kind == ExpressionKind.Dot) {
expr.left = descopeExpression(expr.left);
} else if (expr.kind == ExpressionKind.OptDot) {
expr.left = descopeExpression(expr.left);
} else if (expr.kind == ExpressionKind.Index || expr.kind == ExpressionKind.Slice) {
expr.left = descopeExpression(expr.left);
 // no type
let idx = 0;
while (idx < expr.indexes.length) {
__index_set(expr.indexes, idx, descopeExpression(__index_get(expr.indexes, idx)));
idx = idx + 1;
}
} else if (expr.kind == ExpressionKind.Invoke) {
expr.left = descopeExpression(expr.left);
 // no type
let idx = 0;
while (idx < expr.indexes.length) {
__index_set(expr.indexes, idx, descopeExpression(__index_get(expr.indexes, idx)));
idx = idx + 1;
}
}
return expr;
}
}
export function formatParsedType(type:class_ParsedType) {
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
} else {
return "unknown";
}
}
export function generateTS(block:any) {
const _o = {} as class_generateTS;
 // no type
_o.result = [];
_o.result.push('import { __index_get, __index_set, __slice, StringMap, panic, class_StringMap } from "./runtime"');
function dumpType(type:class_ParsedType) {
_o.result.push(" // " + formatParsedType(type));
}
function generateBlock(block:any,forClass:boolean,atRoot:boolean) {
 // object
let ei: class_ElseIfClause = null;
 // no type
let exportClassifier = "";
if (atRoot) {
exportClassifier = "export ";
}
for (const stmt of block) {
if (stmt.kind == StatementKind.ConstStatement) {
dumpType(stmt.type);
if (forClass && stmt.isPublic) {
_o.result.push("_o." + stmt.identifier + " = " + generateJSExpression(stmt.value) + ";");
} else {
_o.result.push("const " + stmt.identifier + " = " + generateJSExpression(stmt.value) + ";");
}
} else if (stmt.kind == StatementKind.LetStatement) {
dumpType(stmt.type);
if (forClass && stmt.isPublic) {
_o.result.push("_o." + stmt.identifier + " = " + generateJSExpression(stmt.value) + ";");
} else {
if (stmt.type != null) {
_o.result.push("let " + stmt.identifier + ": " + generateTSType(stmt.type) + " = " + generateJSExpression(stmt.value) + ";");
} else {
_o.result.push("let " + stmt.identifier + " = " + generateJSExpression(stmt.value) + ";");
}
}
} else if (stmt.kind == StatementKind.IfStatement) {
_o.result.push("if (" + generateJSExpression(stmt.value) + ") {");
generateBlock(stmt.block, false, false);
for (const ei of stmt.elseIf) {
_o.result.push("} else if (" + generateJSExpression(ei.value) + ") {");
generateBlock(ei.block, false, false);
}
if (stmt.elseBlock != 0 && stmt.elseBlock.length > 0) {
_o.result.push("} else {");
generateBlock(stmt.elseBlock, false, false);
}
_o.result.push("}");
} else if (stmt.kind == StatementKind.WhileStatement) {
_o.result.push("while (" + generateJSExpression(stmt.value) + ") {");
generateBlock(stmt.block, false, false);
_o.result.push("}");
} else if (stmt.kind == StatementKind.RepeatStatement) {
_o.result.push("do {");
generateBlock(stmt.block, false, false);
_o.result.push("} while (!(" + generateJSExpression(stmt.value) + "))");
} else if (stmt.kind == StatementKind.ForStatement) {
_o.result.push("for (const " + stmt.identifier + " of " + generateJSExpression(stmt.value) + ") {");
generateBlock(stmt.block, false, false);
_o.result.push("}");
} else if (stmt.kind == StatementKind.AssignStatement) {
if (stmt.lhs.kind == ExpressionKind.Index) {
_o.result.push("__index_set(" + generateJSExpression(stmt.lhs.left) + ", " + generateJSExpression(__index_get(stmt.lhs.indexes, 0)) + ", " + generateJSExpression(stmt.value) + ");");
} else {
_o.result.push(generateJSExpression(stmt.lhs) + " = " + generateJSExpression(stmt.value) + ";");
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
_o.result.push(exportClassifier + "function " + stmt.identifier + "(" + generateDefnArguments(stmt.defnArguments) + ") {");
generateBlock(stmt.block, false, false);
_o.result.push("}");
if (forClass && stmt.isPublic) {
_o.result.push("_o." + stmt.identifier + " = " + stmt.identifier + ";");
}
} else if (stmt.kind == StatementKind.EnumStatement) {
_o.result.push("enum " + stmt.identifier + " {");
_o.result.push(generateJSEnumValues(stmt));
_o.result.push("};");
} else if (stmt.kind == StatementKind.ReturnStatement) {
_o.result.push("return " + generateJSExpression(stmt.value) + ";");
} else if (stmt.kind == StatementKind.ExpressionStatement) {
_o.result.push(generateJSExpression(stmt.value) + ";");
} else {
_o.result.push("unknown");
}
}
}
function generateTSInterface(definition:class_Statement) {
if (definition.kind == StatementKind.ClassStatement) {
_o.result.push("interface class_" + definition.identifier + " {");
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
interface class_generateTS {
result:any;
}
export function generateJSExpression(expr:class_Expression) {
if (expr == null) {
return "*nil";
}
if (expr.kind == ExpressionKind.LessThan) {
return generateJSExpression(expr.left) + " < " + generateJSExpression(expr.right);
} else if (expr.kind == ExpressionKind.GreaterThan) {
return generateJSExpression(expr.left) + " > " + generateJSExpression(expr.right);
} else if (expr.kind == ExpressionKind.Equals) {
return generateJSExpression(expr.left) + " == " + generateJSExpression(expr.right);
} else if (expr.kind == ExpressionKind.NotEquals) {
return generateJSExpression(expr.left) + " != " + generateJSExpression(expr.right);
} else if (expr.kind == ExpressionKind.GreaterThanEquals) {
return generateJSExpression(expr.left) + " >= " + generateJSExpression(expr.right);
} else if (expr.kind == ExpressionKind.LessThanEquals) {
return generateJSExpression(expr.left) + " <= " + generateJSExpression(expr.right);
} else if (expr.kind == ExpressionKind.Add) {
return generateJSExpression(expr.left) + " + " + generateJSExpression(expr.right);
} else if (expr.kind == ExpressionKind.Subtract) {
return generateJSExpression(expr.left) + " - " + generateJSExpression(expr.right);
} else if (expr.kind == ExpressionKind.Multiply) {
return generateJSExpression(expr.left) + " * " + generateJSExpression(expr.right);
} else if (expr.kind == ExpressionKind.Divide) {
return generateJSExpression(expr.left) + " / " + generateJSExpression(expr.right);
} else if (expr.kind == ExpressionKind.Or) {
return generateJSExpression(expr.left) + " || " + generateJSExpression(expr.right);
} else if (expr.kind == ExpressionKind.And) {
return generateJSExpression(expr.left) + " && " + generateJSExpression(expr.right);
} else if (expr.kind == ExpressionKind.Dot) {
return generateJSExpression(expr.left) + "." + expr.value;
} else if (expr.kind == ExpressionKind.OptDot) {
return generateJSExpression(expr.left) + "?." + expr.value;
} else if (expr.kind == ExpressionKind.Not) {
return "!" + generateJSExpression(expr.left);
} else if (expr.kind == ExpressionKind.IntConstant) {
return expr.value;
} else if (expr.kind == ExpressionKind.NilConstant) {
return "null";
} else if (expr.kind == ExpressionKind.BoolConstant) {
return expr.value;
} else if (expr.kind == ExpressionKind.StringConstant) {
return expr.value;
} else if (expr.kind == ExpressionKind.Identifier) {
return expr.value;
} else if (expr.kind == ExpressionKind.Invoke) {
return generateJSExpression(expr.left) + "(" + generateArguments(expr.indexes) + ")";
} else if (expr.kind == ExpressionKind.Slice) {
return "__slice(" + generateJSExpression(expr.left) + ", " + generateArguments(expr.indexes) + ")";
} else if (expr.kind == ExpressionKind.Index) {
if (expr.indexes.length == 0) {
return "[]";
}
return "__index_get(" + generateJSExpression(expr.left) + ", " + generateArguments(expr.indexes) + ")";
} else if (expr.kind == ExpressionKind.ArrayInit) {
return "[]";
} else {
return "*expression*";
}
}
export function generateTSType(type:class_ParsedType) {
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
} else if (type.kind == TypeKind.objectType) {
if (type.identifier == "Token" || type.identifier == "StatementKind" || type.identifier == "ExpressionKind" || type.identifier == "TypeKind") {
return type.identifier;
}
return "class_" + type.identifier;
} else if (type.kind == TypeKind.functionType) {
return "Function";
} else {
return "any";
}
}
export function generateDefnArgument(arg:class_DefnArgument) {
return arg.identifier + ":" + generateTSType(arg.type);
}
export function generateDefnArguments(args:any) {
if (args == 0 || args.length == 0) {
return "";
}
 // no type
let result = generateDefnArgument(__index_get(args, 0));
 // no type
let idx = 1;
while (idx < args.length) {
result = result + "," + generateDefnArgument(__index_get(args, idx));
idx = idx + 1;
}
return result;
}
export function generateArguments(args:any) {
if (args.length == 0) {
return "";
}
 // no type
let result = generateJSExpression(__index_get(args, 0));
 // no type
let idx = 1;
while (idx < args.length) {
result = result + ", " + generateJSExpression(__index_get(args, idx));
idx = idx + 1;
}
return result;
}
export function generateJSEnumValues(stmt:class_Statement) {
 // no type
let result = __index_get(stmt.identifierList, 0);
 // no type
let idx = 1;
while (idx < stmt.identifierList.length) {
result = result + ", " + __index_get(stmt.identifierList, idx);
idx = idx + 1;
}
return result;
}