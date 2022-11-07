import React, { Suspense } from "react";
import { Canvas } from "@react-three/fiber";
import { Stage, Center, OrbitControls } from "@react-three/drei";

export default function StageDecorator(StoryFn, options) {
  return (
    <Suspense fallback={null}>
      {options.args.noStage ? (
        <StoryFn />
      ) : (
        <Canvas>
          <Stage>
            {options.args.noLight ? null : <ambientLight color={0xffffff} />}
            <Center>
              <StoryFn />
            </Center>
            {options.args.noControls ? null : <OrbitControls />}
          </Stage>
        </Canvas>
      )}
    </Suspense>
  );
}
