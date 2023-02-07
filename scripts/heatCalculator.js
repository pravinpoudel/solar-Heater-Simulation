let specificHeatCapacity = 4180;
let ambientTemp = 20;
let tankSurfaceArea = 10;
let Irradiance = 354;
let intialTankTem = 20;
let upriseRate = 0.03;
const collectorArea = 10.5;
const collectorLossFactor = 13.14;
const transAbsorbCofficient = 0.3;
const tankLossCofficient = 0.25;
const Cpf = 4180;
let waterMass = 1000;
let hotMass = 0.1;
let coldMass = waterMass;
let previosStrataRatio = -0.2;
let coldTemperature = ambientTemp;
let hotTemperature = ambientTemp;

function collectorRemoveFactor(upriseRate, Ac, Ul) {
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

// room, cold, hold
function computeHeatLoss(surfaceArea, heatLossRatio, heatRatio, t3, t2, t1) {
  return (
    surfaceArea * heatLossRatio * (1 - heatRatio) * (t2 - t3) +
    surfaceArea * heatLossRatio * heatRatio * (t1 - t3)
  );
}

function isEquillibruim() {
  return intialTankTem == collectorOutputTemp;
}

function stratumUpdate(deltaTime) {
  hotMass += upriseRate * deltaTime;
  let addedHot = hotMass / waterMass;
  return addedHot;
}

function collectoUsabelHeat(Ti, Ta, Ir) {
  let Qu =
    collectorArea *
    heatRemovedFactor *
    (transAbsorbCofficient * Ir - collectorLossFactor * (Ti - Ta));
  return Qu;
}

const heatRemovedFactor = collectorRemoveFactor(
  upriseRate,
  collectorArea,
  collectorLossFactor
);

function heatCalculatorUpdate(deltaTime) {
  let strataRatio = stratumUpdate(deltaTime);
  let normStrataRatio = strataRatio - Math.floor(strataRatio);
  if (previosStrataRatio > normStrataRatio) {
    coldTemperature = hotTemperature;
  }
  let Qu = collectoUsabelHeat(coldTemperature, ambientTemp, Irradiance);

  let collectorOutputTemp = computeCollectorOutputTemp(Qu, coldTemperature);

  let inputFromUpriser = computeHeatFlow(
    upriseRate,
    specificHeatCapacity,
    collectorOutputTemp,
    hotTemperature
  );
  let lossToEnv = computeHeatLoss(
    tankSurfaceArea,
    tankLossCofficient,
    normStrataRatio,
    ambientTemp,
    coldTemperature,
    hotTemperature
  );
  let totalInternalEnergy = deltaTime * (inputFromUpriser - lossToEnv);
  hotTemperature += totalInternalEnergy / (waterMass * specificHeatCapacity);
  previosStrataRatio = normStrataRatio;
  return [
    hotTemperature,
    coldTemperature,
    collectorOutputTemp,
    normStrataRatio,
  ];
}

export {
  collectoUsabelHeat,
  computeCollectorOutputTemp,
  computeHeatFlow,
  computeHeatLoss,
  stratumUpdate,
  heatCalculatorUpdate,
};
