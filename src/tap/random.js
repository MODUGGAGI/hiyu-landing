const UINT32_SIZE = 0x1_0000_0000;
const entropyBuffer = new Uint32Array(128);
let entropyCursor = entropyBuffer.length;

function cryptoUint32() {
  if (entropyCursor === entropyBuffer.length) {
    globalThis.crypto.getRandomValues(entropyBuffer);
    entropyCursor = 0;
  }
  return entropyBuffer[entropyCursor++];
}

function readEntropy(entropy) {
  if (typeof entropy !== "function") {
    throw new TypeError("Entropy must be a function returning a uint32.");
  }
  const value = entropy();
  if (!Number.isInteger(value) || value < 0 || value >= UINT32_SIZE) {
    throw new RangeError(
      "Entropy must return an integer between 0 and 2^32 - 1.",
    );
  }
  return value;
}

/** Uniform integer in [0, maxExclusive), sampled independently on every call. */
export function randomInt(maxExclusive, entropy = cryptoUint32) {
  if (
    !Number.isSafeInteger(maxExclusive) ||
    maxExclusive < 1 ||
    maxExclusive > UINT32_SIZE
  ) {
    throw new RangeError("maxExclusive must be an integer between 1 and 2^32.");
  }
  const limit = UINT32_SIZE - (UINT32_SIZE % maxExclusive);
  let sample;
  do {
    sample = readEntropy(entropy);
  } while (sample >= limit);
  return sample % maxExclusive;
}

/** Real number in [min, max); equal endpoints return that endpoint. */
export function randomRange(min, max, entropy = cryptoUint32) {
  const span = max - min;
  if (
    !Number.isFinite(min) ||
    !Number.isFinite(max) ||
    max < min ||
    !Number.isFinite(span)
  ) {
    throw new RangeError("Range endpoints must be finite and ordered.");
  }
  if (min === max) return min;
  return min + (readEntropy(entropy) / UINT32_SIZE) * span;
}

/** Every entry has equal probability. Repeated picks, including consecutive ones, are allowed. */
export function pick(values, entropy = cryptoUint32) {
  if (!Array.isArray(values) || values.length === 0) {
    throw new RangeError("pick requires a non-empty array.");
  }
  return values[randomInt(values.length, entropy)];
}
