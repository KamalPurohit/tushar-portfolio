import { banner, mailto } from '../content/site.js'

/* Full-bleed notice band — cream on near-black, never tinted. */
export function Banner() {
  return (
    <div className="border-b border-surface-25">
      <p className="mx-auto max-w-(--container-page) px-6 py-2.5 text-center text-caption text-surface-50">
        {banner.text}{' '}
        <a href={mailto} className="text-shockingly-green transition-opacity hover:opacity-80">
          {banner.linkLab}
        </a>
      </p>
    </div>
  )
}
