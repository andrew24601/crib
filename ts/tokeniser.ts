import { __index_get, __index_set, __slice, panic } from "./runtime"
import { generateTSImport } from "./tboot"
export enum Token {
tkIdentifier, tkIntConstant, tkBoolConstant, tkDoubleConstant, tkStringConstant, tkClass, tkFunction, tkReturn, tkLeftParen, tkRightParen, tkSemiColon, tkComma, tkLeftBracket, tkRightBracket, tkCaret, tkEquals, tkDot, tkOptDot, tkRangeExclusive, tkRangeInclusive, tkAmpersand, tkColon, tkAssign, tkAnd, tkOr, tkConst, tkVar, tkElse, tkElseif, tkEnd, tkInt, tkDouble, tkBool, tkString, tkImport, tkFrom, tkEnum, tkIf, tkWhile, tkRepeat, tkUntil, tkIn, tkFor, tkNil, tkPublic, tkNot, tkQuestionMark, tkBang, tkPlus, tkMinus, tkTimes, tkSlash, tkNotEquals, tkLessThanEquals, tkLessThan, tkGreaterThan, tkGreaterThanEquals, tkLeftBrace, tkRightBrace, tkTake, tkEOF, tkInvalid
};
export function isWhitespace(ch:number):boolean {
if (ch == 32 || ch == 13 || ch == 10 || ch == 9) {
return true;
}
return false;
}
export function isLeadingIdentifier(ch:number):boolean {
return ch >= 65 && ch <= 90 || ch >= 97 && ch <= 122 || ch == 95;
}
export function isTrailingIdentifier(ch:number):boolean {
return ch >= 48 && ch <= 57 || ch >= 65 && ch <= 90 || ch >= 97 && ch <= 122 || ch == 95;
}
export function isDigit(ch:number):boolean {
return ch >= 48 && ch <= 57;
}
export function Tokeniser(text:string):class_Tokeniser {
const _o = {} as class_Tokeniser;
const length: number = text.length;
let pos: number = 0;
let tokenStart: number = 0;
let hasPutback: boolean = false;
let lastToken: Token | null = null;
_o.line = 1;
let lineStart: number = 1;
function nextToken():Token {
if (hasPutback) {
hasPutback = false;
return lastToken!;
}
lastToken = parseNextToken();
return lastToken;
}
_o.nextToken = nextToken;
function putback():void {
hasPutback = true;
}
_o.putback = putback;
function value():string {
return __slice(text, tokenStart, pos);
}
_o.value = value;
function start():number {
return tokenStart - lineStart;
}
_o.start = start;
function tokenLength():number {
return pos - tokenStart;
}
_o.tokenLength = tokenLength;
function parseNextToken():Token {
let ident: string | null = null;
while (pos < length && isWhitespace(text.charCodeAt(pos))) {
if (text.charCodeAt(pos) == 10) {
_o.line = _o.line + 1;
lineStart = pos + 1;
}
pos = pos + 1;
}
if (pos == length) {
return 60;
}
tokenStart = pos;
let ch: number = text.charCodeAt(pos);
pos = pos + 1;
if (isLeadingIdentifier(ch)) {
while (pos < length && isTrailingIdentifier(text.charCodeAt(pos))) {
pos = pos + 1;
}
ident = __slice(text, tokenStart, pos);
if (ident == "const") {
return 25;
} else if (ident == "function") {
return 6;
} else if (ident == "and") {
return 23;
} else if (ident == "or") {
return 24;
} else if (ident == "else") {
return 27;
} else if (ident == "elseif") {
return 28;
} else if (ident == "end") {
return 29;
} else if (ident == "bool") {
return 32;
} else if (ident == "string") {
return 33;
} else if (ident == "double") {
return 31;
} else if (ident == "int") {
return 30;
} else if (ident == "enum") {
return 36;
} else if (ident == "class") {
return 5;
} else if (ident == "if") {
return 37;
} else if (ident == "return") {
return 7;
} else if (ident == "while") {
return 38;
} else if (ident == "repeat") {
return 39;
} else if (ident == "until") {
return 40;
} else if (ident == "in") {
return 41;
} else if (ident == "for") {
return 42;
} else if (ident == "nil") {
return 43;
} else if (ident == "not") {
return 45;
} else if (ident == "import") {
return 34;
} else if (ident == "from") {
return 35;
} else if (ident == "take") {
return 59;
} else if (ident == "true" || ident == "false") {
return 2;
} else if (ident == "public") {
return 44;
}
return 0;
}
if (isDigit(ch)) {
while (pos < length && isDigit(text.charCodeAt(pos))) {
pos = pos + 1;
}
return 1;
}
if (ch == 39 || ch == 34) {
while (pos < length && text.charCodeAt(pos) != ch) {
pos = pos + 1;
}
if (pos < length) {
pos = pos + 1;
}
return 4;
}
let match: Token = 61;
if (ch == 40) {
match = 8;
} else if (ch == 41) {
match = 9;
} else if (ch == 33) {
match = 47;
} else if (ch == 59) {
match = 10;
} else if (ch == 44) {
match = 11;
} else if (ch == 91) {
match = 12;
} else if (ch == 93) {
match = 13;
} else if (ch == 61) {
match = 15;
} else if (ch == 123) {
match = 57;
} else if (ch == 125) {
match = 58;
} else if (ch == 38) {
match = 20;
} else if (ch == 46) {
if (pos < length && text.charCodeAt(pos) == 46) {
pos = pos + 1;
if (pos < length && text.charCodeAt(pos) == 60) {
pos = pos + 1;
match = 18;
} else {
match = 19;
}
} else {
match = 16;
}
} else if (ch == 58) {
if (pos < length && text.charCodeAt(pos) == 61) {
pos = pos + 1;
match = 22;
} else {
match = 21;
}
} else if (ch == 63) {
if (pos < length && text.charCodeAt(pos) == 46) {
pos = pos + 1;
match = 17;
} else {
match = 46;
}
} else if (ch == 43) {
match = 48;
} else if (ch == 45) {
match = 49;
} else if (ch == 42) {
match = 50;
} else if (ch == 94) {
match = 14;
} else if (ch == 47) {
match = 51;
} else if (ch == 60) {
if (pos < length && text.charCodeAt(pos) == 61) {
pos = pos + 1;
match = 53;
} else if (pos < length && text.charCodeAt(pos) == 62) {
pos = pos + 1;
match = 52;
} else {
match = 54;
}
} else if (ch == 62) {
if (pos < length && text.charCodeAt(pos) == 61) {
pos = pos + 1;
match = 56;
} else {
match = 55;
}
}
return match;
}
return _o;
}
export interface class_Tokeniser {
line:number;
nextToken():Token;
putback():void;
value():string;
start():number;
tokenLength():number;
}