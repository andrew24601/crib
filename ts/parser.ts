import { __index_get, __index_set, __slice, panic } from "./runtime"
import { generateTSImport, importScope } from "./tboot"
// import goes here
import { Token, class_Tokeniser, Tokeniser} from "./tokeniser"
// import goes here
import { class_IdentifierOrigin, IdentifierOrigin} from "./infer"
export enum StatementKind {
ConstStatement, LetStatement, EnumStatement, ClassStatement, FunctionStatement, ReturnStatement, IfStatement, WhileStatement, ImportStatement, AssignStatement, ExpressionStatement, RepeatStatement, ForStatement, ForRangeStatement, ForRangeExclusiveStatement, ModuleStatement
};
export enum ExpressionKind {
IntConstant, DoubleConstant, StringConstant, NilConstant, ArrayConstant, Identifier, Multiply, Divide, Modulo, Add, Subtract, LessThan, LessThanEquals, Equals, NotEquals, GreaterThan, GreaterThanEquals, And, Or, OptDot, Dot, Bang, Invoke, Index, IntrinsicType, Slice, BoolConstant, Not, Negate, Invalid
};
export enum TypeKind {
intType, doubleType, boolType, stringType, objectType, arrayType, mapType, nullableType, pointerType, classType, enumType, enumDefinitionType, functionType, voidType, arrayInitType, closureType, unknownType, invalidType
};
 // object<ParsedType>
const sharedUnknownType: class_ParsedType = ParsedType(16, null, null);
export function Expression(kind:ExpressionKind,left:class_Expression | null,right:class_Expression | null,tokeniser:class_Tokeniser | null) {
const _o = {} as class_Expression;
_o.kind = kind;
_o.left = left;
_o.right = right;
 // nullable<string>
_o.value = null;
 // array<object<Expression>>
_o.indexes = [];
 // array<string>
_o.identifiers = [];
 // object<ParsedType>
_o.type = sharedUnknownType;
 // int
_o.line = 0;
 // int
_o.tokenPos = 0;
 // int
_o.tokenLength = 0;
 // nullable<object<IdentifierOrigin>>
_o.origin = null;
if (tokeniser != null) {
_o.line = tokeniser.line;
_o.tokenPos = tokeniser.start();
_o.tokenLength = tokeniser.tokenLength();
}
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
line:number;
tokenPos:number;
tokenLength:number;
origin:class_IdentifierOrigin | null;
}
export function ParsedType(kind:TypeKind,ref:class_ParsedType | null,stmt:class_Statement | null) {
const _o = {} as class_ParsedType;
_o.kind = kind;
_o.ref = ref;
_o.stmt = stmt;
 // nullable<string>
_o.identifier = null;
 // nullable<object<ParsedType>>
_o.mapKeyRef = null;
return _o;
}
export interface class_ParsedType {
kind:TypeKind;
ref:class_ParsedType | null;
stmt:class_Statement | null;
identifier:string | null;
mapKeyRef:class_ParsedType | null;
}
export function DefnArgument(identifier:string,type:class_ParsedType,isPublic:boolean) {
const _o = {} as class_DefnArgument;
_o.identifier = identifier;
_o.type = type;
_o.isPublic = isPublic;
 // nullable<object<Expression>>
_o.value = null;
return _o;
}
export interface class_DefnArgument {
identifier:string;
type:class_ParsedType;
isPublic:boolean;
value:class_Expression | null;
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
 // object<ParsedType>
_o.type = sharedUnknownType;
 // nullable<object<Expression>>
_o.value = null;
 // nullable<object<Expression>>
_o.lhs = null;
 // array<object<Statement>>
_o.block = [];
 // array<object<ElseIfClause>>
_o.elseIf = [];
 // array<object<Statement>>
_o.elseBlock = [];
 // array<string>
_o.identifierList = [];
 // array<object<DefnArgument>>
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
const tk: Token = tokeniser.nextToken();
if (tk == token) {
return true;
}
tokeniser.putback();
return false;
}
function acceptIdentifierToken(token:Token,text:string):boolean {
 // unknown
const tk: Token = tokeniser.nextToken();
if (tk == 0 && tokeniser.value() == text) {
return true;
}
tokeniser.putback();
return false;
}
function expectToken(expected:Token):string {
 // unknown
const tk: Token = tokeniser.nextToken();
if (tk != expected) {
panic("expected " + tokeniser.line);
}
return tokeniser.value();
}
function expectIdentifier():string {
return expectToken(0);
}
function parseType():class_ParsedType {
 // bool
let reference: boolean = false;
 // unknown
const tk: Token = tokeniser.nextToken();
 // object<ParsedType>
let type: class_ParsedType = sharedUnknownType;
 // string
const identifier: string = tokeniser.value();
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
function parseStatement():class_Statement | null {
 // nullable<object<Statement>>
let stmt: class_Statement | null = null;
 // nullable<string>
let identifier: string | null = null;
 // object<ParsedType>
let type: class_ParsedType = sharedUnknownType;
 // nullable<object<Expression>>
let value: class_Expression | null = null;
 // array<object<Statement>>
let block: class_Statement[] = [];
 // bool
let isPublic: boolean = false;
 // unknown
let tk: Token = tokeniser.nextToken();
if (tk == 27 || tk == 28 || tk == 29 || tk == 40 || tk == 59) {
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
if (acceptToken(16)) {
stmt.identifier = ".";
} else if (acceptToken(19)) {
stmt.identifier = "..";
} else {
stmt.identifier = expectIdentifier();
}
while (acceptToken(51)) {
if (acceptToken(19)) {
stmt.identifier = stmt.identifier + "/..";
} else {
stmt.identifier = stmt.identifier + "/" + expectIdentifier();
}
}
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
stmt.value = value;
return stmt;
}
function parseBlock():class_Statement[] {
 // array<object<Statement>>
const result: class_Statement[] = [];
 // nullable<object<Statement>>
let stmt: class_Statement | null = parseStatement();
while (stmt != null) {
result.push(stmt);
stmt = parseStatement();
}
return result;
}
_o.parseBlock = parseBlock;
function parseDefnArgument():class_DefnArgument {
 // bool
let isPublic: boolean = false;
if (acceptToken(44)) {
isPublic = true;
}
 // string
const identifier: string = expectIdentifier();
expectToken(21);
 // object<ParsedType>
const type: class_ParsedType = parseType();
 // object<DefnArgument>
const arg: class_DefnArgument = DefnArgument(identifier, type, isPublic);
if (acceptToken(22)) {
arg.value = parseExpression();
}
return arg;
}
function parseDefnArguments():class_DefnArgument[] {
 // array<object<DefnArgument>>
const result: class_DefnArgument[] = [];
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
function parseExpression():class_Expression {
 // object<Expression>
let left: class_Expression = parseAndExpression();
 // unknown
let tk: Token = tokeniser.nextToken();
while (tk == 24) {
left = Expression(18, left, parseAndExpression(), null);
tk = tokeniser.nextToken();
}
tokeniser.putback();
return left;
}
function parseAndExpression():class_Expression {
 // object<Expression>
let left: class_Expression = parseComparisonExpression();
 // unknown
let tk: Token = tokeniser.nextToken();
while (tk == 23) {
left = Expression(17, left, parseComparisonExpression(), null);
tk = tokeniser.nextToken();
}
tokeniser.putback();
return left;
}
function parseComparisonExpression():class_Expression {
 // object<Expression>
let left: class_Expression = parseAddSub();
 // unknown
let tk: Token = tokeniser.nextToken();
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
function parseAddSub():class_Expression {
 // object<Expression>
let left: class_Expression = parseTerm();
 // unknown
let tk: Token = tokeniser.nextToken();
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
function parseTerm():class_Expression {
 // object<Expression>
let left: class_Expression = parseFactor();
 // unknown
let tk: Token = tokeniser.nextToken();
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
function parseFactor():class_Expression {
 // unknown
const tk: Token = tokeniser.nextToken();
 // nullable<object<Expression>>
let e: class_Expression | null = null;
 // nullable<object<Expression>>
let p: class_Expression | null = null;
 // nullable<string>
let ident: string | null = null;
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
e = Expression(29, null, null, null);
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