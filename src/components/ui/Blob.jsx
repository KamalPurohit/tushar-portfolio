/* Soft 3D organic shapes — the design system's primary imagery.
   Depth comes entirely from multi-stop gradients and an internal specular
   highlight (lit from within), never from box-shadow. */

/* Each discipline's shape is dominated by its own hue, graduating from a
   lighter tint into a deeper one. The taxonomy only reads if the illustration
   matches the label colour, so `mid` is always the discipline's exact token. */
const PALETTE = {
  pink:    { from: '#ffe3fd', mid: '#fec5fb', to: '#c86ff0' },
  orangey: { from: '#ffc46a', mid: '#ff8709', to: '#e8500c' },
  lilac:   { from: '#c8c3ff', mid: '#9d95ff', to: '#6b5ce0' },
  blue:    { from: '#7fe6f5', mid: '#00bae2', to: '#0a7f9e' },
  green:   { from: '#abff84', mid: '#0ae448', to: '#07a836' },
}

/* Each shape is a closed path on a 200x200 canvas. */
const SHAPES = {
  dome: 'M100 14c47 0 86 39 86 86v52a34 34 0 0 1-34 34H48a34 34 0 0 1-34-34v-52C14 53 53 14 100 14Z',
  pill: 'M64 10h72a54 54 0 0 1 54 54v72a54 54 0 0 1-54 54H64a54 54 0 0 1-54-54V64A54 54 0 0 1 64 10Z',
  blob: 'M104 12c38-4 74 22 82 58s-10 76-40 96-72 22-98 0S12 108 22 74 66 16 104 12Z',
  wave: 'M100 10c50 0 90 40 90 90s-40 90-90 90c-34 0-52-22-52-48s26-34 26-58-30-30-30-56S72 10 100 10Z',
}

export function Blob({ shape = 'blob', accent = 'pink', className = '' }) {
  const { from, mid, to } = PALETTE[accent] ?? PALETTE.pink
  const uid = `blob-${shape}-${accent}`

  return (
    <svg
      viewBox="0 0 200 200"
      aria-hidden="true"
      className={className}
    >
      <defs>
        <linearGradient id={`${uid}-fill`} x1="0.1" y1="0" x2="0.9" y2="1">
          <stop offset="0%" stopColor={from} />
          <stop offset="48%" stopColor={mid} />
          <stop offset="100%" stopColor={to} />
        </linearGradient>

        {/* Ambient interior light, top-left, simulating a soft key source. */}
        <radialGradient id={`${uid}-light`} cx="0.3" cy="0.22" r="0.62">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.55" />
          <stop offset="60%" stopColor="#ffffff" stopOpacity="0.06" />
          <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
        </radialGradient>

        {/* Occlusion at the lower edge, keeping the form from floating flat. */}
        <radialGradient id={`${uid}-shade`} cx="0.68" cy="0.86" r="0.55">
          <stop offset="0%" stopColor="#0e100f" stopOpacity="0.42" />
          <stop offset="100%" stopColor="#0e100f" stopOpacity="0" />
        </radialGradient>

        <clipPath id={`${uid}-clip`}>
          <path d={SHAPES[shape] ?? SHAPES.blob} />
        </clipPath>
      </defs>

      <g clipPath={`url(#${uid}-clip)`}>
        <rect width="200" height="200" fill={`url(#${uid}-fill)`} />
        <rect width="200" height="200" fill={`url(#${uid}-shade)`} />
        <rect width="200" height="200" fill={`url(#${uid}-light)`} />
      </g>
    </svg>
  )
}

/* Large, heavily blurred colour washes that sit behind the hero type.
   Purely decorative — they overlap the headline rather than framing it. */
export function HeroWash() {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
      <div
        className="absolute -right-[10%] top-[4%] size-[38rem] rounded-full opacity-25 blur-[110px]"
        style={{ background: 'radial-gradient(circle, #fec5fb 0%, #00bae2 55%, transparent 72%)' }}
      />
      <div
        className="absolute -left-[14%] bottom-[2%] size-[32rem] rounded-full opacity-20 blur-[120px]"
        style={{ background: 'radial-gradient(circle, #0ae448 0%, #abff84 50%, transparent 72%)' }}
      />
      <div
        className="absolute right-[22%] bottom-[16%] size-[24rem] rounded-full opacity-[0.14] blur-[120px]"
        style={{ background: 'radial-gradient(circle, #9d95ff 0%, transparent 70%)' }}
      />
    </div>
  )
}
