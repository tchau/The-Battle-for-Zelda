// see socket.io how to use


var app = require('express').createServer(),
   express = require('express'),
   cls = require('./static/class'),
   Player = require('./static/player').Player,
   Constants = require('./static/const').Constants,
   Rectangle = require('./static/rectangle').Rectangle,
   Mondrian = require('./mondrian').Mondrian,
   _ = require('underscore'),
   io = require('socket.io').listen(app, { log: false });

app.listen(8080);

app.use('/static', express.static(__dirname + '/static'));

app.get('/', function (req, res) {
  console.log(__dirname);
  res.sendfile(__dirname + '/index.html');
});

/* MONDRIAN */
var mondrian = new Mondrian(8081);

/* END MONDRIAN */

var players = {};

function broadcast(signals) {
  var t = new Date();
  var serialPlayers = {};

  _.each(players, function(p, pid) {
    // serialize the player
    serialPlayers[pid] = p.player.serialize();
  });

  _.each(players, function(p, pid) {

    // timestamp world snapshow
    p.socket.emit('update', {
      players: serialPlayers,
      signals: signals,
      t: t.getTime()
    });

  }); 
}

function existsWinner() {
  var winner;
  var numAlive = 0;
  var numPlayers = 0;

  _.each(players, function(p, pid) {
    numPlayers++;
    if (! p.player.dead) {
      console.log('winner is ' + pid);
      numAlive++;
      winner = pid;
    }
  });

  if (numAlive == numPlayers - 1 && numPlayers > 1)
    return winner;
}

// restart the game -- reset all player health and positions
function restart() {
   _.each(players, function(p, pid) {
    p.player.revive();
  });

}

io.sockets.on('connection', function (socket) {

  // random player id after connecting
  var pid = (Math.random() * 1000).toFixed(0) + '-p';
  players[pid] = {
    player: new Player(),
    socket: socket
  };
  socket.emit('setPid', { pid: pid });

  // when user sets his name
  socket.on('userName', function (data) {
    players[data.pid].player.name = data.name;

    var signals = [{
      type: 'playerEntered',
      player: players[data.pid].player.serialize()
    }];

    broadcast(signals);
  });

  // when this player moves
  socket.on('userInput', function (data) {

    mondrian.log(data.pid + "input", data);

    // ignore inputs for dead players
    if (players[data.pid].dead)
      return;

    players[data.pid].player.setDirection( data.dir);
    players[data.pid].player.setVelocity( data.velocity);

    if (data.attack == true) {
      players[data.pid].player.attackTime = 20;
      players[data.pid].player.setVelocity(0);

    }
    mondrian.log(data.pid + "player", players[data.pid].player.serialize());

  });
});

// dead reckoning; clients simulate based on a past data point... course-correct.
// every tick, send position udpates of all ships and projectiles
var oldT = new Date();
setInterval(function() {

  // clear signals
  var signals = [];

  // update player states
  _.each(players, function(p, pid) {
    p.player.update();

    /* is this player attacking? */
    var killbox;
    if (!! (killbox = p.player.getKillBox())) {
      _.each(players, function(other, otherPid) {
        if (pid != otherPid && killbox.intersects(other.player.getBox())) {

          // only if player isn't already hit
          if (other.player.damagedTime <= 0 && !other.player.dead) {

            signals.push({
                type: 'damaged',
                player: otherPid
            });

            // damage effects
            other.player.damagedTime = 40;

            // knockback
            other.player.knockback(p.player.xdir, p.player.ydir);

            // decrease health
            other.player.health--;
            console.log(other.player.health)

            // death?
            if (other.player.health <= 0) {
              other.player.dead = true;

              signals.push({
                type: 'death',
                killer:   pid,
                killed:   otherPid
              });

              // check for a winner
              var winnerPid;
              console.log("WINNER: " + existsWinner())
              if ((winnerPid = existsWinner())) {
                signals.push({
                  type: 'victory',
                  winner:  winnerPid
                });

                // restart the game in 5 seconds
                setTimeout(restart, 5000);
              }


            }
          }
        }
      });
    }

  });

  // broadcast moves
  broadcast(signals);

  var newT = new Date();
//  console.log(newT.getTime() - oldT.getTime())
  oldT = newT;
}, 20);
