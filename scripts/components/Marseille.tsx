import React, { useEffect, useMemo, useRef, useState } from "react";
import * as TWEEN from "@tweenjs/tween.js";
import * as THREE from "three";
import { PerspectiveCamera, useHelper } from "@react-three/drei";
import { degToRad, radToDeg } from "../util";
import { INVERTED_COLORS, COLORS, useCanvasStyle } from "./ThreeApp";
import { useFrame } from "@react-three/fiber";
import TwoPacksTube from "./TwoPacksTube";
import CenteredGroup from "./CenteredGroup";
import RadialLayout from "./RadialLayout";
import { useInterval } from "react-use";
import Building, { buildingGenerator } from "./Building";

export default function Marseille() {
  const cameraGroupRef = useRef<THREE.Group>(null);
  const stageGroupRef = useRef<THREE.Group>(null);
  const [cameraAnimation, setCameraAnimation] = useState("steady");

  const [_, setCanvasStyle] = useCanvasStyle();
  useEffect(() => {
    setCanvasStyle({ filter: "invert(100%)" });
    return () => {
      setCanvasStyle({});
    };
  }, []);

  useEffect(() => {
    if (cameraGroupRef.current) {
      const tw = animateBreathing(cameraGroupRef.current);
      return () => {
        tw.stopChainedTweens();
      };
    }
  }, [cameraAnimation]);

  const pointsRef = useRef<THREE.Points>(null);
  const light = useRef<THREE.SpotLight>(null);
  useFrame(() => {
    TWEEN.update();
  });

  // useHelper(light, THREE.SpotLightHelper);

  useInterval(() => {
    if (stageGroupRef.current) {
      
      animateStageTurnBy(stageGroupRef.current, 5, 900)
    }
  }, 900);

  useEffect(() => {
    if (light.current && pointsRef.current) {
      light.current.target = pointsRef.current;
    }
      if (stageGroupRef.current) {
      
    }
  }, []);

  const houses = useMemo(() => new Array(30).fill(null).map((_, i) => {
    const buildingProps = buildingGenerator(1, [3, 0,3], [3, 8, 3, 1], 3, [30, 20, 30], i % 2, 10, .7, i);
    return <Building key={i} {...buildingProps} material={<meshLambertMaterial color={COLORS.white}/>}/>
  }), [])

  console.log(INVERTED_COLORS)
  return (
    <>
      <color attach="background" args={[INVERTED_COLORS.white]}/>
      <fog attach="fog" args={[INVERTED_COLORS.white, 10,  300]}/>
      <CenteredGroup
        ref={cameraGroupRef}
        position={[-450, 12, 5]}
        size={[0.6, 1.64, 0.35]}
        rotation-y={degToRad(-35)}
      >
        <PerspectiveCamera
          makeDefault
          args={[45, undefined, 0.1, 500]}
          position={[0, 1.64, 0]}
        />
        <points ref={pointsRef} position={[-0.1, .5, -20]} />
        <spotLight
          ref={light}
          color={COLORS.black}
          intensity={.5}
          angle={degToRad(17)}
          penumbra={0.4}
          position={[0, 1.2, 0]}
          castShadow
        />
      </CenteredGroup>

      <CenteredGroup ref={stageGroupRef} size={[500, 0, 500]}>
        <RadialLayout face="x" axis="y" radius={250} mode="spread" position={[0, -250+33, 0]}>
          {houses}
        </RadialLayout>
        <mesh position={[0, 0, 0]} receiveShadow castShadow={false}>
          <cylinderGeometry args={[500, 15, 1]} />
          <meshLambertMaterial color={COLORS.white} />
        </mesh>
      </CenteredGroup>
    </>
  );
}

function animateStageTurnBy(obj: THREE.Object3D,
  angle: number,
  duration = 300) {
    return animateStageTurnTo(obj, angle + radToDeg(obj.rotation.y), duration)
}

function animateStageTurnTo(
  obj: THREE.Object3D,
  angle: number,
  duration = 300
) {
  const tw = new TWEEN.Tween({ ya: obj.rotation.y })
    .to({ ya: degToRad(angle) }, duration)
    // .easing(TWEEN.Easing.Cubic.InOut)
    .onUpdate(({ ya }) => {
      obj.rotation.y = ya;
    });

  return tw.start();
}

function animateBreathing(
  obj: THREE.Object3D,
  height = 0.05,
  rotate = 0.05,
  duration = 1000
) {
  rotate = degToRad(rotate);
  const exhale = new TWEEN.Tween({
    y: obj.position.y,
    xa: obj.rotation.x,
    za: obj.rotation.z,
  })
    .easing(TWEEN.Easing.Cubic.Out)
    .to(
      {
        y: obj.position.y - height,
        xa: obj.rotation.x + rotate,
        za: obj.rotation.z - rotate,
      },
      duration
    )
    .onUpdate(({ y, xa, za }) => {
      obj.position.y = y;
      obj.rotation.x = xa;
      obj.rotation.z = za;
    });

  const inhale = new TWEEN.Tween({
    y: obj.position.y - height,
    xa: obj.rotation.x + rotate,
    za: obj.rotation.z - rotate,
  })
    .to({ y: obj.position.y, xa: obj.rotation.x, za: obj.rotation.z }, duration)
    .repeatDelay(duration / 8)
    .easing(TWEEN.Easing.Cubic.Out)
    .onUpdate(({ y, xa, za }) => {
      obj.position.y = y;
      obj.rotation.x = xa;
      obj.rotation.z = za;
    })
    .chain(exhale);

  exhale.chain(inhale);

  return inhale.start();
}
