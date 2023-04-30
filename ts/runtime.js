import { readFile as fsReadFile } from "fs";

export function __index_get(arr, idx) {
    if (typeof arr === "string")
        return arr.charCodeAt(idx);
    return arr[idx];
}

export function __index_set(arr, idx, value) {
    if (typeof arr === "string")
        throw new Error("Not supported")
    arr[idx] = value;
}

export function __slice(arr, start, end) {
    if (typeof arr === "string")
        return arr.substring(start, end)
    throw new Error("Not supported")
}

export function panic(message) {
    console.log(message);
    throw new Error(message);
}

export async function readFile(path) {
    return new Promise((resolve, reject)=>{
        fsReadFile(path, "utf-8", (err, data) => {
            if (err) {
                reject(err);
            }
            resolve(data);
        });
    });
}
