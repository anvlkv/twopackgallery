import React, { useEffect, useRef } from "react";
import { Canvas } from "@react-three/fiber";
import * as THREE from "three";
import { createStateContext } from "react-use";
import Marseille from "./Marseille";

import styleVars from "../../sass/_variables.module.scss";

export const COLORS = {
  black: styleVars.cBlack,
  white: styleVars.cWHite,
  success: styleVars.cSuccess,
  danger: styleVars.cDanger,
};
export const INVERTED_COLORS = {
  black: styleVars.ciBlack,
  white: styleVars.ciWhite,
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
        <Marseille />
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
