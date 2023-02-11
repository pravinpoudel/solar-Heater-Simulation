if (module.hot) {
  module.hot.accept();
}

import "../styles/style.css";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import { stratumUpdate, heatCalculatorUpdate } from "./heatCalculator";
import { createPipe, createTank } from "./createObject";

let camera, renderer;
const scene = new THREE.Scene();
scene.background = new THREE.Color(0xffffff);
const clock = new THREE.Clock();
let controls;
let collectorPosition = new THREE.Vector3(-60, 10, 0);
let tankPosition = new THREE.Vector3(50, 10, 0);
let texture1,
  texture2,
  texture3,
  texture4,
  pipe_top,
  pipe_bottom,
  pipe_top_left,
  pipe_bottom_left;

let commonUniform = {
  time: { value: 0 },
};

let tank;
let collector;
const tankSize = new THREE.Vector2(50, 180);
const collectorSize = new THREE.Vector2(20, 40);
let ambientTemp = 20;
let done = false;

function init() {
  scene.position.set(0, 0, 0); // it is default value but for sanity
  camera = new THREE.PerspectiveCamera(
    60,
    window.innerWidth / window.innerHeight,
    1,
    1000
  );
  camera.position.set(0, 380, 0);
  camera.lookAt(0, 0, 0);
  const size = 400;
  const divisions = 30;
  const gridHelper = new THREE.GridHelper(
    size,
    divisions,
    new THREE.Color(0xff0000),
    new THREE.Color(0x4b5320)
  );
  scene.add(gridHelper);
  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  document.body.appendChild(renderer.domElement);
  controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.minPolarAngle = 0.0;
  controls.maxPolarAngle = 0.1 * Math.PI;
  controls.minAzimuthAngle = -Infinity;
  controls.maxAzimuthAngle = Infinity;
  controls.minDistance = 300.0;
  controls.maxDistance = 400.0;
  window.addEventListener("resize", onWindowResize, false);

  let loader = new THREE.TextureLoader();
  loader.load("./public/rainbow.png", function (texture) {
    tank = createTank(tankPosition, texture, tankSize, "down", 0.2);
    collector = createTank(
      collectorPosition,
      texture,
      collectorSize,
      "up",
      0.0
    );
    var path = [
      new THREE.Vector3(5, -5, 0),
      new THREE.Vector3(1, 0, 0),
      new THREE.Vector3(10, 0, 0),
      new THREE.Vector3(10, 2, 0),
      new THREE.Vector3(1, 5, 0),
      new THREE.Vector3(10, 5, 0),
      new THREE.Vector3(10, 7, 0),
      new THREE.Vector3(1, 12, 0),
      new THREE.Vector3(10, 12, 0),
      new THREE.Vector3(1, 17, 0),
      new THREE.Vector3(10, 17, 0),
      new THREE.Vector3(1, 22, 0),
      new THREE.Vector3(10, 22, 0),
      new THREE.Vector3(1, 22, 0),
      new THREE.Vector3(10, 22, 0),
      new THREE.Vector3(1, 27, 0),
      new THREE.Vector3(10, 27, 0),
      new THREE.Vector3(1, 32, 0),
      new THREE.Vector3(10, 32, 0),
      new THREE.Vector3(3, 37, 0),
    ];
    var pathBase = new THREE.CatmullRomCurve3(path);
    var rod_geometry = new THREE.TubeGeometry(pathBase, 1000, 1, 4, false);
    var rod_material = new THREE.MeshBasicMaterial({ color: 0xe94929 });
    var rod = new THREE.Mesh(rod_geometry, rod_material);
    rod.scale.set(1, 1, 0);
    rod.position.z = -2;
    rod.position.x -= 5;
    rod.position.y -= 15;
    // rod.rotation.x = Math.PI / 2;
    rod.renderOrder = 9999;
    collector.add(rod);

    [texture1, pipe_bottom] = createPipe(94, 10, texture, "right", -20, 5, 80);
    pipe_bottom.position.y -= 2;
    [texture2, pipe_top] = createPipe(94, 10, texture, "left", -20, 5, -85);
    pipe_top.position.y += 2;
    [texture3, pipe_top_left] = createPipe(70, 10, texture, "up", -62, 11, -50);
    [texture4, pipe_bottom_left] = createPipe(
      63,
      10,
      texture,
      "up",
      -62,
      10,
      50
    );
    update();
  });
}

function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  render();
}
function isEquillibrium(hot, cold) {
  return hot.toFixed(4) == cold.toFixed(4);
}
function updateUniforms([hotTemp, coldTemp, collectorOutputTemp, strataRatio]) {
  tank.material.userData.uniforms.heatRatio.value = strataRatio;
  tank.material.userData.uniforms.hotTemp.value = hotTemp;
  tank.material.userData.uniforms.coldTemp.value = coldTemp;
  collector.material.userData.uniforms.hotTemp.value = collectorOutputTemp;
  collector.material.userData.uniforms.coldTemp.value = coldTemp;
  pipe_bottom_left.material.uniforms.temperature.value = coldTemp;
  pipe_bottom.material.uniforms.temperature.value = coldTemp;
  pipe_top.material.uniforms.temperature.value = hotTemp;
  pipe_top_left.material.uniforms.temperature.value = hotTemp;
}

function update() {
  let deltaTime = clock.getDelta();

  commonUniform.time.value = clock.getElapsedTime();
  let heatOutput = heatCalculatorUpdate(500);
  if (!isEquillibrium(heatOutput[0], heatOutput[1])) {
    updateUniforms(heatOutput);
    texture1.offset.x -= 0.008;
    texture2.offset.x -= 0.008;
    texture3.offset.x -= 0.02;
    texture4.offset.x -= 0.02;
  }
  render();
  requestAnimationFrame(update);
}

function render() {
  controls.update(clock.getDelta());
  renderer.render(scene, camera);
}

console.clear();
init();

export { scene, commonUniform };
