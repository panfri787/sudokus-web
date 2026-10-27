export const GAME_KEY = 'sudokus-web:v1:game'
export const PREFS_KEY = 'sudokus-web:v1:prefs'

/** Lee y parsea JSON de `localStorage`; `null` si no existe, es inválido o no hay acceso. */
export function readJson<T = unknown>(key: string): T | null {
  try {
    const raw = globalThis.localStorage?.getItem(key)
    return raw == null ? null : (JSON.parse(raw) as T)
  } catch {
    return null
  }
}

/** Escribe JSON en `localStorage`; ignora errores (modo privado, cuota). */
export function writeJson(key: string, value: unknown): void {
  try {
    globalThis.localStorage?.setItem(key, JSON.stringify(value))
  } catch {
    // El juego sigue funcionando sin guardar.
  }
}
