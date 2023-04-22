import { __index_get, __index_set, __slice, panic } from "./runtime"
import { generateTSImport, importScope } from "./tboot"
// import goes here
import { Token, class_Tokeniser, Tokeniser} from "./tokeniser"
// import goes here
import { class_ParsedType, ParsedType} from "./parser"
export function parser(tokeniser:class_Tokeniser):void {
 // unknown
let tk: Map<string,class_ParsedType> = new Map<string,class_ParsedType>();
 // array<int>
let items: number[] = [];
 // array<int>
const lessThan10: number[] = items.filter((it)=>it < 10);
}