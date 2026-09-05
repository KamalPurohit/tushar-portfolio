import { motion } from 'framer-motion'

/* The site's recurring typographic signature: every section is introduced by
   a literal curly-bracket pair. */
export function Bracket({ children, className = '' }) {
  return (
    <p className={`text-body-sm text-surface-cream ${className}`}>
      <span className="text-surface-50">{'{ '}</span>
      {children}
      <span className="text-surface-50">{' }'}</span>
    </p>
  )
}

/* Outlined cream pill — the default control. Never filled with colour. */
export function PillButton({ href, children, gradient = false, className = '', ...rest }) {
  const external = href?.startsWith('http') || href?.startsWith('mailto:')
  const base =
    'inline-flex items-center gap-2 rounded-buttons px-6 py-[15px] text-[18px] font-semibold leading-[1.05] text-surface-cream transition-opacity duration-300 hover:opacity-80'

  return (
    <a
      href={href}
      {...(href?.startsWith('http') ? { target: '_blank', rel: 'noreferrer noopener' } : null)}
      className={`${base} ${gradient ? 'cta-gradient-border' : 'border border-surface-cream'} ${className}`}
      {...rest}
    >
      {children}
      {external && <ArrowUpRight />}
    </a>
  )
}

export function ArrowUpRight({ className = 'size-4' }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor"
      strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M7 17L17 7M9 7h8v8" />
    </svg>
  )
}

/* Full-width hairline divider, no padding around it. */
export function Hairline({ className = '' }) {
  return <hr className={`border-0 border-t border-surface-25 ${className}`} />
}

/* Small tag used on work cards. */
export function Tag({ children }) {
  return (
    <span className="rounded-cards border border-surface-25 px-2.5 py-1 text-caption text-surface-50">
      {children}
    </span>
  )
}

/* Scroll-triggered reveal. Content is animated as an enhancement only —
   `whileInView` with `once` leaves it permanently visible after firing. */
export function Reveal({ children, delay = 0, className = '' }) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 28 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.15, margin: '0px 0px -60px 0px' }}
      transition={{ duration: 0.7, delay, ease: [0.16, 1, 0.3, 1] }}
    >
      {children}
    </motion.div>
  )
}

/* Page section: 1280px max-width, generous vertical rhythm. */
export function Section({ id, children, className = '' }) {
  return (
    <section id={id} className={`mx-auto w-full max-w-(--container-page) px-6 py-20 md:py-[108px] ${className}`}>
      {children}
    </section>
  )
}
