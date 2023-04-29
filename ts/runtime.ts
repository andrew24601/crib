import { readFile as fsReadFile } from "fs";

export function __index_get(arr:any, idx: number) {
    if (typeof arr === "string")
        return arr.charCodeAt(idx);
    return arr[idx];
}

export function __index_set(arr:any, idx:number, value: any) {
    if (typeof arr === "string")
        throw new Error("Not supported")
    arr[idx] = value;
}

export function __slice(arr:any, start:number, end:number) {
    if (typeof arr === "string")
        return arr.substring(start, end)
    throw new Error("Not supported")
}

export function panic(message: string) {
    console.log(message);
    throw new Error(message);
}

export async function readFile(path: string): Promise<string> {
    return new Promise((resolve, reject)=>{
        fsReadFile(path, "utf-8", (err: any, data: any) => {
            if (err) {
                reject(err);
            }
            resolve(data);
        });
    });
}
