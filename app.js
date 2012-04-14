// see socket.io how to use


var app = require('express').createServer(),
   express = require('express'),
   cls = require('./static/class'),
   Constants = require('./static/const').Constants,
   _ = require('underscore'),
   io = require('socket.io').listen(app, { log: false });

app.listen(8080);

app.use('/static', express.static(__dirname + '/static'));

app.get('/', function (req, res) {
  console.log(__dirname);
  res.sendfile(__dirname + '/index.html');
});

// array of players
var players = {};
var Player = function() {
  this.x = 100; this.y = 100;
  this.xdir = 0; this.ydir = 0;
  this.velocity = 0;

  this.setDirection = function(dir) {
    if (dir.x != null)
      this.xdir = dir.x;

    if (dir.y != null)
      this.ydir = dir.y;
  };

  this.setVelocity = function(v) {
    this.velocity = v;
  }

  this.updatePos = function() {
    this.x += Constants.WALK_SPEED * this.velocity * this.xdir;
    this.y += Constants.WALK_SPEED * this.velocity * this.ydir;
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

  // when this player moves
  socket.on('userInput', function (data) {
    players[data.pid].player.setDirection( data.dir);
    players[data.pid].player.setVelocity( data.velocity);

  });

  // dead reckoning; clients simulate based on a past data point... course-correct.
  // every tick, send position udpates of all ships and projectiles
  var lastT = new Date();
  setInterval(function() {

    var serialPlayers = {};

    _.each(players, function(p, pid) {
      p.player.updatePos();

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
        t: t
      });

      // walk

    });

    var newT = new Date();
    var diff = newT - lastT;
    //console.log(diff);
    lastT = newT;
  }, 20);
});