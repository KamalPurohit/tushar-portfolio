/* The film's running order, in *story time*. Scroll maps linearly onto
   story time 0 → STORY_END; every scroll-driven animation in the scene is
   keyed to these ranges. (Story time runs past 1 because "The Work" was
   inserted before the ending without re-timing the chapters around it.) */

export const STORY_END = 1.16

export const CHAPTERS = [
  { id: 'hero', index: '01', label: 'The Person', start: 0, end: 0.17 },
  { id: 'cinematographer', index: '02', label: 'The Camera', start: 0.17, end: 0.42 },
  { id: 'editor', index: '03', label: 'The Edit', start: 0.42, end: 0.64 },
  { id: 'social', index: '04', label: 'The Audience', start: 0.64, end: 0.84 },
  { id: 'work', index: '05', label: 'The Work', start: 0.84, end: 1.0 },
  { id: 'contact', index: '06', label: 'The Story', start: 1.0, end: STORY_END },
]

/** Total scroll length of the film, in viewport heights. */
export const FILM_LENGTH_VH = 1160

export const chapterAt = (p) =>
  CHAPTERS.find((c) => p >= c.start && p < c.end) ?? CHAPTERS[CHAPTERS.length - 1]
