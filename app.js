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

// command signals
var signals = [];

// array of players
var PLAYER_WIDTH = 30;
var PLAYER_HEIGHT = 30;
var players = {};
var Player = function() {
  this.x = 100; this.y = 100;
  this.xdir = 0; this.ydir = 0;
  this.velocity = 0;
  this.health = 5;
  this.dead = false;

  // "attacking" cooldown, in ticks
  this.attackTime = 0;

  // "damaged" cooldown, in ticks
  this.damagedTime = 0;


  this.serialize = function() {
    var serialP = {};
    _.each(this, function (field, key) {
      if (typeof this[key] != 'function')
        serialP[key] = field;
    });
    return serialP;
  }

  this.getBox = function() {
    return new Rectangle({ x: this.x, y: this.y, w: 30, h: 30});
  }

  this.knockback = function(xdir, ydir) {
    this.x += xdir * 10;
    this.y += ydir * 10;
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

    signals.push({
      type: 'playerEntered',
      player: players[data.pid].player.serialize()
    });
  });

  // when this player moves
  socket.on('userInput', function (data) {

    // ignore inputs for dead players
    if (players[data.pid].dead)
      return;

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

            // death?
            if (other.player.health <= 0) {
              other.player.dead = true;

              signals.push({
                type: 'death',
                killer:   pid,
                killed:   otherPid
              });

              // check for a winner

            }
          }
        }
      });
    }

    // serialize the player
   
    serialPlayers[pid] = p.player.serialize();
  });

  // broadcast moves
  var t = new Date();
  _.each(players, function(p, pid) {

    // timestamp world snapshow
    p.socket.emit('update', {
      players: serialPlayers,
      signals: signals,
      t: t.getTime()
    });

  });

  // misc signals (player has died, player has entered, player has left, player is damaged)
  signals = [];

  var newT = new Date();
//  console.log(newT.getTime() - oldT.getTime())
  oldT = newT;
}, 20);
