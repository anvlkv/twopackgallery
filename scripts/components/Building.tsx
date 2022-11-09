import React, { useMemo } from "react";
import {
  GroupProps,
  LightNode,
  ThreeElements,
  Vector2,
  Vector3,
} from "@react-three/fiber";
import { Addition, Brush, BrushProps } from "@react-three/csg";
import CenteredGroup from "./CenteredGroup";
import { COLORS } from "./ThreeApp";
import { vectorFromProp } from "../util";

type TSide = "x" | "-x" | "z" | "-z" | "y" | "-y";

type TSideBoxMap = Partial<Record<TSide, Vector3[]>>;

export interface IProps extends GroupProps {
  atrium: Vector3;
  sides?: TSideBoxMap;
  light?: React.ReactElement<ThreeElements["object3D"]>;
  material?: React.ReactElement<ThreeElements["material"]>;
}

function Building({
  atrium,
  sides = {},
  light,
  material = <meshPhongMaterial specular={COLORS.success} color={COLORS.danger} />,
  ...props
}: IProps) {
  const brushes = useMemo(() => {
    const base = vectorFromProp(atrium);
    let isABrush = false;
    let iterSide: TSide;
    let iterSidePosition = 0;
    return (
      [
        "x",
        ...(sides["x"] || []),
        "z",
        ...(sides["z"] || []),
        "y",
        ...(sides["y"] || []),
        "-x",
        ...(sides["-x"] || []),
        "-z",
        ...(sides["-z"] || []),
        "-y",
        ...(sides["-y"] || []),
      ] as (TSide | Vector3)[]
    ).reduce(
      (acc, current, at, all) => {
        if (typeof current === "string") {
          iterSide = current;
          iterSidePosition = 0;
          return acc;
        } else {
          const boxArgs = vectorFromProp(current);
          const boxBrush = (
            <SideBoxBrush
              b
              side={iterSide}
              sidePosition={iterSidePosition}
              size={boxArgs}
              material={material}
              base={base}
            />
          );
          const result = (
            <Addition a>
              {acc}
              {boxBrush}
            </Addition>
          );
          isABrush = !isABrush;
          iterSidePosition +=
            boxArgs[
              iterSide === "x" || iterSide === "-x"
                ? "x"
                : iterSide === "z" || iterSide === "-z"
                ? "z"
                : "y"
            ];
          return result;
        }
      },
      <Brush a position={0}>
        <boxGeometry args={[base.x, base.y, base.z]} />
        {material}
      </Brush>
    );
  }, [atrium, sides, material]);

  return (
    <mesh position={[0, 0, 0]}>
      {brushes}
      {material}
    </mesh>
  );
}

interface ISideBoxBrushProps
  extends Omit<BrushProps, "material" | "children" | "ref" | "position"> {
  material: React.ReactElement<ThreeElements["material"]>;
  size: Vector3;
  base: Vector3;
  side: TSide;
  sidePosition: number;
}

const SideBoxBrush = React.memo(({
  material,
  a,
  b,
  size,
  scale,
  side,
  sidePosition,
  base,
  ...brushProps
}: ISideBoxBrushProps) => {
  const boxArgs = vectorFromProp(size);
  const baseArgs = vectorFromProp(base);

  // default position to align with the main surface edge
  let x = baseArgs.x / 2 - boxArgs.x / 2,
    y = baseArgs.y / 2 - boxArgs.y / 2,
    z = baseArgs.z / 2 - boxArgs.z / 2;

  switch (side) {
    case "x": {
      z += boxArgs.z;
      x -= sidePosition;
      y *= -1;
      break;
    }
    case "-x": {
      z = -z - boxArgs.z;
      x -= sidePosition;
      y *= -1;
      break;
    }
    case "z": {
      x += boxArgs.x;
      z -= sidePosition;
      y *= -1;
      break;
    }
    case "-z": {
      x = -x - boxArgs.x;
      z -= sidePosition;
      y *= -1;
      break;
    }
    case "y": {
      z += (boxArgs.z - baseArgs.z)/2;
      x += (boxArgs.x - baseArgs.x)/2;
      y += boxArgs.y + sidePosition;
      break;
    }
    case "-y": {
      z += (boxArgs.z - baseArgs.z)/2;
      x += (boxArgs.x - baseArgs.x)/2;
      y = -y - boxArgs.y - sidePosition;
      break;
    }
  }

  return (
    <Brush {...brushProps} a={a!!} b={b!!} scale={scale} position={[x, y, z]}>
      <boxGeometry args={[boxArgs.x, boxArgs.y, boxArgs.z]} />
      {material}
    </Brush>
  );
});

export default React.memo(Building);
