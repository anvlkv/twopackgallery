import { Vector3 } from "@react-three/fiber";
import * as THREE from "three";

export function degToRad(deg: number) {
  return (deg * Math.PI) / 180;
}

export function radToDeg(rad: number) {
  return rad / (Math.PI / 180);
}

export function vectorFromProp(prop: Vector3) {
  return prop instanceof THREE.Vector3
    ? prop
    : typeof prop === "number"
    ? new THREE.Vector3().setScalar(prop)
    : new THREE.Vector3(...prop);
}
