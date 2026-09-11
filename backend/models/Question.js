import mongoose from "mongoose";

const optionSchema = new mongoose.Schema(
  {
    id: { type: String, required: true }, // 'a' | 'b' | 'c' | 'd'
    text: { type: String, required: true },
    emoji: { type: String, default: "" },
  },
  { _id: false }
);

const questionSchema = new mongoose.Schema(
  {
    packageId: { type: String, required: true, index: true },
    category: { type: String, required: true },
    difficulty: { type: String, enum: ["easy", "medium", "hard"], required: true },
    text: { type: String, required: true },
    emoji: { type: String, default: "" },
    options: {
      type: [optionSchema],
      validate: (v) => v.length === 4,
      required: true,
    },
    tags: { type: [String], default: [] },
    active: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export default mongoose.models.Question || mongoose.model("Question", questionSchema);
