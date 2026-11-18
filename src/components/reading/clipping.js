/**
 * Recorte de periódico de una noticia (imagen PNG 1080×1350) para compartir:
 * cabecera gótica, fecha, sección, titular, entradilla, foto si se puede y pie con la web.
 */
const W = 1080
const H = 1350
const M = 84

function wrap(ctx, text, maxWidth) {
  const words = String(text || '').split(/\s+/).filter(Boolean)
  const lines = []
  let line = ''
  for (const w of words) {
    const test = line ? `${line} ${w}` : w
    if (ctx.measureText(test).width > maxWidth && line) {
      lines.push(line)
      line = w
    } else line = test
  }
  if (line) lines.push(line)
  return lines
}

function clampLines(ctx, lines, max, maxWidth) {
  if (lines.length <= max) return lines
  const out = lines.slice(0, max)
  let last = out[max - 1]
  while (ctx.measureText(`${last}…`).width > maxWidth && last.includes(' ')) last = last.slice(0, last.lastIndexOf(' '))
  out[max - 1] = `${last}…`
  return out
}

/** Carga la foto solo si el periódico la permite usar en un lienzo (CORS); si no, sin foto. */
function loadPhoto(url) {
  return new Promise((resolve) => {
    if (!url) return resolve(null)
    const img = new Image()
    img.crossOrigin = 'anonymous'
    const timer = setTimeout(() => resolve(null), 4000)
    img.onload = () => {
      clearTimeout(timer)
      resolve(img)
    }
    img.onerror = () => {
      clearTimeout(timer)
      resolve(null)
    }
    img.src = url
  })
}

export async function renderClipping({ story, kicker, dateLine, footer }) {
  await Promise.all(
    ['900 64px "Old Standard TT"', 'italic 32px "Source Serif 4"', '96px "UnifrakturMaguntia"', '600 22px Inter'].map((f) => document.fonts?.load(f).catch(() => null))
  )
  const canvas = document.createElement('canvas')
  canvas.width = W
  canvas.height = H
  const ctx = canvas.getContext('2d')
  const ink = '#141414'
  const red = '#b3121e'

  // Papel con un poco de grano.
  ctx.fillStyle = '#f4f0e6'
  ctx.fillRect(0, 0, W, H)
  for (let i = 0; i < 9000; i++) {
    ctx.fillStyle = `rgba(80,60,30,${Math.random() * 0.035})`
    ctx.fillRect(Math.random() * W, Math.random() * H, 1.4, 1.4)
  }

  ctx.fillStyle = ink
  ctx.textBaseline = 'alphabetic'
  // Cabecera
  ctx.fillRect(M, 70, W - 2 * M, 6)
  ctx.textAlign = 'center'
  ctx.font = '104px "UnifrakturMaguntia", serif'
  ctx.fillText('Renivya', W / 2, 190)
  ctx.fillRect(M, 218, W - 2 * M, 2)
  ctx.fillRect(M, 226, W - 2 * M, 2)
  ctx.font = '600 22px Inter, sans-serif'
  ctx.textAlign = 'left'
  ctx.fillText(dateLine.toUpperCase(), M, 262)
  ctx.fillRect(M, 282, W - 2 * M, 2)

  let y = 340
  if (kicker) {
    ctx.font = '700 24px Inter, sans-serif'
    ctx.fillStyle = story.is_breaking ? red : ink
    ctx.fillText(kicker.toUpperCase(), M, y)
    ctx.fillStyle = ink
    y += 24
  }

  const photo = await loadPhoto(story.image_url)
  const maxText = W - 2 * M
  ctx.font = '900 64px "Old Standard TT", Georgia, serif'
  const titleLines = clampLines(ctx, wrap(ctx, story.title, maxText), photo ? 3 : 5, maxText)
  y += 52
  for (const line of titleLines) {
    ctx.fillText(line, M, y)
    y += 74
  }

  y += 4
  ctx.font = 'italic 32px "Source Serif 4", Georgia, serif'
  ctx.fillStyle = '#2a2a2a'
  const summaryLines = clampLines(ctx, wrap(ctx, story.summary, maxText), photo ? 3 : 7, maxText)
  for (const line of summaryLines) {
    ctx.fillText(line, M, y)
    y += 44
  }
  ctx.fillStyle = ink

  if (!photo && (story.body || []).length) {
    // Sin foto: el texto de la noticia a dos columnas, como en la página de un periódico.
    y += 10
    ctx.fillRect(M, y, W - 2 * M, 2)
    y += 52
    const gap = 40
    const colW = (W - 2 * M - gap) / 2
    const bottom = H - 140
    ctx.font = '28px "Source Serif 4", Georgia, serif'
    const lines = wrap(ctx, story.body.join(' '), colW)
    // Columnas equilibradas: si el texto es corto, mitad y mitad.
    const perCol = Math.min(Math.floor((bottom - y) / 40), Math.ceil(lines.length / 2))
    for (let c = 0; c < 2; c++) {
      const part = lines.slice(c * perCol, (c + 1) * perCol)
      if (c === 1 && lines.length > 2 * perCol && part.length) part[part.length - 1] = `${part[part.length - 1].replace(/[.,;:]?$/, '')}…`
      part.forEach((line, i) => ctx.fillText(line, M + c * (colW + gap), y + i * 40))
    }
    if (lines.length > perCol) ctx.fillRect(M + colW + gap / 2 - 1, y - 30, 1.5, Math.min(perCol, lines.length - perCol) * 40)
  }

  if (photo) {
    y += 18
    const boxH = H - 150 - y
    if (boxH > 160) {
      const boxW = W - 2 * M
      const scale = Math.max(boxW / photo.width, boxH / photo.height)
      const sw = boxW / scale
      const sh = boxH / scale
      ctx.save()
      ctx.filter = 'grayscale(0.15) contrast(1.05)'
      ctx.drawImage(photo, (photo.width - sw) / 2, (photo.height - sh) / 2, sw, sh, M, y, boxW, boxH)
      ctx.restore()
      ctx.strokeStyle = ink
      ctx.lineWidth = 2
      ctx.strokeRect(M, y, boxW, boxH)
    }
  }

  // Pie
  ctx.fillRect(M, H - 108, W - 2 * M, 2)
  ctx.font = '600 22px Inter, sans-serif'
  ctx.fillText(footer, M, H - 70)
  ctx.textAlign = 'right'
  ctx.fillText('■', W - M, H - 70)

  return new Promise((resolve) => canvas.toBlob((b) => resolve(b), 'image/png'))
}
