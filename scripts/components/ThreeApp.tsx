import React, { useEffect, useRef } from "react";
import { Canvas } from "@react-three/fiber";
import { createStateContext } from "react-use";
import Marseille from "./Marseille";
import styleVars from "../../sass/_variables.module.scss";
import * as THREE from "three";
import { getProject } from '@theatre/core'
import studio from '@theatre/studio'
import extension from '@theatre/r3f/dist/extension'
import { SheetProvider } from '@theatre/r3f'


studio.initialize()
studio.extend(extension)

const demoSheet = getProject('Demo Project').sheet('Demo Sheet')

export const COLORS = {
  black: styleVars.cBlack,
  white: styleVars.cWHite,
  success: styleVars.cSuccess,
  danger: styleVars.cDanger,
};
export const INVERTED_COLORS = {
  black: styleVars.ciBlack,
  white: styleVars.ciWHite,
  success: styleVars.ciSuccess,
  danger: styleVars.ciDanger,
};
export const ALPHA = {
  sm: parseFloat(styleVars.caSm),
  base: parseFloat(styleVars.caBase),
  lg: parseFloat(styleVars.caLg),
};
export const SCREEN = {
  sm: parseFloat(styleVars.screenSm),
  base: parseFloat(styleVars.screenBase),
  lg: parseFloat(styleVars.screenLg),
};

const [useCanvasStyle, CanvasStyleProvider] = createStateContext(
  {} as React.CSSProperties
);

function ThreeAppInner() {
  const [style] = useCanvasStyle();
 
  return (
    <>
      <Canvas className="ThreeApp" style={style}>
        <SheetProvider sheet={demoSheet}>
          <Marseille />
          <primitive object={new THREE.AxesHelper(5000)} />
        </SheetProvider>
      </Canvas>
    </>
  );
}

export default function ThreeApp() {
  return (
    <CanvasStyleProvider>
        <ThreeAppInner />
    </CanvasStyleProvider>
  );
}

export { useCanvasStyle };
