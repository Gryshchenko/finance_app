import { createMMKV } from "react-native-mmkv"
import AsyncStorage from "@react-native-async-storage/async-storage"
import { Platform } from "react-native"

const jsStore = {
    async set(key: string, value: string) {
        return AsyncStorage.setItem(key, value)
    },
    async getString(key: string) {
        return AsyncStorage.getItem(key)
    },
    async remove(key: string) {
        return AsyncStorage.removeItem(key)
    },
    async clearAll() {
        return AsyncStorage.clear()
    },
}

let storage = jsStore

if (Platform.OS !== "web") {
    try {
        // @ts-ignore
        storage = createMMKV({ id: "ten.percent.app" });
    } catch (e) {
        console.warn("MMKV not available, falling back to AsyncStorage:", e)
        storage = jsStore
    }
}


export async function saveString(key: string, value: string) {
  try {
    await storage.set(key, value)
    return true
  } catch {
    return false
  }
}

export async function loadString(key: string) {
  try {
    const result = await storage.getString(key)
    return result ?? null
  } catch {
    return null
  }
}

export async function save<T>(key: string, value: T) {
  try {
    return await saveString(key, JSON.stringify(value))
  } catch {
    return false
  }
}

export async function load<T>(key: string): Promise<T | null> {
  try {
    const result = await loadString(key)
    return result != null ? (JSON.parse(result) as T) : null
  } catch {
    return null
  }
}

export async function remove(key: string) {
  try {
    await storage.remove(key)
  } catch {}
}

export async function clear() {
  try {
    await storage.clearAll()
  } catch {}
}

export {
    storage
}
