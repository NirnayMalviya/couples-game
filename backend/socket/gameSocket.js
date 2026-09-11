import Room from "../models/Room.js";
import Game from "../models/Game.js";
import Question from "../models/Question.js";
import { selectQuestionsForCouple } from "../utils/questionSelector.js";

// socketId -> { roomId, playerId }  (in-memory; fine for a single instance)
const socketSessions = new Map();

const toPublicQuestion = (q, index, total) => ({
  index,
  total,
  id: q._id.toString(),
  text: q.text,
  emoji: q.emoji,
  category: q.category,
  difficulty: q.difficulty,
  options: q.options.map((o) => ({ id: o.id, text: o.text })),
});

async function currentQuestionDoc(game) {
  const qid = game.questionIds[game.currentQuestionIndex];
  return Question.findById(qid);
}

function otherPlayerId(game, playerId) {
  return game.playerIds.find((id) => id !== playerId);
}

async function finalizeGame(io, room, game) {
  const [p1, p2] = game.playerIds;
  const s1 = game.scores[p1] || 0;
  const s2 = game.scores[p2] || 0;

  game.state = "FINAL_RESULT";
  game.completedAt = new Date();
  await game.save();

  room.status = "COMPLETED";
  await room.save();

  const winnerPlayerId = s1 === s2 ? null : s1 > s2 ? p1 : p2;

  io.to(room.code).emit("game-complete", {
    scores: game.scores,
    winnerPlayerId,
    isPerfectMatch: s1 === s2,
    maxPossible: game.questionIds.length * 10,
  });
}

export function registerGameSocket(io) {
  io.on("connection", (socket) => {
    socket.on("join-socket-room", async ({ roomId, playerId }) => {
      try {
        const room = await Room.findById(roomId);
        if (!room) return socket.emit("error-toast", { message: "Room not found." });

        socket.join(room.code);
        socketSessions.set(socket.id, { roomId: room._id.toString(), playerId, roomCode: room.code });

        const player = room.players.find((p) => p.playerId === playerId);
        const wasReconnect = player && player.connected === false;
        if (player) player.connected = true;
        await room.save();

        io.to(room.code).emit("room-update", {
          status: room.status,
          packageId: room.packageId,
          players: room.players.map((p) => ({ playerId: p.playerId, nickname: p.nickname, avatar: p.avatar, isHost: p.isHost, connected: p.connected })),
        });

        if (wasReconnect) io.to(room.code).emit("partner-reconnected", { playerId });

        // Resume in-progress game state for this socket, if any.
        if (room.activeGameId) {
          const game = await Game.findById(room.activeGameId);
          if (game && game.state !== "FINAL_RESULT") {
            const qDoc = await currentQuestionDoc(game);
            socket.emit("resume-game", {
              gameId: game._id,
              state: game.state,
              scores: game.scores,
              question: toPublicQuestion(qDoc, game.currentQuestionIndex, game.questionIds.length),
              hasAnswered: game.answers.some((a) => a.questionId.toString() === qDoc._id.toString() && a.playerId === playerId),
              hasGuessed: game.guesses.some((g) => g.questionId.toString() === qDoc._id.toString() && g.playerId === playerId),
            });
          }
        }
      } catch (err) {
        socket.emit("error-toast", { message: "Couldn't join the room." });
      }
    });

    socket.on("select-package", async ({ roomId, packageId }) => {
      const room = await Room.findById(roomId);
      if (!room) return;
      room.packageId = packageId;
      await room.save();
      io.to(room.code).emit("room-update", {
        status: room.status,
        packageId: room.packageId,
        players: room.players.map((p) => ({ playerId: p.playerId, nickname: p.nickname, avatar: p.avatar, isHost: p.isHost, connected: p.connected })),
      });
    });

    socket.on("start-game", async ({ roomId }) => {
      try {
        const room = await Room.findById(roomId);
        if (!room) return;
        if (room.players.length < 2) return socket.emit("error-toast", { message: "Waiting for your partner to join first." });
        if (!room.packageId) return socket.emit("error-toast", { message: "Pick a question package first." });

        const [p1, p2] = room.players;
        let questions;
        try {
          questions = await selectQuestionsForCouple(p1.playerId, p2.playerId, room.packageId, 10);
        } catch (err) {
          if (err.code === "PACKAGE_EXHAUSTED") {
            return io.to(room.code).emit("package-exhausted", {
              message: "You've officially conquered this package! Try another category.",
              available: err.available,
            });
          }
          throw err;
        }

        const game = await Game.create({
          roomId: room._id,
          packageId: room.packageId,
          playerIds: [p1.playerId, p2.playerId],
          questionIds: questions.map((q) => q._id),
          currentQuestionIndex: 0,
          state: "QUESTION_ACTIVE",
          scores: { [p1.playerId]: 0, [p2.playerId]: 0 },
        });

        room.activeGameId = game._id;
        room.status = "IN_GAME";
        await room.save();

        io.to(room.code).emit("game-started", {
          gameId: game._id,
          scores: game.scores,
          question: toPublicQuestion(questions[0], 0, questions.length),
        });
      } catch (err) {
        socket.emit("error-toast", { message: "Couldn't start the game — please try again." });
      }
    });

    socket.on("submit-answer", async ({ roomId, gameId, questionId, optionId, playerId }) => {
      const room = await Room.findById(roomId);
      const game = await Game.findById(gameId);
      if (!room || !game || game.state !== "QUESTION_ACTIVE") return;

      const already = game.answers.some((a) => a.questionId.toString() === questionId && a.playerId === playerId);
      if (already) return;

      game.answers.push({ questionId, playerId, optionId });
      await game.save();

      const bothAnswered = game.answers.filter((a) => a.questionId.toString() === questionId).length === 2;

      if (!bothAnswered) {
        io.to(room.code).emit("player-locked-answer", { playerId });
        return;
      }

      game.state = "GUESSING_PHASE";
      await game.save();
      const qDoc = await Question.findById(questionId);
      io.to(room.code).emit("guessing-phase", {
        message: "Both of you are ready! Let's see if you actually know them 👀",
        question: toPublicQuestion(qDoc, game.currentQuestionIndex, game.questionIds.length),
      });
    });

    socket.on("submit-guess", async ({ roomId, gameId, questionId, guessedOptionId, playerId }) => {
      const room = await Room.findById(roomId);
      const game = await Game.findById(gameId);
      if (!room || !game || game.state !== "GUESSING_PHASE") return;

      const already = game.guesses.some((g) => g.questionId.toString() === questionId && g.playerId === playerId);
      if (already) return;

      const partnerId = otherPlayerId(game, playerId);
      const partnerAnswer = game.answers.find((a) => a.questionId.toString() === questionId && a.playerId === partnerId);
      const isCorrect = !!partnerAnswer && partnerAnswer.optionId === guessedOptionId;
      const points = isCorrect ? 10 : 0;

      game.guesses.push({ questionId, playerId, guessedOptionId, isCorrect, points });
      game.scores[playerId] = (game.scores[playerId] || 0) + points;
      game.markModified("scores");
      await game.save();

      io.to(room.code).emit("player-locked-guess", { playerId });

      const bothGuessed = game.guesses.filter((g) => g.questionId.toString() === questionId).length === 2;
      if (!bothGuessed) return;

      game.state = "ANSWER_REVEAL";
      await game.save();

      const results = {};
      for (const g of game.guesses.filter((g) => g.questionId.toString() === questionId)) {
        const pId = otherPlayerId(game, g.playerId);
        const actual = game.answers.find((a) => a.questionId.toString() === questionId && a.playerId === pId);
        results[g.playerId] = {
          guessedOptionId: g.guessedOptionId,
          actualPartnerOptionId: actual?.optionId,
          isCorrect: g.isCorrect,
          pointsEarned: g.points,
        };
      }

      io.to(room.code).emit("reveal", {
        questionId,
        results,
        scores: game.scores,
        isLastQuestion: game.currentQuestionIndex === game.questionIds.length - 1,
      });
    });

    socket.on("next-question", async ({ roomId, gameId }) => {
      const room = await Room.findById(roomId);
      const game = await Game.findById(gameId);
      if (!room || !game || game.state !== "ANSWER_REVEAL") return;

      const nextIndex = game.currentQuestionIndex + 1;
      if (nextIndex >= game.questionIds.length) {
        await finalizeGame(io, room, game);
        return;
      }

      game.currentQuestionIndex = nextIndex;
      game.state = "QUESTION_ACTIVE";
      await game.save();

      const qDoc = await Question.findById(game.questionIds[nextIndex]);
      io.to(room.code).emit("game-started", {
        gameId: game._id,
        scores: game.scores,
        question: toPublicQuestion(qDoc, nextIndex, game.questionIds.length),
      });
    });

    socket.on("play-again", async ({ roomId }) => {
      const room = await Room.findById(roomId);
      if (!room) return;
      room.status = "GAME_READY";
      room.activeGameId = null;
      room.packageId = null;
      await room.save();
      io.to(room.code).emit("room-update", {
        status: room.status,
        packageId: room.packageId,
        players: room.players.map((p) => ({ playerId: p.playerId, nickname: p.nickname, avatar: p.avatar, isHost: p.isHost, connected: p.connected })),
      });
    });

    socket.on("disconnect", async () => {
      const session = socketSessions.get(socket.id);
      if (!session) return;
      socketSessions.delete(socket.id);

      const room = await Room.findById(session.roomId);
      if (!room) return;
      const player = room.players.find((p) => p.playerId === session.playerId);
      if (player) player.connected = false;
      await room.save();

      io.to(session.roomCode).emit("partner-disconnected", { playerId: session.playerId });
    });
  });
}
