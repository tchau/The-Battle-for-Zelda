var Constants = require('./const').Constants
    Rectangle = require('./rectangle').Rectangle,
            _ = require('underscore');

// array of players
var PLAYER_WIDTH = 30;
var PLAYER_HEIGHT = 30;
var Player = function() {
  this.x = 100; this.y = 100;
  this.xdir = 0; this.ydir = 0;
  this.velocity = 0;
  this.health = 5;
  this.dead = false;

  // "attacking" cooldown, in ticks
  this.attackTime = 0;

  // "damaged" cooldown, in ticks
  this.damagedTime = 0;


  this.serialize = function() {
    var serialP = {};
    _.each(this, function (field, key) {
      if (typeof this[key] != 'function')
        serialP[key] = field;
    });
    return serialP;
  }

  this.getBox = function() {
    return new Rectangle({ x: this.x, y: this.y, w: 30, h: 30 });
  }

  this.knockback = function(xdir, ydir) {
    this.x += xdir * 10;
    this.y += ydir * 10;
  }

  this.setDirection = function(dir) {
    if (dir.x != null)
      this.xdir = dir.x;

    if (dir.y != null)
      this.ydir = dir.y;
  };

  this.setVelocity = function(v) {
    this.velocity = v;
  }

  this.getKillBox = function () {
    if (this.attackTime == 0)
      return null;

    // else return a box that is adjacent to the player, depending on 
    // their direction
    return new Rectangle(
          { x: this.x + PLAYER_WIDTH * this.xdir,
            y: this.y + PLAYER_HEIGHT * this.ydir,
            w: PLAYER_WIDTH/2,
            h: PLAYER_HEIGHT/2 });
  }

  // update to next tick
  this.update = function() {
    this.x += Constants.WALK_SPEED * this.velocity * this.xdir;
    this.y += Constants.WALK_SPEED * this.velocity * this.ydir;

    if (this.damagedTime > 0)
      this.damagedTime--;

    if (this.attackTime > 0)
      this.attackTime--;
  };

  this.revive = function() {
    this.dead = false;
    this.health = 5;
  }
};

module.exports = {
  Player: Player
}