var Rectangle = function(config) {
  this.x = config.x;
  this.y = config.y;
  this.w = config.w;
  this.h = config.h;

  this.intersects = function(rect) {
    /*
    console.log('intersects?')
    console.log(rect);
    console.log(this);
    */
    var P1 = { x : this.x, y : this.y }
    var P2 = { x : this.x + this.w, y : this.y + this.h }
    var P3 = { x : rect.x, y : rect.y }
    var P4 = { x : rect.x + rect.w, y : rect.y + rect.h }
    return !( P2.y < P3.y || P1.y > P4.y || P2.x < P3.x || P1.x > P4.x );
  }

};

exports.Rectangle = Rectangle;