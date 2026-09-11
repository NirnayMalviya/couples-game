import "dotenv/config";
import mongoose from "mongoose";
import Question from "../models/Question.js";
import { SEED_QUESTIONS } from "./seedQuestions.js";

async function run() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log("Connected. Wiping existing questions...");
  await Question.deleteMany({});
  const inserted = await Question.insertMany(SEED_QUESTIONS);
  console.log(`Seeded ${inserted.length} questions.`);
  await mongoose.disconnect();
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
