import { __index_get, __index_set, __slice, StringMap, panic, class_StringMap } from "./runtime"
import { generateTSImport } from "./tboot"
// import goes here
import { Token, class_Tokeniser, Tokeniser} from "./tokeniser"
export enum StatementKind {
ConstStatement, LetStatement, EnumStatement, ClassStatement, FunctionStatement, ReturnStatement, IfStatement, WhileStatement, ImportStatement, AssignStatement, ExpressionStatement, RepeatStatement, ForStatement
};
export enum ExpressionKind {
IntConstant, DoubleConstant, StringConstant, NilConstant, Identifier, Multiply, Divide, Modulo, Add, Subtract, LessThan, LessThanEquals, Equals, NotEquals, GreaterThan, GreaterThanEquals, And, Or, OptDot, Dot, Bang, Invoke, Index, IntrinsicType, Slice, ArrayInit, BoolConstant, Not, Negate, Invalid
};
export enum TypeKind {
intType, doubleType, boolType, stringType, objectType, arrayType, nullableType, pointerType, classType, enumType, enumDefinitionType, functionType, voidType, unknownType, invalidType
};
 // unknown
const sharedUnknownType: any = ParsedType(TypeKind.unknownType, null, null);
export function Expression(kind:ExpressionKind,left:class_Expression | null,right:class_Expression | null) {
const _o = {} as class_Expression;
_o.kind = kind;
_o.left = left;
_o.right = right;
 // nullable<string>
_o.value = null;
 // array<object>
_o.indexes = [];
 // array<string>
_o.identifiers = [];
 // object
_o.type = sharedUnknownType;
 // unknown
_o.line = 0;
return _o;
}
export interface class_Expression {
kind:ExpressionKind;
left:class_Expression | null;
right:class_Expression | null;
value:string | null;
indexes:class_Expression[];
identifiers:string[];
type:class_ParsedType;
line:any;
}
export function ParsedType(kind:TypeKind,ref:class_ParsedType | null,stmt:class_Statement | null) {
const _o = {} as class_ParsedType;
_o.kind = kind;
_o.ref = ref;
_o.stmt = stmt;
 // nullable<string>
_o.identifier = null;
 // array<object>
_o.parameters = [];
return _o;
}
export interface class_ParsedType {
kind:TypeKind;
ref:class_ParsedType | null;
stmt:class_Statement | null;
identifier:string | null;
parameters:class_ParsedType[];
}
export function DefnArgument(identifier:string,type:class_ParsedType,isPublic:boolean) {
const _o = {} as class_DefnArgument;
_o.identifier = identifier;
_o.type = type;
_o.isPublic = isPublic;
return _o;
}
export interface class_DefnArgument {
identifier:string;
type:class_ParsedType;
isPublic:boolean;
}
export function ElseIfClause(value:class_Expression,block:class_Statement[]) {
const _o = {} as class_ElseIfClause;
_o.value = value;
_o.block = block;
return _o;
}
export interface class_ElseIfClause {
value:class_Expression;
block:class_Statement[];
}
export function Statement(kind:StatementKind) {
const _o = {} as class_Statement;
_o.kind = kind;
 // nullable<string>
_o.identifier = null;
 // object
_o.type = sharedUnknownType;
 // nullable<object>
_o.value = null;
 // nullable<object>
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
_o.isPublic = false;
return _o;
}
export interface class_Statement {
kind:StatementKind;
identifier:string | null;
type:class_ParsedType;
value:class_Expression | null;
lhs:class_Expression | null;
block:class_Statement[];
elseIf:class_ElseIfClause[];
elseBlock:class_Statement[];
identifierList:string[];
defnArguments:class_DefnArgument[];
isPublic:boolean;
}
export function Parser(tokeniser:class_Tokeniser) {
const _o = {} as class_Parser;
function acceptToken(token:Token):boolean {
 // unknown
const tk: any = tokeniser.nextToken();
if (tk == token) {
return true;
}
tokeniser.putback();
return false;
}
function expectToken(expected:Token):string {
 // unknown
const tk: any = tokeniser.nextToken();
if (tk != expected) {
panic("expected " + tokeniser.line);
}
return tokeniser.value();
}
function expectIdentifier():string {
return expectToken(Token.tkIdentifier);
}
function parseType():class_ParsedType {
 // unknown
let reference: any = false;
 // unknown
const tk: any = tokeniser.nextToken();
 // object
let type: class_ParsedType = sharedUnknownType;
 // unknown
const identifier: any = tokeniser.value();
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
function parseStatement():class_Statement | null {
 // unknown
let tk: any = tokeniser.nextToken();
 // nullable<object>
let stmt: class_Statement | null = null;
 // nullable<string>
let identifier: string | null = null;
 // object
let type: class_ParsedType = sharedUnknownType;
 // nullable<object>
let value: class_Expression | null = null;
 // array<object>
let block: class_Statement[] = [];
 // unknown
let isPublic: any = false;
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
} else if (type?.kind == TypeKind.boolType) {
value = Expression(ExpressionKind.BoolConstant, null, null);
value.value = "false";
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
while (acceptToken(Token.tkElseif)) {
stmt.elseIf.push(ElseIfClause(parseExpression(), parseBlock()));
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
} else if (tk == Token.tkImport) {
stmt = Statement(StatementKind.ImportStatement);
stmt.identifierList.push(expectIdentifier());
while (acceptToken(Token.tkComma)) {
stmt.identifierList.push(expectIdentifier());
}
expectToken(Token.tkFrom);
if (acceptToken(Token.tkDot)) {
stmt.identifier = ".";
} else if (acceptToken(Token.tkRangeInclusive)) {
stmt.identifier = "..";
} else {
stmt.identifier = expectIdentifier();
}
while (acceptToken(Token.tkSlash)) {
if (acceptToken(Token.tkRangeInclusive)) {
stmt.identifier = stmt.identifier + "/..";
} else {
stmt.identifier = stmt.identifier + "/" + expectIdentifier();
}
}
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
function parseBlock():class_Statement[] {
 // array<object>
const result: class_Statement[] = [];
 // nullable<object>
let stmt: class_Statement | null = parseStatement();
while (stmt != null) {
result.push(stmt);
stmt = parseStatement();
}
return result;
}
_o.parseBlock = parseBlock;
function parseDefnArgument():class_DefnArgument {
 // unknown
let isPublic: any = false;
if (acceptToken(Token.tkPublic)) {
isPublic = true;
}
 // unknown
const identifier: any = expectIdentifier();
expectToken(Token.tkColon);
 // unknown
const type: any = parseType();
return DefnArgument(identifier, type, isPublic);
}
function parseDefnArguments():class_DefnArgument[] {
 // array<object>
const result: class_DefnArgument[] = [];
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
function parseExpression():class_Expression {
 // unknown
let left: any = parseAndExpression();
 // unknown
let tk: any = tokeniser.nextToken();
while (tk == Token.tkOr) {
left = Expression(ExpressionKind.Or, left, parseAndExpression());
tk = tokeniser.nextToken();
}
tokeniser.putback();
return left;
}
function parseAndExpression():class_Expression {
 // unknown
let left: any = parseComparisonExpression();
 // unknown
let tk: any = tokeniser.nextToken();
while (tk == Token.tkAnd) {
left = Expression(ExpressionKind.And, left, parseComparisonExpression());
tk = tokeniser.nextToken();
}
tokeniser.putback();
return left;
}
function parseComparisonExpression():class_Expression {
 // unknown
let left: any = parseAddSub();
 // unknown
let tk: any = tokeniser.nextToken();
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
function parseAddSub():class_Expression {
 // unknown
let left: any = parseTerm();
 // unknown
let tk: any = tokeniser.nextToken();
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
function parseTerm():class_Expression {
 // unknown
let left: any = parseFactor();
 // unknown
let tk: any = tokeniser.nextToken();
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
function parseFactor():class_Expression {
 // unknown
const tk: any = tokeniser.nextToken();
 // nullable<object>
let e: class_Expression | null = null;
 // nullable<object>
let p: class_Expression | null = null;
 // nullable<string>
let ident: string | null = null;
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
e = Expression(ExpressionKind.Invalid, null, null);
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
} else if (acceptToken(Token.tkBang)) {
e = Expression(ExpressionKind.Bang, e, null);
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
return e!;
}
}
return e!;
}
return _o;
}
export interface class_Parser {
parseBlock():class_Statement[];
}