import { Vector2, Vector3 } from "@react-three/fiber";
import * as THREE from "three";

export function degToRad(deg: number) {
  return (deg * Math.PI) / 180;
}

export function radToDeg(rad: number) {
  return rad / (Math.PI / 180);
}

export function vector3FromProp(prop: Vector3) {
  return prop instanceof THREE.Vector3
    ? prop
    : typeof prop === "number"
    ? new THREE.Vector3().setScalar(prop)
    : new THREE.Vector3(...prop);
}

export function vector2FromProp(prop: Vector2) {
  return prop instanceof THREE.Vector2
    ? prop
    : typeof prop === "number"
    ? new THREE.Vector2().setScalar(prop)
    : new THREE.Vector2(...prop);
}

export function mulberry32(a = 1) {
  return function() {
    var t = a += 0x6D2B79F5;
    t = Math.imul(t ^ t >>> 15, t | 1);
    t ^= t + Math.imul(t ^ t >>> 7, t | 61);
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  }
}