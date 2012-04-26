// globals
var players = {};
var pid; 

function getHearts(num) {
  var hearts = "";
  for (var i = 0; i < num; i++)
      hearts+= "&hearts;";

  return hearts;
}

function handleSignals(signals) {
  _.each(signals, function(signal) {
    if (signal.type == 'death') {
      var str = (players[signal.killer].name + ' hath slain ' + players[signal.killed].name + '!');
      console.log(str);
    }
    if (signal.type == 'damaged') {
      var hearts = getHearts(players[signal.player].health);
      $('#sidepanel').find('#row-' + signal.player + ' span.hearts').html(hearts);
    }
    if (signal.type == 'playerEntered') {
      $('#sidepanel').empty();
      _.each(players, function(player, pid) {
          var hearts = getHearts(player.health);
          $('#sidepanel').append($('<div></div>')
                              .attr('id', 'row-' + pid)
                              .append($('<span></span>&nbsp;').text(player.name))
                              .append($('<span class="hearts"></span>').html(hearts)));
      });

    }
  });
}
function startGame(username) {
  var canvas = $('#canvas')[0];
      ctx = canvas.getContext('2d');
      ctx.fillStyle='#ff0000';

  var socket = io.connect('http://192.168.1.2');

  socket.on('setPid', function (data) {
    pid = data.pid;
    console.log("Connected: " + data.pid)

    // handle user input
    players[pid] = new Hero();
    new InputManager(socket, pid, players[pid]);

    socket.emit('userName', {
      pid: pid,
      name: username
    });
  });

  // updates from backend
  var buf = new SnapshotBuffer();
  socket.on('update', function (data) {
    
    // store into the snapshot buffer
    buf.store(data);

    _.each(data.players, function(player, pid){
      if (players[pid] == undefined)
        players[pid] = new Hero();

      players[pid].setValue(player);
    });

    if (data.signals.length > 0) {
      handleSignals(data.signals);
    }
  });
  
  // animation loop - perform INTERPOLATION to reduce jerkiness, buffer the snapshots
  setInterval(function() {
    ctx.clearRect(0,0, canvas.width, canvas.height);

    // interpolate using the last two snapshots -- do we need to use server timestamps or local ones? well we KNOW the snapshots are CREATED with consistent periods; 
    // go 100ms back in time; choose the snapshot 1 PRIOR and 1 AHEAD, interpolate between the two based on server timestamps
    var renderSnapshot = buf.getInterpolatedSnapshot();

    // foreach player, advance frame and draw
    _.each(players, function(player, pid){
      player.draw(ctx);
    });

  }, 1000 / FPS);
}