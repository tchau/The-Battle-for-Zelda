// TODO
// currently sends commands at maximum rate; need to put it into a loop sampling at
// the server's tick rate
var InputManager = Class.extend({
	init: function(socket, pid, hero) {

    console.log('New InputManager ' + pid);
		this._socket = socket;
		this._pid    = pid;
    this.hero    = hero;

		this.bind();
	},

	bind: function() {

		var socket = this._socket, 
					 pid = this._pid;

		// User Input Handling
		var UP = 87, DOWN = 83, RIGHT = 68, LEFT = 65;
    var SPACE = 32;
    var keysDown = 0;


    var keyStates = {};


		// on keyUP, speed 0.
		$('body').keydown(function(e) {

      // choose to go in most recent direction
      // only accept VALID controls
      console.log("KEYDOWN: " + e.keyCode);

			var dir;
      var attack = null;
			switch (e.keyCode) {
				case UP:
					dir= {x: 0, y: -1}; break;
				case DOWN:
					dir= {x: 0, y: 1}; break;
				case LEFT:
					dir= {x: -1, y: 0}; break;
				case RIGHT:
					dir= {x: 1, y: 0}; break;
        case SPACE:
          dir = {}; attack = true; break;
			}

			// ignore nonmatches
			if (dir) {

        keyStates[e.keyCode] = 1;

				socket.emit('userInput', { 
					pid: pid,
					dir: dir,
          attack: attack,
          velocity: 1
				});
			}

		});


		// user input - RELEASE of keys.
		$('body').keyup(function(e) {
      var currentDir = this.hero.getDirection()
      keyStates[e.keyCode] = 0;

      var keysDown = _.reduce(keyStates, function(a, b) { return a + b; })

      // if NO motion keys are depressed, stop.
      if (keysDown == 0) {
        console.log('full stop ' + keysDown);
        socket.emit('userInput', { 
            pid: pid,
            dir: {}, // no change to direction
            velocity: 0 // stop
        });
      }
		}.bind(this));
	}

	

});