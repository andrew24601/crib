import { __index_get, __index_set, __slice, StringMap, panic, class_StringMap } from "./runtime"
import { generateTSImport, importScope } from "./tboot"
// import goes here
import { Token, class_Tokeniser, Tokeniser} from "./tokeniser"
// import goes here
import { class_ParsedType, ParsedType} from "./parser"
export function parser(tokeniser:class_Tokeniser):void {
 // unknown
let tk: Map<string,class_ParsedType> = new Map<string,class_ParsedType>();
}