import React, { Suspense, useEffect } from "react";
import * as THREE from 'three'
import { Canvas } from "@react-three/fiber";
import {
  Stage,
  Center,
  OrbitControls,
} from "@react-three/drei";
import { getProject } from "@theatre/core";
import studio from "@theatre/studio";
import extension from "@theatre/r3f/dist/extension";
import { SheetProvider } from "@theatre/r3f";

studio.initialize();
studio.extend(extension);

const demoSheet = getProject("twopack.gallery").sheet("storybook");

export default function StageDecorator(StoryFn, options) {
  const hideStudio = options.args.noTheatre || options.args.noStage;

  useEffect(() => {
    if (hideStudio) {
      studio.ui.hide();
    } else {
      studio.ui.restore();
    }
  }, [hideStudio]);

  return (
    <Suspense fallback={null}>
      {options.args.noStage ? (
        <StoryFn />
      ) : (
        <Canvas style={{height:'calc(100vh - 2rem)', width: 'calc(100vw - 2rem)'}}>
          <SheetProvider sheet={demoSheet}>
            <Stage>
              {options.args.noLight ? null : <ambientLight color={0xffffff} />}
              <Center>
                <StoryFn />
              </Center>
              {options.args.noControls ? null : <OrbitControls makeDefault />}
            </Stage>
            {options.args.noAxes ? null : <primitive object={new THREE.AxesHelper(100)} />}
            {options.args.noGrid ? null : <primitive object={new THREE.GridHelper(100, 100, 0x666666, 0x999999)} />}
          </SheetProvider>
        </Canvas>
      )}
    </Suspense>
  );
}

