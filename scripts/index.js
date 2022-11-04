import * as THREE from "three";
// import {
//   SMAAEffect,
//   SMAAPreset,
//   EdgeDetectionMode,
//   BlendFunction,
//   TextureEffect,
//   SelectiveBloomEffect,
//   EffectComposer,
//   EffectPass,
//   RenderPass,
// } from "postprocessing";
import * as TWEEN from "@tweenjs/tween.js";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import { SVGLoader } from "three/examples/jsm/loaders/SVGLoader";

const white = 0xf9f9f9;
const in_white = 0x060606;
const black = 0x7e7f7a;
const in_black = 0x818085;

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(
  90,
  window.innerWidth / window.innerHeight,
  0.1,
  10000
);

const fillMaterial = new THREE.MeshPhongMaterial({ color: white });
const strokeMaterial = new THREE.MeshToonMaterial({
  color: white,
  transparent: true,
  // fog: false,
});

// strokeMaterial.emissive = in_black
// strokeMaterial.emissiveIntensity = 0

const canvas = document.getElementById("three-window");
const renderer = new THREE.WebGLRenderer({
  canvas,
});

// const composer = new EffectComposer(renderer);
init();
function init() {
  const control = new OrbitControls(camera, renderer.domElement);

  // composer.addPass(new RenderPass(scene, camera));
  // const smaaEffect = new SMAAEffect({
  //   preset: SMAAPreset.HIGH,
  //   edgeDetectionMode: EdgeDetectionMode.COLOR,
  // });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.outputEncoding = THREE.sRGBEncoding;
  renderer.shadowMap.enabled = true;
  renderer.antialias = true;
  scene.background = new THREE.Color(in_white);
  scene.fog = new THREE.Fog(in_white, 20, 500);

  // const light = new THREE.HemisphereLight(white, black, 0.2);
  // // light.color.setHSL(0.6, 1, 0);
  // // light.groundColor.setHSL(0.095, 1, 0.75);
  // light.position.set(0, 50, 0);

  // const hemiLightHelper = new THREE.HemisphereLightHelper( light, 10 );
  // 		scene.add( hemiLightHelper );
  // scene.add(light);

  // const dirLight = new THREE.DirectionalLight(in_black, 1);
  // // dirLight.color.setHSL(0.1, 1, 0.95);
  // dirLight.position.set(-1, 1.75, 1);
  // dirLight.position.multiplyScalar(30);
  // scene.add(dirLight);

  // dirLight.castShadow = true;

  // dirLight.shadow.mapSize.width = 2048;
  // dirLight.shadow.mapSize.height = 2048;

  // const d = 50;

  // dirLight.shadow.camera.left = -d;
  // dirLight.shadow.camera.right = d;
  // dirLight.shadow.camera.top = d;
  // dirLight.shadow.camera.bottom = -d;

  // dirLight.shadow.camera.far = 3500;
  // dirLight.shadow.bias = -0.0001;

  // const dirLightHelper = new THREE.DirectionalLightHelper(dirLight, 10);
  // scene.add(dirLightHelper);

  // const geometry = new THREE.CylinderGeometry(20, 20, 500);
  // const material = new THREE.MeshPhongMaterial({
  //   color: black,
  //   specular: black,
  //   shininess: 30,
  //   transparent: false,
  // });
  // const stage = new THREE.Mesh(geometry, material);
  // scene.add(stage);

  camera.position.x = 75;
  camera.position.y = 150;
  camera.position.z = 100;

  camera.rotation.x = 0;
  camera.rotation.y = 1;
  camera.rotation.z = 0;
  // control.update();
  // camera.position.x = -500;

  // scene.add(new THREE.GridHelper(500, 500));
  // scene.add(new THREE.AxesHelper(10));
  // const loader = new THREE.TextureLoader();
  // const pic = new THREE.PlaneGeometry(1100, 1280);
  // const pic_face = new THREE.MeshBasicMaterial({
  //   map: loader.load(
  //     "/artworks/6ba2aaee-35f7-4695-b627-fa7b076a011a/inverted.jpg"
  //   ),
  // });
  // const pic_mesh = new THREE.Mesh(pic, pic_face);
  // pic_mesh.scale.set(0.1, 0.1, 0.1);
  // pic_mesh.position.set(-60, 20, 10);
  // scene.add(pic_mesh);

  const url = "/twopacks.svg";
  const svgLoader = new SVGLoader();
  // const bloom = new SelectiveBloomEffect(scene, camera, {});
  svgLoader.load(url, (d) => {
    const { object, update } = loadSVGData(6, d);
    object.scale.set(0.1, -0.1, 0.1);
    scene.add(object);
    
    const box = new THREE.Box3().setFromObject(object);
    const size = box.getSize(new THREE.Vector3());
    
    object.position.set(-size.x - 15, size.y + 100, 12);
    const position = object.position
    const light = new THREE.PointLight(in_black, 1, 100, 2)
    light.position.set(position.x, position.y - size.y/2, position.z)
    scene.add(light);
    const light2 = new THREE.PointLight(in_black, 1, 100, 2)
    light2.position.set(position.x + size.x*.8, position.y - size.y/2, position.z)
    scene.add(light2);
    const light3 = new THREE.PointLight(in_black, 1, 100, 2)
    light3.position.set(position.x + size.x*.1, position.y, position.z)
    scene.add(light3);
    const light4 = new THREE.PointLight(in_black, 1, 100, 2)
    light4.position.set(position.x + size.x*.1, position.y - size.y * .9, position.z)
    scene.add(light4);
    const light5 = new THREE.PointLight(in_black, 1, 100, 2)
    light5.position.set(position.x + size.x*.7, position.y - size.y * .9, position.z)
    scene.add(light5);
    const light6 = new THREE.PointLight(in_black, 1, 100, 2)
    light6.position.set(position.x + size.x*.7, position.y, position.z)
    scene.add(light6);
    
  });
  const house = randomHouse()
  scene.add(house)

  animateCameraBreathing()
  

  requestAnimationFrame(function animate(time) {
    requestAnimationFrame(animate);
  
    TWEEN.update(time)
  
    renderer.render(scene, camera)
  })
}

function animateCameraBreathing(height = .5, duration = 700) {
  const exhale = new TWEEN.Tween({y: camera.position.y+height})
  .easing(TWEEN.Easing.Cubic.Out)
  .to({ y: camera.position.y-height}, duration)
  .onUpdate(({y}) => {
    camera.position.y = y
  })

  const inhale = new TWEEN.Tween({y: camera.position.y-height})
    .to({ y: camera.position.y + height}, duration)
    .easing(TWEEN.Easing.Cubic.In)
    .onUpdate(({y}) => {
      camera.position.y = y
    })
    .chain(exhale)

  exhale.chain(inhale)

  return inhale.start()
}

function randomHouse(mx=200, my=200, mz=200) {
  const w = mx + mx * Math.random(), h = my + my * Math.random(), d = mz+ mz * Math.random();
  const center = new THREE.BoxGeometry(w, h, d);
  const mesh = new THREE.Mesh(center, fillMaterial);
  mesh.translateX(-w/2)
  mesh.translateY(h/2)
  mesh.translateZ(-d/2)
  return mesh
}

function loadSVGData(extrusion, svgData) {
  const svgGroup = new THREE.Group();
  const updateMap = [];

  svgData.paths.forEach((path) => {
    path.currentPath.curves.forEach((c2, i) => {
      let c3;
      switch (c2.type) {
        case "LineCurve": {
          c3 = new THREE.LineCurve3(
            new THREE.Vector3(c2.v1.x, c2.v1.y, 0),
            new THREE.Vector3(c2.v2.x, c2.v2.y, 0)
          );
          break;
        }
        case "QuadraticBezierCurve": {
          c3 = new THREE.QuadraticBezierCurve3(
            new THREE.Vector3(c2.v0.x, c2.v0.y, 0),
            new THREE.Vector3(c2.v1.x, c2.v1.y, 0),
            new THREE.Vector3(c2.v2.x, c2.v2.y, 0)
          );
          break;
        }
        case "CubicBezierCurve": {
          c3 = new THREE.CubicBezierCurve3(
            new THREE.Vector3(c2.v0.x, c2.v0.y, 0),
            new THREE.Vector3(c2.v1.x, c2.v1.y, 0),
            new THREE.Vector3(c2.v2.x, c2.v2.y, 0),
            new THREE.Vector3(c2.v3.x, c2.v3.y, 0)
          );
          break;
        }
      }
      const geometry = new THREE.TubeGeometry(
        c3,
        undefined,
        extrusion,
        extrusion/2,
        path.autoClose
      );
      const mesh = new THREE.Mesh(geometry, strokeMaterial);
      svgGroup.add(mesh);
    });

    const box = new THREE.Box3().setFromObject(svgGroup);
    const size = box.getSize(new THREE.Vector3());
    const yOffset = size.y / -2;
    const xOffset = size.x / -2;

    // Offset all of group's elements, to center them
    svgGroup.children.forEach((item) => {
      item.position.x = xOffset;
      item.position.y = yOffset;
    });
    svgGroup.rotateX(-Math.PI / 2);
  });
  return {
    object: svgGroup,
    update(extrusion) {
      // updateMap.forEach((updateDetails) => {
      //   const meshGeometry = new THREE.ExtrudeGeometry(updateDetails.shape, {
      //     depth: extrusion,
      //     bevelEnabled: false,
      //   });
      //   const linesGeometry = new THREE.EdgesGeometry(meshGeometry);
      //   updateDetails.mesh.geometry.dispose();
      //   updateDetails.lines.geometry.dispose();
      //   updateDetails.mesh.geometry = meshGeometry;
      //   updateDetails.lines.geometry = linesGeometry;
      // });
    },
  };
}
