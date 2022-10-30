import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);

init();
function init() {
  const renderer = new THREE.WebGLRenderer({
    canvas: document.getElementById("three-window"),
  });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.outputEncoding = THREE.sRGBEncoding;
  renderer.shadowMap.enabled = true;
  renderer.antialias = true;
  // scene.background = new THREE.Color(0xffffff);
  // scene.fog = new THREE.Fog(0xffffff, 2, 500);

  const control = new OrbitControls(camera, renderer.domElement)

  const light = new THREE.HemisphereLight(0x000000, 0xffffff, 0.2);
  light.color.setHSL(0.6, 1, 0);
  light.groundColor.setHSL(0.095, 1, 0.75);
  light.position.set(0, 50, 0);

  const hemiLightHelper = new THREE.HemisphereLightHelper( light, 10 );
  		scene.add( hemiLightHelper );
  scene.add(light);

  const dirLight = new THREE.DirectionalLight(0x000000, 1);
  dirLight.color.setHSL(0.1, 1, 0.95);
  dirLight.position.set(-1, 1.75, 1);
  dirLight.position.multiplyScalar(30);
  scene.add(dirLight);

  dirLight.castShadow = true;

  dirLight.shadow.mapSize.width = 2048;
  dirLight.shadow.mapSize.height = 2048;

  const d = 50;

  dirLight.shadow.camera.left = -d;
  dirLight.shadow.camera.right = d;
  dirLight.shadow.camera.top = d;
  dirLight.shadow.camera.bottom = -d;

  dirLight.shadow.camera.far = 3500;
  dirLight.shadow.bias = -0.0001;

  const dirLightHelper = new THREE.DirectionalLightHelper( dirLight, 10 );
  scene.add( dirLightHelper );

  const geometry = new THREE.CylinderGeometry(500, 500, 1);
  const material = new THREE.MeshPhongMaterial({
    color: 0xdddddd,
    specular: 0x009900,
    shininess: 30,
    transparent: false,
  });
  const cube = new THREE.Mesh(geometry, material);
  scene.add(cube);

  camera.position.x = 450;
  camera.position.y = 20;
  camera.position.z = 90;

  camera.rotation.x = -0.2;
  camera.rotation.y = 0.7;
  camera.rotation.z = 0.2;
  control.update()
  // camera.position.x = -500;

  scene.add(new THREE.GridHelper(500, 500))
  scene.add(new THREE.AxesHelper(10))
  const loader = new THREE.TextureLoader()
  const pic = new THREE.PlaneGeometry(1100, 1280)
  const pic_face = new THREE.MeshBasicMaterial({map: loader.load('/artworks/6ba2aaee-35f7-4695-b627-fa7b076a011a/IMAGE 2022-10-21 12:10:59.jpg')})
  const pic_mesh = new THREE.Mesh(pic, pic_face)
  scene.add(pic_mesh)



  animate();

  function animate() {
    requestAnimationFrame(animate);

    // s

    renderer.render(scene, camera);
  }
}