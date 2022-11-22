import React, { useEffect, useMemo } from "react";
import * as THREE from "three";
import { Vector3, Vector2 } from "@react-three/fiber";
import { RigidBody } from "@react-three/rapier";
import { Sphere } from "@react-three/drei";
import {
  vector2FromProp,
  vector3FromProp,
  degToRad,
  radToDeg,
  mulberry32,
} from "../util";
import { editable as e } from "@theatre/r3f";
import { GroupProps } from "@react-three/fiber";

export interface IProps extends GroupProps {
  velocity: Vector3;
  size: number;
  volume: Vector3;
}

type TSide = "x" | "-x" | "z" | "-z";

// const WindMaterial =

function Wind({
  volume,
  size,
  velocity: propsVelocity,
  ...groupProps
}: IProps) {
  const { x: Vx, y: Vy, z: Vz } = vector3FromProp(volume);
  const [velocity, direction] = useMemo(() => {
    const velocity = vector3FromProp(propsVelocity);
    let direction: TSide =
      Math.abs(velocity.x) > Math.abs(velocity.z) ? "x" : "z";
    direction = `${Math.sign(velocity[direction]) > 0 ? "" : "-"}${direction}`;
    return [
      [velocity.x, velocity.y, velocity.z] as [number, number, number],
      direction,
    ];
  }, [propsVelocity]);


  const filledVolume = useMemo(() => {
    const Nx = Math.floor(Vx / size),
      Ny = Math.floor(Vy / size),
      Nz = Math.floor(Vz / size);
    const distX = Vx / Nx,
      distY = Vy / Ny,
      distZ = Vz / Nz;
    const particles: React.ReactElement[] = [];
    const rand = mulberry32(Nx * Ny * Nz);
    for (let i = Nx; i >= 0; i--) {
      for (let j = Ny; j >= 0; j--) {
        for (let k = Nz; k >= 0; k--) {
          const r = rand();
          if (Math.cos(i * j * k + r) > 0.95) {
            const p = vector3FromProp([i * distX, j * distY, k * distZ]);
            particles.push(
              <WindParticle
                key={`${i}_${j}_${k}`}
                velocity={velocity}
                vx={Vx}
                vy={Vy}
                vz={Vz}
                d={size * r}
                direction={direction}
                position={p}
              />
            );
          }
        }
      }
    }
    return particles;
  }, [velocity, direction, Vx, Vy, Vz, size]);

  return <group {...groupProps}>{filledVolume}</group>;
}

function WindParticle({
  d,
  velocity,
  direction,
  position,
  vx,
  vy,
  vz,
}: {
  d: number;
  position: THREE.Vector3;
  direction: TSide;
  velocity: [number, number, number];
  vx: number;
  vy: number;
  vz: number;
}) {
  // const [ref, api] = useSphere<THREE.Points>(() => ({
  //   mass: .1,
  //   velocity,
  //   args: [d],
  //   position: [position.x, position.y, position.z],
  //   type: "Kinematic",
  //   material: {
  //     friction: .1,
  //     restitution: 1,
  //   }
  // }), undefined, [d, position, velocity]);

  // useEffect(() => {
  //   return api.position.subscribe(([x, y, z]) => {
  //     const [Dx, Dy, Dz] = [x, y, z].map(Math.abs);
  //     if (Dx > vx || Dy > vy || Dz > vz) {
  //       api.position.set(
  //         Dx > vx ? position.x - vx/2 : x,
  //         Dy > vy ? position.y - vy/2 : y,
  //         Dz > vz ? position.z - vz/2 : z,
  //       );
  //     }
  //   });
  // }, [api, vx, vy, vz, position, velocity, direction]);

  return <Sphere position={position} args={[d]}/>

  // return <RigidBody linearVelocity={velocity}>
  //   <Sphere position={position} args={[d]}/>
  // </RigidBody>
}

export default React.memo(Wind);
