import { CanvasTexture, SRGBColorSpace } from 'three'

/* The desk monitor's contents, painted onto a canvas each frame: a desktop
   with three windows — brands and pages sliding past in two rows, reels
   scrolling in columns, and YouTube films scrolling as cards. */

const W = 1600
const H = 688
const FONT = '"Inter Tight", "Helvetica Neue", Arial, sans-serif'
const MONO = '"JetBrains Mono", ui-monospace, Menlo, monospace'

function load(src, fallback) {
  const img = new Image()
  img.decoding = 'async'
  if (/^https?:/.test(src)) {
    // Remote thumbnails must be CORS-clean or the canvas can't be uploaded
    // as a texture; if the host refuses, fall back to a local still.
    img.crossOrigin = 'anonymous'
    img.onerror = () => {
      img.onerror = null
      img.removeAttribute('crossorigin')
      img.src = fallback
    }
  }
  img.src = src
  return img
}
const ready = (img) => img.complete && img.naturalWidth > 0

function roundRect(g, x, y, w, h, r) {
  g.beginPath()
  g.roundRect(x, y, w, h, r)
}

/** Draw `img` to cover (crop) or contain (fit) the box. */
function drawFit(g, img, x, y, w, h, mode = 'cover') {
  if (!ready(img)) {
    g.fillStyle = '#1c1d21'
    g.fillRect(x, y, w, h)
    return
  }
  const s = mode === 'cover'
    ? Math.max(w / img.naturalWidth, h / img.naturalHeight)
    : Math.min(w / img.naturalWidth, h / img.naturalHeight)
  const dw = img.naturalWidth * s
  const dh = img.naturalHeight * s
  g.drawImage(img, x + (w - dw) / 2, y + (h - dh) / 2, dw, dh)
}

function windowFrame(g, x, y, w, h, title, accent) {
  g.save()
  g.shadowColor = 'rgba(0,0,0,0.55)'
  g.shadowBlur = 30
  g.shadowOffsetY = 10
  roundRect(g, x, y, w, h, 14)
  g.fillStyle = '#121317'
  g.fill()
  g.restore()
  roundRect(g, x, y, w, h, 14)
  g.strokeStyle = 'rgba(255,255,255,0.08)'
  g.lineWidth = 1.5
  g.stroke()
  // title bar
  g.save()
  roundRect(g, x, y, w, 34, [14, 14, 0, 0])
  g.fillStyle = '#1a1b20'
  g.fill()
  g.restore()
  ;['#ff5f57', '#febc2e', '#28c840'].forEach((c, i) => {
    g.beginPath()
    g.arc(x + 22 + i * 20, y + 17, 6, 0, Math.PI * 2)
    g.fillStyle = c
    g.fill()
  })
  g.font = `600 15px ${FONT}`
  g.fillStyle = '#d9d4ca'
  g.textAlign = 'center'
  g.textBaseline = 'middle'
  g.fillText(title, x + w / 2, y + 18)
  g.fillStyle = accent
  g.fillRect(x + w - 60, y + 15, 40, 4)
  g.textAlign = 'left'
}

/** Clip to a window's content area and run `fn` inside it. */
function inside(g, x, y, w, h, fn) {
  g.save()
  roundRect(g, x, y + 34, w, h - 34, [0, 0, 14, 14])
  g.clip()
  fn(x, y + 34, w, h - 34)
  g.restore()
}

export function createWorkScreen({ brands, pages, reels, films }) {
  const canvas = document.createElement('canvas')
  canvas.width = W
  canvas.height = H
  const g = canvas.getContext('2d')
  const texture = new CanvasTexture(canvas)
  texture.colorSpace = SRGBColorSpace
  texture.anisotropy = 8

  const brandImgs = brands.map((b) => ({ ...b, img: load(b.logo) }))
  const pageImgs = pages.map((p) => ({ ...p, img: load(p.logo) }))
  const reelImgs = reels.map((r) => load(r.image))
  const filmImgs = films.map((f, i) => ({
    ...f,
    img: load(`https://i.ytimg.com/vi/${f.youtubeId}/hqdefault.jpg`, reels[i % reels.length].image),
  }))

  function menubar(t) {
    g.fillStyle = 'rgba(8,9,11,0.9)'
    g.fillRect(0, 0, W, 28)
    g.font = `600 14px ${FONT}`
    g.fillStyle = '#ece6da'
    g.textBaseline = 'middle'
    g.fillText('●  Tushar KB — Portfolio', 18, 14)
    g.font = `500 12px ${MONO}`
    g.fillStyle = '#8d8a84'
    const secs = Math.floor(t)
    const clock = `${String(21 + Math.floor(secs / 3600) % 3).padStart(2, '0')}:${String(Math.floor(secs / 60) % 60).padStart(2, '0')}`
    g.textAlign = 'right'
    g.fillText(`EDIT · COLOUR · DELIVER    ${clock}`, W - 18, 14)
    g.textAlign = 'left'
  }

  function clients(t) {
    const x = 24
    const y = 44
    const w = W - 48
    const h = 226
    windowFrame(g, x, y, w, h, 'Clients — brands & pages I’ve made work for', '#ffb27a')
    inside(g, x, y, w, h, (cx, cy, cw) => {
      // Row 1: brand logos on light tiles, sliding left.
      const tw = 168
      const gap = 16
      const span = brandImgs.length * (tw + gap)
      const off = (t * 55) % span
      for (let k = -1; k <= Math.ceil(cw / span) + 1; k++) {
        brandImgs.forEach((b, i) => {
          const bx = cx + 16 + k * span + i * (tw + gap) - off
          if (bx > cx + cw || bx + tw < cx) return
          roundRect(g, bx, cy + 14, tw, 84, 10)
          g.fillStyle = '#f4f1ea'
          g.fill()
          drawFit(g, b.img, bx + 16, cy + 22, tw - 32, 68, 'contain')
        })
      }
      // Row 2: page avatars with names, sliding right.
      const pw = 236
      const pspan = pageImgs.length * pw
      const poff = (t * 38) % pspan
      for (let k = -1; k <= Math.ceil(cw / pspan) + 1; k++) {
        pageImgs.forEach((p, i) => {
          const px = cx + k * pspan + i * pw + poff - pspan
          if (px > cx + cw || px + pw < cx) return
          g.save()
          g.beginPath()
          g.arc(px + 44, cy + 148, 30, 0, Math.PI * 2)
          g.clip()
          drawFit(g, p.img, px + 14, cy + 118, 60, 60)
          g.restore()
          g.font = `600 17px ${FONT}`
          g.fillStyle = '#ece6da'
          g.textBaseline = 'middle'
          g.fillText(p.name, px + 86, cy + 140)
          g.font = `500 11px ${MONO}`
          g.fillStyle = '#8d8a84'
          g.fillText('INSTAGRAM PAGE', px + 86, cy + 160)
        })
      }
    })
  }

  function reelsWindow(t) {
    const x = 24
    const y = 286
    const w = 592
    const h = H - y - 20
    windowFrame(g, x, y, w, h, 'Reels — @nottusharr', '#e4405f')
    inside(g, x, y, w, h, (cx, cy, cw, ch) => {
      const cols = 3
      const gap = 14
      const tw = (cw - gap * (cols + 1)) / cols
      const th = tw * (16 / 9)
      const span = reelImgs.length * (th + gap)
      for (let c = 0; c < cols; c++) {
        const speed = 34 + c * 9
        const off = (t * speed + c * 140) % span
        for (let k = -1; k <= Math.ceil(ch / span) + 1; k++) {
          reelImgs.forEach((img, i) => {
            const ry = cy + gap + k * span + i * (th + gap) - off
            if (ry > cy + ch || ry + th < cy) return
            const rx = cx + gap + c * (tw + gap)
            g.save()
            roundRect(g, rx, ry, tw, th, 10)
            g.clip()
            drawFit(g, reelImgs[(i + c * 2) % reelImgs.length], rx, ry, tw, th)
            const grad = g.createLinearGradient(0, ry + th * 0.6, 0, ry + th)
            grad.addColorStop(0, 'rgba(0,0,0,0)')
            grad.addColorStop(1, 'rgba(0,0,0,0.65)')
            g.fillStyle = grad
            g.fillRect(rx, ry, tw, th)
            g.restore()
            g.font = `500 11px ${MONO}`
            g.fillStyle = '#ece6da'
            g.fillText('▶ REEL', rx + 10, ry + th - 14)
          })
        }
      }
    })
  }

  function filmsWindow(t) {
    const x = 632
    const y = 286
    const w = W - x - 24
    const h = H - y - 20
    windowFrame(g, x, y, w, h, 'YouTube — films, music videos & podcasts', '#ff3b30')
    inside(g, x, y, w, h, (cx, cy, cw, ch) => {
      const cols = 2
      const gap = 18
      const tw = (cw - gap * (cols + 1)) / cols
      const th = tw * (9 / 16)
      const cardH = th + 62
      const rows = Math.ceil(filmImgs.length / cols)
      const span = rows * (cardH + gap)
      const off = (t * 26) % span
      for (let k = -1; k <= Math.ceil(ch / span) + 1; k++) {
        filmImgs.forEach((f, i) => {
          const fx = cx + gap + (i % cols) * (tw + gap)
          const fy = cy + gap + k * span + Math.floor(i / cols) * (cardH + gap) - off
          if (fy > cy + ch || fy + cardH < cy) return
          g.save()
          roundRect(g, fx, fy, tw, th, 10)
          g.clip()
          drawFit(g, f.img, fx, fy, tw, th)
          g.restore()
          // play badge
          roundRect(g, fx + tw / 2 - 30, fy + th / 2 - 21, 60, 42, 12)
          g.fillStyle = 'rgba(255,0,0,0.88)'
          g.fill()
          g.beginPath()
          g.moveTo(fx + tw / 2 - 8, fy + th / 2 - 11)
          g.lineTo(fx + tw / 2 + 12, fy + th / 2)
          g.lineTo(fx + tw / 2 - 8, fy + th / 2 + 11)
          g.fillStyle = '#fff'
          g.fill()
          g.font = `600 17px ${FONT}`
          g.fillStyle = '#ece6da'
          g.textBaseline = 'alphabetic'
          const title = f.title.length > 44 ? `${f.title.slice(0, 43)}…` : f.title
          g.fillText(title, fx + 2, fy + th + 26)
          g.font = `500 11px ${MONO}`
          g.fillStyle = '#8d8a84'
          g.fillText(f.tags.join(' · ').toUpperCase(), fx + 2, fy + th + 48)
        })
      }
    })
  }

  function draw(t) {
    const bg = g.createLinearGradient(0, 0, W, H)
    bg.addColorStop(0, '#15171c')
    bg.addColorStop(1, '#07080a')
    g.fillStyle = bg
    g.fillRect(0, 0, W, H)
    menubar(t)
    clients(t)
    reelsWindow(t)
    filmsWindow(t)
    texture.needsUpdate = true
  }

  draw(0)
  return { texture, draw, aspect: W / H }
}
