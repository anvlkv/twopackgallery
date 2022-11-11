import React, { forwardRef, useMemo, useRef } from "react";
import { GroupProps, ThreeElements, Vector3 } from "@react-three/fiber";
import CenteredGroup from "./CenteredGroup";
import { COLORS } from "./ThreeApp";
import { mulberry32, vector3FromProp } from "../util";
import { Center, useHelper } from "@react-three/drei";
import * as THREE from "three";

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
  material = (
    <meshPhongMaterial specular={COLORS.success} color={COLORS.danger} />
  ),
  ...props
}: IProps) {
  const brushes = useMemo(() => {
    const base = vector3FromProp(atrium);
    let iterSide: TSide;
    const iterSidePosition = {} as Record<TSide, number>;
    return (
      [
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
        "x",
        ...(sides["x"] || []),
      ] as (TSide | Vector3)[]
    ).reduce(
      (acc, current, at, all) => {
        if (typeof current === "string") {
          if (current === "-y") {
            acc = (
              <Center disableY disableZ>
                {acc}
              </Center>
            );
          } else if (current === "x") {
            acc = <group position={[0, iterSidePosition["-y"], 0]}>{acc}</group>;
          }
          iterSide = current;
          iterSidePosition[iterSide] = 0;
          return acc;
        } else {
          const boxArgs = vector3FromProp(current);
          const boxBrush = (
            <SideBoxMesh
              side={iterSide}
              sidePosition={iterSidePosition[iterSide]}
              size={boxArgs}
              material={material}
              base={base}
            />
          );
          const result = (
            <>
              {acc}
              {boxBrush}
            </>
          );
          iterSidePosition[iterSide] +=
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
      <mesh position={0}>
        <boxGeometry args={[base.x, base.y, base.z]} />
        {material}
      </mesh>
    );
  }, [atrium, sides, material]);

  const ref = useRef(null);
  useHelper(ref, THREE.BoxHelper);

  return (
    <group {...props} ref={ref}>
      {brushes}
      {/* <mesh>
      </mesh> */}
    </group>
  );
}

interface ISideBoxMeshProps
  extends Omit<GroupProps, "children" | "ref" | "position"> {
  material: React.ReactElement<ThreeElements["material"]>;
  size: Vector3;
  base: Vector3;
  side: TSide;
  sidePosition: number;
}

const SideBoxMesh = React.memo(
  forwardRef<THREE.Group, ISideBoxMeshProps>(function SideBoxMeshFn(
    {
      material,
      size,
      scale,
      side,
      sidePosition,
      base,
      ...groupProps
    }: ISideBoxMeshProps,
    ref
  ) {
    const boxArgs = vector3FromProp(size);
    const baseArgs = vector3FromProp(base);

    // default position to align with the main surface edge
    let x = (baseArgs.x - boxArgs.x) / 2,
      y = (baseArgs.y - boxArgs.y) / 2,
      z = (baseArgs.z - boxArgs.z) / 2;

    switch (side) {
      case "x": {
        z += boxArgs.z - Number.MIN_VALUE * boxArgs.z;
        x -= sidePosition - Number.MIN_VALUE * sidePosition;
        y *= -1;
        break;
      }
      case "-x": {
        z = -z - boxArgs.z + Number.MIN_VALUE * boxArgs.z;
        x -= sidePosition - -Number.MIN_VALUE * sidePosition;
        y *= -1;
        break;
      }
      case "z": {
        x += boxArgs.x - Number.MIN_VALUE * boxArgs.x;
        z -= sidePosition - Number.MIN_VALUE * sidePosition;
        y *= -1;
        break;
      }
      case "-z": {
        x = -x - boxArgs.x + Number.MIN_VALUE * boxArgs.x;
        z -= sidePosition - Number.MIN_VALUE * sidePosition;
        y *= -1;
        break;
      }
      case "y": {
        z += (boxArgs.z - baseArgs.z) / 2;
        x += (boxArgs.x - baseArgs.x) / 2;
        y += boxArgs.y + sidePosition - Number.MIN_VALUE * sidePosition;
        break;
      }
      case "-y": {
        // align with 'x' side
        // z += (boxArgs.z - baseArgs.z) / 2;
        x += (boxArgs.x - baseArgs.x) / 2;
        y = -y - boxArgs.y - sidePosition + Number.MIN_VALUE * sidePosition;
        break;
      }
    }

    return (
      <mesh scale={scale} position={[x, y, z]}>
        <boxGeometry args={[boxArgs.x, boxArgs.y, boxArgs.z]} />
        {material}
      </mesh>
    );
  })
);

export default React.memo(Building);

export function buildingGenerator(
  foundation: Vector3,
  space: Vector3,
  levels: Vector3,
  entrance: Vector3,
  parcel: Vector3,
  symmetry: number,
  levelHeight: number,
  sideRatio: number,
  seed: number
) {
  const boundaries = vector3FromProp(parcel);
  const { x: levelsX, y: levelsY, z: levelsZ } = vector3FromProp(levels);
  const foundationBoundary = vector3FromProp(foundation);
  const spacing = vector3FromProp(space);
  const atrium = vector3FromProp([
    (boundaries.x - spacing.x) * (1 - sideRatio),
    levelsY * levelHeight - (foundation ? levelHeight / 3 : 0),
    (boundaries.z - spacing.z) * (1 - sideRatio),
  ] as Vector3);
  const entranceBox = vector3FromProp(entrance);
  foundationBoundary.x += atrium.x;
  foundationBoundary.z += atrium.z;
  foundationBoundary.y *= levelHeight;
  const centeredSideBoundary = vector3FromProp([
    (boundaries.x - spacing.x) * sideRatio,
    atrium.y - levelHeight,
    atrium.x + (boundaries.x - spacing.x) * sideRatio,
  ]);
  const roofBoundary = vector3FromProp([
    atrium.x + centeredSideBoundary.x * 2,
    Math.abs(boundaries.y - atrium.y - spacing.y),
    atrium.z + centeredSideBoundary.x * 2,
  ]);
  const rand = mulberry32(seed);
  const sideBoxMap: TSideBoxMap = {
    x: [entranceBox],
    "-x": buildingSideGenerator(
      vector3FromProp([
        atrium.x,
        centeredSideBoundary.y,
        centeredSideBoundary.x,
      ]),
      levelsX,
      rand,
      (symmetry -= 1) >= 0,
      "x"
    ),
    y: buildingSideGenerator(
      roofBoundary,
      levelsY,
      rand,
      (symmetry -= 1) >= 0,
      "y"
    ).sort((a, b) => b.x - a.x),
  };

  if (symmetry - 2 >= 0) {
    const sharedSide = buildingSideGenerator(
      centeredSideBoundary,
      levelsZ,
      rand,
      (symmetry -= 2) >= 0,
      "z"
    );
    sideBoxMap["-z"] = sideBoxMap["z"] = sharedSide;
    foundationBoundary.x += centeredSideBoundary.x;
    foundationBoundary.z += centeredSideBoundary.z * 2;
  } else {
    const offset1 = rand();
    const offset2 = Math.sin(offset1);
    const zSideBoundary = vector3FromProp([
        centeredSideBoundary.x - centeredSideBoundary.x * offset1,
        centeredSideBoundary.y,
        centeredSideBoundary.z - centeredSideBoundary.z * offset2,
      ]),
      mzSideBoundary = vector3FromProp([
        centeredSideBoundary.x + centeredSideBoundary.x * offset1,
        centeredSideBoundary.y,
        centeredSideBoundary.z + centeredSideBoundary.z * offset2,
      ]);
    if ((symmetry -= 1) >= 0) {
      zSideBoundary.z = mzSideBoundary.z = Math.max(
        mzSideBoundary.z,
        zSideBoundary.z
      );
    }
    sideBoxMap["-z"] = buildingSideGenerator(
      mzSideBoundary,
      levelsZ,
      rand,
      offset1 > 0.5,
      "z"
    );
    sideBoxMap["z"] = buildingSideGenerator(
      zSideBoundary,
      levelsZ,
      rand,
      offset2 > 0.5,
      "z"
    );
    foundationBoundary.x += zSideBoundary.x + mzSideBoundary.x;
    foundationBoundary.z +=
      Math.max(mzSideBoundary.z, zSideBoundary.z) - atrium.z;
  }

  sideBoxMap["-y"] = [foundationBoundary];

  return { sides: sideBoxMap, atrium };
}

function buildingSideGenerator(
  boundary: THREE.Vector3,
  levels: number,
  rand: () => number,
  symmetry: boolean,
  longSide: TSide
): THREE.Vector3[] {
  const boxes: THREE.Vector3[] = [];

  const levelBoundary = boundary.clone();
  levelBoundary[longSide] = levelBoundary[longSide] / levels;

  let longSideSum = 0;
  for (let lvl = symmetry ? Math.floor(levels / 2) : levels; lvl > 0; lvl--) {
    const coe = Math.sin(rand());
    const box = new THREE.Vector3(
      levelBoundary.x * coe,
      levelBoundary.y * coe,
      levelBoundary.z * coe
    );
    box[longSide] = levelBoundary[longSide];
    longSideSum += box[longSide];
    boxes.push(box);
  }

  if (symmetry) {
    boxes.push(
      ...(longSideSum < boundary[longSide] / 2
        ? [
            new THREE.Vector3(
              longSide.includes("x")
                ? boundary[longSide] / 2 - longSideSum
                : levelBoundary.x * rand(),
              longSide.includes("y")
                ? boundary[longSide] / 2 - longSideSum
                : levelBoundary.y * rand(),
              longSide.includes("z")
                ? boundary[longSide] / 2 - longSideSum
                : levelBoundary.z * rand()
            ),
          ]
        : []),
      ...[...boxes].reverse()
    );
  }

  return boxes;
}
