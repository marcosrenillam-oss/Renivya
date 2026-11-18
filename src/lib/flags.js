/** Bandera emoji de un código ISO alfa-2 (🇪🇸). */
export function flagEmoji(code) {
  if (!code || !/^[A-Za-z]{2}$/.test(code)) return '🌐'
  return String.fromCodePoint(...code.toUpperCase().split('').map((c) => 0x1f1e6 + c.charCodeAt(0) - 65))
}
