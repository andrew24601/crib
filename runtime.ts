export interface class_StringMap
{
    v: Map<string, any>;
    add(key: string, value: any): void;
    set(key: string, value: any): void;
    delete(key: string): void;
    has(key: string): boolean;
    get(key: string): any;
    clear(): void;
}

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

export function StringSet() {
    const v = new Set();

    return {
        add(value) {
            v.add(value)
        },
        has(value) {
            return v.has(value)
        }
    }
}

export function StringMap(init?: class_StringMap): class_StringMap {
    const v = new Map();

    if (init) {
        for (const [key, value] of init.v) {
            v.set(key, value)
        }
    }

    return {
        v,
        add(key, value) {
            v.set(key, value)
        },
        set(key, value) {
            v.set(key, value)
        },
        delete(key) {
            v.delete(key)
        },
        has(key) {
            return v.has(key)
        },
        get(key) {
            return v.get(key)
        },
        clear() {
            v.clear();
        }
    }
}

export function panic(message) {
    console.log(message);
//    throw new Error(message);
}