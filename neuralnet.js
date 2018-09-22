function Node() {
  this.weights = [];
  this.newWeights = [];
  this.value = 0;
  this.pt12 = 0;
  this.sum;
}

function Layer(size) {
  this.nodes = [];
  for(var i = 0;i < size;i ++) {
    this.nodes.push(new Node());
  }
}

function Net(layerSizes, act, dact, derror) {
  this.layers = [];
  for(var i = 0;i < layerSizes.length;i ++) {
    this.layers.push(new Layer(layerSizes[i]));
  }

  this.initWeights = function() {
    this.layers.forEach((layer, index) => {
      if(index == this.layers.length - 1) return;
      var nextLayer = this.layers[index + 1];
      layer.nodes.forEach((node) => {
        for(var i = 0;i < nextLayer.nodes.length;i ++) {
          var w = Math.random()
          node.weights.push(w);
          node.newWeights.push(w);
        }
      });
    })
  }

  this.initWeights();

  this.calc = function(input) {
    this.layers[0].nodes.forEach((node, index) => {
      node.value = input[index];
      node.sum = input[index];
    });
    this.layers.forEach((layer, index) => {
      if(index == 0) return;
      var prevLayer = this.layers[index - 1];
      layer.nodes.forEach((node, index) => {
        node.sum = 0;
        prevLayer.nodes.forEach((prevNode) => {
          node.sum += prevNode.value * prevNode.weights[index];
        })
        node.value = act(node.sum);
      })
    })
    return this.layers[this.layers.length-1].nodes.map((node) => node.value);
  }

  this.train = function(input, output, rate) {
    this.calc(input);
    var outLayer = this.layers[this.layers.length - 1];
    var prevLayer = this.layers[this.layers.length - 2];

    outLayer.nodes.forEach((node, i) => {
      const pt1 = dact(node.sum);
      const pt2 = derror(output[i], node.value);
      node.pt12 = pt1 * pt2;
       prevLayer.nodes.forEach((prevNode, j) => {
         const dw = pt1 * pt2 * prevNode.value;
         prevNode.newWeights[i] = prevNode.weights[i] - dw * rate;
       })
    });

    for(var i = this.layers.length - 2; i > 0; i--) {
      var layer = this.layers[i];
      var prevLayer = this.layers[i - 1];
      var nextLayer = this.layers[i + 1];

      layer.nodes.forEach((node, i) => {
        var pt2 = 0;
        nextLayer.nodes.forEach((nextNode, j) => {
          pt2 += nextNode.pt12 * node.weights[j];
        });
        const pt1 = dact(node.sum);
         prevLayer.nodes.forEach((prevNode, j) => {
           const dw = pt1 * pt2 * prevNode.value;
           prevNode.newWeights[i] = prevNode.weights[i] - dw * rate;
         })
      });
    }



    this.layers.forEach((layer) => {
      layer.nodes.forEach((node) => {
        node.newWeights.forEach((weight, i) => {
          node.weights[i] = weight;
        })
      })
    });

  }
}

function sig(val) {
  return 1 / (1 + Math.exp(-val));
}

function dsig(val) {
  return Math.exp(-1 * val) / Math.pow(1 + Math.exp(-1 * val), 2);
}

function error(target, calculated) {
  return 1 / 2 * (target - calculated) * (target - calculated);
}

function derror(target, calculated) {
  return target - calculated;
}

var net = new Net([2, 5, 5, 3, 7, 2, 1], sig, dsig, error, derror);
var rate = 1/100;
for(var i = 0;i < 1000;i ++) {
  net.train([1,1], [0], rate);
  net.train([0,1], [1], rate);
  net.train([1,0], [1], rate);
  net.train([0,0], [0], rate);
}
