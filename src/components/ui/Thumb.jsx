import { useState } from 'react'
import { Blob } from './Blob.jsx'

const ACCENTS = ['pink', 'orangey', 'lilac', 'blue', 'green']

/* Image with a graceful fallback: if the file is missing (the reel stills are
   not in the repo yet), it renders generated gradient art instead of a broken
   image, keyed off the index so each tile stays distinct. */
export function Thumb({ src, alt, index = 0, className = '' }) {
  const [failed, setFailed] = useState(!src)
  const accent = ACCENTS[index % ACCENTS.length]

  if (failed) {
    return (
      <div className={`grid place-items-center overflow-hidden bg-off-black ${className}`}>
        <Blob shape="blob" accent={accent} className="w-3/5 opacity-90" />
      </div>
    )
  }

  return (
    <img
      src={src}
      alt={alt}
      loading="lazy"
      onError={() => setFailed(true)}
      className={`object-cover ${className}`}
    />
  )
}
