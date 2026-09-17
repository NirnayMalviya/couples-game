import Room from "../models/Room.js";
import Game from "../models/Game.js";
import Question from "../models/Question.js";
import { selectQuestionsForCouple } from "../utils/questionSelector.js";

// socketId -> { roomId, playerId }  (in-memory; fine for a single instance)
const socketSessions = new Map();

const QUESTIONS_PER_ROUND = 5;
const POINTS_PER_QUESTION = 2; // 5 questions × 2 = 10 max per package

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

async function publicQuestionsFor(game) {
  const docs = await Question.find({ _id: { $in: game.questionIds } });
  // Preserve the original round order, not whatever order Mongo returns.
  const byId = new Map(docs.map((d) => [d._id.toString(), d]));
  const ordered = game.questionIds.map((id) => byId.get(id.toString()));
  return ordered.map((q, i) => toPublicQuestion(q, i, ordered.length));
}

function buildResults(game) {
  const [p1, p2] = game.playerIds;
  const results = { [p1]: [], [p2]: [] };
  for (const qId of game.questionIds.map((id) => id.toString())) {
    for (const pId of [p1, p2]) {
      const g = game.guesses.find((g) => g.questionId.toString() === qId && g.playerId === pId);
      const otherId = otherPlayerId(game, pId);
      const actual = game.answers.find((a) => a.questionId.toString() === qId && a.playerId === otherId);
      results[pId].push({
        questionId: qId,
        guessedOptionId: g?.guessedOptionId,
        actualPartnerOptionId: actual?.optionId,
        isCorrect: !!g?.isCorrect,
        pointsEarned: g?.points || 0,
      });
    }
  }
  return results;
}

function otherPlayerId(game, playerId) {
  return game.playerIds.find((id) => id !== playerId);
}

function roomPlayersPayload(room) {
  return room.players.map((p) => ({
    playerId: p.playerId,
    nickname: p.nickname,
    avatar: p.avatar,
    isHost: p.isHost,
    connected: p.connected,
  }));
}

async function finalizeRound(io, room, game) {
  const [p1, p2] = game.playerIds;
  const s1 = game.scores[p1] || 0;
  const s2 = game.scores[p2] || 0;

  const finished = await Game.findOneAndUpdate(
    { _id: game._id, state: "REVEAL" },
    { $set: { state: "FINAL_RESULT", completedAt: new Date() } },
    { new: true }
  );
  if (!finished) return; // already finalized by the other player's click

  room.status = "COMPLETED";
  await room.save();

  const winnerPlayerId = s1 === s2 ? null : s1 > s2 ? p1 : p2;

  io.to(room.code).emit("game-complete", {
    scores: game.scores,
    winnerPlayerId,
    isPerfectMatch: s1 === s2,
    maxPossible: game.questionIds.length * POINTS_PER_QUESTION,
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
          players: roomPlayersPayload(room),
        });

        if (wasReconnect) io.to(room.code).emit("partner-reconnected", { playerId });

        // Resume in-progress round for this socket, if any — send the full
        // question set plus which ones this player has already answered
        // and guessed, so the client can restore the right local step.
        if (room.activeGameId) {
          const game = await Game.findById(room.activeGameId);
          if (game && game.state !== "FINAL_RESULT") {
            const questions = await publicQuestionsFor(game);
            const answeredIds = game.answers.filter((a) => a.playerId === playerId).map((a) => a.questionId.toString());
            const guessedIds = game.guesses.filter((g) => g.playerId === playerId).map((g) => g.questionId.toString());
            const payload = {
              gameId: game._id,
              state: game.state,
              scores: game.scores,
              questions,
              answeredIds,
              guessedIds,
            };
            if (game.state === "REVEAL") {
              const results = buildResults(game);
              payload.revealResults = results[playerId];
              payload.maxPossible = game.questionIds.length * POINTS_PER_QUESTION;
            }
            socket.emit("resume-game", payload);
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
        players: roomPlayersPayload(room),
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
          questions = await selectQuestionsForCouple(p1.playerId, p2.playerId, room.packageId, QUESTIONS_PER_ROUND);
        } catch (err) {
          if (err.code === "PACKAGE_INCOMPLETE") {
            return io.to(room.code).emit("package-exhausted", {
              message: "This package isn't fully loaded yet — try another one for now.",
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
          state: "ANSWERING",
          scores: { [p1.playerId]: 0, [p2.playerId]: 0 },
        });

        room.activeGameId = game._id;
        room.status = "IN_GAME";
        await room.save();

        io.to(room.code).emit("game-started", {
          gameId: game._id,
          scores: game.scores,
          questions: questions.map((q, i) => toPublicQuestion(q, i, questions.length)),
        });
      } catch (err) {
        socket.emit("error-toast", { message: "Couldn't start the game — please try again." });
      }
    });

    // Both partners answer all QUESTIONS_PER_ROUND questions independently,
    // at their own pace — no per-question waiting. Once BOTH have answered
    // every question, the round moves to the guessing phase for everyone.
    socket.on("submit-answer", async ({ roomId, gameId, questionId, optionId, playerId }) => {
      const room = await Room.findById(roomId);
      if (!room) return;

      const game = await Game.findOneAndUpdate(
        {
          _id: gameId,
          state: "ANSWERING",
          answers: { $not: { $elemMatch: { questionId, playerId } } },
        },
        { $push: { answers: { questionId, playerId, optionId, submittedAt: new Date() } } },
        { new: true }
      );
      if (!game) return; // wrong state, or already answered this one

      const myCount = game.answers.filter((a) => a.playerId === playerId).length;
      if (myCount === QUESTIONS_PER_ROUND) {
        io.to(room.code).emit("player-finished-answering", { playerId });
      }

      const [p1, p2] = game.playerIds;
      const p1Done = game.answers.filter((a) => a.playerId === p1).length === QUESTIONS_PER_ROUND;
      const p2Done = game.answers.filter((a) => a.playerId === p2).length === QUESTIONS_PER_ROUND;
      if (!(p1Done && p2Done)) return;

      const advanced = await Game.findOneAndUpdate(
        { _id: gameId, state: "ANSWERING" },
        { $set: { state: "GUESSING" } },
        { new: true }
      );
      if (!advanced) return; // another event already advanced this game

      const questions = await publicQuestionsFor(advanced);
      io.to(room.code).emit("guessing-phase", {
        message: "Both of you are ready! Let's see if you actually know them 👀",
        questions,
      });
    });

    // Same independent-pace pattern for guesses. Partner answers are
    // already final by the time GUESSING starts, so scoring is safe to
    // compute inline before the atomic write.
    socket.on("submit-guess", async ({ roomId, gameId, questionId, guessedOptionId, playerId }) => {
      const room = await Room.findById(roomId);
      if (!room) return;

      const gameBeforeGuess = await Game.findById(gameId);
      if (!gameBeforeGuess || gameBeforeGuess.state !== "GUESSING") return;

      const partnerId = otherPlayerId(gameBeforeGuess, playerId);
      const partnerAnswer = gameBeforeGuess.answers.find((a) => a.questionId.toString() === questionId && a.playerId === partnerId);
      const isCorrect = !!partnerAnswer && partnerAnswer.optionId === guessedOptionId;
      const points = isCorrect ? POINTS_PER_QUESTION : 0;

      const game = await Game.findOneAndUpdate(
        {
          _id: gameId,
          state: "GUESSING",
          guesses: { $not: { $elemMatch: { questionId, playerId } } },
        },
        {
          $push: { guesses: { questionId, playerId, guessedOptionId, isCorrect, points, submittedAt: new Date() } },
          $inc: { [`scores.${playerId}`]: points },
        },
        { new: true }
      );
      if (!game) return; // wrong state, or already guessed this one

      const myCount = game.guesses.filter((g) => g.playerId === playerId).length;
      if (myCount === QUESTIONS_PER_ROUND) {
        io.to(room.code).emit("player-finished-guessing", { playerId });
      }

      const [p1, p2] = game.playerIds;
      const p1Done = game.guesses.filter((g) => g.playerId === p1).length === QUESTIONS_PER_ROUND;
      const p2Done = game.guesses.filter((g) => g.playerId === p2).length === QUESTIONS_PER_ROUND;
      if (!(p1Done && p2Done)) return;

      const revealed = await Game.findOneAndUpdate(
        { _id: gameId, state: "GUESSING" },
        { $set: { state: "REVEAL" } },
        { new: true }
      );
      if (!revealed) return; // another event already advanced this game

      const results = buildResults(revealed);

      io.to(room.code).emit("reveal-all", {
        results,
        scores: revealed.scores,
        maxPossible: revealed.questionIds.length * POINTS_PER_QUESTION,
      });
    });

    // Either player can move the round on from the breakdown screen to the
    // final scoreboard — first one wins the race, the other's call is a
    // harmless no-op since the state guard has already flipped.
    socket.on("finish-round", async ({ roomId, gameId }) => {
      const room = await Room.findById(roomId);
      const game = await Game.findById(gameId);
      if (!room || !game || game.state !== "REVEAL") return;
      await finalizeRound(io, room, game);
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
        players: roomPlayersPayload(room),
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
