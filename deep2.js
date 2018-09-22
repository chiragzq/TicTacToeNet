function xor(ab) {
  let [ a, b] = ab;
  
  
  return ((a != b) && (a || b))
    ? [ 0, 1 ] // true
    : [ 1, 0]; // false
}

function genDataset() {
  let rawInputs = [
    [true, true],
    [true, false],
    [false, true],
    [false, false]
  ];
  let rawTargets = [
    [1, 0],
    [0, 1],
    [0, 1],
    [1, 0]
  ];
  return {
    rawInputs,
    rawTargets
  };
}


function makeConnectedLayer(graph, inputLayer, index, nodes) {
  return graph.layers.dense(
    "fully_connected_" + index,
    inputLayer,
    nodes,
    (x) => graph.relu(x)
  );
}

function normalizePair(pair) {
  return pair.map(b => b ? 1 : 0);
}

let initialLearningRate = 0.06;
const math = dl.ENV.math;
const graph = new dl.Graph();
const optimizer = new dl.train.sgd(initialLearningRate);

let inputTensor = graph.placeholder('input pair value', [2]);
let targetTensor = graph.placeholder('target classifier', [2]);

let hiddenLayer1 = makeConnectedLayer(graph, inputTensor, 0, 32);
let hiddenLayer2 = makeConnectedLayer(graph, hiddenLayer1, 1, 16);
let outputTensor = makeConnectedLayer(graph, hiddenLayer2, 2, 2);

let costTensor = graph.meanSquaredCost(targetTensor, outputTensor);
let session = new dl.Session(graph, math);
let batchSize = 4;

const {rawInputs, rawTargets} = genDataset();
const inputArray= rawInputs.map(c => dl.tensor1d(normalizePair(c)));
const targetArray = rawTargets.map(o => dl.tensor1d(o));

const shuffledInputProviderBuilder = new dl.InCPUMemoryShuffledInputProviderBuilder([inputArray, targetArray]);
const [inputProvider, targetProvider] = shuffledInputProviderBuilder.getInputProviders();
const feedEntries = [
  {tensor: inputTensor, data: inputProvider},
  {tensor: targetTensor, data: targetProvider}
];

function train(step) {
  optimizer.setLearningRate();
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
    data: dl.tensor1d(normalizePair(rgb)),
  }];
  let classifier = session.eval(outputTensor, mapping).getValues();
  return classifier;
}

function convertOutput(output) {
  return output[0] > output[1] ? [1, 0] : [0, 1];
}

for(let i = 0;i < 1000;i ++) {
  let cost = train(i);
  console.log("Training " + i + " Cost " + cost);
}

let testSet = genDataset();
let numCorrect = 0;
for(let i = 0;i < testSet.rawInputs.length;i ++) {
  const output = convertOutput(predict(testSet.rawInputs[i]));
  if(output[0] == testSet.rawTargets[i][0]) numCorrect++;
}

console.log("Correct " + numCorrect + "/" + testSet.rawInputs.length);