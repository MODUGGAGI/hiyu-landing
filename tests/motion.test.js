import test from "node:test";
import assert from "node:assert/strict";
import { ButtonMotion, StickerEmitter } from "../src/tap/motion.js";

// This fixture models DOM ownership and animation lifecycle, not browser rendering.
// Browser QA remains responsible for real pointer input, paint cost, and visual feel.
function fixture(viewportWidth = 320) {
  const animations = [];
  const timers = new Map();
  let nextTimer = 0;
  let now = 0;
  const document = {
    documentElement: { clientWidth: viewportWidth },
    defaultView: {
      innerWidth: viewportWidth,
      performance: { now: () => now },
      getComputedStyle: (node) => ({
        transform: node.renderedTransform ?? (node.style.transform || "none"),
      }),
      setTimeout: (callback, delay = 0) => {
        const id = ++nextTimer;
        timers.set(id, { callback, due: now + delay });
        return id;
      },
      clearTimeout: (id) => timers.delete(id),
    },
    createElement: (tagName) => new Node(tagName),
    createDocumentFragment: () => new Node("#fragment"),
  };

  class Node {
    constructor(tagName) {
      this.tagName = tagName;
      this.ownerDocument = document;
      this.children = [];
      this.attributes = new Map();
      this.style = {
        transform: "",
        setProperty(name, value) {
          this[name] = value;
        },
      };
      this.classList = {
        values: new Set(),
        add(value) {
          this.values.add(value);
        },
        remove(value) {
          this.values.delete(value);
        },
        contains(value) {
          return this.values.has(value);
        },
      };
    }

    append(node) {
      if (node.tagName === "#fragment") {
        for (const child of [...node.children]) this.append(child);
        return;
      }
      node.remove();
      node.parentNode = this;
      this.children.push(node);
    }

    remove() {
      if (this.parentNode) {
        this.parentNode.children = this.parentNode.children.filter(
          (child) => child !== this,
        );
        this.parentNode = null;
      }
    }

    setAttribute(key, value) {
      this.attributes.set(key, value);
    }

    getBoundingClientRect() {
      if (this.rect) return this.rect;
      if (this.children[0]?.tagName === "img") return { width: 52, height: 54 };
      const text = this.children[0]?.textContent ?? "";
      const width = 26 + [...text].length * 15;
      return { width, height: 46 };
    }

    animate(frames, options) {
      const animation = {
        node: this,
        frames,
        options,
        cancelled: false,
        cancel() {
          if (this.cancelled) return;
          this.cancelled = true;
          this.node.renderedTransform = null;
          this.oncancel?.();
        },
        finish() {
          this.onfinish?.();
        },
      };
      animations.push(animation);
      return animation;
    }
  }

  const button = new Node("button");
  button.rect = {
    left: 12,
    right: viewportWidth - 12,
    top: 240,
    bottom: 320,
    width: viewportWidth - 24,
    height: 80,
  };
  function advance(milliseconds) {
    const end = now + milliseconds;
    while (timers.size) {
      const [id, timer] = [...timers].sort((a, b) => a[1].due - b[1].due)[0];
      if (timer.due > end) break;
      now = timer.due;
      timers.delete(id);
      timer.callback();
    }
    now = end;
  }
  return {
    button,
    surface: new Node("span"),
    layer: new Node("div"),
    animations,
    timers,
    advance,
    runTimers() {
      if (timers.size)
        advance(
          Math.max(...[...timers.values()].map((timer) => timer.due)) - now,
        );
    },
  };
}

const emotion = {
  id: "blocked",
  label: "답답",
  color: "#F8D3C0",
  icon: "./assets/blocked.svg",
  assets: [
    { kind: "text", value: "꽉 막혔어" },
    { kind: "emoji", value: "😤" },
  ],
};

function parseTransform(value) {
  const match = value.match(
    /^translate3d\(([-.\d]+)px, ([-.\d]+)px, 0\) scale\(([-.\d]+)\) rotate\(([-.\d]+)deg\)$/,
  );
  assert.ok(match, `Unexpected transform: ${value}`);
  return match.slice(1).map(Number);
}

test("each tap adds one weighted reaction and reactions accumulate across a burst", (context) => {
  // A seeded entropy source makes coverage of all four renderers repeatable.
  // The public random sampler and real emission path remain unchanged.
  let seed = 0x1234_5678;
  context.mock.method(globalThis.crypto, "getRandomValues", (array) => {
    for (let i = 0; i < array.length; i += 1) {
      seed = (Math.imul(seed, 1_664_525) + 1_013_904_223) >>> 0;
      array[i] = seed;
    }
    return array;
  });
  const { button, layer, animations } = fixture();
  const emitter = new StickerEmitter(layer);
  const allowed = new Map(
    [
      { kind: "face", value: emotion.icon },
      { kind: "plus", value: "+1" },
      ...emotion.assets,
    ].map((asset) => [asset.value, asset.kind]),
  );
  const emitted = [];
  const seenKinds = new Set();
  for (let i = 0; i < 80; i += 1) {
    emitter.emit({ button, emotion });
    assert.equal(layer.children.length, i + 1);
    assert.equal(emitter.activeCount, i + 1);
    assert.equal(animations.length, i + 1);
    const node = layer.children.at(-1);
    const value =
      node.children[0].tagName === "img"
        ? node.children[0].src
        : node.children[0].textContent;
    assert.ok(
      allowed.has(value),
      `Reaction outside the chosen emotion pool: ${value}`,
    );
    const kind = allowed.get(value);
    seenKinds.add(kind);
    assert.equal(node.className, `particle particle--${kind}`);
    assert.equal(node.attributes.get("aria-hidden"), "true");
    if (kind === "face") {
      assert.equal(node.children[0].tagName, "img");
      assert.equal(node.children[0].alt, "");
      assert.equal(node.children[0].draggable, false);
    } else {
      assert.equal(node.children[0].tagName, "span");
    }
    emitted.push(node);
    assert.deepEqual(
      layer.children,
      emitted,
      "a new click must not replace an earlier floating reaction",
    );
  }
  assert.deepEqual(seenKinds, new Set(["face", "text", "emoji", "plus"]));
  emitter.clear();
  assert.equal(layer.children.length, 0);
});

test("a cap of one keeps only the latest reaction while cleaning up the previous animation", () => {
  const { button, layer, animations } = fixture();
  const emitter = new StickerEmitter(layer, { maxParticles: 1 });
  for (let i = 0; i < 20; i += 1) {
    const previous = animations.at(-1);
    emitter.emit({ button, emotion });
    assert.equal(emitter.activeCount, 1);
    assert.equal(layer.children.length, 1);
    assert.equal(animations.length, i + 1);
    assert.equal(layer.children[0], animations.at(-1).node);
    if (previous) {
      assert.ok(previous.cancelled);
      assert.equal(previous.node.parentNode, null);
      assert.equal(previous.onfinish, null);
      assert.equal(previous.oncancel, null);
    }
  }
  assert.equal(emitter.peakCount, 1);
  emitter.destroy();
  assert.equal(layer.children.length, 0);
});

test("decorative image assets are rejected while the dedicated emotion face stays supported", () => {
  const { button, layer } = fixture();
  const emitter = new StickerEmitter(layer);
  const unsupported = {
    ...emotion,
    assets: [{ kind: "image", value: "./assets/cloud.svg", variant: "doodle" }],
  };
  assert.throws(
    () => emitter.emit({ button, emotion: unsupported }),
    /must be text or emoji/,
  );
  assert.equal(emitter.activeCount, 0);
  assert.equal(layer.children.length, 0);
});

test("a 500-tap burst respects its particle cap and releases completed or cancelled particles", () => {
  const { button, layer, animations } = fixture();
  const emitter = new StickerEmitter(layer, { maxParticles: 12 });
  for (let i = 0; i < 500; i += 1) {
    emitter.emit({ button, emotion, combo: i + 1 });
    assert.ok(emitter.activeCount <= 12);
    assert.equal(layer.children.length, emitter.activeCount);
  }
  assert.equal(emitter.peakCount, 12);
  const active = animations.filter((animation) => !animation.cancelled);
  const beforeFinish = emitter.activeCount;
  active[0].finish();
  assert.equal(emitter.activeCount, beforeFinish - 1);
  assert.equal(active[0].node.parentNode, null);
  assert.equal(active[0].onfinish, null);
  assert.equal(active[0].oncancel, null);
  active[1].cancel();
  assert.equal(emitter.activeCount, beforeFinish - 2);
  assert.equal(active[1].node.parentNode, null);
  emitter.clear();
  assert.equal(emitter.activeCount, 0);
  assert.equal(layer.children.length, 0);
  assert.ok(
    animations.every(
      (animation) =>
        animation.cancelled && !animation.onfinish && !animation.oncancel,
    ),
  );
});

test("rotated and scaled stickers stay within 18px side padding even when emitted at an edge", () => {
  for (const viewportWidth of [280, 320, 768]) {
    const { button, layer, animations } = fixture(viewportWidth);
    const emitter = new StickerEmitter(layer);
    const wideEmotion = {
      ...emotion,
      assets: [
        { kind: "text", value: "길이가 긴 스티커도 안전하게" },
        { kind: "emoji", value: "😤" },
      ],
    };
    for (let i = 0; i < 40; i += 1) {
      emitter.emit({
        button,
        emotion: wideEmotion,
        pointer: { x: i % 2 ? 0 : viewportWidth, y: 280 },
        combo: 20,
      });
    }
    for (const animation of animations) {
      const { width, height } = animation.node.getBoundingClientRect();
      const left = parseFloat(animation.node.style.left);
      for (const frame of animation.frames) {
        const [x, , scale, angle] = parseTransform(frame.transform);
        const radians = (angle * Math.PI) / 180;
        const halfExtent =
          ((width * Math.abs(Math.cos(radians)) +
            height * Math.abs(Math.sin(radians))) *
            scale) /
          2;
        const center = left + width / 2 + x;
        // Account only for subpixel rounding in serialized transform values.
        assert.ok(center - halfExtent >= 17.8, "left edge escaped");
        assert.ok(
          center + halfExtent <= viewportWidth - 17.8,
          "right edge escaped",
        );
      }
    }
    emitter.destroy();
  }
});

test("reduced-motion particles only fade and the preference is read again for later taps", () => {
  const { button, layer, animations } = fixture();
  let reduced = true;
  const emitter = new StickerEmitter(layer, { reducedMotion: () => reduced });
  emitter.emit({ button, emotion });
  for (const animation of animations) {
    assert.equal(animation.options.duration, 150);
    assert.equal(
      new Set(animation.frames.map((frame) => frame.transform)).size,
      1,
    );
    assert.equal(animation.frames[0].opacity, 0);
    assert.equal(animation.frames.at(-1).opacity, 0);
  }
  emitter.clear();
  reduced = false;
  emitter.emit({ button, emotion });
  assert.ok(
    animations.at(-1).options.duration >= 650 &&
      animations.at(-1).options.duration < 800,
  );
  assert.ok(
    new Set(animations.at(-1).frames.map((frame) => frame.transform)).size > 1,
  );
  emitter.destroy();
  const countBefore = animations.length;
  emitter.emit({ button, emotion });
  assert.equal(animations.length, countBefore);
  assert.equal(layer.children.length, 0);
});

test("interrupting a press or release begins at the visible transform instead of jumping to rest", () => {
  const { button, surface, animations, advance } = fixture();
  const motion = new ButtonMotion(button, surface);
  motion.press();
  const first = animations.at(-1);
  advance(60);
  const halfwayDown = "matrix(0.99, 0, 0, 0.99, 0, 2.4)";
  surface.renderedTransform = halfwayDown;
  motion.release();
  assert.equal(animations.at(-1).frames[0].transform, halfwayDown);
  assert.ok(first.cancelled);
  assert.equal(first.onfinish, null);
  const returning = animations.at(-1);
  const halfwayBack = "matrix(0.997, 0, 0, 0.997, 0, 0.8)";
  surface.renderedTransform = halfwayBack;
  motion.press();
  assert.equal(animations.at(-1).frames[0].transform, halfwayBack);
  assert.ok(returning.cancelled);
  assert.ok(button.classList.contains("is-pressed"));
  animations.at(-1).finish();
  assert.ok(animations.at(-1).cancelled);
  motion.destroy();
  assert.equal(surface.style.transform, "");
  assert.ok(!button.classList.contains("is-pressed"));
});

test("reduced-motion buttons press and release immediately and cancel an in-flight spring", () => {
  const { button, surface, animations } = fixture();
  let reduced = false;
  const motion = new ButtonMotion(button, surface, {
    reducedMotion: () => reduced,
  });
  motion.press();
  const running = animations.at(-1);
  reduced = true;
  motion.release();
  assert.ok(running.cancelled);
  assert.equal(animations.length, 1);
  assert.equal(surface.style.transform, "none");
  motion.press();
  assert.ok(button.classList.contains("is-pressed"));
  assert.match(surface.style.transform, /translate3d\(0, 4px, 0\)/);
  assert.equal(animations.length, 1);
  motion.release();
  assert.equal(surface.style.transform, "none");
  assert.ok(!button.classList.contains("is-pressed"));
  motion.destroy();
});

test("a very quick tap remains visibly pressed for 60ms and a new press replaces the pending release", () => {
  const { button, surface, animations, timers, advance } = fixture();
  const motion = new ButtonMotion(button, surface);
  motion.press();
  advance(8);
  motion.release();
  assert.equal(animations.length, 1);
  assert.equal(timers.size, 1);
  assert.ok(button.classList.contains("is-pressed"));
  advance(20);
  motion.press();
  assert.equal(timers.size, 0);
  assert.equal(
    animations.length,
    1,
    "repeated press must not jump or restart the press animation",
  );
  motion.release();
  advance(59);
  assert.ok(button.classList.contains("is-pressed"));
  assert.equal(animations.length, 1);
  advance(1);
  assert.ok(!button.classList.contains("is-pressed"));
  assert.equal(animations.length, 2);
  assert.equal(timers.size, 0);
  motion.destroy();
});

test("normal holds release promptly and switching to reduced motion settles a running return", () => {
  const { button, surface, animations, timers, advance } = fixture();
  let reduced = false;
  const motion = new ButtonMotion(button, surface, {
    reducedMotion: () => reduced,
  });
  motion.press();
  advance(120);
  motion.release();
  assert.equal(timers.size, 0);
  assert.equal(animations.length, 2);
  assert.ok(!button.classList.contains("is-pressed"));
  const returning = animations.at(-1);
  reduced = true;
  motion.release();
  assert.ok(returning.cancelled);
  assert.equal(animations.length, 2);
  assert.equal(surface.style.transform, "none");
  motion.tap();
  assert.equal(timers.size, 0);
  assert.ok(!button.classList.contains("is-pressed"));
  assert.equal(surface.style.transform, "none");
  motion.destroy();
});

test("repeated taps replace the release timer and destroying a button stops pending work", () => {
  const { button, surface, animations, timers, runTimers } = fixture();
  const motion = new ButtonMotion(button, surface);
  motion.tap();
  motion.tap();
  assert.equal(timers.size, 1);
  runTimers();
  assert.ok(!button.classList.contains("is-pressed"));
  motion.tap();
  motion.destroy();
  assert.equal(timers.size, 0);
  assert.ok(animations.at(-1).cancelled);
  const previous = animations.length;
  motion.tap();
  motion.press();
  motion.release();
  runTimers();
  assert.equal(animations.length, previous);
  assert.equal(surface.style.transform, "");
});

test("phone reactions use local coordinates and stay inside the device instead of the page", () => {
  const f = fixture(1200);
  f.layer.rect = { left: 650, top: 110, width: 350, height: 700 };
  f.layer.clientWidth = 350;
  f.button.rect = {
    left: 700,
    right: 800,
    top: 400,
    bottom: 500,
    width: 100,
    height: 100,
  };
  const emitter = new StickerEmitter(f.layer, { localCoordinates: true });
  emitter.emit({ button: f.button, emotion });
  const particle = f.layer.children[0];
  assert.ok(
    parseFloat(particle.style.left) >= 0 &&
      parseFloat(particle.style.left) < 350,
  );
  assert.ok(
    parseFloat(particle.style.top) > 200 &&
      parseFloat(particle.style.top) < 360,
  );
  emitter.destroy();
  assert.equal(f.layer.children.length, 0);
});

test("rotated phone reactions still emerge within the tapped button", () => {
  const f = fixture(1200);
  Object.assign(f.layer, {
    offsetLeft: 0,
    offsetTop: 0,
    offsetParent: null,
    clientWidth: 350,
  });
  Object.assign(f.button, {
    offsetLeft: 125,
    offsetTop: 300,
    offsetWidth: 100,
    offsetHeight: 100,
    offsetParent: null,
  });
  // The transformed rectangles are intentionally very different from app layout.
  f.layer.rect = { left: 570, top: 95, width: 510, height: 740 };
  f.button.rect = {
    left: 780,
    right: 895,
    top: 420,
    bottom: 535,
    width: 115,
    height: 115,
  };
  const emitter = new StickerEmitter(f.layer, { localCoordinates: true });
  for (let i = 0; i < 30; i += 1) {
    emitter.emit({ button: f.button, emotion });
    const particle = f.layer.children.at(-1);
    const size = particle.getBoundingClientRect();
    const centerX = parseFloat(particle.style.left) + size.width / 2;
    const centerY = parseFloat(particle.style.top) + size.height / 2;
    assert.ok(centerX >= 125 && centerX <= 225);
    assert.ok(centerY >= 300 && centerY <= 400);
  }
  emitter.destroy();
});

test("rapid demo taps release before the next 55ms press instead of staying held", () => {
  const { button, surface, advance, timers, animations, layer: shadow } = fixture();
  button.offsetWidth = 105;
  const motion = new ButtonMotion(button, surface, { buzzer: true, rapid: true, shadow });
  for (let i = 0; i < 10; i++) {
    motion.tap();
    assert.equal(button.classList.contains('is-pressed'), true);
    assert.equal(surface.style.transform, 'translate3d(0, 3px, 0)');
    assert.equal(shadow.style.opacity, 0);
    assert.equal(surface.style['--press-depth'], '1');
    assert.ok(animations.every(a => a.cancelled || a.node !== surface)); // immediate down must paint without waiting for animation
    advance(30);
    assert.equal(button.classList.contains('is-pressed'), false);
    assert.ok(24 + animations.at(-1).options.duration < 55);
    assert.equal(animations.at(-1).frames.at(-1)['--press-depth'], '0');
    animations.filter(a => !a.cancelled).forEach(a => a.finish());
    advance(25);
  }
  motion.destroy();
  assert.equal(timers.size, 0);
});
