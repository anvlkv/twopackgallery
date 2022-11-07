import * as THREE from "three";
import { GroupProps, reconciler, ThreeElements } from "@react-three/fiber";
import React, { useEffect, useMemo, useRef } from "react";
import CenteredGroup from "./CenteredGroup";
import { createStateContext } from "react-use";
import { degToRad } from "../util";
import { useHelper } from "@react-three/drei";
import { BoxHelper } from "three";
import { COLORS } from "./ThreeApp";

type TSide = "x" | "y" | "z";

type TMode = "pack" | "spread";

export interface IProps extends GroupProps {
  radius: number;
  face: TSide;
  axis: TSide;
  mode: TMode;
}

const [useSegments, SegmentsContextProvider] = createStateContext(
  [] as ({ distance: number; sweep: number } | undefined)[]
);

const RadialSegment = React.memo(
  ({
    children: child,
    index,
    face,
    radius,
    axis,
    totalSegments,
    mode,
  }: {
    index: number;
    children: React.ReactElement<ThreeElements["object3D"]>;
    face: TSide;
    radius: number;
    axis: TSide;
    totalSegments: number;
    mode: TMode;
  }) => {
    const ref = useRef<THREE.Group>(null);
    const [segments, setSegments] = useSegments();

    useEffect(() => {
      if (ref.current) {
        setSegments((s) => {
          if (ref.current) {
            const box = new THREE.Box3().setFromObject(ref.current);
            const size = box.getSize(new THREE.Vector3());
            const sweep = 2 * Math.sin(size[face] / (2 * radius));
            s[index] = { distance: size[face], sweep };
            return [...s];
          }
          return s;
        });
        return () => {
          setSegments((s) => {
            s[index] = undefined;
            return [...s];
          });
        };
      }
    }, [setSegments, index, face, radius]);

    const [sweepBefore, totalSweep] = useMemo(
      () =>
        segments.reduce(
          (acc, size, at) => {
            if (at < index) {
              acc[0] += size ? size.sweep : 0;
            }
            acc[1] += size ? size.sweep : 0;
            return acc;
          },
          [0, 0] as [number, number]
        ),
      [segments, index]
    );

    const [center, recenter] = useMemo(() => {
      const vec = new THREE.Vector3();
      const side = ['x', 'y', 'z'].find(a => a!== face && a!== axis)!
      vec[face] = radius;
      vec[side] = radius;
      const de_vec = vec.clone();
      de_vec[face] *= -1;
      de_vec[side] *= -1
      return [vec, de_vec];
    }, [face, axis]);

    const rotation = useMemo(() => {
      const vec = new THREE.Euler();
      switch (mode) {
        case "pack": {
          vec[axis] = sweepBefore;
          break;
        }
        case "spread": {
          const whitespace = degToRad(360) - totalSweep;
          const segmentWhiteSpace = whitespace / totalSegments;
          vec[axis] = segmentWhiteSpace * index + sweepBefore;
          break;
        }
        default: {
          throw new Error(`[${mode}] not supported`);
        }
      }
      return vec;
    }, [sweepBefore, axis, mode, totalSegments, index, totalSweep]);

    return (
      <group rotation={rotation} position={center}>
        <group position={recenter} ref={ref}>
          {child}
        </group>
      </group>
    );
  }
);

export default function RadialLayout({
  radius,
  children,
  face,
  axis,
  mode,
  ...groupProps
}: IProps) {
  const segmentsCount = React.Children.count(children);

  const ref = useRef(null)

  useHelper(ref, BoxHelper, COLORS.danger)

  return (
    <CenteredGroup {...groupProps} size={[radius * 2, radius * 2, radius * 2]} >
        <SegmentsContextProvider>
          <group position={[-radius, radius, -radius]}>
            {React.Children.map(children, (ch, at) => (
              <RadialSegment
                key={at}
                mode={mode}
                face={face}
                axis={axis}
                radius={radius}
                index={at}
                totalSegments={segmentsCount}
                children={ch as React.ReactElement<ThreeElements["object3D"]>}
              />
            ))}
          </group>
        </SegmentsContextProvider>
        <mesh ref={ref} position={[0, 1, 0]}>
          <sphereGeometry args={[10]}/>
          <meshBasicMaterial color={COLORS.success}/>
        </mesh>
    </CenteredGroup>
  );
}
