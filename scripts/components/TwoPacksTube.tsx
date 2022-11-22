import { GroupProps, useLoader } from "@react-three/fiber";
import React from "react";
import { useMemo } from "react";
import * as THREE from "three";
import { SVGLoader } from "three/examples/jsm/loaders/SVGLoader";
import { COLORS } from "./ThreeApp";

export default function TwoPacksTube(props: GroupProps) {
  const twopacks = useLoader(SVGLoader, "/twopacks.svg");

  const Tube = useMemo(() => {
    const Material = <meshToonMaterial color={COLORS.white} fog/>;
    return twopacks.paths.map((path, p_at) =>
      path.currentPath.curves.reduce((meshes, c2, at) => {
        let c3;
        let s = 1;
        switch (c2.type) {
          case "LineCurve": {
            c3 = new THREE.LineCurve3(
              new THREE.Vector3(c2.v1.x, c2.v1.y, 0),
              new THREE.Vector3(c2.v2.x, c2.v2.y, 0)
            );
            break;
          }
          case "QuadraticBezierCurve": {
            s = 16;
            c3 = new THREE.QuadraticBezierCurve3(
              new THREE.Vector3(c2.v0.x, c2.v0.y, 0),
              new THREE.Vector3(c2.v1.x, c2.v1.y, 0),
              new THREE.Vector3(c2.v2.x, c2.v2.y, 0)
            );
            break;
          }
          case "CubicBezierCurve": {
            s = 32;
            c3 = new THREE.CubicBezierCurve3(
              new THREE.Vector3(c2.v0.x, c2.v0.y, 0),
              new THREE.Vector3(c2.v1.x, c2.v1.y, 0),
              new THREE.Vector3(c2.v2.x, c2.v2.y, 0),
              new THREE.Vector3(c2.v3.x, c2.v3.y, 0)
            );
            break;
          }
        }
        meshes.push(
          <mesh key={`${p_at}_${at}`} scale={[1, -1, 1]}>
            <tubeGeometry args={[c3, s, 6, 6]} />
            {Material}
          </mesh>
        );
        return meshes;
      }, [])
    );
  }, [twopacks.paths]);

  return (
    <group {...props}>
      {Tube.flatMap((t) => [...t])}
    </group>
  );
}
