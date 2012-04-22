
function startGame() {
  var canvas = $('#canvas')[0];
      ctx = canvas.getContext('2d');
      ctx.fillStyle='#ff0000';

  var players = {};
  var pid; 
  
  var socket = io.connect('http://localhost');

  socket.on('setPid', function (data) {
    pid = data.pid;
    console.log("Connected: " + data.pid)

    // handle user input
    players[pid] = new Hero();
    new InputManager(socket, pid, players[pid]);
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