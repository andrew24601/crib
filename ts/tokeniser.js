import { __index_get, __index_set, __slice, panic } from "./runtime"
import { generateTSImport, generateCImport } from "./tboot"
export const Token = {
tkIdentifier: 0, tkIntConstant:1, tkBoolConstant:2, tkDoubleConstant:3, tkStringConstant:4, tkClass:5, tkFunction:6, tkReturn:7, tkLeftParen:8, tkRightParen:9, tkSemiColon:10, tkComma:11, tkLeftBracket:12, tkRightBracket:13, tkCaret:14, tkEquals:15, tkDot:16, tkOptDot:17, tkRangeExclusive:18, tkRangeInclusive:19, tkAmpersand:20, tkColon:21, tkAssign:22, tkAnd:23, tkOr:24, tkConst:25, tkVar:26, tkElse:27, tkElseif:28, tkEnd:29, tkInt:30, tkDouble:31, tkBool:32, tkString:33, tkImport:34, tkFrom:35, tkEnum:36, tkIf:37, tkWhile:38, tkRepeat:39, tkUntil:40, tkIn:41, tkFor:42, tkNil:43, tkPublic:44, tkNot:45, tkQuestionMark:46, tkBang:47, tkPlus:48, tkMinus:49, tkTimes:50, tkSlash:51, tkNotEquals:52, tkLessThanEquals:53, tkLessThan:54, tkGreaterThan:55, tkGreaterThanEquals:56, tkLeftBrace:57, tkRightBrace:58, tkTake:59, tkComment:60, tkEOF:61, tkInvalid:62
};
export function isWhitespace(ch) {
if (ch == 32 || ch == 13 || ch == 10 || ch == 9) {
return true;
}
return false;
}
export function isLeadingIdentifier(ch) {
return ch >= 65 && ch <= 90 || ch >= 97 && ch <= 122 || ch == 95;
}
export function isTrailingIdentifier(ch) {
return ch >= 48 && ch <= 57 || ch >= 65 && ch <= 90 || ch >= 97 && ch <= 122 || ch == 95;
}
export function isDigit(ch) {
return ch >= 48 && ch <= 57;
}
export function Tokeniser(text) {
const _o = {};
const length = text.length;
let pos = 0;
let tokenStart = 0;
let hasPutback = false;
let lastToken = null;
_o.line = 1;
let lineStart = 1;
function nextToken() {
if (hasPutback) {
hasPutback = false;
return lastToken;
}
lastToken = parseNextToken();
while (lastToken == 60) {
lastToken = parseNextToken();
}
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
function start() {
return tokenStart - lineStart;
}
_o.start = start;
function tokenLength() {
return pos - tokenStart;
}
_o.tokenLength = tokenLength;
function parseNextToken() {
let ident = null;
while (pos < length && isWhitespace(text.charCodeAt(pos))) {
if (text.charCodeAt(pos) == 10) {
_o.line = _o.line + 1;
lineStart = pos + 1;
}
pos = pos + 1;
}
if (pos == length) {
return 61;
}
tokenStart = pos;
let ch = text.charCodeAt(pos);
pos = pos + 1;
if (ch == 47 && pos < length && text.charCodeAt(pos) == 47) {
pos = pos + 1;
while (pos < length && text.charCodeAt(pos) != 10) {
pos = pos + 1;
}
return 60;
}
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
let match = 62;
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