import mongoose from "mongoose";

const playerSchema = new mongoose.Schema(
  {
    playerId: { type: String, required: true },
    nickname: { type: String, required: true },
    avatar: { type: String, default: "💕" },
    connected: { type: Boolean, default: true },
    isHost: { type: Boolean, default: false },
  },
  { _id: false }
);

const roomSchema = new mongoose.Schema(
  {
    code: { type: String, required: true, unique: true, index: true },
    players: { type: [playerSchema], default: [] },
    packageId: { type: String, default: null },
    status: {
      type: String,
      enum: ["WAITING_FOR_PARTNER", "GAME_READY", "IN_GAME", "COMPLETED"],
      default: "WAITING_FOR_PARTNER",
    },
    activeGameId: { type: mongoose.Schema.Types.ObjectId, ref: "Game", default: null },
    expiresAt: { type: Date, required: true },
  },
  { timestamps: true }
);

export default mongoose.models.Room || mongoose.model("Room", roomSchema);
