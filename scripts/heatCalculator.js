let intialTankTem = 20;
let upriseRate = 0.03;
const collectorArea = 1.5;
const collectorLossFactor = 13.14;
const transAbsorbCofficient = 0.3;
const Cpf = 4180;
let waterMass = 100;
let hotMass = 0.1;
let coldMass = waterMass;

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

function computeHeatLoss(surfaceArea, heatLossRatio, t2, t1) {
  return surfaceArea * heatLossRatio * (t2 - t1);
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

export {
  collectoUsabelHeat,
  computeCollectorOutputTemp,
  computeHeatFlow,
  computeHeatLoss,
  stratumUpdate,
};
