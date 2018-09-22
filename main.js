var E = 0;
var R = 1; //red goes first
var B = 2;
var T = 3;

var kill = false;
var width = 600;
var height = 600;
var thickness = 10;
var canvas = document.getElementById("canvas");
var ctx = canvas.getContext("2d");

var players = [[new RandomPlayer(R), new TablePlayer(R), new NeuralPlayer(R)],[new RandomPlayer(B), new TablePlayer(B), new NeuralPlayer(B)]];

function draw(game, ctx) {
  ctx.fillStyle = "white";
  ctx.fillRect(0, 0, width, height);
  ctx.fillStyle = "black";
  ctx.fillRect(width / 3 - thickness / 2, 0, thickness, height);
  ctx.fillRect(2 * width / 3 - thickness / 2, 0, thickness, height);
  ctx.fillRect(0, height / 3 - thickness / 2, width, thickness);
  ctx.fillRect(0, 2 * height / 3 - thickness / 2, width, thickness);

  for(var i = 0;i < 3; i++) {
    for(var j = 0;j < 3;j ++) {
      if(game[i][j] == R) {
        ctx.fillStyle = "red";
        ctx.fillRect(
          width / 3 * j + thickness,
          width / 3 * i + thickness,
          width / 3 - thickness * 2,
          width / 3 - thickness * 2,
        )
      } else if(game[i][j] == B) {
        ctx.fillStyle = "blue";
        ctx.fillRect(
          width / 3 * j + thickness,
          width / 3 * i + thickness,
          width / 3 - thickness * 2,
          width / 3 - thickness * 2,
        )
      }
    }
  }
}

// RED=-1, PLAY=0, BLUE=1, TIE=2
function gameState(game) {
  for(var i = 0;i < 3;i ++) {
    var a = checkSet(game[i]);
    var b = checkSet([game[0][i], game[1][i], game[2][i]]);
    if(a != E) return a;
    if(b != E) return b;
  }
  if(game[0][0] == game[0+1][0+1] && game[0+1][0+1] == game[0+2][0+2] && game[0][0] != E) {
    return game[0][0];
  }
  if(game[2][0] == game[1][1] && game[1][1] == game[0][2] && game[1][1] != E) {
    return game[0][0];
  }
  var tie = true;
  for(var i = 0;i < 3;i ++) {
    if(game[i].includes(E)) return E;
  }
  return T;
}

function checkSet(row) {
  return (row[0] == row[1] && row[0] == row[2] && row[0] != E) ? row[0] : E;
}



var redWins = 0;
var blueWins = 0;
var draws = 0;
//var red = new NeuralPlayer(R);
//var blue = new RandomPlayer(B);
function runGame() {
  var game = [
    [E, E, E],
    [E, E, E],
    [E, E, E]
  ];
  var redType = Number(document.getElementById("redplayer").value);
  var blueType = Number(document.getElementById("blueplayer").value);
  players[0][redType].startGame();
  players[1][blueType].startGame();
  var redPlaying = Math.random() > 0.5;
  var state = E;
  while(state == E) {
    if(redPlaying) {
      var spot = players[0][redType].takeTurn(game);
      game[spot[0]][spot[1]] = R
    } else {
      spot = players[1][blueType].takeTurn(game);
      game[spot[0]][spot[1]] = B
    }
    redPlaying = (redPlaying == false);
    state = gameState(game);
    draw(game, ctx);
  }
  players[0][redType].endGame(state);
  players[1][blueType].endGame(state);
  if(state == R) redWins++;
  if(state == B) blueWins++;
  if(state == T) draws++;
  document.getElementById("counter").innerHTML = "Red: " + redWins + " Blue: " + blueWins + " Ties: " + draws;
}

function doTimes(fun, times, callback) {
  kill = false;
  let count = 1;
  let fun2 = () => {
    fun();
    if(count++ < times && !kill) setTimeout(fun2, 5);
    else {
      callback();
      kill = false;
    }
  }
  fun2();
}

function resetCounts() {
  redWins = 0;
  blueWins = 0;
  draws = 0;
  document.getElementById("counter").innerHTML = "Red: " + redWins + " Blue: " + blueWins + " Ties: " + draws;
}

function runMultiple(times) {
  document.getElementById("runMultiple").disabled = true;
  document.getElementById("resetCounts").disabled = true;
  document.getElementById("redplayer").disabled = true;
  document.getElementById("blueplayer").disabled = true;
  document.getElementById("rungame").disabled = true;
  document.getElementById("resetplayerdata").disabled = true;
  document.getElementById("runcustom").disabled = true;
  doTimes(runGame, times, function() {
    document.getElementById("runMultiple").disabled=false;
    document.getElementById("resetCounts").disabled = false;
    document.getElementById("redplayer").disabled = false;
    document.getElementById("blueplayer").disabled = false;
    document.getElementById("rungame").disabled = false;
    document.getElementById("resetplayerdata").disabled = false;
    document.getElementById("runcustom").disabled = false;
  });
}

function resetPlayerData() {
  if(confirm("This will reset all training/tables for the players.")) {
    players = [[new RandomPlayer(R), new TablePlayer(R), new NeuralPlayer(R)],[new RandomPlayer(B), new TablePlayer(B), new NeuralPlayer(B)]];
  }
}
