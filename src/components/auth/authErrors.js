/** Traduce errores del SDK a claves de i18n, sin exponer detalles técnicos. */
export function authErrorKey(error) {
  const status = error?.status ?? error?.response?.status
  if (status === 401 || status === 403) return 'auth.invalidCredentials'
  return 'auth.genericError'
}
