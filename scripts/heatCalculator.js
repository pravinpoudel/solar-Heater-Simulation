import { Clock } from "../node_modules/three/build/three.module.js";

let specificHeatCapacity = 4180;
let intialTankTem = 20;
let ambientTemp = 20;
let tankSurfaceArea = 10;
let upriseRate = 0.03;
let tankLossCofficient = 300;
let waterMass = 100;
let equillibruim = false;
const clock = new Clock();
const collectorArea = 1.5;
const collectorLossFactor = 13.14;
const transAbsorbCofficient = 0.3;
let heatRemovedFactor;
let Irradiance = 354;
const Cpf = 4180;

function collectorRemoveFactor(Mf, Ac, Ul) {
  return (
    ((upriseRate * Cpf) / (Ac * Ul)) *
    (1 - Math.exp((-1 * Ac * Ul) / (upriseRate * Cpf)))
  );
}

function computeCollectorOutputTemp(Qu, inputTemp) {
  return inputTemp + Qu / (upriseRate * Cpf);
}

function computeHeatFlow(flowRate, specificHeatCapacity, t2, t1) {
  return flowRate * specificHeatCapacity * (t2 - t1);
}

function computeHeatLoss(surfaceArea, heatLossRatio, t2, t1) {
  return surfaceArea * heatLossRatio * (t2 - t1);
}

function isEquillibruim() {
  return intialTankTem == collectorOutputTemp;
}

function collectoUsabelHeat(Ti, Ta, Ir) {
  let Qu =
    collectorArea *
    heatRemovedFactor *
    (transAbsorbCofficient * Ir - collectorLossFactor * (Ti - Ta));
  return Qu;
}

function update(delta) {
  // collector heat ann output temperature
  let Qu = collectoUsabelHeat(intialTankTem, ambientTemp, Irradiance);
  let collectorOutputTemp = computeCollectorOutputTemp(Qu, intialTankTem);
  //
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
  console.log(lossToEnv);

  let totalInternalEnergy = delta * (inputFromUpriser - lossToEnv);
  intialTankTem += totalInternalEnergy / (waterMass * specificHeatCapacity);
  console.log(intialTankTem);
}

// function animate() {
//   const delta = clock.getDelta();
//   update(delta);
//   if (!isEquillibruim()) {
//     console.log(intialTankTem);
//     requestAnimationFrame(animate);
//   }
// }

function main() {
  heatRemovedFactor = collectorRemoveFactor(
    upriseRate,
    collectorArea,
    collectorLossFactor
  );
  console.log(heatRemovedFactor);
  update(3600);
  // animate();
}
console.log("Hi");
main();
