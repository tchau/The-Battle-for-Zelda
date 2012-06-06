var Mondrian = function(port) {

  var sockets = [];
  var mondApp = require('express').createServer(),
      express = require('express');
  mondApp.listen(port);

  var io = require('socket.io').listen(mondApp, { log: false });
  io.sockets.on('connection', function(socket) {
    console.log("MONDRIAN ON");
    sockets.push(socket);
  });

  mondApp.get('/', function(req, res) {
    console.log(__dirname);
    res.sendfile(__dirname + '/mondrian.html');
  });
  mondApp.use('/static', express.static(__dirname + '/static'));


  this.log = function(id, msg) {
    var socks = sockets.length;
    for (var i = 0; i < socks; i++)
      sockets[i].emit('update', { id: id, data:msg });
  }

}

module.exports = {
  Mondrian: Mondrian
}