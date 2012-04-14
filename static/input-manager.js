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
    var keysDown = 0;


    var keyStates = {};


		// on keyUP, speed 0.
		$('body').keydown(function(e) {

      //keysDown++;
      keyStates[e.keyCode] = 1;

			var dir;
			switch (e.keyCode) {
				case UP:
					dir= {x: 0, y: -1}; break;
				case DOWN:
					dir= {x: 0, y: 1}; break;
				case LEFT:
					dir= {x: -1, y: 0}; break;
				case RIGHT:
					dir= {x: 1, y: 0}; break;
			}

			// ignore nonmatches
			if (dir) {
        //console.log("send: " + pid + ' ' + dir.x + ' ' + dir.y)
				socket.emit('userInput', { 
					pid: pid,
					dir: dir,
          velocity: 1
				});
			}
		});


		// user input - release
		$('body').keyup(function(e) {
      var currentDir = this.hero.getDirection()
      keyStates[e.keyCode] = 0;

      var keysDown = _.reduce(keyStates, function(a, b) { return a + b; })
      console.log('stop ' + keysDown);
      var newVelocity = (keysDown > 0) ? 1 : 0;

      var dir;
      switch (e.keyCode) {
        case UP:
          dir= {x: 0, y: -1}; break;
        case DOWN:
          dir= {x: 0, y: 1}; break;
        case LEFT:
          dir= {x: -1, y: 0}; break;
        case RIGHT:
          dir= {x: 1, y: 0}; break;
      }

      if (dir) {
        socket.emit('userInput', { 
            pid: pid,
            dir: dir,
            velocity: newVelocity
        });
      }
      /*
			if (e.keyCode == UP || e.keyCode == DOWN) {
				socket.emit('userInput', { 
						pid: pid,
						dir: { x: null, y: 0},
            velocity: newVelocity
				});
			}
			else if (e.keyCode == LEFT || e.keyCode == RIGHT) {
        //currentDir.y = 0;
				socket.emit('userInput', { 
						pid: pid,
//						dir: currentDir,
            dir: { x: 0, y: null},
            velocity: newVelocity
				});
			}
      */

		}.bind(this));
	}

	

});