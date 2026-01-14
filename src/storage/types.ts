import {Low} from "lowdb";
import {JSONFile} from "lowdb/node";

type collectionKeysType = { [key: string]: string };

// As new data collections are added, they should be added here or by plugin.
const collectionKeys: collectionKeysType = {
    dezucker: "dezucker",
    people: "people",
};

let _runtimeMergedKeys: collectionKeysType | null = null;

export async function storageFactory(pluginKeys?: string[]): Promise<InternalStorage> {
    if (pluginKeys) return initStorage(withPluginKeys(pluginKeys));
    return initStorage();
}

function withPluginKeys(pluginKeys: string[]): { [key: string]: string } {
    let keySet: Set<{[key: string]: string}> = new Set();
    for (const key of pluginKeys) {
        keySet.add({ [key]: key });
    }
    if (_runtimeMergedKeys) {
        keySet.add(_runtimeMergedKeys);
    }
    _runtimeMergedKeys = {
        ...keySet.values().next().value,
        ...collectionKeys,
    }
    return _runtimeMergedKeys;
}

async function initStorage(initialKeys: collectionKeysType = { ...collectionKeys }): Promise<InternalStorage> {
    const storage: InternalStorage = {
        async push(key: keyof typeof initialKeys, data: any): Promise<void> {
            await push(key, getDatabase(), data);
        },
        async dataFor(key: keyof typeof initialKeys): Promise<any[]> {
            return dataFor(key, getDatabase());
        },
        collectionKeys: initialKeys,
        async init(): Promise<void> {
            await getDatabase().read();
        },
    };
    await storage.init();
    return storage;
}

let _initialData: { [key: string] : any[] } | null = null;

function initialData(): { [key: string] : any[] } {
    if (_initialData != null) return _initialData;

    _initialData = {};
    for (const key in collectionKeys) {
        _initialData[key] = [];
    }
    return _initialData;
}

const adapter = new JSONFile('./data/dezucker.json');

interface InternalStorage {
    init(): Promise<void>;
    push(key: keyof typeof collectionKeys, data: any): Promise<void>;
    dataFor(key: keyof typeof collectionKeys): Promise<any[]>;
    collectionKeys: typeof collectionKeys;
}

async function push(key: keyof typeof collectionKeys, database: Low<any>, data: any): Promise<void> {
    await database.read();
    if (database.data[key] == null) return Promise.reject(`Collection ${key} does not exist.`);
    database.data[key].push(data);
    return await database.write();
}

async function dataFor(key: keyof typeof collectionKeys, database: Low<any>): Promise<any[]> {
    await database.read();
    if (database.data[key] == null) return Promise.reject(`Collection ${key} does not exist.`);
    return database.data[key];
}

let _database: Low<any> | null = null;

function getDatabase() {
    if (_database != null) return _database;
    _database = new Low(adapter, initialData());
    return _database
}
