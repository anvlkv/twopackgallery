import { GroupProps, Vector3 } from "@react-three/fiber";
import React, { forwardRef, useMemo } from "react";
import THREE from "three";

export interface IProps extends GroupProps {
  size: Vector3;
}

function CenteredGroup({
  size,
  children,
  ...props
}: React.PropsWithChildren<IProps>, ref) {
  return (
    <group {...props} ref={ref}>
      <group position={[-size[0], -size[1], -size[2]]}>
        <group position={[size[0], size[1], size[2]]}>{children}</group>
      </group>
    </group>
  );
}

export default React.memo(forwardRef<THREE.Group, React.PropsWithChildren<IProps>>(CenteredGroup))