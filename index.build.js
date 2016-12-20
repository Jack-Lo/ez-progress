'use strict';

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

var Event = require('on-fire');
var win = window;
var doc = document;

var sTO = win.setTimeout;
var sIV = win.setInterval;
var cTO = win.clearTimeout;
var cIV = win.clearInterval;

function random(n) {
  if ((typeof n === 'undefined' ? 'undefined' : _typeof(n)) === 'object') {
    var times = n[1] - n[0];
    var offset = n[0];
    return Math.random() * times + offset;
  } else {
    return n;
  }
}

function main(opt) {
  var onFire = new Event();
  var _t = this;
  _t.on = onFire.on;
  _t.fire = onFire.fire;
  _t.handler = onFire.handler;

  var cfg = _t.config = {
    from: opt.from ? opt.from : 0,
    to: opt.to ? opt.to : 100,
    speed: opt.speed ? opt.speed : 1,
    delay: opt.delay ? opt.delay : 1000 / 11
  };

  var data = _t.data = {
    progress: cfg.from,
    next: {
      dist: cfg.from,
      callback: null,
      speed: cfg.speed,
      delay: cfg.delay,
      status: 1
    },
    status: 0
  };

  _t.timer = 0;
}

main.prototype = {
  from: function from(prg) {
    var _t = this;

    _t.config.from = prg;
  },
  progress: function progress(prg, cb, spd, dly) {
    var _t = this;
    var cfg = _t.config;
    var data = _t.data;

    var _spd = random(spd);
    var _dly = random(dly);

    var from = data.progress;
    _t.timer = sTO(function () {
      if (from + _spd >= prg) {
        data.progress = prg;
        _t.fire('progress', data);
        cTO(_t.timer);

        data.next.status = 1;

        if (prg === cfg.to) {
          _t.fire('completed', data);
        }

        cb && cb(data);
      } else {
        data.progress += _spd;
        _t.fire('progress', data);
        _t.progress(prg, cb, spd, dly);
      }
    }, _dly);
  },
  add: function add(prg, cb, spd, dly) {
    var _t = this;
    var cfg = _t.config;
    var data = _t.data;
    var next = data.next;

    if (_t.data.status === 1) {
      // ended
      return _t;
    }

    cTO(_t.timer);

    if (next.status === 0) {
      _t.fire('passed', data);
      next.status = 1;
    }

    if (next.dist + prg > cfg.to) {
      // 对超出部分裁剪对齐
      next.dist = cfg.to;
    } else {
      next.dist += prg;
    }

    next.callback = cb;
    next.speed = spd ? spd : cfg.speed;
    next.delay = dly ? dly : cfg.delay;
    next.status = 0;

    _t.progress(next.dist, next.callback, next.speed, next.delay);

    if (_t.data.status === 2) {
      // complete
      _t.data.status = 1; // 完成后，锁住add方法
    }

    return _t;
  },
  go: function go(prg, cb, spd, dly) {
    var _t = this;
    var data = _t.data;

    _t.add(prg - data.progress, cb, spd, dly);

    return _t;
  },
  end: function end() {
    var _t = this;

    _t.data.status = 1;
    cTO(_t.timer);
    _t.fire('ended', _t.data);

    return _t;
  },
  complete: function complete(cb, spd, dly) {
    var _t = this;

    _t.data.status = 2;
    cTO(_t.timer);

    _t.go(_t.config.to, cb, spd, dly);

    return _t;
  },
  reset: function reset(cb) {
    var _t = this;
    var cfg = _t.config;

    cTO(_t.timer);

    _t.handler = {};
    _t.data = {
      progress: cfg.from,
      next: {
        dist: cfg.from,
        callback: null,
        speed: cfg.speed,
        delay: cfg.delay,
        status: 1
      },
      status: 0
    };

    _t.timer = 0;

    _t.fire('reset', _t.data);
    // _t.fire('progress', _t.data)  // 触发一次progress？

    cb && cb(_t.data);

    return _t;
  },
  destroy: function destroy(cb) {
    var _t = this;

    cTO(_t.timer);

    cb && cb(_t.data);
    _t.fire('destroy', _t.data); // 这里实际上是先回调，再destroy...

    _t.config = null;
    _t.data = null;
    _t.timer = 0;

    _t.on = null;
    _t.fire = null;
    _t.handler = null;

    return _t;
  }
};

module.exports = main;
