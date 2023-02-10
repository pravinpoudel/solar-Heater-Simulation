if (module.hot) {
  module.hot.accept();
}

import "../styles/style.css";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import Stats from "three/examples/jsm/libs/stats.module";
import { GUI } from "dat.gui";
import { CanvasTexture } from "three";
import { stratumUpdate, heatCalculatorUpdate } from "./heatCalculator";
import fbm from "./shader/fractal";

let camera, renderer;
const scene = new THREE.Scene();
scene.background = new THREE.Color(0xffffff);
const stats = Stats();
const gui = new GUI();
const clock = new THREE.Clock();
let controls;
let collectorPosition = new THREE.Vector3(-50, 10, 0);
let tankPosition = new THREE.Vector3(50, 10, 0);
let texture1, texture2;

let commonUniform = {
  time: { value: 0 },
};

let ambientTemp = 10;
let intialTankTem = 10;
let tank;
let collector;
let colorArray = [
  new THREE.Color(0, 0, 1),
  new THREE.Color(0, 1, 1),
  new THREE.Color(0, 1, 0),
  new THREE.Color(1, 1, 0),
  new THREE.Color(1, 0, 0),
];
const tankSize = new THREE.Vector2(30, 100);
const collectorSize = new THREE.Vector2(20, 40);

let done = false;

// const backgroundLoader = new THREE.TextureLoader();
// backgroundLoader.load("./public/grid.jpg", function (texture) {
//   texture.wrapS = THREE.RepeatWrapping;
//   texture.wrapT = THREE.RepeatWrapping;
//   texture.repeat.set(4, 4);
//   scene.background = texture;
// });

function init() {
  scene.position.set(0, 0, 0); // it is default value but for sanity
  camera = new THREE.PerspectiveCamera(
    60,
    window.innerWidth / window.innerHeight,
    1,
    10000
  );
  camera.position.set(0, 150, 100);
  camera.lookAt(0, 0, 0);
  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.shadowMap.enabled = true;
  renderer.setSize(window.innerWidth, window.innerHeight);
  document.body.appendChild(renderer.domElement);
  controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;

  window.addEventListener("resize", onWindowResize, false);
  document.body.appendChild(stats.dom);

  const size = 400;
  const divisions = 30;

  const gridHelper = new THREE.GridHelper(
    size,
    divisions,
    new THREE.Color(0xff0000),
    new THREE.Color(0x4b5320)
  );
  scene.add(gridHelper);
  texture1 = createPipe(80, 4, "right", -10, 5, 40);
  texture2 = createPipe(80, 4, "left", -10, 5, -40);
}

let loader = new THREE.TextureLoader();
loader.load("./public/cool-warm-colormap.png", function (texture) {
  tank = createTank(tankPosition, texture, tankSize, "down", 0.2);
  collector = createTank(collectorPosition, texture, collectorSize, "up", 0.8);
});

function createTank(position, texture, size, direction, heatRatio) {
  const tankGeometry = new THREE.PlaneGeometry(size.x, size.y);
  const flowDirection = direction == "up" ? -1.0 : 1.0;
  let tankMaterial = new THREE.MeshBasicMaterial({
    onBeforeCompile: (shader) => {
      shader.uniforms.colors = tankMaterial.userData.uniforms.colors;
      shader.uniforms.heatRatio = tankMaterial.userData.uniforms.heatRatio;
      shader.uniforms.heatTexture = tankMaterial.userData.uniforms.heatTexture;
      shader.uniforms.hotTemp = tankMaterial.userData.uniforms.hotTemp;
      shader.uniforms.coldTemp = tankMaterial.userData.uniforms.coldTemp;
      shader.uniforms.time = commonUniform.time;
      shader.uniforms.flowDirection = { value: flowDirection };
      shader.uniforms.height = { value: 10 };
      shader.uniforms.randShift = {
        value: new THREE.Vector2().random().subScalar(0.5).multiplyScalar(100),
      };
      shader.fragmentShader = `
      uniform vec3 colors[2];
      uniform float heatRatio;
      uniform sampler2D heatTexture;
      uniform float hotTemp;
      uniform float coldTemp;
      uniform float time;
      uniform float height;
      uniform vec2 randShift;
      uniform float flowDirection;
      ${fbm}
      ${shader.fragmentShader}
    `.replace(
        `#include <color_fragment>`,
        `#include <color_fragment>
        float timeFactor = time*0.1*flowDirection;
        vec3 coldColor = texture(heatTexture, vec2(coldTemp, 0.5)).rgb;
        vec3 hotColor = texture(heatTexture, vec2(hotTemp, 0.5)).rgb;
        float colorRatio = smoothstep( heatRatio-0.5, heatRatio + 0.5, vUv.y);
        vec3 tempColor = mix(hotColor, coldColor, colorRatio);
        float fbmValue1 = fbm(vec3((vUv +randShift)*vec2(1.0, height)- vec2(0.0, timeFactor), timeFactor*0.25));
        float fbmValue2 = fbm(vec3((vUv +randShift)*vec2(1.0, height)*4.0- vec2(0, 10.0*timeFactor), timeFactor*0.5));
        fbmValue1 = max(fbmValue1, fbmValue2);
        diffuseColor.rgb = mix(tempColor, tempColor+0.1, smoothstep(0.4, 0.6, fbmValue1));
      `
      );
    },
    side: THREE.DoubleSide,
  });
  tankMaterial.defines = { USE_UV: "" };
  texture.needsUpdate = true;
  texture.generateMipmaps = true;
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  // texture.repeat.x = 100;
  // texture.repeat.y = 100;

  tankMaterial.userData = {
    uniforms: {
      colors: {
        value: [new THREE.Color(0, 0, 1), new THREE.Color(0, 1, 1)],
      },
      heatTexture: {
        type: "t",
        value: texture,
      },
      hotTemp: {
        value: 0.8,
      },
      coldTemp: {
        value: 0.1,
      },
      heatRatio: {
        value: heatRatio,
      },
      height: { value: size.y },
    },
  };

  console.log(size.y);

  console.log(tankMaterial.userData.uniforms);

  // tankMaterial.userData.uniforms.needsUpdate = true;
  let tank = new THREE.Mesh(tankGeometry, tankMaterial);
  tank.rotation.x = Math.PI * 0.5;
  scene.add(tank);
  tank.position.copy(position);

  var outlineMaterial = new THREE.MeshBasicMaterial({
    side: THREE.DoubleSide,
    color: new THREE.Color(0x667755),
  });
  done = true;
  return tank;
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
  context.font = "24px sans-serif";
  context.fillText("->", 0, 0);

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
    color: new THREE.Color(0xd4f1f9),
    opacity: 0.6,
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

function update() {
  let deltaTime = clock.getDelta();
  deltaTime *= 1000;
  if (done) {
    commonUniform.time.value = clock.getElapsedTime();
    let [hotTemp, coldTemp, collectorOutputTemp, strataRatio] =
      heatCalculatorUpdate(300);
    console.log(collectorOutputTemp, hotTemp, coldTemp);
    tank.material.userData.uniforms.heatRatio.value = strataRatio;
    tank.material.userData.uniforms.hotTemp.value = Math.min(
      1.0,
      (hotTemp - ambientTemp) / (50 - ambientTemp)
    );
    tank.material.userData.uniforms.coldTemp.value = Math.min(
      (coldTemp - ambientTemp) / (50 - ambientTemp),
      1
    );
    collector.material.userData.uniforms.hotTemp.value = Math.min(
      (collectorOutputTemp - ambientTemp) / (50 - ambientTemp),
      1
    );
    collector.material.userData.uniforms.coldTemp.value = Math.min(
      (coldTemp - ambientTemp) / (50 - ambientTemp),
      1
    );

    tank.material.needsUpdate = true;
    // console.log(hotTemp / 60, coldTemp / 60);
    texture1.offset.x -= 0.008;
    texture2.offset.x -= 0.008;
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
