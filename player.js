function RandomPlayer(sym) {
  this.startGame = function() {

  }

  this.takeTurn = function(game) {
    var spots = [];
    for(var i = 0;i < 3;i ++) {
      for(var j = 0;j < 3;j ++) {
        if(game[i][j] == E) spots.push([i, j]);
      }
    }
    return spots[Math.floor(Math.random() * spots.length)];
  }

  this.endGame = function(result) {

  }
}

function TablePlayer(sym) {
  this.table = new ProbTable();

  this.startGame = function() {
    this.table.turns = [];
  }

  this.takeTurn = function(game) {
    var best = this.table.bestMove(game);
    return [Math.floor(best / 3), best % 3];
  }

  this.endGame = function(result) {
    this.table.endedGame(result == T || result == sym);
  }
}

function NeuralPlayer(sym) {
  this.net = new TicTacToeNet();
  
  this.startGame = function() {
    this.net.startGame();
  }

  this.takeTurn = function(game) {
    let move;
    let chance = 10;
    if(Math.random() * chance < chance - 1) {
      move = this.net.bestMove(game);
    } else {
      move = this.net.randomMove(game);
    }
    return [Math.floor(move / 3), move % 3];
  }

  this.endGame = function(result) {
    this.net.endGame(result == T || result == sym);
  }
}

function ProbTable() {
  this.ps = {};
  this.turns = [];

  this.bestMove = function(state) {
    var enc = encode(state);

    if(!this.ps[enc]) {
      init = []
      for(var i = 0;i < 3;i ++) {
        for(var j = 0;j < 3;j ++) {
          init[i * 3 + j] = state[i][j] != E ? 0 : 0.5;
        }
      }
      this.ps[enc] = init;
    }
    choices = [];
    maxVal = -100;
    for(var i = 0;i < 9;i ++) {
      if(this.ps[enc][i] > maxVal) {
        maxVal = this.ps[enc][i];
        choices = [i];
      } else if(this.ps[enc][i] == maxVal) {
        choices[choices.length] = i;
      }
    }
    var move = choices[Math.floor(Math.random() * choices.length)]
    this.turns.push({enc: enc, move: move});
    return choices[Math.floor(Math.random() * choices.length)];
  }

  this.endedGame = function(good) {
    this.turns.forEach((val) => {
      this.ps[val.enc][val.move] *= good ? 1.1 : 0.9;
    });
  }
}

function encode(game) {
  var str = "";
  game.forEach((row) => {
    row.forEach((val) => {
      str += val;
    })
  });
  return str;
}

function encodeNeural(game) {
  let state = [];
  game.forEach((row) => {
    row.forEach((val) => {
      if(colVal == 2) state.push(-1);
      else state.push(colVal);
    })
  });
  return str;
}
