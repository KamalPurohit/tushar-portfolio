import { motion } from 'framer-motion'
import { hero, stats, meta, mailto } from '../content/site.js'
import { Bracket, PillButton, Hairline } from './ui/Primitives.jsx'
import { Blob, HeroWash } from './ui/Blob.jsx'

const EASE = [0.16, 1, 0.3, 1]

export function Hero() {
  return (
    <section id="top" className="relative overflow-hidden">
      <HeroWash />

      {/* Headline is allowed to bleed toward the viewport edge — no narrow
          container, and the decorative blob overlaps the type. */}
      <div className="mx-auto max-w-(--container-page) px-6 pb-16 pt-16 md:pb-24 md:pt-24">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: EASE }}
        >
          <Bracket>{hero.eyebrow}</Bracket>
        </motion.div>

        <div className="relative mt-8">
          {/* 3D dome overlapping the right edge of the headline block. */}
          <Blob
            shape="dome"
            accent="pink"
            className="pointer-events-none absolute -right-8 -top-16 -z-10 w-[38vw] max-w-[26rem] opacity-70 md:-right-4 md:-top-24"
          />

          <h1 className="text-display font-semibold text-surface-cream">
            {hero.lines.map((line, i) => (
              <span key={line} className="block overflow-hidden">
                <motion.span
                  className="block"
                  initial={{ y: '105%' }}
                  animate={{ y: '0%' }}
                  transition={{ duration: 1, delay: 0.1 + i * 0.1, ease: EASE }}
                >
                  {line}
                </motion.span>
              </span>
            ))}
          </h1>
        </div>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4, ease: EASE }}
          className="mt-10 max-w-2xl text-pretty text-body-lg text-surface-50"
        >
          {hero.intro}
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.5, ease: EASE }}
          className="mt-10 flex flex-wrap items-center gap-3"
        >
          <PillButton href="#work">My Works</PillButton>
          <PillButton href={mailto} gradient>Let’s Work Together</PillButton>
        </motion.div>
      </div>

      <div className="mx-auto max-w-(--container-page) px-6">
        <Hairline />
        <motion.dl
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.6 }}
          className="grid grid-cols-3 divide-x divide-surface-25"
        >
          {stats.map((s) => (
            <div key={s.label} className="px-2 py-8 text-center first:pl-0 last:pr-0 md:py-12">
              <dt className="sr-only">{s.label}</dt>
              <dd>
                <span className="block text-heading-sm font-semibold text-surface-cream">{s.value}</span>
                <span className="mt-2 block text-caption text-surface-50">{s.label}</span>
              </dd>
            </div>
          ))}
        </motion.dl>
        <Hairline />
      </div>
    </section>
  )
}
