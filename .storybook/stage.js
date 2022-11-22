import React, { Suspense, useEffect } from "react";
import * as THREE from "three";
import { Canvas } from "@react-three/fiber";
import { Stage, Center, OrbitControls } from "@react-three/drei";
import { getProject } from "@theatre/core";
import studio from "@theatre/studio";
import extension from "@theatre/r3f/dist/extension";
import { SheetProvider } from "@theatre/r3f";
import { Physics, Debug } from "@react-three/rapier";
import {
  CanvasStyleProvider,
  useCanvasStyle,
} from "../scripts/components/ThreeApp";

studio.initialize();
studio.extend(extension);

const demoSheet = getProject("twopack.gallery").sheet("storybook");

export function CanvasStyleDecorator(StoryFn, options) {
  if (options.args.noStage) {
    return <StoryFn />;
  } else {
    return (
      <CanvasStyleProvider>
        <StoryFn />
      </CanvasStyleProvider>
    );
  }
}

export default function StageDecorator(StoryFn, options) {
  return (
    <Suspense fallback={null}>
      {options.args.noStage ? (
        <StoryFn />
      ) : (
        <WithStage StoryFn={StoryFn} options={options} />
      )}
    </Suspense>
  );
}

function WithStage({ StoryFn, options }) {
  const hideStudio = options.args.noTheatre || options.args.noStage;
  const [canvasStyle] = useCanvasStyle();
  useEffect(() => {
    if (hideStudio) {
      studio.ui.hide();
    } else {
      studio.ui.restore();
    }
  }, [hideStudio]);

  return (
    <Canvas
      style={{
        height: "calc(100vh - 2rem)",
        width: "calc(100vw - 2rem)",
        ...canvasStyle,
      }}
      gl={{ preserveDrawingBuffer: true }}
    >
      {options.args.noBackground ? null : (
        <color attach="background" args={[0x999999]} />
      )}
      <SheetProvider sheet={demoSheet}>
        <Stage>
          {options.args.noLight ? null : <ambientLight color={0xffffff} />}
          <Center>
            {options.args.noPhysics ? (
              <StoryFn />
            ) : (
              <Physics {...options.args.physicsProps}>
                {options.args.noDebug ? null : <Debug />}
                <StoryFn />
              </Physics>
            )}
          </Center>
          {options.args.noControls ? null : <OrbitControls makeDefault />}
        </Stage>
        {options.args.noAxes ? null : (
          <primitive object={new THREE.AxesHelper(100)} />
        )}
        {options.args.noGrid ? null : (
          <primitive
            object={new THREE.GridHelper(100, 100, 0x666666, 0x999999)}
          />
        )}
      </SheetProvider>
    </Canvas>
  );
}
