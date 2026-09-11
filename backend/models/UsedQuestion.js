import mongoose from "mongoose";

// couplePairId is the two playerIds sorted + joined, so the same two
// people never see a repeated question regardless of which room they use.
const usedQuestionSchema = new mongoose.Schema(
  {
    couplePairId: { type: String, required: true, index: true },
    questionId: { type: mongoose.Schema.Types.ObjectId, ref: "Question", required: true },
    packageId: { type: String, required: true },
    usedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

usedQuestionSchema.index({ couplePairId: 1, questionId: 1 }, { unique: true });

export default mongoose.models.UsedQuestion || mongoose.model("UsedQuestion", usedQuestionSchema);

export function couplePairId(playerIdA, playerIdB) {
  return [playerIdA, playerIdB].sort().join("::");
}
