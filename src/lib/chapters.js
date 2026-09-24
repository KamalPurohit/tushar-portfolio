/* The film's running order. Every scroll-driven animation on the page is
   keyed to these ranges of overall progress (0 → 1). */

export const CHAPTERS = [
  { id: 'hero', index: '01', label: 'The Person', start: 0, end: 0.17 },
  { id: 'cinematographer', index: '02', label: 'The Camera', start: 0.17, end: 0.42 },
  { id: 'editor', index: '03', label: 'The Edit', start: 0.42, end: 0.64 },
  { id: 'social', index: '04', label: 'The Audience', start: 0.64, end: 0.84 },
  { id: 'contact', index: '05', label: 'The Story', start: 0.84, end: 1 },
]

/** Total scroll length of the film, in viewport heights. */
export const FILM_LENGTH_VH = 1000

export const chapterAt = (p) =>
  CHAPTERS.find((c) => p >= c.start && p < c.end) ?? CHAPTERS[CHAPTERS.length - 1]
