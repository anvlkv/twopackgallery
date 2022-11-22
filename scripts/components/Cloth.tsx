import React, {
  useContext,
  useRef,
  useEffect,
  useMemo,
  useCallback,
  createRef,
} from "react";
import * as THREE from "three";
import { GroupProps, useFrame, Vector2, Vector3 } from "@react-three/fiber";
import { Box, Plane, useTexture } from "@react-three/drei";
import {
  RigidBodyApi,
  RigidBodyApiRef,
  RigidBody,
  useSphericalJoint,
} from "@react-three/rapier";
import { vector2FromProp } from "../util";

type TSide = "x" | "-x" | "y" | "-y";

export interface IProps extends GroupProps {
  size: Vector2;
  density: Vector2;
  weight: number;
  staticSide: TSide[];
  texture: string;
  pattern: "x" | "+";
}

type LoomRefs = {
  particleRefs: React.RefObject<RigidBodyApi>[];
  meshRef: React.RefObject<THREE.Mesh> | null;
};

const FabricContext =
  React.createContext<React.MutableRefObject<LoomRefs> | null>(null);

function useFabricContext() {
  const ctx = useContext(FabricContext)!;

  function setMesh(v: React.RefObject<THREE.Mesh>) {
    ctx.current.meshRef = v;
  }

  function getMesh() {
    return ctx.current.meshRef?.current || undefined;
  }

  function getA(at: number) {
    return ctx.current.particleRefs[at];
  }

  function getB(at: number) {
    return ctx.current.particleRefs[at + 1];
  }

  function getC(at: number, Nx: number) {
    return ctx.current.particleRefs[at + Nx];
  }

  function getD(at: number, Nx: number) {
    return ctx.current.particleRefs[at + 1 + Nx];
  }

  function getE(at: number, Nx: number) {
    return ctx.current.particleRefs[at - 1 + Nx];
  }

  return useMemo(
    () => ({
      setMesh,
      getA,
      getB,
      getC,
      getD,
      getE,
      getMesh,
    }),
    [ctx]
  );
}

export default function Cloth({
  size,
  density,
  staticSide,
  weight,
  texture: texturePath,
  pattern,
  ...groupProps
}: IProps) {
  const { x: width, y: height } = vector2FromProp(size);
  const { x: Nx, y: Ny } = vector2FromProp(density);

  const texture = useTexture(texturePath);

  const distX = width / Nx,
    distY = height / Ny;
  const mass = weight / ((Nx + 1) * (Ny + 1));

  const particleAt = useCallback(
    (i: number, j: number) => {
      const position = [
        (-distX * Nx) / 2 + i * distX,
        (distY * Ny) / 2 - j * distY,
        0,
      ] as [number, number, number];
      const isStatic =
        (i === 0 && staticSide.includes("-x")) ||
        (i === Nx && staticSide.includes("x")) ||
        (j === 0 && staticSide.includes("-y")) ||
        (j === Ny && staticSide.includes("y"));
      const index = j * (Nx + 1) + i;
      const pMass = isStatic ? 0 : mass;

      const stitches: EStitch[] = [];

      switch (pattern) {
        case "+": {
          if (i !== Nx) {
            stitches.push(EStitch.H);
          }
          if (j !== Ny) {
            stitches.push(EStitch.V);
          }
          break;
        }
        case "x": {
          if ((i === 0 || i === Nx) && j !== Ny) {
            stitches.push(EStitch.V);
          }

          if ((j === 0 || j === Ny) && i !== Nx) {
            stitches.push(EStitch.H);
          }

          if (i !== 0 && j !== Ny) {
            stitches.push(EStitch.RL);
          }

          if (i !== Nx && j !== Ny) {
            stitches.push(EStitch.LR);
          }
          break;
        }
      }

      if (j > Ny || i > Nx) {
        throw new Error("particle is not in scope");
      }

      return {
        position,
        mass: pMass,
        at: index,
        Nx,
        dist: [distX, distY],
        stitches,
      } as ILoomProps;
    },
    [Nx, Ny, distX, distY, mass, pattern, staticSide]
  );

  const bodies = useRef<LoomRefs>({
    meshRef: null,
    particleRefs: Array.from({
      length: (Nx + 1) * (Ny + 1),
    }).map(() => createRef()),
  });
  bodies.current.particleRefs = Array.from({
    length: (Nx + 1) * (Ny + 1),
  }).map((_, i) => bodies.current.particleRefs[i] || createRef());

  const spec = `${Nx}_${Ny}_${staticSide.join("|")}_${mass}_${distX}_${distY}`;

  return (
    <group {...groupProps}>
      <FabricContext.Provider value={bodies}>
        <Fabric
          spec={spec}
          particle={particleAt}
          width={width}
          height={height}
          Nx={Nx}
          Ny={Ny}
          texture={texture}
        />
      </FabricContext.Provider>
    </group>
  );
}

interface IFabricProps {
  spec: string;
  width: number;
  height: number;
  Nx: number;
  Ny: number;
  particle: (i: number, j: number) => ILoomProps;
  texture?: THREE.Texture;
}

function Fabric(props: IFabricProps) {
  const { width, height, Nx, Ny, particle, spec } = props;
  const meshRef = useRef<THREE.Mesh>(null);
  const { setMesh } = useFabricContext();

  const wovenFabric = useMemo(
    () =>
      Array.from({ length: Nx + 1 }).flatMap((_, i) =>
        Array.from({ length: Ny + 1 }).map((_, j) => (
          <Loom {...particle(i, j)} spec={spec} key={`${spec}_${i}_${j}`} />
        ))
      ),
    [Nx, Ny, particle, spec]
  );

  useEffect(() => {
    setMesh(meshRef);
  }, [setMesh, meshRef]);

  return (
    <>
      <Plane ref={meshRef} position={[0, 0, 0]} args={[width, height, Nx, Ny]}>
        <meshStandardMaterial
          map={props.texture}
          side={THREE.DoubleSide}
          roughness={1 - 1 / (Nx * Ny)}
        />
      </Plane>
      {wovenFabric}
    </>
  );
}

enum EStitch {
  H = "-",
  V = "|",
  RL = "/",
  LR = "\\",
}

interface ILoomProps {
  stitches: EStitch[];
  Nx: number;
  at: number;
  mass: number;
  dist: [number, number];
  position: Vector3;
  spec?: string;
}

function Loom({ stitches, Nx, mass, at, position, dist, spec }: ILoomProps) {
  const { getA, getB, getC, getD, getE, getMesh } = useFabricContext();
  const a = getA(at),
    b = getB(at),
    c = getC(at, Nx + 1),
    d = getD(at, Nx + 1),
    e = getE(at, Nx + 1);

  const HJoint = dist[0] / 2;
  const VJoint = dist[1] / 2;
  const joints = stitches.flatMap((s, i) => {
    const key = `${spec}_${at}_${s}_${i}`;
    switch (s) {
      case EStitch.H: {
        return [
          <WeaveJoint
            key={key}
            a={a}
            b={b}
            c1={[HJoint, 0, 0]}
            c2={[-HJoint, 0, 0]}
          />,
        ];
      }
      case EStitch.V: {
        return [
          <WeaveJoint
            key={key}
            a={a}
            b={c}
            c1={[0, -VJoint, 0]}
            c2={[0, VJoint, 0]}
          />,
        ];
      }
      case EStitch.LR: {
        return [
          <WeaveJoint
            key={key}
            a={a}
            b={d}
            c1={[HJoint, -VJoint, 0]}
            c2={[-HJoint, VJoint, 0]}
          />,
        ];
      }
      case EStitch.RL: {
        return [
          <WeaveJoint
            key={key}
            a={a}
            b={e}
            c1={[-HJoint, -VJoint, 0]}
            c2={[HJoint, VJoint, 0]}
          />,
        ];
      }
    }
  });

  useFrame(() => {
    const mesh = getMesh();
    if (mesh && a.current) {
      const { x, y, z } = a.current.translation();
      mesh.geometry.attributes.position.setXYZ(at, x, y, z);
      mesh.geometry.attributes.position.needsUpdate = true;
    }
  });

  return (
    <>
      <RigidBody position={position} mass={mass} ref={a} includeInvisible>
        <object3D>
          <Box args={[dist[0]/2, dist[1]/2, 0.01]} visible={false} />
        </object3D>
      </RigidBody>
      {joints}
    </>
  );
}

function WeaveJoint({
  a,
  b,
  c1,
  c2,
}: {
  a: RigidBodyApiRef;
  b: RigidBodyApiRef;
  c1: [number, number, number];
  c2: [number, number, number];
}) {
  if (!a || !b) {
    debugger;
  }

  useSphericalJoint(a, b, [c1, c2]);
  return <></>;
}
