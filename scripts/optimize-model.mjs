// One-off: extracts the Mixamo X Bot's animation clips the site uses into an
// animation-only GLB (skeleton + clips, no mesh). The avatar is driven from
// these clips at runtime (see scene/Humanoid.jsx).
// Resampling/quantisation is deliberately skipped: both corrupt this rig.
// Run with: node scripts/optimize-model.mjs <Xbot.glb> [out.glb]
import { NodeIO } from '@gltf-transform/core'
import { ALL_EXTENSIONS } from '@gltf-transform/extensions'
import { prune } from '@gltf-transform/functions'

const KEEP = new Set(['idle', 'agree', 'headShake'])
const [input, output = 'public/models/xbot-anims.glb'] = process.argv.slice(2)

const io = new NodeIO().registerExtensions(ALL_EXTENSIONS)
const doc = await io.read(input)
const root = doc.getRoot()
for (const anim of root.listAnimations()) if (!KEEP.has(anim.getName())) anim.dispose()
for (const node of root.listNodes()) {
  if (node.getMesh()) node.setMesh(null)
  if (node.getSkin()) node.setSkin(null)
}
await doc.transform(prune({ propertyTypes: ['accessor', 'animation', 'mesh', 'skin', 'material', 'texture', 'bufferView'] }))
await io.write(output, doc)
console.log('wrote', output)
