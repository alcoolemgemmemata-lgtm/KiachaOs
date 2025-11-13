export function logger(component: string) {
  return {
    info: (msg: string) => console.log(`[${component}] ${msg}`),
    error: (msg: string) => console.error(`[${component}] ERROR: ${msg}`),
    warn: (msg: string) => console.warn(`[${component}] WARN: ${msg}`),
    debug: (msg: string) => console.log(`[${component}] DEBUG: ${msg}`)
  }
}
