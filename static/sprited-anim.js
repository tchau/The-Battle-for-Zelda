
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

  getDirection: function() {
    return { xdir: this.xdir, ydir: this.ydir };
  },

  setDirection: function(xdir, ydir) {

    var directions = {
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
      }
    };

    // if there was any change in direction
    if (! (xdir == this.xdir && ydir == this.ydir)) {

      if (ydir < 0)
        this.setupAnim(this._spriteImg, directions.UP);
      else
        this.setupAnim(this._spriteImg, directions.LEFT);
      var img = new Image();
      img.src = '/static/img/sprite1.png';

    }

    this.xdir = xdir;
    this.ydir = ydir;
  },

  draw: function(ctx) {
    this._super(ctx, this._x, this._y);
  }
});