// Package metadata. Question content lives in data/seedQuestions.js,
// keyed by packageId. Add a new package by adding an entry here and
// 10 questions with the matching packageId in the seed file — nothing
// else in the app needs to change (fully database-driven).
export const PACKAGES = [
  {
    id: "random-us",
    title: "Random Us",
    emoji: "💕",
    description: "Funny, unpredictable questions about the two of you.",
    difficultyLabel: "Mixed",
  },
  {
    id: "how-well",
    title: "How Well Do You Know Me?",
    emoji: "🧠",
    description: "Built to test how well you actually know your partner.",
    difficultyLabel: "Mixed",
  },
  {
    id: "dream-vacations",
    title: "Dream Vacations",
    emoji: "✈️",
    description: "Travel style, dream trips, and spontaneous adventures.",
    difficultyLabel: "Mixed",
  },
  {
    id: "relationship",
    title: "Relationship",
    emoji: "❤️",
    description: "Love languages, communication, and appreciation.",
    difficultyLabel: "Mixed",
  },
];
