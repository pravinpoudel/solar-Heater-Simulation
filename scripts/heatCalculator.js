let specificHeatCapacity = 4180;
let ambientTemp = 20.0;
let coldTemperature = ambientTemp;
let hotTemperature = ambientTemp;
const MAX_TEMP = 40.0;
let tankSurfaceArea = 10;
let upriserArea = 0.3175;
const collectorArea = 1.5;
let Irradiance = 1000;
let flowRate = 0.1;
let upriserLossCoff = 0.2;
let collectorEfficienyFactor = 0.3;
const collectorLossFactor = 4;
const transAbsorbCofficient = 0.3;
const tankLossCofficient = 0.5;
let waterMass = 1000;
let hotMass = 0.1;
let previosStrataRatio = -0.2;

function convectionLoss(ta, tfo, Au, Uu) {
  let cofficient = (-Au * Uu) / (flowRate * specificHeatCapacity);
  let tankInput = ta + (tfo - ta) * Math.exp(cofficient);
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

function computeHeatLoss(surfaceArea, heatLossRatio, heatRatio, t3, t2, t1) {
  return [
    surfaceArea * heatLossRatio * heatRatio * (t1 - t3),
    surfaceArea * heatLossRatio * (1 - heatRatio) * (t2 - t3),
  ];
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
  // hot and cold ratio
  let strataRatio = stratumUpdate(deltaTime);
  let normStrataRatio = strataRatio - Math.floor(strataRatio);

  if (previosStrataRatio > normStrataRatio) {
    document.getElementById("hotTemp").innerHTML = hotTemperature.toFixed(2);
    coldTemperature = hotTemperature;
  }

  let Qu = collectoUsabelHeat(coldTemperature, ambientTemp, Irradiance);
  let collectorOutputTemp = computeCollectorOutputTemp(Qu, coldTemperature);
  collectorOutputTemp = collectorOutputTemp;

  //temperature after loss in the upriser which can be a pipe connecting solar collector and tank
  let tankInputTemp = convectionLoss(
    ambientTemp,
    collectorOutputTemp,
    upriserArea,
    upriserLossCoff
  );

  // this is input temperautre of fluid at the tank inlet from solar container
  let tankInputHeat = computeHeatFlow(
    flowRate,
    specificHeatCapacity,
    tankInputTemp,
    hotTemperature,
    normStrataRatio
  );

  // since there are two stratas, loss in each strata is envLoss_Hot for hot strata region and envLoss_Cold for cold
  // strata region

  let [envLoss_Hot, envLoss_Cold] = computeHeatLoss(
    tankSurfaceArea,
    tankLossCofficient,
    normStrataRatio,
    ambientTemp,
    coldTemperature,
    hotTemperature
  );

  // final mean temperature of hot strata region after gaining the energy from the collector
  let totalInternalEnergy = deltaTime * (tankInputHeat - envLoss_Hot);

  hotTemperature +=
    totalInternalEnergy / (waterMass * normStrataRatio * specificHeatCapacity);

  // final temperautre of cold strata region which is affected by loss in environment because
  //we are not considering the water inlet from the other cold water source.

  coldTemperature -=
    (tankSurfaceArea * tankLossCofficient * (coldTemperature - ambientTemp)) /
    (waterMass * specificHeatCapacity);

  previosStrataRatio = normStrataRatio;

  updateDormText(hotTemperature, coldTemperature, collectorOutputTemp);

  // since the temperature range is from ambient to max water heat temperature, the range of 0 to max might not be
  // very informative so i thought of ranging the map from ambient to max which i have considered to be 45 degree centigrade.

  let mappedTemp = mapAmbient([
    hotTemperature,
    coldTemperature,
    collectorOutputTemp,
  ]);

  return [...mappedTemp, normStrataRatio];
}

function mapAmbient(temperatureLists) {
  let mappedValue = temperatureLists.map((element, index) => {
    return Math.min(1.0, (element - ambientTemp) / (MAX_TEMP - ambientTemp));
  });
  return mappedValue;
}

function updateDormText(hotTemp, coldTemp, collectorOutputTemp) {
  document.getElementById("ambientTemp").innerHTML = ambientTemp;
  document.getElementById("collectorTemp").innerHTML =
    collectorOutputTemp.toFixed(2);
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
