function detectLanguage() {
  let locale = null

  // Browser
  if (typeof navigator !== "undefined") {
    // @ts-ignore
    locale = navigator.languages?.[0] || navigator.language || navigator?.userLanguage
  }

  // Native
  if (!locale && typeof globalThis !== "undefined") {
    // @ts-ignore
    if (globalThis.__LOCALE__) locale = globalThis.__LOCALE__
    // @ts-ignore
    else if (globalThis.NativeLocale) locale = globalThis.NativeLocale
  }

  // normalization
  if (locale) {
    return locale.toLowerCase().split(/[-_]/)[0]
  }

  // 4Fallback
  return "en"
}

export default detectLanguage
