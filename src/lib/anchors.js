import { Vector3 } from 'three'

/* World-space points that one scene object publishes and another reads in
   the same frame — e.g. the cinema camera tells the humanoid where its
   grips are. Writers run at an earlier useFrame priority than readers. */
export const anchors = {
  gripRight: new Vector3(-0.2, 1.3, 0.4),
  gripLeft: new Vector3(0, 1.3, 0.55),
  monitor: new Vector3(-0.1, 1.55, 0.3),
  editCursor: new Vector3(0, 1.8, -2.2),
  /** Where the lens should focus this frame (depth of field). */
  focus: new Vector3(0, 1.5, 0),
}
