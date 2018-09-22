let doTrain = true;
function getRandomMove(game) {
   var spots = [];
    for(var i = 0;i < 3;i ++) {
      for(var j = 0;j < 3;j ++) {
        if(game[i][j] == E) spots.push([i, j]);
      }
    }
    return spots[Math.floor(Math.random() * spots.length)];
}

function encodeState(state) {
    let enc = [];
    state.forEach((row) => {
      row.forEach((val) => {
        if(val == 2) enc.push(-1);
        else enc.push(val);
      })
    });
    return enc;
  }

function makeConnectedLayer(graph, inputLayer, index, nodes) {
  return graph.layers.dense(
    "fully_connected_" + index,
    inputLayer,
    nodes,
    (x) => graph.relu(x)
  );
}
  
function TicTacToeNet() {
  this.turns = [];
  
  this.startGame = function() {
    this.turns = [];
  }
  
  this.bestMove = function(state) {
    let enc = encodeState(state);
    const mapping = [{
      tensor: inputTensor,
      data: dl.tensor1d(enc)
    }];
    let classifier = session.eval(outputTensor, mapping).getValues();
    let available = enc.map((val) => val == E);
    const move = bestOpenSpot(classifier, available);
    this.turns.push({enc, move});
    return move;
  }
  
  this.randomMove = function(state) {
    let enc = encodeState(state);
    let available = enc.map((val) => val == E);
    const move = randomOpenSpot(available);
    this.turns.push({enc, move});
    return move;
  }
  
  this.endGame = function(good) {
    if(!good) return;
    if(!doTrain) return;
    const {rawInputs, rawTargets} = this.generateDataset();
    const inputArray= rawInputs.map(c => dl.tensor1d(c));
    const targetArray = rawTargets.map(o => dl.tensor1d(o));
  
    const shuffledInputProviderBuilder = new dl.InCPUMemoryShuffledInputProviderBuilder([inputArray, targetArray]);
    const [inputProvider, targetProvider] = shuffledInputProviderBuilder.getInputProviders();
    const feedEntries = [
      {tensor: inputTensor, data: inputProvider},
      {tensor: targetTensor, data: targetProvider}
    ];
    for(let i = 0;i < 10;i ++) {
      this.train(feedEntries);
    }
  }
  
  this.generateDataset = function() {
    let rawInputs = [];
    let rawTargets = [];
    
    for(let i = 0;i < this.turns.length;i ++) {
      rawInputs.push(this.turns[i].enc);
      let arr = [0, 0, 0, 0, 0, 0, 0, 0, 0];
      arr[this.turns[i].move] = 1;
      rawTargets.push(arr);
    }
    
    return {rawInputs, rawTargets};
  }
  
  this.train = function(feedEntries) {
    const cost = session.train(
      costTensor,
      feedEntries,
      this.turns.length,
      optimizer,
      dl.CostReduction.NONE
    );
  }
  
  function bestOpenSpot(output, available) {
    let max = -1000000;
    let index = -1;
    for(let i = 0;i < output.length;i ++) {
      if(!available[i]) continue;
      if(output[i] > max) {
        max = output[i];
        index = i;
      }
    }
    return index;
  }
  
  function randomOpenSpot(available) {
    var open = [];
    for(let i=0;i < available.length;i ++) {
      if(available[i]) open.push(i);
    }
    return open[Math.floor(Math.random() * open.length)];
  }
  
  let initialLearningRate = 0.06;
  let netShape = /* 9 */ [8192]; //9
  const math = dl.ENV.math;
  const graph = new dl.Graph();
  const optimizer = new dl.train.sgd(initialLearningRate);
  
  let inputTensor = graph.placeholder('input pair value', [9]);
  let hiddenLayer = makeConnectedLayer(graph, inputTensor, 0, netShape[0]);
  for(let i = 1;i < netShape.length;i ++) {
    hiddenLayer = makeConnectedLayer(graph, hiddenLayer, i, netShape[i])
  }
  let outputTensor = makeConnectedLayer(graph, hiddenLayer, netShape.length, 9);
  let targetTensor = graph.placeholder('target classifier', [9]);

  let costTensor = graph.meanSquaredCost(targetTensor, outputTensor);
  let session = new dl.Session(graph, math);
  
}
