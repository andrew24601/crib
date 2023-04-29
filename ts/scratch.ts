import { __index_get, __index_set, __slice, panic } from "./runtime"
import { generateTSImport } from "./tboot"
// import goes here
import { readFile} from "./runtime"
export async function test():Promise<void> {
 // string
const d: string = await parser();
}
export async function parser():Promise<string> {
 // string
const data: string = await readFile("./test.txt");
return data;
}