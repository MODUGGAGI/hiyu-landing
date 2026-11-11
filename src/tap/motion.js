import { randomRange } from "./random.js";
import { pickReaction } from "./emotions.js";

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
const radians = (degrees) => (degrees * Math.PI) / 180;

function layoutOffset(element) {
  let x = 0;
  let y = 0;
  for (let node = element; node; node = node.offsetParent) {
    if (!Number.isFinite(node.offsetLeft) || !Number.isFinite(node.offsetTop))
      return null;
    x += node.offsetLeft;
    y += node.offsetTop;
  }
  return { x, y };
}

function localButtonRect(button, layer) {
  const buttonOffset = layoutOffset(button);
  const layerOffset = layoutOffset(layer);
  if (
    !buttonOffset ||
    !layerOffset ||
    !(button.offsetWidth > 0) ||
    !(button.offsetHeight > 0)
  )
    return null;
  const left = buttonOffset.x - layerOffset.x;
  const top = buttonOffset.y - layerOffset.y;
  return {
    left,
    top,
    right: left + button.offsetWidth,
    bottom: top + button.offsetHeight,
    width: button.offsetWidth,
    height: button.offsetHeight,
  };
}

function transform(x, y, scale, rotation) {
  return `translate3d(${x.toFixed(2)}px, ${y.toFixed(2)}px, 0) scale(${scale.toFixed(3)}) rotate(${rotation.toFixed(2)}deg)`;
}

function floatFrames({
  deltaX,
  controlX,
  rise,
  fitScale,
  initialRotation,
  rotation,
}) {
  // Sample a continuous arc once. The browser plays these keyframes without a JS frame loop.
  return Array.from({ length: 33 }, (_, index) => {
    const t = index / 32;
    const progress = 1 - (1 - t) ** 3;
    const remaining = 1 - progress;
    const x = 2 * remaining * progress * controlX + progress ** 2 * deltaX;
    const y = -(2 * remaining * progress * rise * 0.88 + progress ** 2 * rise);
    const scale = fitScale * (1 - 0.42 * Math.exp(-24 * t) * Math.cos(32 * t));
    const turn = initialRotation + (rotation - initialRotation) * progress;
    const fade = clamp((t - 0.7) / 0.3, 0, 1);
    const opacity = Math.min(1, t / 0.045) * (1 - fade ** 2 * (3 - 2 * fade));
    return { transform: transform(x, y, scale, turn), opacity, offset: t };
  });
}

export class StickerEmitter {
  #layer;
  #document;
  #window;
  #reducedMotion;
  #maxParticles;
  #localCoordinates;
  #particles = new Map();
  #peakCount = 0;
  #destroyed = false;

  constructor(
    layer,
    {
      reducedMotion = () => false,
      maxParticles = 84,
      localCoordinates = false,
    } = {},
  ) {
    if (!layer?.ownerDocument || typeof layer.append !== "function") {
      throw new TypeError("StickerEmitter needs a DOM layer.");
    }
    if (typeof reducedMotion !== "function")
      throw new TypeError("reducedMotion must be a function.");
    if (!Number.isInteger(maxParticles) || maxParticles < 1) {
      throw new RangeError("maxParticles must be a positive integer.");
    }
    this.#layer = layer;
    this.#document = layer.ownerDocument;
    this.#window = this.#document.defaultView;
    this.#reducedMotion = reducedMotion;
    this.#maxParticles = maxParticles;
    this.#localCoordinates = localCoordinates;
    this.#layer.style.overflow = "clip";
  }

  get activeCount() {
    return this.#particles.size;
  }
  get peakCount() {
    return this.#peakCount;
  }

  emit({ button, emotion, pointer = null, combo = 1 }) {
    if (this.#destroyed) return;
    if (
      !button ||
      !emotion ||
      typeof emotion.icon !== "string" ||
      !emotion.icon ||
      !Array.isArray(emotion.assets) ||
      emotion.assets.length === 0
    ) {
      throw new TypeError(
        "emit needs a button and an emotion with its face icon and sticker assets.",
      );
    }
    if (
      emotion.assets.some(
        (asset) =>
          !asset ||
          (asset.kind !== "text" && asset.kind !== "emoji") ||
          typeof asset.value !== "string",
      )
    ) {
      throw new TypeError("Emitted stickers must be text or emoji.");
    }

    // Read geometry once per input. No layout measurements run inside animation frames.
    const rawRect = button.getBoundingClientRect();
    const bounds = this.#localCoordinates
      ? this.#layer.getBoundingClientRect()
      : { left: 0, top: 0 };
    // A tilted phone's bounding box is wider than its layout. Its particles
    // share that transform, so use the untransformed button center and size.
    const localRect = this.#localCoordinates
      ? localButtonRect(button, this.#layer)
      : null;
    const scale =
      this.#localCoordinates && !localRect
        ? this.#layer.clientWidth / bounds.width
        : 1;
    const buttonRect = localRect || {
      left: (rawRect.left - bounds.left) * scale,
      right: (rawRect.right - bounds.left) * scale,
      top: (rawRect.top - bounds.top) * scale,
      bottom: (rawRect.bottom - bounds.top) * scale,
      width: rawRect.width * scale,
      height: rawRect.height * scale,
    };
    const viewportWidth = this.#localCoordinates
      ? this.#layer.clientWidth
      : this.#document.documentElement.clientWidth || this.#window.innerWidth;
    const originX =
      !localRect && Number.isFinite(pointer?.x)
        ? clamp(
            (pointer.x - bounds.left) * scale,
            buttonRect.left + 16,
            buttonRect.right - 16,
          )
        : buttonRect.left + buttonRect.width / 2;
    const originY =
      !localRect && Number.isFinite(pointer?.y)
        ? clamp(
            (pointer.y - bounds.top) * scale,
            buttonRect.top + 16,
            buttonRect.bottom - 16,
          )
        : buttonRect.top + buttonRect.height * 0.4;
    const reduced = this.#reducedMotion();
    const bonusHeight = Math.min(
      22,
      Math.log2(Math.max(1, Number.isFinite(combo) ? combo : 1)) * 5,
    );
    // Count feedback is always shown on the button; the floating reaction is one random item.
    const assets = [pickReaction(emotion)];

    while (this.#particles.size + assets.length > this.#maxParticles) {
      this.#remove(this.#particles.keys().next().value);
    }

    const fragment = this.#document.createDocumentFragment();
    const pending = assets.map((asset) => {
      const node = this.#createParticle(asset, emotion.color);
      fragment.append(node);
      return { node };
    });
    this.#layer.append(fragment);

    // Batch measurements before starting animations to avoid read/write thrashing.
    const measurements = pending.map(({ node }) =>
      localRect && node.offsetWidth > 0 && node.offsetHeight > 0
        ? { width: node.offsetWidth, height: node.offsetHeight }
        : node.getBoundingClientRect(),
    );
    pending.forEach(({ node }, index) => {
      const width = measurements[index].width * scale,
        height = measurements[index].height * scale;
      const rotation = reduced ? 0 : randomRange(-12, 12);
      const initialRotation = reduced ? 0 : rotation + randomRange(-5, 5);
      const maxRotation =
        Math.max(Math.abs(rotation), Math.abs(initialRotation)) + 3;
      const rotatedWidth = width + height * Math.sin(radians(maxRotation));
      const fitScale = Math.min(
        1,
        Math.max(0.1, (viewportWidth - 36) / (rotatedWidth * 1.06)),
      );
      const halfWidth = (rotatedWidth * fitScale * 1.06) / 2;
      const minX = 18 + halfWidth;
      const maxX = Math.max(minX, viewportWidth - 18 - halfWidth);
      const x = clamp(originX + randomRange(-28, 28), minX, maxX);
      const y = originY - height / 2 + randomRange(-10, 7);
      const endX = clamp(x + randomRange(-44, 44), minX, maxX);
      const deltaX = endX - x;
      const controlX =
        clamp(x + deltaX * 0.35 + randomRange(-12, 12), minX, maxX) - x;
      const rise = randomRange(72, 106) + bonusHeight;

      node.style.left = `${x - width / 2}px`;
      node.style.top = `${y}px`;
      const frames = reduced
        ? [
            { opacity: 0, transform: transform(0, 0, fitScale, 0), offset: 0 },
            {
              opacity: 1,
              transform: transform(0, 0, fitScale, 0),
              offset: 0.2,
            },
            { opacity: 0, transform: transform(0, 0, fitScale, 0), offset: 1 },
          ]
        : floatFrames({
            deltaX,
            controlX,
            rise,
            fitScale,
            initialRotation,
            rotation,
          });

      let animation;
      try {
        animation = node.animate(frames, {
          duration: reduced ? 150 : randomRange(650, 800),
          easing: "linear",
          fill: "both",
        });
      } catch (error) {
        node.remove();
        throw error;
      }
      this.#particles.set(node, animation);
      this.#peakCount = Math.max(this.#peakCount, this.#particles.size);
      animation.onfinish = () => this.#remove(node);
      animation.oncancel = () => this.#remove(node);
    });
  }

  #createParticle(asset, color) {
    const node = this.#document.createElement("span");
    node.className = `particle particle--${asset.kind}`;
    node.setAttribute("aria-hidden", "true");
    node.style.setProperty("--sticker-color", color);
    if (asset.kind === "face") {
      const face = this.#document.createElement("img");
      face.src = asset.value;
      face.alt = "";
      face.draggable = false;
      face.width = 52;
      face.height = 54;
      node.append(face);
    } else {
      const label = this.#document.createElement("span");
      label.textContent = asset.value;
      node.append(label);
    }
    return node;
  }

  #remove(node) {
    const animation = this.#particles.get(node);
    if (!animation) return;
    this.#particles.delete(node);
    animation.onfinish = null;
    animation.oncancel = null;
    animation.cancel();
    node.remove();
  }

  clear() {
    for (const node of this.#particles.keys()) this.#remove(node);
  }

  destroy() {
    this.clear();
    this.#destroyed = true;
  }
}

export class ButtonMotion {
  #button;
  #surface;
  #window;
  #animation = null;
  #releaseTimer = null;
  #pressed = false;
  #pressedAt = -Infinity;
  #destroyed = false;
  #initialTransform;
  #restTransform;
  #reducedMotion;
  #buzzer;
  #rapid;
  #shadow;
  #shadowAnimation = null;

  constructor(button, surface, { reducedMotion = () => false, buzzer = false, rapid = false, shadow = null } = {}) {
    if (!button || !surface?.ownerDocument)
      throw new TypeError("ButtonMotion needs a button and its surface.");
    if (typeof reducedMotion !== "function")
      throw new TypeError("reducedMotion must be a function.");
    this.#buzzer = buzzer;
    this.#rapid = rapid;
    this.#shadow = shadow;
    this.#button = button;
    this.#surface = surface;
    this.#window = surface.ownerDocument.defaultView;
    this.#initialTransform = surface.style.transform;
    this.#restTransform = this.#window.getComputedStyle(surface).transform;
    this.#reducedMotion = reducedMotion;
  }

  #moveTo(target, duration, easing) {
    // Capture the visible transform before cancelling so rapid taps never snap to the rest position.
    const visibleSurface = this.#window.getComputedStyle(this.#surface);
    const start = visibleSurface.transform;
    const startDepth = visibleSurface.getPropertyValue?.('--press-depth') || '0';
    const endDepth = this.#pressed ? '1' : '0';
    if (this.#animation) {
      this.#animation.onfinish = null;
      this.#animation.cancel();
      this.#animation = null;
    }
    this.#surface.style.transform = target;
    if (this.#buzzer) this.#surface.style.setProperty('--press-depth', endDepth);
    if (this.#shadow) {
      const visible = this.#window.getComputedStyle(this.#shadow);
      const from = { transform: visible.transform, opacity: visible.opacity };
      this.#shadowAnimation?.cancel();
      const to = { transform: target, opacity: this.#pressed ? 0 : 1 };
      Object.assign(this.#shadow.style, to);
      this.#shadowAnimation = this.#reducedMotion() || duration === 0 ? null : this.#shadow.animate([from, to], { duration, easing });
    }
    if (this.#reducedMotion() || duration === 0) return;
    const animation = this.#surface.animate(
      [
        { transform: start, ...(this.#buzzer ? { '--press-depth': startDepth } : {}) },
        { transform: target, ...(this.#buzzer ? { '--press-depth': endDepth } : {}) },
      ],
      { duration, easing },
    );
    this.#animation = animation;
    animation.onfinish = () => {
      if (this.#animation === animation) this.#animation = null;
      animation.onfinish = null;
      animation.cancel();
    };
  }

  press() {
    if (this.#destroyed) return;
    this.#window.clearTimeout(this.#releaseTimer);
    this.#releaseTimer = null;
    this.#pressedAt = this.#window.performance.now();
    if (this.#pressed) return;
    this.#pressed = true;
    this.#button.classList.add("is-pressed");
    const rest =
      this.#restTransform === "none" ? "" : ` ${this.#restTransform}`;
    this.#moveTo(
      this.#buzzer ? `translate3d(0, ${3 * this.#button.offsetWidth / 105}px, 0)${rest}` : `translate3d(0, 4px, 0) scale(0.985)${rest}`,
      this.#rapid ? 0 : this.#buzzer ? 55 : 70,
      "cubic-bezier(.2,.7,.3,1)",
    );
  }

  release() {
    if (this.#destroyed) return;
    this.#window.clearTimeout(this.#releaseTimer);
    this.#releaseTimer = null;
    const reduced = this.#reducedMotion();
    if (!this.#pressed) {
      // A preference change can arrive while the button is already springing back.
      if (reduced && this.#animation)
        this.#moveTo(this.#restTransform, 0, "linear");
      return;
    }
    const remaining = (this.#rapid ? 24 : this.#buzzer ? 70 : 60) - (this.#window.performance.now() - this.#pressedAt);
    if (!reduced && remaining > 0) {
      this.#releaseTimer = this.#window.setTimeout(() => {
        this.#releaseTimer = null;
        this.#releaseNow();
      }, remaining);
      return;
    }
    this.#releaseNow();
  }

  #releaseNow() {
    if (this.#destroyed) return;
    this.#pressed = false;
    this.#button.classList.remove("is-pressed");
    this.#moveTo(this.#restTransform, this.#rapid ? 20 : this.#buzzer ? 180 : 230, this.#buzzer ? "cubic-bezier(.34,1.15,.64,1)" : "cubic-bezier(.34,1.35,.64,1)");
  }

  tap() {
    if (this.#destroyed) return;
    this.press();
    this.release();
  }

  destroy() {
    this.#window.clearTimeout(this.#releaseTimer);
    if (this.#animation) {
      this.#animation.onfinish = null;
      this.#animation.cancel();
      this.#animation = null;
    }
    this.#shadowAnimation?.cancel();
    this.#button.classList.remove("is-pressed");
    this.#surface.style.transform = this.#initialTransform;
    if (this.#buzzer) this.#surface.style.setProperty('--press-depth', '0');
    this.#pressed = false;
    this.#destroyed = true;
  }
}
