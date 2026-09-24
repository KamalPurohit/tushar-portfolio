import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useProgress } from '@react-three/drei'
import { meta } from '../content/site'

/* Film-leader loader: a counter and a hairline, then the curtain lifts. */
export default function Loader() {
  const { progress, active } = useProgress()
  const [done, setDone] = useState(false)
  useEffect(() => {
    if (!active && progress >= 100) {
      const t = setTimeout(() => setDone(true), 700)
      return () => clearTimeout(t)
    }
  }, [active, progress])
  return (
    <AnimatePresence>
      {!done && (
        <motion.div
          className="loader"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, transition: { duration: 1.2, ease: [0.6, 0, 0.2, 1] } }}
        >
          <p className="loader__name">{meta.name}</p>
          <p className="loader__sub mono">Loading the reel</p>
          <div className="loader__bar">
            <motion.span animate={{ scaleX: progress / 100 }} transition={{ ease: 'easeOut' }} />
          </div>
          <p className="loader__count mono">{String(Math.round(progress)).padStart(3, '0')}</p>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
