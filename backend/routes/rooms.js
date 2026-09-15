import { Router } from "express";
import { customAlphabet } from "nanoid";
import Room from "../models/Room.js";
import { PACKAGES } from "../data/packages.js";

const router = Router();
const codeAlphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no ambiguous chars
const genCode = customAlphabet(codeAlphabet, 4);
const genPlayerId = customAlphabet("abcdefghijklmnopqrstuvwxyz0123456789", 12);

const ROOM_TTL_MS = 1000 * 60 * 60 * 6; // 6 hours for an unused room

router.get("/packages", (_req, res) => {
  res.json(PACKAGES);
});

router.post("/rooms", async (req, res) => {
  const { nickname, avatar } = req.body;
  if (!nickname?.trim()) return res.status(400).json({ error: "Nickname is required." });

  const code = `LOVE-${genCode()}`;
  const playerId = genPlayerId();

  const room = await Room.create({
    code,
    players: [{ playerId, nickname: nickname.trim().slice(0, 24), avatar: avatar || "❤️", isHost: true }],
    status: "WAITING_FOR_PARTNER",
    expiresAt: new Date(Date.now() + ROOM_TTL_MS),
  });

  res.status(201).json({ roomCode: room.code, roomId: room._id, playerId });
});

router.post("/rooms/:code/join", async (req, res) => {
  const { nickname, avatar } = req.body;
  const code = req.params.code.toUpperCase();
  if (!nickname?.trim()) return res.status(400).json({ error: "Nickname is required." });

  const room = await Room.findOne({ code });
  if (!room) return res.status(404).json({ error: "That room code doesn't exist or has expired." });
  if (room.players.length >= 2) return res.status(409).json({ error: "This room is already full." });

  const playerId = genPlayerId();
  room.players.push({ playerId, nickname: nickname.trim().slice(0, 24), avatar: avatar || "💕", isHost: false });
  room.status = "GAME_READY";
  await room.save();

  res.status(200).json({
    roomId: room._id,
    playerId,
    hostNickname: room.players[0].nickname,
  });
});

router.get("/rooms/:code", async (req, res) => {
  const room = await Room.findOne({ code: req.params.code.toUpperCase() });
  if (!room) return res.status(404).json({ error: "Room not found." });
  res.json({
    roomCode: room.code,
    roomId: room._id,
    status: room.status,
    players: room.players.map((p) => ({ nickname: p.nickname, avatar: p.avatar, isHost: p.isHost, connected: p.connected })),
    packageId: room.packageId,
  });
});

export default router;
