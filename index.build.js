(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
  typeof define === 'function' && define.amd ? define(factory) :
  (global = typeof globalThis !== 'undefined' ? globalThis : global || self, global.Progress = factory());
}(this, (function () { 'use strict';

  function _typeof(obj) {
    "@babel/helpers - typeof";

    if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") {
      _typeof = function (obj) {
        return typeof obj;
      };
    } else {
      _typeof = function (obj) {
        return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj;
      };
    }

    return _typeof(obj);
  }

  function onFire () {
    var _handlers = {};

    var _on = function (type, handler) {
      if (!_handlers[type]) {
        _handlers[type] = [];
      }

      _handlers[type].push(handler);
    };

    var _fire = function (type, res) {
      if (type in _handlers) {
        var arr = _handlers[type];
        for (var i = 0; i < arr.length; i++) {
          arr[i](res);
        }
      }
    };

    return {
      handler: _handlers,
      on: _on,
      fire: _fire
    }
  }

  var onFire_1 = onFire;

  var win = window;
  var sTO = win.setTimeout;
  var cTO = win.clearTimeout;

  function random(n) {
    if (_typeof(n) === 'object') {
      var times = n[1] - n[0];
      var offset = n[0];
      return Math.random() * times + offset;
    }

    return n;
  }

  function main() {
    var opt = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
    var onFire = new onFire_1();
    var self = this;
    self.on = onFire.on;
    self.fire = onFire.fire;
    self.handler = onFire.handler;
    var from = opt.from,
        to = opt.to,
        speed = opt.speed,
        delay = opt.delay;
    var cfg = {
      from: from || 0,
      to: to || 100,
      speed: speed || 1,
      delay: delay || 1000 / 11
    };
    self.config = cfg;
    var data = {
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
    self.data = data;
    self.timer = 0;
  }

  main.prototype = {
    from: function from(prg) {
      var self = this;
      var newPrg = random(prg);
      self.config.from = newPrg;
    },
    progress: function progress(prg, cb, spd, dly) {
      var self = this;
      var cfg = self.config;
      var data = self.data;
      var newSpd = random(spd);
      var newDly = random(dly);
      var from = data.progress;
      self.timer = sTO(function () {
        if (from + newSpd >= prg) {
          data.progress = prg;
          self.fire('progress', data);
          cTO(self.timer);
          data.next.status = 1;

          if (prg === cfg.to) {
            self.fire('completed', data);
          }

          if (cb) {
            cb(data);
          }
        } else {
          data.progress += newSpd;
          self.fire('progress', data);
          self.progress(prg, cb, spd, dly);
        }
      }, newDly);
    },
    add: function add(prg, cb, spd, dly) {
      var self = this;
      var cfg = self.config;
      var data = self.data;
      var next = data.next;
      var newPrg = random(prg);

      if (self.data.status === 1) {
        // ended
        return self;
      }

      cTO(self.timer);

      if (next.status === 0) {
        self.fire('passed', data);
        next.status = 1;
      }

      if (next.dist + newPrg > cfg.to) {
        // 对超出部分裁剪对齐
        next.dist = cfg.to;
      } else {
        next.dist += newPrg;
      }

      next.callback = cb;
      next.speed = spd || cfg.speed;
      next.delay = dly || cfg.delay;
      next.status = 0;
      self.progress(next.dist, next.callback, next.speed, next.delay);

      if (self.data.status === 2) {
        // complete
        self.data.status = 1; // 完成后，锁住add方法
      }

      return self;
    },
    go: function go(prg, cb, spd, dly) {
      var self = this;
      var data = self.data;
      var newPrg = random(prg);
      self.add(newPrg - data.progress, cb, spd, dly);
      return self;
    },
    end: function end(cb) {
      var self = this;
      self.data.status = 1;
      cTO(self.timer);
      self.fire('ended', self.data);

      if (cb) {
        cb(self.data);
      }

      return self;
    },
    complete: function complete(cb, spd, dly) {
      var self = this;
      self.data.status = 2;
      cTO(self.timer);
      self.go(self.config.to, cb, spd, dly);
      return self;
    },
    reset: function reset(cb) {
      var self = this;
      var cfg = self.config;
      cTO(self.timer);
      self.handler = {};
      self.data = {
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
      self.timer = 0;
      self.fire('reset', self.data); // self.fire('progress', self.data)  // 触发一次progress？

      if (cb) {
        cb(self.data);
      }

      return self;
    },
    destroy: function destroy(cb) {
      var self = this;
      cTO(self.timer);

      if (cb) {
        cb(self.data);
      }

      self.fire('destroy', self.data); // 这里实际上是先回调，再destroy...

      self.config = null;
      self.data = null;
      self.timer = 0;
      self.on = null;
      self.fire = null;
      self.handler = null;
      return self;
    }
  };

  return main;

})));
