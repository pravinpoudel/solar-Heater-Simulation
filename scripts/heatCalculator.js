let specificHeatCapacity = 4180;
let ambientTemp = 20;
let tankSurfaceArea = 10;
let Irradiance = 1000;
let intialTankTem = 20;
let flowRate = 0.1;
const collectorArea = 1.5;
const collectorLossFactor = 4;
const transAbsorbCofficient = 0.3;
const tankLossCofficient = 0.5;
let waterMass = 500;
let hotMass = 0.1;
let coldMass = waterMass;
let previosStrataRatio = -0.2;
let coldTemperature = ambientTemp;
let hotTemperature = ambientTemp;
let upriserArea = 0.3175;
let upriserLossCoff = 0.2;
let collectorEfficienyFactor = 0.3;

function convectionLoss(ta, tfo, Au, Uu) {
  let cofficient = (-Au * Uu) / (flowRate * specificHeatCapacity);
  let tankInput = ta + (tfo - ta) * Math.exp(cofficient);
  // console.log(tankInput);
  return tankInput;
}

function collectorRemoveFactor(flowRate, Ac, Ul) {
  return (
    ((flowRate * specificHeatCapacity) / (Ac * Ul)) *
    (1 -
      Math.exp(
        (-1 * Ac * Ul * collectorEfficienyFactor) /
          (flowRate * specificHeatCapacity)
      ))
  );
}

function computeCollectorOutputTemp(Qu, inputTemp) {
  return inputTemp + Qu / (flowRate * specificHeatCapacity);
}

function computeHeatFlow(flowRate, specificHeatCapacity, t2, t1, strataRatio) {
  return flowRate * specificHeatCapacity * strataRatio * (t2 - t1);
}

// room(t3), cold(t2), hot(t1)
function computeHeatLoss(surfaceArea, heatLossRatio, heatRatio, t3, t2, t1) {
  return [
    surfaceArea * heatLossRatio * heatRatio * (t1 - t3),
    surfaceArea * heatLossRatio * (1 - heatRatio) * (t2 - t3),
  ];
}

function isEquillibruim() {
  return intialTankTem == collectorOutputTemp;
}

function stratumUpdate(deltaTime) {
  hotMass += flowRate * deltaTime;
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
  flowRate,
  collectorArea,
  collectorLossFactor
);

function heatCalculatorUpdate(deltaTime) {
  let strataRatio = stratumUpdate(deltaTime);
  let normStrataRatio = strataRatio - Math.floor(strataRatio);
  if (previosStrataRatio > normStrataRatio) {
    console.log(
      "new hot temperature is",
      hotTemperature,
      "cold temperature is",
      coldTemperature
    );
    coldTemperature = hotTemperature;
  }
  let Qu = collectoUsabelHeat(coldTemperature, ambientTemp, Irradiance);

  let collectorOutputTemp = computeCollectorOutputTemp(Qu, coldTemperature);

  // console.log("collector outpuut temperature:", collectorOutputTemp);
  let tankInput = convectionLoss(
    ambientTemp,
    collectorOutputTemp,
    upriserArea,
    upriserLossCoff
  );

  let inputFromUpriser = computeHeatFlow(
    flowRate,
    specificHeatCapacity,
    collectorOutputTemp,
    hotTemperature,
    normStrataRatio
  );

  let [envLoss_Hot, envLoss_Cold] = computeHeatLoss(
    tankSurfaceArea,
    tankLossCofficient,
    normStrataRatio,
    ambientTemp,
    coldTemperature,
    hotTemperature
  );

  let totalInternalEnergy = deltaTime * (inputFromUpriser - envLoss_Hot);
  hotTemperature +=
    totalInternalEnergy / (waterMass * strataRatio * specificHeatCapacity);
  coldTemperature -=
    (tankSurfaceArea * tankLossCofficient * (coldTemperature - ambientTemp)) /
    (waterMass * specificHeatCapacity);

  previosStrataRatio = normStrataRatio;
  // console.log([hotTemperature, coldTemperature, collectorOutputTemp]);
  updateDormText(hotTemperature, coldTemperature, collectorOutputTemp);
  let mappedTemp = mapAmbient([
    hotTemperature,
    coldTemperature,
    collectorOutputTemp,
  ]);
  return [...mappedTemp, normStrataRatio];
}

function mapAmbient(temperatureLists) {
  let mappedValue = temperatureLists.map((element, index) => {
    return Math.min(1.0, (element - ambientTemp) / (50 - ambientTemp));
  });
  return mappedValue;
}

function updateDormText(hotTemp, coldTemp, collectorOutputTemp) {
  document.getElementById("collectorTemp").innerHTML = hotTemp.toFixed(2);
  document.getElementById("hotTemp").innerHTML = hotTemp.toFixed(2);
  document.getElementById("coldTemp").innerHTML = coldTemp.toFixed(2);
}

export {
  collectoUsabelHeat,
  computeCollectorOutputTemp,
  computeHeatFlow,
  computeHeatLoss,
  stratumUpdate,
  heatCalculatorUpdate,
};
