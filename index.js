import Event from 'on-fire';

const win = window;

const sTO = win.setTimeout;
const cTO = win.clearTimeout;

function random(n) {
  if (typeof n === 'object') {
    const times = n[1] - n[0];
    const offset = n[0];
    return Math.random() * times + offset;
  }
  return n;
}

function main(opt = {}) {
  const onFire = new Event();
  const self = this;
  self.on = onFire.on;
  self.fire = onFire.fire;
  self.handler = onFire.handler;

  const {
    from, to, speed, delay,
  } = opt;

  const cfg = {
    from: from || 0,
    to: to || 100,
    speed: speed || 1,
    delay: delay || (1000 / 11),
  };

  self.config = cfg;

  const data = {
    progress: cfg.from,
    next: {
      dist: cfg.from,
      callback: null,
      speed: cfg.speed,
      delay: cfg.delay,
      status: 1,
    },
    status: 0,
  };

  self.data = data;
  self.timer = 0;
}

main.prototype = {
  from(prg) {
    const self = this;
    const newPrg = random(prg);
    self.config.from = newPrg;
  },
  progress(prg, cb, spd, dly) {
    const self = this;
    const cfg = self.config;
    const { data } = self;

    const newSpd = random(spd);
    const newDly = random(dly);
    const from = data.progress;
    self.timer = sTO(() => {
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
  add(prg, cb, spd, dly) {
    const self = this;
    const cfg = self.config;
    const { data } = self;
    const { next } = data;
    const newPrg = random(prg);
    if (self.data.status === 1) { // ended
      return self;
    }
    cTO(self.timer);
    if (next.status === 0) {
      self.fire('passed', data);
      next.status = 1;
    }
    if (next.dist + newPrg > cfg.to) { // 对超出部分裁剪对齐
      next.dist = cfg.to;
    } else {
      next.dist += newPrg;
    }
    next.callback = cb;
    next.speed = spd || cfg.speed;
    next.delay = dly || cfg.delay;
    next.status = 0;
    self.progress(next.dist, next.callback, next.speed, next.delay);
    if (self.data.status === 2) { // complete
      self.data.status = 1; // 完成后，锁住add方法
    }
    return self;
  },
  go(prg, cb, spd, dly) {
    const self = this;
    const { data } = self;
    const newPrg = random(prg);
    self.add(newPrg - data.progress, cb, spd, dly);
    return self;
  },
  end(cb) {
    const self = this;
    self.data.status = 1;
    cTO(self.timer);
    self.fire('ended', self.data);
    if (cb) {
      cb(self.data);
    }
    return self;
  },
  complete(cb, spd, dly) {
    const self = this;
    self.data.status = 2;
    cTO(self.timer);
    self.go(self.config.to, cb, spd, dly);
    return self;
  },
  reset(cb) {
    const self = this;
    const cfg = self.config;
    cTO(self.timer);
    self.handler = {};
    self.data = {
      progress: cfg.from,
      next: {
        dist: cfg.from,
        callback: null,
        speed: cfg.speed,
        delay: cfg.delay,
        status: 1,
      },
      status: 0,
    };

    self.timer = 0;

    self.fire('reset', self.data);
    // self.fire('progress', self.data)  // 触发一次progress？

    if (cb) {
      cb(self.data);
    }

    return self;
  },
  destroy(cb) {
    const self = this;

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
  },
};

export default main;
