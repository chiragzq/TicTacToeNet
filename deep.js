function getAccessibleColor(rgb) {
  let [ r, g, b ] = rgb;

  let colors = [r / 255, g / 255, b / 255];

  let c = colors.map((col) => {
    if (col <= 0.03928) {
      return col / 12.92;
    }
    return Math.pow((col + 0.055) / 1.055, 2.4);
  });

  let L = (0.2126 * c[0]) + (0.7152 * c[1]) + (0.0722 * c[2]);

  return (L > 0.179)
    ? [ 0, 1 ] // black
    : [ 1, 0]; //white
}

function genDataset(num) {
  let rawInputs = [];
  let rawTargets = [];
  for(let i = 0;i < num;i ++) {
    let c = getRandomColor();
    rawInputs.push(c);
    rawTargets.push(getAccessibleColor(c));
  }
  return {
    rawInputs,
    rawTargets
  };
}

function getRandomColor() {
  return [
    getRandomChannel(),
    getRandomChannel(),
    getRandomChannel()
  ]
}

function getRandomChannel() {
  return Math.floor(Math.random() * 256);
}

function makeConnectedLayer(graph, inputLayer, index, nodes) {
  return graph.layers.dense(
    "fully_connected_" + index,
    inputLayer,
    nodes,
    (x) => graph.relu(x)
  );
}

function normalizeRGB(rgb) {
  return rgb.map(c => c / 256);
}

let initialLearningRate = 0.06;
const math = dl.ENV.math;
const graph = new dl.Graph();
const optimizer = new dl.train.sgd(initialLearningRate);

let inputTensor = graph.placeholder('input RGB value', [3]);
let targetTensor = graph.placeholder('target classifier', [2]);

let hiddenLayer1 = makeConnectedLayer(graph, inputTensor, 0, 64);
let hiddenLayer2 = makeConnectedLayer(graph, hiddenLayer1, 1, 32);
let hiddenLayer3 = makeConnectedLayer(graph, hiddenLayer2, 2, 16);
let outputTensor = makeConnectedLayer(graph, hiddenLayer3, 3, 2);

let costTensor = graph.meanSquaredCost(targetTensor, outputTensor);
let session = new dl.Session(graph, math);
let batchSize = 400;

const {rawInputs, rawTargets} = genDataset(2000);
const inputArray= rawInputs.map(c => dl.tensor1d(normalizeRGB(c)));
const targetArray = rawTargets.map(o => dl.tensor1d(o));

const shuffledInputProviderBuilder = new dl.InCPUMemoryShuffledInputProviderBuilder([inputArray, targetArray]);
const [inputProvider, targetProvider] = shuffledInputProviderBuilder.getInputProviders();
const feedEntries = [
  {tensor: inputTensor, data: inputProvider},
  {tensor: targetTensor, data: targetProvider}
];

function train(step) {
  let learningRate = initialLearningRate * Math.pow(0.9, Math.floor(step / 50));
  optimizer.setLearningRate(learningRate);
  const cost = session.train(
    costTensor,
    feedEntries,
    batchSize,
    optimizer,
    dl.CostReduction.MEAN
  );
  
  return cost.getValues();
}

function predict(rgb) {
  const mapping = [{
    tensor: inputTensor,
    data: dl.tensor1d(normalizeRGB(rgb)),
  }];
  let classifier = session.eval(outputTensor, mapping).getValues();
  return classifier;
}

function convertOutput(output) {
  return output[0] > output[1] ? [1, 0] : [0, 1];
}

for(let i = 0;i < 100;i ++) {
  let cost = train(i);
  console.log("Training " + i + " Cost " + cost);
}

console.log(convertOutput(predict([100, 100, 100])));

let testSet = genDataset(50);
let numCorrect = 0;
for(let i = 0;i < testSet.rawInputs.length;i ++) {
  const output = convertOutput(predict(testSet.rawInputs[i]));
  if(output[0] == testSet.rawTargets[i][0]) numCorrect++;
}

console.log("Correct " + numCorrect + "/" + testSet.rawInputs.length);