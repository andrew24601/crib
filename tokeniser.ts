import { __index_get, __index_set, __slice, StringMap, panic, class_StringMap } from "./runtime"
import { generateTSImport } from "./tboot"
export enum Token {
tkIdentifier, tkIntConstant, tkBoolConstant, tkDoubleConstant, tkStringConstant, tkClass, tkFunction, tkReturn, tkLeftParen, tkRightParen, tkSemiColon, tkComma, tkLeftBracket, tkRightBracket, tkCaret, tkEquals, tkDot, tkOptDot, tkRangeExclusive, tkRangeInclusive, tkAmpersand, tkColon, tkAssign, tkAnd, tkOr, tkConst, tkLet, tkElse, tkElseif, tkEnd, tkInt, tkDouble, tkBool, tkString, tkImport, tkFrom, tkEnum, tkIf, tkWhile, tkRepeat, tkUntil, tkOf, tkFor, tkNil, tkPublic, tkNot, tkQuestionMark, tkBang, tkPlus, tkMinus, tkTimes, tkSlash, tkNotEquals, tkLessThanEquals, tkLessThan, tkGreaterThan, tkGreaterThanEquals, tkEOF, tkInvalid
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
export function Tokeniser(text:string) {
const _o = {} as class_Tokeniser;
 // unknown
const length: any = text.length;
 // unknown
let pos: any = 0;
 // unknown
let tokenStart: any = 0;
 // unknown
let hasPutback: any = false;
 // nullable<object>
let lastToken: Token | null = null;
 // unknown
_o.line = 1;
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
function parseNextToken():Token {
 // nullable<string>
let ident: string | null = null;
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
 // unknown
let ch: any = __index_get(text, pos);
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
} else if (ident == "import") {
return Token.tkImport;
} else if (ident == "from") {
return Token.tkFrom;
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
 // unknown
let match: any = Token.tkInvalid;
if (ch == 40) {
match = Token.tkLeftParen;
} else if (ch == 41) {
match = Token.tkRightParen;
} else if (ch == 33) {
match = Token.tkBang;
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
export interface class_Tokeniser {
line:any;
nextToken():Token;
putback():void;
value():string;
}