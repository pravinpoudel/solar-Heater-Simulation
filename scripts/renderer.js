if (module.hot) {
  module.hot.accept();
}

import "../styles/style.css";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import Stats from "three/examples/jsm/libs/stats.module";
import { GUI } from "dat.gui";
import { CanvasTexture } from "three";

let camera, renderer;
const scene = new THREE.Scene();
scene.background = new THREE.Color(0xffe9c0);
const stats = Stats();
const gui = new GUI();
const clock = new THREE.Clock();
let controls;
let collectorPosition = new THREE.Vector3(-50, 10, 0);
let tankPosition = new THREE.Vector3(50, 10, 0);
let texture1, texture2;

function init() {
  scene.position.set(0, 0, 0); // it is default value but for sanity
  camera = new THREE.PerspectiveCamera(
    60,
    window.innerWidth / window.innerHeight,
    1,
    10000
  );
  camera.position.set(0, 200, 0);
  camera.lookAt(0, 0, 0);
  renderer = new THREE.WebGLRenderer();
  renderer.shadowMap.enabled = true;
  renderer.setSize(window.innerWidth, window.innerHeight);
  document.body.appendChild(renderer.domElement);
  controls = new OrbitControls(camera, renderer.domElement);

  window.addEventListener("resize", onWindowResize, false);
  document.body.appendChild(stats.dom);

  const size = 200;
  const divisions = 20;

  const gridHelper = new THREE.GridHelper(size, divisions);
  scene.add(gridHelper);
  texture1 = createPipe(80, 10, "right", -10, 5, 40);
  texture2 = createPipe(80, 10, "left", -10, 5, -40);
}

function addCollector_Tank(collectorPosition, tankPosition) {
  const tankGeometry = new THREE.PlaneGeometry(50, 90);
  const tankMaterial = new THREE.MeshBasicMaterial({
    color: 0xffff00,
    side: THREE.DoubleSide,
  });

  const collectorGeometry = new THREE.PlaneGeometry(20, 50);
  const collectorMaterial = new THREE.MeshBasicMaterial({
    color: 0xffcc00,
    side: THREE.DoubleSide,
  });

  let collector = new THREE.Mesh(collectorGeometry, collectorMaterial);
  collector.rotation.x = Math.PI * 0.5;
  let tank = new THREE.Mesh(tankGeometry, tankMaterial);
  tank.rotation.x = Math.PI * 0.5;
  scene.add(tank);
  scene.add(collector);

  tank.position.copy(tankPosition);
  collector.position.copy(collectorPosition);
}

function createPipe(height, radius, direction, x, y, z) {
  let pipeGroup = new THREE.Group();
  // flow direction
  let canvas = document.createElement("canvas");
  canvas.width = 40;
  canvas.height = 40;
  let context = canvas.getContext("2d");
  context.fillStyle = "rgba(0, 0, 0, 1)";
  context.translate(20, 20);
  context.textAlign = "center";
  context.textBaseline = "middle";
  context.font = "40px sans-serif";
  context.fillText("➡", 0, 0);

  let texture = new CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.x = 5;
  texture.repeat.y = 1;

  const stripGeometry = new THREE.PlaneGeometry(height, radius);
  const stripMaterial = new THREE.MeshBasicMaterial({
    map: texture,
    opacity: 1,
    side: THREE.DoubleSide,
    depthWrite: false,
    depthTest: false,
    transparent: true,
  });

  const stripeMesh = new THREE.Mesh(stripGeometry, stripMaterial);
  scene.add(stripeMesh);

  stripeMesh.rotation.y = 0.5 * Math.PI;
  stripeMesh.rotation.z = 0.5 * Math.PI;
  const _cylidnerGeometery = new THREE.PlaneGeometry(height, radius);
  const _cylinderMaterial = new THREE.MeshBasicMaterial({
    color: "white",
    opacity: 0.2,
    side: THREE.DoubleSide,
    depthWrite: false,
    depthTest: false,
    transparent: true,
  });

  const _cylinder = new THREE.Mesh(_cylidnerGeometery, _cylinderMaterial);
  _cylinder.rotation.y = Math.PI * 0.5;
  _cylinder.rotation.z = Math.PI * 0.5;
  pipeGroup.add(_cylinder);
  pipeGroup.add(stripeMesh);
  let directionVector = direction == "right" ? 1 : -1;
  pipeGroup.rotation.z = directionVector * 0.5 * Math.PI;
  pipeGroup.position.x = x;
  pipeGroup.position.y = y;
  pipeGroup.position.z = z;
  scene.add(pipeGroup);
  return texture;
}
function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  render();
}

function animate() {
  addCollector_Tank(collectorPosition, tankPosition);
  let deltaTime = clock.getDelta();
  texture1.offset.x -= deltaTime;
  texture2.offset.x -= deltaTime;
  render();
  stats.update();
  requestAnimationFrame(animate);
}

function render() {
  controls.update(clock.getDelta());
  renderer.render(scene, camera);
}

init();
animate();
