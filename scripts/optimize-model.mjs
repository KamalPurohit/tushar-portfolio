// One-off: trims the Mixamo X Bot down to the clips the site uses.
// (meshopt/quantisation is deliberately skipped: it corrupts this rig's skinning.) Run with: node scripts/optimize-model.mjs <in.glb>
import { NodeIO } from '@gltf-transform/core'
import { ALL_EXTENSIONS } from '@gltf-transform/extensions'
import { prune } from '@gltf-transform/functions'

const KEEP = new Set(['idle', 'agree', 'headShake'])
const [input, output = 'public/models/xbot.glb'] = process.argv.slice(2)

const io = new NodeIO().registerExtensions(ALL_EXTENSIONS)
const doc = await io.read(input)
for (const anim of doc.getRoot().listAnimations()) if (!KEEP.has(anim.getName())) anim.dispose()
await doc.transform(prune({ propertyTypes: ['accessor', 'animation'] }))
await io.write(output, doc)
console.log('wrote', output)
