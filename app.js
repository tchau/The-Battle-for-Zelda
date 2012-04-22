// see socket.io how to use


var app = require('express').createServer(),
   express = require('express'),
   cls = require('./static/class'),
   Constants = require('./static/const').Constants,
   Rectangle = require('./static/rectangle').Rectangle,
   _ = require('underscore'),
   io = require('socket.io').listen(app, { log: false });

app.listen(8080);

app.use('/static', express.static(__dirname + '/static'));

app.get('/', function (req, res) {
  console.log(__dirname);
  res.sendfile(__dirname + '/index.html');
});

// array of players
var PLAYER_WIDTH = 30;
var PLAYER_HEIGHT = 30;
var players = {};
var Player = function() {
  this.x = 100; this.y = 100;
  this.xdir = 0; this.ydir = 0;
  this.velocity = 0;

  // "attacking" cooldown, in ticks
  this.attackTime = 0;

  // "damaged" cooldown, in ticks
  this.damagedTime = 0;

  this.getBox = function() {
    return new Rectangle({ x: this.x, y: this.y, w: 30, h: 30});
  }

  this.knockback = function(xdir, ydir) {
    this.x += xdir * 6;
    this.y += ydir * 6;
  }

  this.setDirection = function(dir) {
    if (dir.x != null)
      this.xdir = dir.x;

    if (dir.y != null)
      this.ydir = dir.y;
  };

  this.setVelocity = function(v) {
    this.velocity = v;
  }

  this.getKillBox = function () {
    if (this.attackTime == 0)
      return null;

    // else return a box that is adjacent to the player, depending on 
    // their direction
    return new Rectangle(
          { x: this.x + PLAYER_WIDTH * this.xdir,
            y: this.y + PLAYER_HEIGHT * this.ydir,
            w: PLAYER_WIDTH/2,
            h: PLAYER_HEIGHT/2 });

  }

  // update to next tick
  this.update = function() {
    this.x += Constants.WALK_SPEED * this.velocity * this.xdir;
    this.y += Constants.WALK_SPEED * this.velocity * this.ydir;

    if (this.damagedTime > 0)
      this.damagedTime--;

    if (this.attackTime > 0)
      this.attackTime--;
  };
};

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
  });

  // when this player moves
  socket.on('userInput', function (data) {
    players[data.pid].player.setDirection( data.dir);
    players[data.pid].player.setVelocity( data.velocity);

    if (data.attack == true) {
      players[data.pid].player.attackTime = 20;
      players[data.pid].player.setVelocity(0);
    }

  });
});

// dead reckoning; clients simulate based on a past data point... course-correct.
// every tick, send position udpates of all ships and projectiles
var oldT = new Date();
setInterval(function() {

  var serialPlayers = {};

  // update player states
  _.each(players, function(p, pid) {
    p.player.update();

    /* is this player attacking? */
    var killbox;
    if (!! (killbox = p.player.getKillBox())) {
      _.each(players, function(other, otherPid) {
        if (pid != otherPid && killbox.intersects(other.player.getBox())) {

            // somehow signal that the other player was hit.
            // make them flash
            // knock them back
            other.player.damagedTime = 70;
            // ok; so they've been hit -- 
            // i guess they'll be knocked back -- and the player
            // character must play an animated effect (flashing)

            // here we push them back
            other.player.knockback(p.player.xdir, p.player.ydir);
        }
      });
    }

    // serialize the player
    var serialP = {};
    _.each(p.player, function (field, key) {
      if (typeof p.player[key] != 'function')
        serialP[key] = field;
    });
    serialPlayers[pid] = serialP;
  });

  // broadcast moves
  var t = new Date();
  _.each(players, function(p, pid) {

    // timestamp world snapshow
    p.socket.emit('update', {
      players: serialPlayers,
      t: t.getTime()
    });

  });


  var newT = new Date();
//  console.log(newT.getTime() - oldT.getTime())
  oldT = newT;
}, 20);
