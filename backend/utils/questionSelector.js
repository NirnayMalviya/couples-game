import Question from "../models/Question.js";

const shuffle = (arr) => {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

/**
 * Returns all questions for a package (fixed at 5 per package), in a
 * freshly shuffled order each game. Packages are fixed-size, so there's
 * no rotation pool to draw from -- every play of a package uses the same
 * set of questions, just in a different order.
 */
export async function selectQuestionsForCouple(playerIdA, playerIdB, packageId, count = 5) {
  const questions = await Question.find({ packageId, active: true });

  if (questions.length < count) {
    const err = new Error(`Package "${packageId}" doesn't have enough active questions.`);
    err.code = "PACKAGE_INCOMPLETE";
    err.available = questions.length;
    throw err;
  }

  return shuffle(questions).slice(0, count);
}
