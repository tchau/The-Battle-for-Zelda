var SnapshotBuffer = Class.extend({
  init: function() {
    this.buffer = [];

    // max buff size
    this.MAX_BUF = 20;
    this.cursor = 0;
  },

  store: function(snapshot) {
    this.buffer[this.cursor] = snapshot;

    // wraparound
    this.cursor = this.next(this.cursor);
  },

  next: function(cursor) {
    return (cursor + 1) % this.MAX_BUF;
  },
  prev: function(cursor) {
    return ((cursor - 1) < 0) ? this.MAX_BUF - 1 : cursor - 1;
  },

  // applies 100ms delay
  getInterpolatedSnapshot: function() {
    var ct = new Date().getTime() - 100;

    // shotA: seek snapshot before ct
    var i = this.cursor;
    while ( this.buffer[i].t > ct) {
      i = prev(this.cursor);
    }

    var a = this.buffer[i];
    var b = this.buffer[this.next(i)];

    this.interpolate(a, b, ct);

    // shotB: seek snapshot immediately after (if any)
    // return interpolation of A and B

    // if shotB does not exist, must extrapolate
  },

  // lists of players
  interpolate: function(a, b, ct) {
    var resultPlayers = {};
    var frac = a.t - 

    _.each(a.players, function(playerA, pid) {
      var playerB = b[pid];


      var result = {
        x : playerA.x 
      }


    });

  }

});