import { projects, reels, meta } from '../content/site.js'
import { Section, Bracket, Tag, Hairline, Reveal, PillButton, ArrowUpRight } from './ui/Primitives.jsx'
import { Thumb } from './ui/Thumb.jsx'

export function Work() {
  return (
    <Section id="work">
      <Reveal>
        <Bracket>Portfolio</Bracket>
        <h2 className="mt-6 max-w-3xl text-balance text-heading font-semibold text-surface-cream">
          Check out my featured projects
        </h2>
      </Reveal>

      {/* Showcase grid — 8px radius, 24px gaps, no borders, no elevation. */}
      <div className="mt-16 grid gap-6 md:grid-cols-2">
        {projects.map((p, i) => (
          <Reveal key={p.title} delay={(i % 2) * 0.08}>
            <ProjectCard project={p} />
          </Reveal>
        ))}
      </div>

      <div className="mt-24">
        <Reveal>
          <h3 className="text-subheading font-semibold text-surface-cream">Short-form &amp; reels</h3>
        </Reveal>
        <Hairline className="mt-6 mb-6" />

        <div className="grid grid-cols-2 gap-6 md:grid-cols-3">
          {reels.map((r, i) => (
            <Reveal key={r.href} delay={(i % 3) * 0.06}>
              <ReelCard reel={r} index={i} />
            </Reveal>
          ))}
        </div>
      </div>

      <div className="mt-16 flex justify-center">
        <PillButton href={meta.moreWorkUrl}>View More Work</PillButton>
      </div>
    </Section>
  )
}

function ProjectCard({ project }) {
  return (
    <article className="group relative flex h-full flex-col overflow-hidden rounded-cards bg-off-black">
      <div className="relative aspect-video overflow-hidden bg-just-black">
        <img
          src={`https://img.youtube.com/vi/${project.youtubeId}/maxresdefault.jpg`}
          alt={`${project.title} thumbnail`}
          loading="lazy"
          className="size-full object-cover transition-transform duration-700 group-hover:scale-[1.04]"
        />
        <span className="absolute inset-0 bg-just-black/0 transition-colors duration-500 group-hover:bg-just-black/20" />
      </div>

      <div className="flex flex-1 flex-col p-6">
        <h3 className="flex items-start gap-2 text-subheading font-semibold text-surface-cream">
          <a href={project.href} target="_blank" rel="noreferrer noopener" className="after:absolute after:inset-0">
            {project.title}
          </a>
          <ArrowUpRight className="mt-1.5 size-5 shrink-0 text-surface-50 transition-colors group-hover:text-surface-cream" />
        </h3>

        <p className="mt-3 text-body-sm text-surface-50">{project.client}</p>

        <ul className="mt-5 flex flex-wrap gap-2">
          {project.tags.map((t) => (
            <li key={t}><Tag>{t}</Tag></li>
          ))}
        </ul>

        <p className="mt-5 text-pretty text-body-sm leading-[1.5] text-surface-50">
          {project.summary}
        </p>
      </div>
    </article>
  )
}

function ReelCard({ reel, index }) {
  return (
    <article className="group relative overflow-hidden rounded-cards bg-off-black">
      <div className="relative aspect-[9/16] overflow-hidden">
        <Thumb
          src={reel.image}
          alt={`${reel.title} still`}
          index={index}
          className="size-full transition-transform duration-700 group-hover:scale-[1.04]"
        />
      </div>

      <div className="p-4">
        <h4 className="flex items-start gap-1.5 text-body-sm text-surface-cream">
          <a href={reel.href} target="_blank" rel="noreferrer noopener" className="after:absolute after:inset-0">
            {reel.title}
          </a>
          <ArrowUpRight className="mt-0.5 size-3.5 shrink-0 text-surface-50" />
        </h4>
        <ul className="mt-3 flex flex-wrap gap-1.5">
          {reel.tags.map((t) => (
            <li key={t}><Tag>{t}</Tag></li>
          ))}
        </ul>
      </div>
    </article>
  )
}
