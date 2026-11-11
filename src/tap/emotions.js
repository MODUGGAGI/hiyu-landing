import { pick, randomInt } from "./random.js";

// Category probabilities stay fixed even when an emotion gains more text or emoji choices.
// 200 integer tickets represent 40%, 37.5%, 15%, and 7.5% respectively.
export const reactionWeights = Object.freeze({
  face: 80,
  text: 75,
  emoji: 30,
  plus: 15,
});

export function pickReaction(emotion, entropy) {
  const categories = Object.entries(reactionWeights);
  let ticket = randomInt(
    categories.reduce((sum, [, weight]) => sum + weight, 0),
    entropy,
  );
  for (const [kind, weight] of categories) {
    ticket -= weight;
    if (ticket >= 0) continue;
    if (kind === "face") return { kind, value: emotion.icon };
    if (kind === "plus") return { kind, value: "+1" };
    return pick(
      emotion.assets.filter((asset) => asset.kind === kind),
      entropy,
    );
  }
}
