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
    this.cursor = (this.cursor + 1) % this.MAX_BUF;
  },

  next: function(cursor) {
    return (cursor + 1) % this.buffer.length;
  },
  prev: function(cursor) {
    return ((cursor - 1) < 0) ? this.buffer.length - 1 : cursor - 1;
  },

  // applies 100ms delay
  getInterpolatedSnapshot: function() {

    if (this.buffer.length <2) return {};

    var ct = new Date().getTime() - 100;

    // shotA: seek snapshot before ct
    //var i = this.cursor;

    // TODO getting trapped here;
    //while (this.buffer[i].t > ct) {
      var i = this.prev(this.prev(this.cursor));
    //}

    var a = this.buffer[i];
    var b = this.buffer[this.next(i)];

    return this.interpolate(a, b, ct);

    // if shotB does not exist, must extrapolate
  },

  // lists of players
  interpolate: function(a, b, ct) {
    var resultPlayers = {};
    var timeDif = ct - a.t;

    _.each(a.players, function(playerA, pid) {
      var playerB = b.players[pid];

      var result = {
        x : playerA.x + ((timeDif * playerB.x) - (timeDif * playerA.x)) / b.t - ct,
        y : playerA.y + ((timeDif * playerB.y) - (timeDif * playerA.y)) / b.t - ct
      };

      resultPlayers[pid] = result;
    });

    return resultPlayers;
  }

});