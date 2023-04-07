import { __index_get, __index_set, __slice, StringMap, panic, class_StringMap } from "./runtime"
import { generateTSImport, importScope } from "./tboot"
// import goes here
import { Token, class_Tokeniser, Tokeniser} from "./tokeniser"
export function parser(tokeniser:class_Tokeniser):void {
 // object<Token>
let tk: Token = tokeniser.nextToken();
}