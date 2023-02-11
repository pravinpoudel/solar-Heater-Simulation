import fbm from "./shader/fractal";
import * as THREE from "three";
import { scene, commonUniform } from "./renderer";

function createPipe(height, radius, _heatTexture, direction, x, y, z) {
  let pipeGroup = new THREE.Group();
  // flow direction
  let canvas = document.createElement("canvas");
  canvas.width = 20;
  canvas.height = 20;
  let context = canvas.getContext("2d");
  context.fillStyle = "rgba(0, 0, 0, 1)";
  context.translate(20, 20);
  context.textAlign = "center";
  context.textBaseline = "middle";
  context.font = "26px sans-serif";
  context.fillText("➡︎", 0, 0);

  let texture = new THREE.CanvasTexture(canvas);
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

  const geometry = new THREE.PlaneGeometry(height, 5);
  // const _cylinderMaterial = new THREE.ShaderMaterial({
  //   color: new THREE.Color(0x4040ff),
  //   opacity: 0.6,
  //   side: THREE.DoubleSide,
  //   depthWrite: false,
  //   depthTest: false,
  //   transparent: true,
  // });
  const _cylinderMaterial = new THREE.ShaderMaterial({
    uniforms: {
      temperature: {
        type: "f",
        value: 0.8,
      },
      heatTexture: {
        type: "t",
        value: _heatTexture,
      },
    },
    vertexShader: `
      void main() {
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0);
      }
    `,
    fragmentShader: `
      uniform float temperature;
      uniform sampler2D heatTexture;
      void main() {
        gl_FragColor = vec4(texture(heatTexture, vec2(temperature, 0.5)).rgb, 0.7);
      }`,
    side: THREE.DoubleSide,
    transparent: true,
  });

  const _cylinder = new THREE.Mesh(geometry, _cylinderMaterial);
  _cylinder.rotation.z = Math.PI * 0.5;
  _cylinder.rotation.y = -1 * Math.PI * 0.5;
  if (direction == "up") {
    _cylinder.rotation.x = Math.PI * 0.5;
    stripeMesh.rotation.x = -Math.PI * 0.5;
  }
  pipeGroup.add(_cylinder);
  pipeGroup.add(stripeMesh);
  let directionVector = direction == "right" ? 1 : -1;
  pipeGroup.rotation.z = directionVector * 0.5 * Math.PI;
  pipeGroup.position.x = x;
  pipeGroup.position.y = y;
  pipeGroup.position.z = z;
  scene.add(pipeGroup);
  return [texture, _cylinder];
}

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
          float timeFactor = time*0.01*flowDirection;
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
        value: 0.1,
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

  // tankMaterial.userData.uniforms.needsUpdate = true;
  let tank = new THREE.Mesh(tankGeometry, tankMaterial);
  tank.rotation.x = Math.PI * 0.5;
  tank.position.copy(position);
  scene.add(tank);
  return tank;
}

export { createPipe, createTank };
