if (module.hot) {
  module.hot.accept();
}

import "../styles/style.css";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import Stats from "three/examples/jsm/libs/stats.module";
import { GUI } from "dat.gui";
import { CanvasTexture } from "three";
import {
  collectoUsabelHeat,
  computeCollectorOutputTemp,
  computeHeatFlow,
  computeHeatLoss,
  stratumUpdate,
} from "./heatCalculator";
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

let specificHeatCapacity = 4180;
let intialTankTem = 20;
let ambientTemp = 20;
let tankSurfaceArea = 10;
let upriseRate = 0.03;
let tankLossCofficient = 300;
let waterMass = 100;
let Irradiance = 354;
let tankMaterial;
let maxTemp = 50;
let minTemperature = 0;
let colorArray = [
  new THREE.Color(0, 0, 1),
  new THREE.Color(0, 1, 1),
  new THREE.Color(0, 1, 0),
  new THREE.Color(1, 1, 0),
  new THREE.Color(1, 0, 0),
];
let done = false;

function init() {
  scene.position.set(0, 0, 0); // it is default value but for sanity
  camera = new THREE.PerspectiveCamera(
    60,
    window.innerWidth / window.innerHeight,
    1,
    10000
  );
  camera.position.set(0, 300, 50);
  camera.lookAt(0, 0, 0);
  renderer = new THREE.WebGLRenderer();
  renderer.shadowMap.enabled = true;
  renderer.setSize(window.innerWidth, window.innerHeight);
  document.body.appendChild(renderer.domElement);
  controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;

  window.addEventListener("resize", onWindowResize, false);
  document.body.appendChild(stats.dom);

  const size = 200;
  const divisions = 20;

  const gridHelper = new THREE.GridHelper(size, divisions);
  scene.add(gridHelper);
  texture1 = createPipe(80, 10, "right", -10, 5, 40);
  texture2 = createPipe(80, 10, "left", -10, 5, -40);
  addCollector_Tank(collectorPosition, tankPosition);
}
const beforeCompileShader = (shader) => {
  shader.uniforms.colors = tankMaterial.userData.uniforms.colors;
  shader.uniforms.heatRatio = tankMaterial.userData.uniforms.heatRatio;
  shader.fragmentShader = `
  uniform vec3 colors[2];
  uniform float heatRatio;
  uniform sampler2D heatTexture;
  uniform float hotTemp;
  uniform float coldTemp;
  ${shader.fragmentShader}
`.replace(
    `#include <color_fragment>`,
    `#include <color_fragment>
    vec3 coldColor = texture(heatTexture, vec2(5, 0.5)).rgb;
    vec3 hotColor = texture(heatTexture, vec2(0.5, 0.5)).rgb;
    float colorRatio = smoothstep( heatRatio-0.5, heatRatio + 0.5, vUv.y);
    diffuseColor.rgb = mix(coldColor, hotColor, colorRatio);
  `
  );
};

function addCollector_Tank(collectorPosition, tankPosition) {
  const tankGeometry = new THREE.PlaneGeometry(50, 90);
  tankMaterial = new THREE.MeshBasicMaterial({
    onBeforeCompile: (shader) => {
      beforeCompileShader(shader);
    },
    side: THREE.DoubleSide,
  });

  tankMaterial.defines = { USE_UV: "" };
  let heatMapTexture = new THREE.TextureLoader().load(
    "./public/cool-warm-colormap.png",
    function (texture) {
      texture.needsUpdate = true;
      texture.generateMipmaps = true;
      tankMaterial.userData = {
        uniforms: {
          heatRatio: { value: 0.8 },
          colors: {
            value: [new THREE.Color(0, 0, 1), new THREE.Color(0, 1, 1)],
          },
          heatTexture: {
            type: "t",
            value: texture,
          },
          hotTemp: {
            value: 0.7,
          },
          coldTemp: {
            value: 0.1,
          },
        },
      };
      tankMaterial.userData.uniforms.needsUpdate = true;
      let tank = new THREE.Mesh(tankGeometry, tankMaterial);
      tank.rotation.x = Math.PI * 0.5;
      const collectorGeometry = new THREE.PlaneGeometry(20, 50);
      const collectorMaterial = new THREE.MeshBasicMaterial({
        side: THREE.DoubleSide,
      });
      collectorMaterial.onBeforeCompile = (shader) => {
        beforeCompileShader(shader);
      };
      collectorMaterial.defines = { USE_UV: "" };
      collectorMaterial.userData = {
        uniforms: {
          heatRatio: { value: 0.5 },
          heatTexture: {
            type: "t",
            value: texture,
          },
          colors: {
            value: [new THREE.Color(1, 0, 0), new THREE.Color(1, 1, 1)],
          },
          hotTemp: {
            value: 0.7,
          },
          coldTemp: {
            value: 0.1,
          },
        },
      };

      collectorMaterial.needsUpdate = true;
      let collector = new THREE.Mesh(collectorGeometry, collectorMaterial);
      collector.rotation.x = Math.PI * 0.5;
      scene.add(tank);
      scene.add(collector);

      tank.position.copy(tankPosition);
      collector.position.copy(collectorPosition);
      done = true;
    }
  );
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

function heatCalculatorUpdate(deltaTime) {
  let Qu = collectoUsabelHeat(intialTankTem, ambientTemp, Irradiance);
  let collectorOutputTemp = computeCollectorOutputTemp(Qu, intialTankTem);
  let inputFromUpriser = computeHeatFlow(
    upriseRate,
    specificHeatCapacity,
    collectorOutputTemp,
    intialTankTem
  );

  let lossToEnv = computeHeatLoss(
    tankSurfaceArea,
    tankLossCofficient,
    intialTankTem,
    ambientTemp
  );
  let totalInternalEnergy = deltaTime * (inputFromUpriser - lossToEnv);
  intialTankTem += totalInternalEnergy / (waterMass * specificHeatCapacity);
  // console.log(intialTankTem);
}

function update() {
  let deltaTime = clock.getDelta();
  deltaTime *= 100;
  if (done) {
    heatCalculatorUpdate(deltaTime);
    tankMaterial.userData.uniforms.heatRatio.value = stratumUpdate(deltaTime);
    tankMaterial.userData.uniforms.hotTemp = 30 / 40;
    tankMaterial.userData.uniforms.coldTemp = 20 / 40;
    // console.log(m.userData.uniforms.heatRatio);
    texture1.offset.x -= deltaTime * 0.008;
    texture2.offset.x -= deltaTime * 0.008;
    render();
    stats.update();
  }
  requestAnimationFrame(update);
}

function render() {
  controls.update(clock.getDelta());
  renderer.render(scene, camera);
}

init();
update();
// console.clear();
