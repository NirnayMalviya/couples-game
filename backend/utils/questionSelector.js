import Question from "../models/Question.js";
import UsedQuestion, { couplePairId } from "../models/UsedQuestion.js";

const shuffle = (arr) => {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

// Picks up to `count` items from `pool` respecting a rough easy/medium/hard
// mix, then shuffles the final order and nudges apart any two consecutive
// questions that share the same tag (mirrors the brief's "smart rotation").
function smartSelect(pool, count = 10) {
  const byDifficulty = { easy: [], medium: [], hard: [] };
  for (const q of pool) byDifficulty[q.difficulty]?.push(q);

  const target = { easy: Math.round(count * 0.3), medium: Math.round(count * 0.4), hard: Math.round(count * 0.3) };
  let picked = [];
  for (const diff of ["easy", "medium", "hard"]) {
    picked.push(...shuffle(byDifficulty[diff]).slice(0, target[diff]));
  }
  // Top up from whatever's left if a difficulty bucket was short.
  if (picked.length < count) {
    const remaining = shuffle(pool.filter((q) => !picked.includes(q)));
    picked.push(...remaining.slice(0, count - picked.length));
  }
  picked = shuffle(picked).slice(0, count);

  // Light pass to avoid two same-tag questions back to back.
  for (let i = 1; i < picked.length; i++) {
    const prevTag = picked[i - 1].tags?.[0];
    const curTag = picked[i].tags?.[0];
    if (prevTag && prevTag === curTag) {
      const swapIdx = picked.findIndex((q, idx) => idx > i && q.tags?.[0] !== curTag);
      if (swapIdx !== -1) [picked[i], picked[swapIdx]] = [picked[swapIdx], picked[i]];
    }
  }
  return picked;
}

/**
 * Selects up to 10 questions for a couple + package that neither of them
 * has seen together before, records them as used, and returns the docs.
 * Throws { code: "PACKAGE_EXHAUSTED" } if fewer than `count` are left.
 */
export async function selectQuestionsForCouple(playerIdA, playerIdB, packageId, count = 10) {
  const pairId = couplePairId(playerIdA, playerIdB);

  const used = await UsedQuestion.find({ couplePairId: pairId, packageId }).select("questionId");
  const usedIds = used.map((u) => u.questionId.toString());

  const pool = await Question.find({
    packageId,
    active: true,
    _id: { $nin: usedIds },
  });

  if (pool.length < count) {
    const err = new Error("This couple has exhausted the question pool for this package.");
    err.code = "PACKAGE_EXHAUSTED";
    err.available = pool.length;
    throw err;
  }

  const selected = smartSelect(pool, count);

  await UsedQuestion.insertMany(
    selected.map((q) => ({ couplePairId: pairId, questionId: q._id, packageId })),
    { ordered: false }
  ).catch(() => {}); // ignore rare unique-index races

  return selected;
}
