import { Addition, Brush } from "@react-three/csg";
import {
  GroupProps,
  LightNode,
  ThreeElements,
  Vector2,
  Vector3,
} from "@react-three/fiber";
import React from "react";
import { degToRad } from "../util";
import CenteredGroup from "./CenteredGroup";
import { COLORS } from "./ThreeApp";

type TSide = "x" | "-x" | "z" | "-z" | "y" | "-y";

export interface IProps extends GroupProps {
  atrium: Vector3;
  boundaries: Vector3;
  levels: number;
  foundation?: number;
  windowRatios?: Vector2;
  entrance?: TSide;
  light?: React.ReactElement<ThreeElements["object3D"]>;
  material?: React.ReactElement<ThreeElements["material"]>;
}

function Building({
  atrium: base,
  boundaries,
  levels,
  foundation,
  windowRatios,
  entrance,
  light,
  ...props
}: IProps) {
  // const facade =

  return <CenteredGroup {...props} size={boundaries}>
    <mesh scale={base} position={[0, 0, 0]}>
      <boxGeometry args={[1, 1, 1]}/>
      <meshPhongMaterial color={COLORS.danger}/>
    </mesh>
  </CenteredGroup>;
}

// interface ICarcaseComponentBrushProps {
//   size: Vector3;
//   position: Vector3;
//   material?: React.ReactElement<ThreeElements["material"]>;
// }

// type TSideProps = [Omit<ICarcaseBrushProps, "material">[], Omit<ICarcaseBrushProps, "material">[]]

// interface ICarcaseBrushProps extends ICarcaseComponentBrushProps {
//   xSides: TSideProps
//   ySides: TSideProps
//   zSides: TSideProps
// }

// function CarcaseBrush({size, position, material, xSides, ySides, zSides}: ICarcaseBrushProps) {

//   return <Addition a scale={size} position={position}>
    
//   </Addition>
// }


// function WingBrush({size, position, material}: ICarcaseComponentBrushProps) {
//   return <Brush b scale={size} position={position}>
//     <boxGeometry args={[1, 1, 1]} />
//     {material}
//   </Brush>
// }

// function EntranceBrush({
//   size,
//   position,
// }: Omit<ICarcaseComponentBrushProps, "material">) {
//   return (
//     <Addition b scale={size} position={position}>
//       <Brush a position={[0.5, 0.7 / 2, 0.5]}>
//         <boxGeometry args={[1, 0.7, 1]} />
//       </Brush>
//       <Brush b position={[1, 0.7, 1]} rotation={[degToRad(90), 0, 0]}>
//         <cylinderGeometry args={[1, 1, 1]} />
//       </Brush>
//     </Addition>
//   );
// }

// function WindowBrush({ size, position }: Omit<ICarcaseComponentBrushProps, "material">) {
//   return (
//     <Brush b scale={size} position={position}>
//       <boxGeometry args={[1, 1, 1]} />
//     </Brush>
//   );
// }

// function AtriumBrush({ size, material, position }: ICarcaseComponentBrushProps) {
//   return (
//     <Brush a scale={size} position={position}>
//       <boxGeometry args={[1, 1, 1]} />
//       {material}
//     </Brush>
//   );
// }

export default React.memo(Building);
