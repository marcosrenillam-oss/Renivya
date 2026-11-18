/**
 * Vibración breve al tocar. Android: navigator.vibrate. iPhone (iOS 18+): Safari no expone
 * vibración, pero alternar un <input type="checkbox" switch> produce el "tic" del sistema.
 */
let iosSwitch = null

function iosTick() {
  if (!iosSwitch) {
    const label = document.createElement('label')
    label.setAttribute('aria-hidden', 'true')
    label.style.cssText = 'position:fixed;left:-9999px;top:0;width:1px;height:1px;overflow:hidden;opacity:0;pointer-events:none'
    const input = document.createElement('input')
    input.type = 'checkbox'
    input.setAttribute('switch', '')
    input.tabIndex = -1
    label.appendChild(input)
    document.body.appendChild(label)
    iosSwitch = label
  }
  iosSwitch.click()
}

export function haptic(kind = 'light') {
  try {
    if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
      navigator.vibrate(kind === 'medium' ? 14 : 8)
      return
    }
    if (/iP(hone|ad|od)/.test(navigator.userAgent || '')) iosTick()
  } catch {
    /* sin háptica */
  }
}
