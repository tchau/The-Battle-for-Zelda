
var SpritedAnim = Class.extend({

	setupAnim: function(image, config) {
		this._img = image;

		// config options
		this._width = config.width;
		this._height = config.height;
		this._spriteX = config.spriteX;
		this._spriteY = config.spriteY;
		this._frames = config.frames;

		this._index = 0;
	},

	next: function() {
		this._index = (this._index + 1) % this._frames;
	},

	// assuming the frames are horizontally laid out
	// draw at x, y position
	// @param ctx context
	draw: function(ctx, x, y) {
		var frameX = this._spriteX + (this._index * this._width)
		var frameY = this._spriteY;

		ctx.drawImage(this._img, 
									frameX, frameY,  // xy pos of frame in img
									this._width, this._height,  // dimnensions of sprite frame
									x, y,  // position on canvas to draw
									this._width, this._height); // dimensions of area to draw
	}

});

var Hero = SpritedAnim.extend({
  init: function(config) {

    this._spriteImg = new Image();
    this._spriteImg.src = '/static/img/sprite1.png';

    this.setupAnim(this._spriteImg, {
      width: 24,
      height: 24,
      spriteX: 240,
      spriteY: 0,
      frames: 8
    });
  },

  setPosition: function(x, y) {
    this._x = x;
    this._y = y;
  },

  setVelocity : function(velocity) {
    this._velocity = velocity;
  },

  getDirection: function() {
    return { xdir: this.xdir, ydir: this.ydir };
  },

  ATTACKING_SPRITES: {
      LEFT: {
        width: 30,
        height: 32,
        spriteX: 234,
        spriteY: 88,
        frames: 5
      },
      UP: {
        width: 30,
        height: 32,
        spriteX: 0,
        spriteY: 178,
        frames: 5
      },
      RIGHT: {
        width: 30,
        height: 32,
        spriteX: 236,
        spriteY: 178,
        frames: 6
      },
      DOWN: {
        width: 29,
        height: 33,
        spriteX: 0,
        spriteY: 88,
        frames: 6
      }

  },
  STANDING_SPRITES: {
    LEFT: {
        width: 24,
        height: 24,
        spriteX: 240,
        spriteY: 0,
        frames: 1
      },
      UP: {
        width: 30,
        height: 28,
        spriteX: 0,
        spriteY: 120,
        frames: 1
      },
      RIGHT: {
        width: 30,
        height: 24,
        spriteX: 240,
        spriteY: 120,
        frames: 1
      },
      DOWN: {
        width: 30,
        height: 30,
        spriteX: 0,
        spriteY: 30,
        frames: 1
      }
  },

  WALK_SPRITES: {
      LEFT: {
        width: 24,
        height: 24,
        spriteX: 240,
        spriteY: 0,
        frames: 8
      },
      UP: {
        width: 30,
        height: 28,
        spriteX: 0,
        spriteY: 120,
        frames: 8
      },
      RIGHT: {
        width: 30,
        height: 24,
        spriteX: 240,
        spriteY: 120,
        frames: 6
      },
      DOWN: {
        width: 30,
        height: 30,
        spriteX: 0,
        spriteY: 30,
        frames: 8
      }
  },

  STATES: {
    STANDING: 0,
    WALKING: 1,
    ATTACKING: 2
  },

  setDirection: function(xdir, ydir) {

    //this.setState(this.STATES.WALKING, xdir, ydir);

    this.xdir = xdir;
    this.ydir = ydir;
  },

  setValue: function(playerJSON) {
    this.setPosition(playerJSON.x, playerJSON.y);
    this.setVelocity(playerJSON.velocity);
    this.damaged = playerJSON.damaged; 
    //TODO do not copy fields; just do it completely and automatically

    if (playerJSON.attackTime > 0) {
      this.setState(this.STATES.ATTACKING, playerJSON.xdir, playerJSON.ydir)
    }
    else if (this._velocity == 0)
      this.setState(this.STATES.STANDING, playerJSON.xdir, playerJSON.ydir)
    else 
      this.setState(this.STATES.WALKING, playerJSON.xdir, playerJSON.ydir);

    this.setDirection(playerJSON.xdir, playerJSON.ydir);
  },

  setState: function(state, xdir, ydir) {

    // if same animation state, keep running
    if (this.state == state && this.xdir == xdir && this.ydir == ydir)
      return;

    // otherwise change animation

    console.log(state)

    // walking (direction)
    if (state == this.STATES.WALKING) {

      console.log('walking ' + xdir + ', ' + ydir);

      // if there was any change in direction
      if (! (xdir == this.xdir && ydir == this.ydir && this.state == state)) {
        console.log(this.getCardinality(xdir, ydir));
        this.setupAnim(this._spriteImg, this.WALK_SPRITES[this.getCardinality(xdir, ydir)]);
      }
    }

    // standing (direction)
    if (state == this.STATES.STANDING) {
        this.setupAnim(this._spriteImg, this.STANDING_SPRITES[this.getCardinality(xdir, ydir)]);
    }

    // slashing (direction)
    if (state == this.STATES.ATTACKING) {
        this.setupAnim(this._spriteImg, this.ATTACKING_SPRITES[this.getCardinality(xdir, ydir)]);
      }

    this.state = state;

  },

  getCardinality: function(xdir, ydir) {
    if (ydir < 0)
      return "UP";
    if (xdir < 0)
      return "LEFT";
    if (xdir > 0)
      return "RIGHT";
    else
      return "DOWN";
  },

  draw: function(ctx) {
    //if (this._velocity > 0)
    this.next();

    this._super(ctx, this._x, this._y);

    // TODO temp
    if (this.damaged) {
      ctx.drawR
      ctx.strokeStyle = '#f00'; // red
      ctx.lineWidth   = 1;
      ctx.strokeRect(this._x - 2,  this._y - 2, 28, 28);
    }
  }
});