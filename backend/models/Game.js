import mongoose from "mongoose";

const answerSchema = new mongoose.Schema(
  {
    questionId: { type: mongoose.Schema.Types.ObjectId, ref: "Question", required: true },
    playerId: { type: String, required: true },
    optionId: { type: String, required: true },
    submittedAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const guessSchema = new mongoose.Schema(
  {
    questionId: { type: mongoose.Schema.Types.ObjectId, ref: "Question", required: true },
    playerId: { type: String, required: true }, // who guessed
    guessedOptionId: { type: String, required: true },
    isCorrect: { type: Boolean, default: false },
    points: { type: Number, default: 0 },
    submittedAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const gameSchema = new mongoose.Schema(
  {
    roomId: { type: mongoose.Schema.Types.ObjectId, ref: "Room", required: true },
    packageId: { type: String, required: true },
    playerIds: { type: [String], required: true }, // [player1Id, player2Id]
    questionIds: { type: [mongoose.Schema.Types.ObjectId], ref: "Question", required: true },
    // ANSWERING: both players independently answering all questions.
    // GUESSING: both answered; now independently guessing all questions.
    // REVEAL: both guessed; per-question breakdown has been sent.
    // FINAL_RESULT: round over, winner/tie computed.
    state: {
      type: String,
      enum: ["ANSWERING", "GUESSING", "REVEAL", "FINAL_RESULT"],
      default: "ANSWERING",
    },
    answers: { type: [answerSchema], default: [] },
    guesses: { type: [guessSchema], default: [] },
    scores: { type: mongoose.Schema.Types.Mixed, default: {} }, // { [playerId]: number }
    startedAt: { type: Date, default: Date.now },
    completedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

export default mongoose.models.Game || mongoose.model("Game", gameSchema);
