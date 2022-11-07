import React, { useEffect, useRef, useState } from "react";
import * as TWEEN from "@tweenjs/tween.js";
import * as THREE from "three";
import { PerspectiveCamera, useHelper } from "@react-three/drei";
import { degToRad, radToDeg } from "../util";
import { INVERTED_COLORS, COLORS, useCanvasStyle } from "./ThreeApp";
import { useFrame } from "@react-three/fiber";
import TwoPacksTube from "./TwoPacksTube";
import CenteredGroup from "./CenteredGroup";
import { editable as e } from "@theatre/r3f";
import RadialLayout from "./RadialLayout";
import { useInterval } from "react-use";
import Building from "./Building";

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

  useHelper(light, THREE.SpotLightHelper);

  useInterval(() => {
    if (stageGroupRef.current) {
      animateStageTurnBy(stageGroupRef.current, 5, 300);
    }
  }, 300);

  useEffect(() => {
    if (light.current && pointsRef.current) {
      light.current.target = pointsRef.current;
    }
  }, []);
  const EditableCamera = e(PerspectiveCamera, 'perspectiveCamera')

  return (
    <>
      <ambientLight color={COLORS.white}/>
      <EditableCamera
        makeDefault
        args={[70, undefined, 0.1, 1000]}
        position={[0, 900, 0]}
        rotation-x={degToRad(-90)}
        theatreKey='perspectiveCamera'
      />
      <CenteredGroup
        ref={cameraGroupRef}
        position={[-450, 12, 5]}
        size={[0.6, 1.64, 0.35]}
        rotation-y={degToRad(-35)}
      >
        <points ref={pointsRef} position={[-0.1, 0, -20]} />
        <spotLight
          ref={light}
          color={COLORS.white}
          intensity={0.5}
          angle={degToRad(17)}
          penumbra={0.4}
          position={[0, 1.2, 0]}
          castShadow
        />
      </CenteredGroup>

      <CenteredGroup ref={stageGroupRef} size={[500, 0, 500]}>
        <mesh position={[0, 0, 0]}>
          <cylinderGeometry args={[500, 15, 1]} />
          <meshPhongMaterial color={COLORS.white} />
        </mesh>
        <RadialLayout face="x" axis="y" radius={250} mode="spread" position={[0, -200, 0]}>
          <group position={[100, 0, 0]}>
            <mesh position={[0, 1, 0]}>
              <boxGeometry args={[2, 2, 1]} />
              <meshPhongMaterial
                color={INVERTED_COLORS.white}
                specular={INVERTED_COLORS.black}
              />
            </mesh>
            <TwoPacksTube
              scale={[0.01, 0.01, 0.01]}
              position={[0, 17, 0]}
              rotation-y={degToRad(90)}
            />
          </group>
          <Building atrium={[100, 100, 100]} boundaries={[100, 100, 100]} levels={4}/>
          <Building atrium={[100, 100, 100]} boundaries={[100, 100, 100]} levels={4}/>
          <Building atrium={[100, 100, 100]} boundaries={[100, 100, 100]} levels={4}/>
          <Building atrium={[100, 100, 100]} boundaries={[100, 100, 100]} levels={4}/>
          <Building atrium={[100, 100, 100]} boundaries={[100, 100, 100]} levels={4}/>
          <Building atrium={[100, 100, 100]} boundaries={[100, 100, 100]} levels={4}/><Building atrium={[100, 100, 100]} boundaries={[100, 100, 100]} levels={4}/>
          <Building atrium={[100, 100, 100]} boundaries={[100, 100, 100]} levels={4}/>
          <Building atrium={[100, 100, 100]} boundaries={[100, 100, 100]} levels={4}/>
          <Building atrium={[100, 100, 100]} boundaries={[100, 100, 100]} levels={4}/>
          <Building atrium={[100, 100, 100]} boundaries={[100, 100, 100]} levels={4}/>
          <Building atrium={[100, 100, 100]} boundaries={[100, 100, 100]} levels={4}/><Building atrium={[100, 100, 100]} boundaries={[100, 100, 100]} levels={4}/>
          <Building atrium={[100, 100, 100]} boundaries={[100, 100, 100]} levels={4}/>
          <Building atrium={[100, 100, 100]} boundaries={[100, 100, 100]} levels={4}/><Building atrium={[100, 100, 100]} boundaries={[100, 100, 100]} levels={4}/>
          <Building atrium={[100, 100, 100]} boundaries={[100, 100, 100]} levels={4}/>
          <Building atrium={[100, 100, 100]} boundaries={[100, 100, 100]} levels={4}/><Building atrium={[100, 100, 100]} boundaries={[100, 100, 100]} levels={4}/>
          <Building atrium={[100, 100, 100]} boundaries={[100, 100, 100]} levels={4}/>
          <Building atrium={[100, 100, 100]} boundaries={[100, 100, 100]} levels={4}/><Building atrium={[100, 100, 100]} boundaries={[100, 100, 100]} levels={4}/>
          <Building atrium={[100, 100, 100]} boundaries={[100, 100, 100]} levels={4}/>
          <Building atrium={[100, 100, 100]} boundaries={[100, 100, 100]} levels={4}/>

          <group position={[100, 1, 0]}>
            <mesh position={[0, 1, 0]}>
              <boxGeometry args={[2, 2, 1]} />
              <meshPhongMaterial
                color={INVERTED_COLORS.white}
                specular={INVERTED_COLORS.black}
              />
            </mesh>
            <TwoPacksTube
              scale={[0.01, 0.01, 0.01]}
              position={[0, 17, 0]}
              rotation-y={degToRad(90)}
            />
          </group>
          <Building atrium={[100, 100, 100]} boundaries={[100, 100, 100]} levels={4}/>
          <Building atrium={[100, 100, 100]} boundaries={[100, 100, 100]} levels={4}/>
          <Building atrium={[100, 100, 100]} boundaries={[100, 100, 100]} levels={4}/>
          <Building atrium={[100, 100, 100]} boundaries={[100, 100, 100]} levels={4}/>
          <Building atrium={[100, 100, 100]} boundaries={[100, 100, 100]} levels={4}/>
          <Building atrium={[100, 100, 100]} boundaries={[100, 100, 100]} levels={4}/><Building atrium={[100, 100, 100]} boundaries={[100, 100, 100]} levels={4}/>
          <Building atrium={[100, 100, 100]} boundaries={[100, 100, 100]} levels={4}/>
          <Building atrium={[100, 100, 100]} boundaries={[100, 100, 100]} levels={4}/>
          <Building atrium={[100, 100, 100]} boundaries={[100, 100, 100]} levels={4}/>
          <Building atrium={[100, 100, 100]} boundaries={[100, 100, 100]} levels={4}/>
          <Building atrium={[100, 100, 100]} boundaries={[100, 100, 100]} levels={4}/><Building atrium={[100, 100, 100]} boundaries={[100, 100, 100]} levels={4}/>
          <Building atrium={[100, 100, 100]} boundaries={[100, 100, 100]} levels={4}/>
          <Building atrium={[100, 100, 100]} boundaries={[100, 100, 100]} levels={4}/><Building atrium={[100, 100, 100]} boundaries={[100, 100, 100]} levels={4}/>
          <Building atrium={[100, 100, 100]} boundaries={[100, 100, 100]} levels={4}/>
          <Building atrium={[100, 100, 100]} boundaries={[100, 100, 100]} levels={4}/><Building atrium={[100, 100, 100]} boundaries={[100, 100, 100]} levels={4}/>
          <Building atrium={[100, 100, 100]} boundaries={[100, 100, 100]} levels={4}/>
          <Building atrium={[100, 100, 100]} boundaries={[100, 100, 100]} levels={4}/><Building atrium={[100, 100, 100]} boundaries={[100, 100, 100]} levels={4}/>
          <Building atrium={[100, 100, 100]} boundaries={[100, 100, 100]} levels={4}/>
          <Building atrium={[100, 100, 100]} boundaries={[100, 100, 100]} levels={4}/>
          <group position={[100, 1, 0]}>
            <mesh position={[0, 1, 0]}>
              <boxGeometry args={[2, 2, 1]} />
              <meshPhongMaterial
                color={INVERTED_COLORS.white}
                specular={INVERTED_COLORS.black}
              />
            </mesh>
            <TwoPacksTube
              scale={[0.01, 0.01, 0.01]}
              position={[0, 17, 0]}
              rotation-y={degToRad(90)}
            />
          </group>
          <Building atrium={[100, 100, 100]} boundaries={[100, 100, 100]} levels={4}/>
          <Building atrium={[100, 100, 100]} boundaries={[100, 100, 100]} levels={4}/>
          <Building atrium={[100, 100, 100]} boundaries={[100, 100, 100]} levels={4}/>
          <Building atrium={[100, 100, 100]} boundaries={[100, 100, 100]} levels={4}/>
          <Building atrium={[100, 100, 100]} boundaries={[100, 100, 100]} levels={4}/>
          <Building atrium={[100, 100, 100]} boundaries={[100, 100, 100]} levels={4}/><Building atrium={[100, 100, 100]} boundaries={[100, 100, 100]} levels={4}/>
          <Building atrium={[100, 100, 100]} boundaries={[100, 100, 100]} levels={4}/>
          <Building atrium={[100, 100, 100]} boundaries={[100, 100, 100]} levels={4}/>
          <Building atrium={[100, 100, 100]} boundaries={[100, 100, 100]} levels={4}/>
          <Building atrium={[100, 100, 100]} boundaries={[100, 100, 100]} levels={4}/>
          <Building atrium={[100, 100, 100]} boundaries={[100, 100, 100]} levels={4}/><Building atrium={[100, 100, 100]} boundaries={[100, 100, 100]} levels={4}/>
          <Building atrium={[100, 100, 100]} boundaries={[100, 100, 100]} levels={4}/>
          <Building atrium={[100, 100, 100]} boundaries={[100, 100, 100]} levels={4}/><Building atrium={[100, 100, 100]} boundaries={[100, 100, 100]} levels={4}/>
          <Building atrium={[100, 100, 100]} boundaries={[100, 100, 100]} levels={4}/>
          <Building atrium={[100, 100, 100]} boundaries={[100, 100, 100]} levels={4}/><Building atrium={[100, 100, 100]} boundaries={[100, 100, 100]} levels={4}/>
          <Building atrium={[100, 100, 100]} boundaries={[100, 100, 100]} levels={4}/>
          <Building atrium={[100, 100, 100]} boundaries={[100, 100, 100]} levels={4}/><Building atrium={[100, 100, 100]} boundaries={[100, 100, 100]} levels={4}/>
          <Building atrium={[100, 100, 100]} boundaries={[100, 100, 100]} levels={4}/>
          <Building atrium={[100, 100, 100]} boundaries={[100, 100, 100]} levels={4}/>
        </RadialLayout>
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
    .easing(TWEEN.Easing.Cubic.InOut)
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
