import { useEffect, useRef, useState } from 'react'
import { motion, useMotionValueEvent, useScroll, useTransform } from 'framer-motion'
import { CHAPTERS, chapterAt } from '../lib/chapters'
import { scrollToChapter } from '../lib/scroll'
import { brands, film, mailto, meta, projects } from '../content/site'

/* Everything readable sits in the DOM, above the canvas: fixed layers whose
   opacity and drift are driven by the same scroll progress as the film. */

/** Fade in over [a, b], hold, fade out over [c, d]; drift up as it goes. */
function useBeat(progress, [a, b, c, d], { from = 0, to = 0 } = {}) {
  const opacity = useTransform(progress, [a, b, c, d], [from, 1, 1, to])
  const y = useTransform(progress, [a, b, c, d], [40 * (1 - from), 0, 0, -40 * (1 - to)])
  const pointerEvents = useTransform(opacity, (o) => (o > 0.6 ? 'auto' : 'none'))
  const visibility = useTransform(opacity, (o) => (o < 0.01 ? 'hidden' : 'visible'))
  return { opacity, y, pointerEvents, visibility }
}

function TopBar({ progress }) {
  const [chapter, setChapter] = useState(CHAPTERS[0])
  useMotionValueEvent(progress, 'change', (p) => {
    const c = chapterAt(p)
    setChapter((prev) => (prev.id === c.id ? prev : c))
  })
  return (
    <header className="topbar">
      <button className="brand" onClick={() => scrollToChapter('hero')}>
        {meta.name}
      </button>
      <div className="chapter-now" aria-live="polite">
        <span className="mono">{chapter.index}</span>
        <span className="chapter-now__rule" />
        <span>{chapter.label}</span>
      </div>
      <a className="talk" href={mailto}>
        Let&rsquo;s talk <span aria-hidden>↗</span>
      </a>
    </header>
  )
}

function Rail({ progress }) {
  const scaleY = useTransform(progress, [0, 1], [0, 1])
  return (
    <nav className="rail" aria-label="Chapters">
      <div className="rail__track">
        <motion.div className="rail__fill" style={{ scaleY }} />
      </div>
      {CHAPTERS.map((c) => (
        <button
          key={c.id}
          className="rail__tick"
          style={{ top: `${c.start * 100}%` }}
          onClick={() => scrollToChapter(c.id)}
          aria-label={`${c.index} ${c.label}`}
        >
          <span className="rail__label">{c.label}</span>
        </button>
      ))}
    </nav>
  )
}

/** Viewfinder furniture: frame corners, REC + timecode, lens data. */
function Hud({ progress }) {
  const tc = useRef()
  const lens = useRef()
  useEffect(() => {
    let raf
    const tick = (now) => {
      const p = progress.get()
      const total = Math.floor(p * 180 * 24) + Math.floor((now / 1000) * 24) % 24
      const f = total % 24
      const s = Math.floor(total / 24)
      const pad = (n) => String(n).padStart(2, '0')
      if (tc.current) tc.current.textContent = `01:${pad(Math.floor(s / 60))}:${pad(s % 60)}:${pad(f)}`
      if (lens.current) {
        const c = chapterAt(p).id
        const text = {
          hero: '50MM · T1.5 · ISO 800',
          cinematographer: '35MM · T2.1 · 172.8°',
          editor: 'TIMELINE · 23.976 FPS',
          social: '24MM · T2.8 · ISO 1280',
          contact: '85MM · T1.8 · ISO 640',
        }[c]
        if (lens.current.textContent !== text) lens.current.textContent = text
      }
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [progress])
  return (
    <div className="hud" aria-hidden="true">
      <span className="hud__corner hud__corner--tl" />
      <span className="hud__corner hud__corner--tr" />
      <span className="hud__corner hud__corner--bl" />
      <span className="hud__corner hud__corner--br" />
      <div className="hud__rec mono">
        <span className="hud__dot" /> REC <span ref={tc}>01:00:00:00</span>
      </div>
      <div className="hud__lens mono" ref={lens} />
    </div>
  )
}

/** Letterbox bars close in briefly at every chapter change — a cut. */
function Letterbox({ progress }) {
  const h = useTransform(progress, (p) => {
    let v = 0
    for (const c of CHAPTERS.slice(1)) {
      const d = Math.abs(p - c.start)
      v = Math.max(v, Math.max(0, 1 - d / 0.03))
    }
    return `${v * v * 7}vh`
  })
  return (
    <>
      <motion.div className="letterbox letterbox--top" style={{ height: h }} />
      <motion.div className="letterbox letterbox--bottom" style={{ height: h }} />
    </>
  )
}

function Hero({ progress }) {
  const beat = useBeat(progress, [0, 0.001, 0.07, 0.13], { from: 1 })
  const hint = useTransform(progress, [0, 0.03], [1, 0])
  const [r1, r2, r3] = film.hero.roles
  const rise = (i) => ({
    initial: { opacity: 0, y: 30, filter: 'blur(8px)' },
    animate: { opacity: 1, y: 0, filter: 'blur(0px)' },
    transition: { delay: 1.9 + i * 0.18, duration: 1.2, ease: [0.2, 0.7, 0.2, 1] },
  })
  return (
    <motion.section className="hero" style={beat} aria-labelledby="hero-title">
      <h1 id="hero-title" className="sr-only">
        {meta.name} — {film.hero.roles.join(', ')}
      </h1>
      <motion.p className="hero__role hero__role--a" {...rise(0)}>
        {r1}
      </motion.p>
      <motion.p className="hero__role hero__role--b" {...rise(1)}>
        {r2}
      </motion.p>
      <motion.p className="hero__role hero__role--c" {...rise(2)}>
        {r3}
      </motion.p>
      <motion.p className="hero__line serif" {...rise(3)}>
        {film.hero.line}
      </motion.p>
      <motion.div className="scroll-hint mono" style={{ opacity: hint }}>
        Scroll to explore <span className="scroll-hint__arrow">↓</span>
      </motion.div>
    </motion.section>
  )
}

function Chapter({ progress, range, index, title, line, notes, align = 'left' }) {
  const beat = useBeat(progress, range)
  return (
    <motion.section className={`chapter chapter--${align}`} style={beat}>
      <p className="eyebrow mono">
        {index} <span className="eyebrow__rule" />
      </p>
      <h2 className="chapter__title">{title}</h2>
      <p className="chapter__line serif">&ldquo;{line}&rdquo;</p>
      {notes && (
        <ul className="chapter__notes mono">
          {notes.map((n) => (
            <li key={n}>{n}</li>
          ))}
        </ul>
      )}
    </motion.section>
  )
}

function Contact({ progress }) {
  const beat = useBeat(progress, [0.87, 0.93, 0.999, 1], { to: 1 })
  return (
    <motion.section className="contact" style={beat} id="contact" aria-labelledby="contact-title">
      <div className="contact__main">
        <p className="eyebrow mono">
          05 <span className="eyebrow__rule" /> The Story
        </p>
        <h2 id="contact-title" className="contact__title">
          {film.contact.title} <span className="serif">{film.contact.titleAccent}</span>
        </h2>
        <a className="contact__email" href={mailto}>
          {meta.email}
        </a>
        <ul className="contact__links mono">
          <li>
            <a href={meta.phoneHref}>{meta.phone}</a>
          </li>
          <li>
            <a href={meta.instagram} target="_blank" rel="noreferrer">
              Instagram ↗
            </a>
          </li>
          <li>
            <a href={meta.locationMap} target="_blank" rel="noreferrer">
              {meta.location}
            </a>
          </li>
          <li>
            <a href={meta.moreWorkUrl} target="_blank" rel="noreferrer">
              Full work list ↗
            </a>
          </li>
        </ul>
      </div>
      <div className="credits">
        <p className="eyebrow mono">Selected work</p>
        <ol>
          {projects.map((p) => (
            <li key={p.youtubeId}>
              <a href={p.href} target="_blank" rel="noreferrer">
                <span className="credits__title">{p.title}</span>
                <span className="credits__meta mono">{p.tags.join(' · ')}</span>
              </a>
            </li>
          ))}
        </ol>
        <p className="eyebrow mono credits__brands-label">Worked with</p>
        <p className="credits__brands">{brands.map((b) => b.name).join('  ·  ')}</p>
      </div>
      <p className="contact__foot mono">
        © {new Date().getFullYear()} {meta.name} — shot, cut &amp; delivered from {meta.location}
      </p>
    </motion.section>
  )
}

export default function Overlay() {
  const { scrollYProgress: progress } = useScroll()
  return (
    <div className="overlay">
      <Letterbox progress={progress} />
      <Hud progress={progress} />
      <TopBar progress={progress} />
      <Rail progress={progress} />
      <Hero progress={progress} />
      <Chapter
        progress={progress}
        range={[0.24, 0.28, 0.38, 0.415]}
        index="02 — The Camera"
        title={film.cinematographer.title}
        line={film.cinematographer.line}
        notes={film.cinematographer.notes}
      />
      <Chapter
        progress={progress}
        range={[0.47, 0.5, 0.6, 0.635]}
        index="03 — The Edit"
        title={film.editor.title}
        line={film.editor.line}
        notes={film.editor.notes}
        align="right"
      />
      <Chapter
        progress={progress}
        range={[0.68, 0.71, 0.79, 0.83]}
        index="04 — The Audience"
        title={film.social.title}
        line={film.social.line}
        notes={['Hover an icon', 'Scroll to scatter']}
      />
      <Contact progress={progress} />
    </div>
  )
}
