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
    state: {
      type: String,
      enum: [
        "SELF_ANSWER",      // both partners independently answering their own 5
        "GUESS_PHASE",      // both partners independently guessing their own 5
        "PACKAGE_COMPLETE", // both done guessing, scores revealed
      ],
      default: "SELF_ANSWER",
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
