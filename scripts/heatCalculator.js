import { Clock } from "../node_modules/three/build/three.module.js";

let specificHeatCapacity = 4180;
let intialTankTem = 20;
let collectorOutputTemp = 22;
let ambientTemp = 16;
let tankSurfaceArea = 25;
let upriseRate = 0.03;
let tankLossCofficient = 0.25;
let waterMass = 100;
let equillibruim = false;
const clock = new Clock();
const collectorArea = 1.5;

function computeHeatFlow(flowRate, specificHeatCapacity, t2, t1) {
  return flowRate * specificHeatCapacity * (t2 - t1);
}

function isEquillibruim() {
  return intialTankTem == collectorOutputTemp;
}

function calCollectorOutTemp() {
  let absorbedHeat = absorbedEnergy * Area;
  let useFulHeat = absorbedHeat - heatLost;
}

function update(delta) {
  let inputFromUpriser = computeHeatFlow(
    upriseRate,
    specificHeatCapacity,
    collectorOutputTemp,
    intialTankTem
  );

  let lossToEnv = computeHeatFlow(
    tankSurfaceArea,
    tankLossCofficient,
    intialTankTem,
    ambientTemp
  );

  let totalInternalEnergy = delta * (inputFromUpriser - lossToEnv);
  intialTankTem += totalInternalEnergy / (waterMass * specificHeatCapacity);
}

function animate() {
  const delta = clock.getDelta();
  update(delta);
  if (!isEquillibruim()) {
    console.log(intialTankTem);
    requestAnimationFrame(animate);
  }
}

animate();
