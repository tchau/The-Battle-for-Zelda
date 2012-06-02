// globals
var players = {};
var pid; 

function getHearts(num) {
  var hearts = "";
  for (var i = 0; i < num; i++)
      hearts+= "&hearts;";

  return hearts;
}


/*
  TODO turn this into an event-driven architecture
      Events from server are "fired" by Objects there (player damaged)

      BUT what about client objects "sync"? Sync with server objs (rather, client
      objects are passively syncing with the backend objs' states as pure observers)

      Objects in the client "listen". E.g. event "player34 damaged" is handled
      by Player, and perhaps side panel that must refresh stats.

      however the client objs can't directly listen to server objs... they "remote" listen
      via the socket interface. Published server events must be transmitted.
      The interface must route it to the right local rep.

      These objects also may publish their own events in response.
*/
function handleSignals(signals) {
  _.each(signals, function(signal) {
    console.log(signal)
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
    if (signal.type == 'victory') {
      $('#victory').show()
                    .removeClass('hidden')
                   .find('h2').text(players[signal.winner].name + ' has won!');
      setTimeout(function() {
        $('#victory').hide();
      }, 5000);

    }
  });
}

function startGame(username) {
  var canvas = $('#canvas')[0];
      ctx = canvas.getContext('2d');
      ctx.fillStyle='#ff0000';

  //var socket = io.connect('http://192.168.1.2');
  var socket = io.connect('http://localhost');
  //var socket = io.connect('http://battlezelda.nodejitsu.com');

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
