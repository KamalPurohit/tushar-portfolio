/* ============================================================================
   SITE CONTENT — all copy lives here.
   Extracted from the existing tushar-kb-portfolio site.
   ========================================================================== */

export const meta = {
  name: 'Tushar KB',
  role: 'Filmmaker and Visual Creative',
  location: 'Bangalore, India',
  locationMap: 'https://maps.app.goo.gl/39XzdDpZWU5b1SfE8',
  email: 'nottusharr@gmail.com',
  phone: '+91 953-863-4399',
  phoneHref: 'tel:+919538634399',
  instagram: 'https://www.instagram.com/nottusharr/',
  moreWorkUrl:
    'https://docs.google.com/document/d/17Y9BDZh9Rng1VSAtnCP9HeITGKy4ypMJOWGhrG_rNWQ/edit?tab=t.0',
  description:
    'Tushar KB — filmmaker and visual creative creating bold, story-driven visuals for brands and creators.',
}

export const mailto = `mailto:${meta.email}?subject=Message%20from%20your%20site`

export const banner = {
  text: 'Available for freelance and full-time work',
  linkLab: "Let's talk",
}

export const nav = [
  { label: 'Work', href: '#work' },
  { label: 'Craft', href: '#craft' },
  { label: 'About', href: '#about' },
  { label: 'Contact', href: '#contact' },
]

export const hero = {
  eyebrow: "I'm Tushar KB",
  lines: ['Filmmaker', '& visual creative'],
  intro:
    'Four years across music videos, short films, live events, podcasts and ' +
    'branded content — directing on set, editing in post, and everything ' +
    'between.',
}

export const stats = [
  { value: '40+', label: 'Happy clients' },
  { value: '4+', label: 'Years of experience' },
  { value: '50+', label: 'Projects done' },
]

export const about = {
  eyebrow: 'About Me',
  title: 'Transforming complex ideas into compelling visuals',
  body: [
    'I’m Tushar, a self-taught filmmaker and visual creative with 4+ years of ' +
      'experience across music videos, short films, live events, podcasts, and ' +
      'branded content. From directing on set to editing in post, I’ve led ' +
      'end-to-end productions—including projects with Google and Karnataka’s ' +
      'leading podcast platform. I’ve also helped grow large digital pages and ' +
      'built marketing narratives that resonate.',
    'Adaptable and fast-moving, I work fluidly across formats and platforms, ' +
      'bringing clarity, pace, and a strong storytelling instinct to every ' +
      'project. Right now, I’m focused on creating bold, story-driven content ' +
      'that breaks through the noise and connects with real audiences.',
  ],
  details: [
    { label: 'Name', value: 'Tushar KB' },
    { label: 'Phone', value: '+91 953-863-4399', href: 'tel:+919538634399' },
    { label: 'Email', value: 'nottusharr@gmail.com', href: mailto },
    {
      label: 'Location',
      value: 'Bangalore, India',
      href: 'https://maps.app.goo.gl/39XzdDpZWU5b1SfE8',
    },
  ],
}

/* The design system's signature: one colour per discipline, never reused.
   `accent` maps to a token colour; `shape` picks the 3D illustration form.
   NOTE: these four blurbs are new copy written from the About section — worth
   a read-through before launch. */
export const disciplines = [
  {
    key: 'direction',
    label: 'Direction',
    accent: 'pink',
    shape: 'dome',
    title: 'Leading the set, start to finish',
    body:
      'Concept development through final delivery — directing crews, shaping ' +
      'the visual language of a shoot, and keeping a production moving without ' +
      'losing the story underneath it.',
  },
  {
    key: 'cinematography',
    label: 'Cinematography',
    accent: 'orangey',
    shape: 'pill',
    title: 'Operating the camera myself',
    body:
      'Music videos, podcasts, live events and branded work — shot hands-on, ' +
      'with an eye for the frame that carries the moment rather than just ' +
      'covering it.',
  },
  {
    key: 'editing',
    label: 'Editing',
    accent: 'lilac',
    shape: 'blob',
    title: 'Finding the cut in post',
    body:
      'Edit, colour grade and finish. Long-form podcast episodes, short-form ' +
      'reels and promotional films — built for the pace each platform ' +
      'actually rewards.',
  },
  {
    key: 'content',
    label: 'Content & Social',
    accent: 'blue',
    shape: 'wave',
    title: 'Growing pages from the ground up',
    body:
      'Helped take a Kannada podcast from zero to 75,000+ subscribers — ' +
      'thumbnails, pre-production, reels and rollout, plus creative work for ' +
      'some of India’s largest digital pages.',
  },
]

/* Featured video work. YouTube thumbnails are served from img.youtube.com. */
export const projects = [
  {
    title: 'Illade Neenu',
    client: 'Kannada Film Community (Indie Project)',
    youtubeId: 'CN3gLiGeWEE',
    href: 'https://www.youtube.com/watch?v=CN3gLiGeWEE',
    tags: ['Directed', 'Shot', 'Edited'],
    summary:
      'Directed, shot, and edited a music video for the Kannada Film Community, ' +
      'an independent platform run by close collaborators. A complete creative ' +
      'endeavour handled from concept development to final delivery.',
    featured: true,
  },
  {
    title: 'KFC Interval Ep. 1: EKKA Fever with Yuva Rajkumar',
    client: 'Kannada Film Community',
    youtubeId: 'eHCAHMHoo2k',
    href: 'https://www.youtube.com/watch?v=eHCAHMHoo2k',
    tags: ['Shot', 'Edited'],
    summary:
      'Directed and shot a podcast series for the Kannada Film Community, ' +
      'overseeing the visual language and execution to align with the ' +
      'platform’s indie, culturally rooted identity.',
    featured: true,
  },
  {
    title: 'Rap, Maatu mathe Fifa with @BrodhaV',
    client: 'Kannada’s Leading Podcast Channel',
    youtubeId: '8evvtkCSQHY',
    href: 'https://www.youtube.com/watch?v=8evvtkCSQHY',
    tags: ['Shot', 'Edited'],
    summary:
      'An integral part of building one of Karnataka’s biggest Kannada ' +
      'podcasts from the ground up — 0 to 75,000+ subscribers. Thumbnails, ' +
      'pre-production, shooting, editing, reels and overall creative ' +
      'production.',
    featured: true,
  },
  {
    title: 'Rise Of Kshetrapathi',
    client: 'Promotional Music Video — released on Anand Audio',
    youtubeId: 'tNwOW5xP5K0',
    href: 'https://www.youtube.com/watch?v=tNwOW5xP5K0',
    tags: ['Directed', 'Shot', 'Edited', 'Graded'],
    summary:
      'Directed, shot, edited and colour-graded a promotional music video for ' +
      'a Kannada feature film, released under Anand Audio — one of ' +
      'Karnataka’s biggest music labels.',
    featured: true,
  },
]

/* Vertical short-form work. Stills live in /public/thumbnail/.
   Link targets are carried over from the previous site, which mapped these
   filenames to these reels. `href: ''` renders an unlinked tile. */
export const reels = [
  {
    title: 'Reel for @solocreators.app',
    href: 'https://www.instagram.com/reel/DDhMOoCyO44/',
    image: '/thumbnail/insta1.jpg',
    tags: ['Shot', 'Edited'],
  },
  {
    title: 'Reel for @solocreators.app',
    href: 'https://www.instagram.com/reel/DDwqfLByDKh/',
    image: '/thumbnail/insta2.jpg',
    tags: ['Shot', 'Edited'],
  },
  {
    title: 'Reel for @solocreators.app',
    href: 'https://www.instagram.com/reel/DGF5s9fyCdU/',
    image: '/thumbnail/insta3.jpg',
    tags: ['Shot', 'Edited'],
  },
  {
    title: 'Reel for @atherenergy',
    href: 'https://www.instagram.com/reel/DFRvI_8zvE4/',
    image: '/thumbnail/insta4.jpg',
    tags: ['Shot', 'Edited'],
  },
  {
    title: 'Reel for @solocreators.app',
    href: 'https://www.instagram.com/reel/C9H-GzbtZ82/',
    image: '/thumbnail/insta5.jpg',
    tags: ['Shot', 'Edited'],
  },
  {
    title: 'Reel for @poweredbyada',
    href: 'https://www.instagram.com/reel/C7TtjUtNBsU/',
    image: '/thumbnail/insta6.jpg',
    tags: ['Shot', 'Edited'],
  },
  {
    // TODO: no link — this still was not on the previous site. Add the reel
    // URL and a real title, or delete this entry.
    title: 'Short-form reel',
    href: '',
    image: '/thumbnail/insta7.jpg',
    tags: ['Shot', 'Edited'],
  },
]

/* Logo files live in /public/brandlogos/ — paths are lowercase to match the
   directory exactly, since Netlify's filesystem is case-sensitive. A missing
   file falls back to the brand name as a cream wordmark. */
export const brands = [
  { name: 'Google', logo: '/brandlogos/google.png' },
  { name: 'Meesho', logo: '/brandlogos/meesho.png' },
  { name: 'BGMI', logo: '/brandlogos/bgmi.jpg' },
  { name: 'Prime Video', logo: '/brandlogos/primevideo.png' },
  { name: 'Rapido', logo: '/brandlogos/rapido.jpg' },
  { name: 'Flipkart', logo: '/brandlogos/flipkart.png' },
  { name: 'Ather', logo: '/brandlogos/ather.png' },
  { name: 'Jio Hotstar', logo: '/brandlogos/jiohotstar.webp' },
  { name: 'Azadi Records', logo: '/brandlogos/azadi.png' },
  { name: 'Ajio', logo: '/brandlogos/ajio.png' },
  { name: 'New Me', logo: '/brandlogos/newme.jpg' },
  { name: 'Durex', logo: '/brandlogos/durex.png' },
]

/* Instagram pages — these are profile pictures, so they render as circles.
   Note durex.jpg here is the "Thank you Durex" page, distinct from the Durex
   brand logo (durex.png) above. */
export const pages = [
  { name: 'ScoopWhoop', logo: '/brandlogos/scoopwhoop.png', round: true },
  { name: 'Solo', logo: '/brandlogos/solo.jpg', round: true },
  { name: 'ThankYou Durex', logo: '/brandlogos/durex.jpg', round: true },
  { name: 'Powered By Ada', logo: '/brandlogos/ada.jpg', round: true },
  { name: 'OkTested by SW', logo: '/brandlogos/oktested.jpg', round: true },
  { name: 'AdParody', logo: '/brandlogos/adparody.jpg', round: true },
]

export const contact = {
  eyebrow: 'Contact',
  title: "Let's make something awesome together!",
  teaser:
    'Want to know more about me, tell me about your project, or just to say ' +
    'hello? Drop me a line and I’ll get back as soon as possible.',
}

/* ----------------------------------------------------------------------------
   3D film copy — one block per chapter.
   ------------------------------------------------------------------------- */

export const film = {
  hero: {
    roles: ['Cinematographer', 'Filmmaker', 'Video Editor'],
    line: 'I turn moments into moving images.',
  },
  cinematographer: {
    title: 'Cinematographer',
    line: 'Framing stories through light, movement and perspective.',
    notes: ['Music videos', 'Podcasts', 'Live events', 'Branded films'],
  },
  editor: {
    title: 'Video Editor',
    line: 'Shaping raw footage into rhythm, emotion and story.',
    notes: ['Edit', 'Colour grade', 'Finish', 'Long & short form'],
  },
  social: {
    title: 'Content & Social',
    line: 'Creating visuals that connect beyond the frame.',
  },
  contact: {
    title: "Let's make something",
    titleAccent: 'worth watching.',
  },
}

/* Floating 3D icons in the Content & Social chapter.
   Only Instagram is a confirmed profile — the rest describe the kind of work
   made for each platform. Add an `href` to make an icon clickable. */
export const socials = [
  {
    id: 'instagram',
    name: 'Instagram',
    color: '#e4405f',
    href: 'https://www.instagram.com/nottusharr/',
    handle: '@nottusharr',
    preview: '/thumbnail/insta1.jpg',
    blurb: 'Reels for Solo, Ather and Powered by Ada — shot and cut in-house.',
  },
  {
    id: 'youtube',
    name: 'YouTube',
    color: '#ff3b30',
    href: 'https://www.youtube.com/watch?v=8evvtkCSQHY',
    handle: 'Long-form',
    preview: 'https://img.youtube.com/vi/8evvtkCSQHY/hqdefault.jpg',
    blurb: 'Helped grow a Kannada podcast from 0 to 75,000+ subscribers.',
  },
  {
    id: 'tiktok',
    name: 'TikTok',
    color: '#25f4ee',
    href: '',
    handle: 'Vertical-first',
    preview: '/thumbnail/insta3.jpg',
    blurb: 'Hook-first vertical edits built for the scroll.',
  },
  {
    id: 'facebook',
    name: 'Facebook',
    color: '#1877f2',
    href: '',
    handle: 'Pages & campaigns',
    preview: '/thumbnail/insta4.jpg',
    blurb: 'Creative for ScoopWhoop, OkTested and AdParody audiences.',
  },
  {
    id: 'x',
    name: 'X',
    color: '#e7e7e7',
    href: '',
    handle: 'Clips & cutdowns',
    preview: '/thumbnail/insta5.jpg',
    blurb: 'Fast cutdowns that land in a single autoplay.',
  },
  {
    id: 'linkedin',
    name: 'LinkedIn',
    color: '#0a66c2',
    href: '',
    handle: 'Brand films',
    preview: '/thumbnail/insta6.jpg',
    blurb: 'Branded work for Google, Meesho, Flipkart and Prime Video.',
  },
]
