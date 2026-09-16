import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { apiGet, getSocket, loadSession } from "../lib/socket.js";
import PackagePicker from "../components/PackagePicker.jsx";
import PlayerBar from "../components/PlayerBar.jsx";
import FinalResult from "../components/FinalResult.jsx";
import Confetti from "../components/Confetti.jsx";
import AnimatedNumber from "../components/AnimatedNumber.jsx";

const MICROCOPY_CORRECT = ["Damn. You KNOW them. ❤️", "Okay soulmate, calm down. 😭❤️", "That's a real connection right there."];
const MICROCOPY_WRONG = ["That answer was… ambitious. 😂", "We need to schedule a relationship meeting. 💀", "Bold guess. Wrong guess."];

export default function Room() {
  const { code } = useParams();
  const navigate = useNavigate();
  const session = useMemo(() => loadSession(), []);

  const [packages, setPackages] = useState([]);
  const [roomStatus, setRoomStatus] = useState("WAITING_FOR_PARTNER");
  const [players, setPlayers] = useState([]);
  const [packageId, setPackageId] = useState(null);
  const [banner, setBanner] = useState(null);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(null); // "code" | "link" | null

  const [game, setGame] = useState(null); // { gameId, state, question, scores }
  const [selectedOption, setSelectedOption] = useState(null);
  const [hasAnswered, setHasAnswered] = useState(false);
  const [hasGuessed, setHasGuessed] = useState(false);
  const [partnerLocked, setPartnerLocked] = useState(false);
  const [reveal, setReveal] = useState(null); // results for current question
  const [finalResult, setFinalResult] = useState(null);

  const myPlayerId = session?.playerId;
  const roomId = session?.roomId;
  const isHost = players.find((p) => p.playerId === myPlayerId)?.isHost;

  useEffect(() => {
    if (!session || session.roomCode !== code) {
      navigate(`/join/${code}`);
      return;
    }
    apiGet("/packages").then(setPackages).catch(() => {});

    const socket = getSocket();
    socket.emit("join-socket-room", { roomId: session.roomId, playerId: session.playerId });

    socket.on("room-update", (data) => {
      setRoomStatus(data.status);
      setPlayers(data.players);
      setPackageId(data.packageId);
      if (data.status === "GAME_READY" || data.status === "WAITING_FOR_PARTNER") {
        setGame(null);
        setFinalResult(null);
        setReveal(null);
      }
    });

    socket.on("package-exhausted", (data) => setBanner(data.message));

    socket.on("game-started", ({ gameId, scores, question }) => {
      setBanner(null);
      setFinalResult(null);
      setReveal(null);
      setSelectedOption(null);
      setHasAnswered(false);
      setHasGuessed(false);
      setPartnerLocked(false);
      setGame({ gameId, state: "QUESTION_ACTIVE", question, scores });
    });

    socket.on("player-locked-answer", ({ playerId }) => {
      if (playerId !== session.playerId) setPartnerLocked(true);
    });

    socket.on("guessing-phase", ({ question }) => {
      setPartnerLocked(false);
      setSelectedOption(null);
      setHasGuessed(false);
      setGame((g) => (g ? { ...g, state: "GUESSING_PHASE", question } : g));
    });

    socket.on("player-locked-guess", ({ playerId }) => {
      if (playerId !== session.playerId) setPartnerLocked(true);
    });

    socket.on("reveal", ({ results, scores }) => {
      setReveal(results[session.playerId]);
      setGame((g) => (g ? { ...g, state: "ANSWER_REVEAL", scores } : g));
    });

    socket.on("game-complete", (data) => setFinalResult(data));

    socket.on("resume-game", ({ gameId, state, scores, question, hasAnswered: ha, hasGuessed: hg }) => {
      setGame({ gameId, state, question, scores });
      setHasAnswered(ha);
      setHasGuessed(hg);
    });

    socket.on("partner-disconnected", () => setBanner("💕 Your partner disconnected — they can rejoin any time."));
    socket.on("partner-reconnected", () => setBanner("They're back! ❤️"));
    socket.on("error-toast", (d) => setError(d.message));

    return () => {
      socket.off("room-update");
      socket.off("package-exhausted");
      socket.off("game-started");
      socket.off("player-locked-answer");
      socket.off("guessing-phase");
      socket.off("player-locked-guess");
      socket.off("reveal");
      socket.off("game-complete");
      socket.off("resume-game");
      socket.off("partner-disconnected");
      socket.off("partner-reconnected");
      socket.off("error-toast");
    };
  }, [code]);

  function selectPackage(id) {
    getSocket().emit("select-package", { roomId, packageId: id });
  }

  function startGame() {
    getSocket().emit("start-game", { roomId });
  }

  function submitAnswer() {
    if (!selectedOption) return;
    setHasAnswered(true);
    getSocket().emit("submit-answer", {
      roomId,
      gameId: game.gameId,
      questionId: game.question.id,
      optionId: selectedOption,
      playerId: myPlayerId,
    });
  }

  function submitGuess() {
    if (!selectedOption) return;
    setHasGuessed(true);
    getSocket().emit("submit-guess", {
      roomId,
      gameId: game.gameId,
      questionId: game.question.id,
      guessedOptionId: selectedOption,
      playerId: myPlayerId,
    });
  }

  function nextQuestion() {
    setReveal(null);
    getSocket().emit("next-question", { roomId, gameId: game.gameId });
  }

  function playAgain() {
    getSocket().emit("play-again", { roomId });
  }

  function copyCode() {
    navigator.clipboard?.writeText(code);
    setCopied("code");
    setTimeout(() => setCopied(null), 1600);
  }
  function copyLink() {
    navigator.clipboard?.writeText(`${window.location.origin}/join/${code}`);
    setCopied("link");
    setTimeout(() => setCopied(null), 1600);
  }

  if (!session) return null;

  return (
    <div className="min-h-screen bg-cream bg-grain-fade px-6 py-10">
      <AnimatePresence>
        {banner && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="max-w-md mx-auto mb-4 text-center text-sm bg-lavender/20 text-plum rounded-full px-4 py-2"
          >
            {banner}
          </motion.div>
        )}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="max-w-md mx-auto mb-4 text-center text-sm bg-coral/10 text-coral rounded-full px-4 py-2"
          >
            {error}
          </motion.div>
        )}
      </AnimatePresence>

      {finalResult ? (
        <FinalResult
          players={players}
          myPlayerId={myPlayerId}
          scores={finalResult.scores}
          winnerPlayerId={finalResult.winnerPlayerId}
          isPerfectMatch={finalResult.isPerfectMatch}
          onPlayAgain={playAgain}
          onChoosePackage={playAgain}
        />
      ) : game ? (
        <GameScreen
          game={game}
          reveal={reveal}
          players={players}
          myPlayerId={myPlayerId}
          selectedOption={selectedOption}
          setSelectedOption={setSelectedOption}
          hasAnswered={hasAnswered}
          hasGuessed={hasGuessed}
          partnerLocked={partnerLocked}
          onSubmitAnswer={submitAnswer}
          onSubmitGuess={submitGuess}
          onNextQuestion={nextQuestion}
        />
      ) : (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="max-w-md mx-auto">
          <div className="postcard p-6 mb-6 text-center">
            <p className="text-xs uppercase tracking-widest text-plum/40 mb-2">Room code</p>
            <p className="font-display text-3xl text-plum mb-3 tracking-wide">{code}</p>
            <div className="flex gap-2 justify-center">
              <motion.button
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.95 }}
                onClick={copyCode}
                className="btn-press text-sm px-4 py-1.5 rounded-full bg-plum/5 text-plum hover:bg-plum/10 transition-colors"
              >
                {copied === "code" ? "Copied! ✓" : "Copy code"}
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.95 }}
                onClick={copyLink}
                className="btn-press text-sm px-4 py-1.5 rounded-full bg-plum/5 text-plum hover:bg-plum/10 transition-colors"
              >
                {copied === "link" ? "Copied! ✓" : "Copy invite link"}
              </motion.button>
            </div>
          </div>

          <PlayerBar players={players} myPlayerId={myPlayerId} totalQuestions={0} currentIndex={0} />

          {players.length < 2 ? (
            <motion.p
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ repeat: Infinity, duration: 2 }}
              className="text-center text-plum/60 mt-6"
            >
              ⏳ Waiting for your partner to join…
            </motion.p>
          ) : (
            <div className="mt-8">
              <h3 className="font-display text-xl text-plum text-center mb-4">Choose a package</h3>
              <PackagePicker packages={packages} selectedId={packageId} onSelect={isHost ? selectPackage : () => {}} disabled={!isHost} />
              {isHost ? (
                <motion.button
                  disabled={!packageId}
                  onClick={startGame}
                  whileHover={packageId ? { scale: 1.02, y: -1 } : {}}
                  whileTap={packageId ? { scale: 0.97 } : {}}
                  className="shimmer-sweep w-full mt-6 py-3 rounded-full bg-rose text-white font-semibold shadow-glow disabled:opacity-50 disabled:shadow-none hover:shadow-glow-lg transition-shadow"
                >
                  Start the game 💕
                </motion.button>
              ) : (
                <p className="text-center text-sm text-plum/50 mt-4">Waiting for your partner to pick a package and start…</p>
              )}
            </div>
          )}
        </motion.div>
      )}
    </div>
  );
}

function GameScreen({ game, reveal, players, myPlayerId, selectedOption, setSelectedOption, hasAnswered, hasGuessed, partnerLocked, onSubmitAnswer, onSubmitGuess, onNextQuestion }) {
  const { state, question, scores } = game;
  const isGuessing = state === "GUESSING_PHASE";
  const isRevealed = state === "ANSWER_REVEAL";
  const locked = (isGuessing ? hasGuessed : hasAnswered) || isRevealed;
  const partnerId = Object.keys(scores).find((id) => id !== myPlayerId);

  return (
    <div className="max-w-md mx-auto">
      {isRevealed && reveal?.isCorrect && <Confetti trigger={`${question.id}-correct`} count={20} />}

      <PlayerBar players={players} myPlayerId={myPlayerId} totalQuestions={question.total} currentIndex={question.index} />

      <AnimatePresence mode="wait">
        <motion.div
          key={`${question.id}-${state}`}
          initial={{ opacity: 0, x: 24 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -24 }}
          transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
          className="postcard p-6 mt-6"
        >
          <p className="text-xs uppercase tracking-widest text-plum/40 mb-2">
            {isGuessing || isRevealed ? "Guess your partner 👀" : "Answer for yourself"}
          </p>
          <p className="font-display text-xl text-plum mb-5">
            {question.emoji} {question.text}
          </p>

          <div className="grid gap-2.5">
            {question.options.map((opt, i) => {
              let cls = "border-plum/12 bg-white";
              let shadow = "";
              let shake = false;
              if (isRevealed && reveal) {
                if (opt.id === reveal.actualPartnerOptionId) {
                  cls = "border-mint bg-mint/10";
                  shadow = "shadow-glow-mint";
                } else if (opt.id === reveal.guessedOptionId) {
                  cls = "border-coral bg-coral/10";
                  shadow = "shadow-glow-coral";
                  shake = !reveal.isCorrect;
                } else {
                  cls = "border-plum/10 bg-white opacity-50";
                }
              } else if (selectedOption === opt.id) {
                cls = "border-rose bg-rose/10";
                shadow = "shadow-glow";
              }
              return (
                <motion.button
                  key={opt.id}
                  disabled={locked}
                  onClick={() => setSelectedOption(opt.id)}
                  initial={{ opacity: 0, y: 8 }}
                  animate={
                    shake
                      ? { opacity: 1, y: 0, x: [0, -6, 6, -4, 4, 0] }
                      : { opacity: 1, y: 0 }
                  }
                  transition={{ delay: shake ? 0 : i * 0.04, duration: shake ? 0.4 : 0.25 }}
                  whileHover={!locked ? { scale: 1.015, y: -2 } : {}}
                  whileTap={!locked ? { scale: 0.985 } : {}}
                  className={`option-btn text-left px-4 py-3 rounded-xl border-2 ${cls} ${shadow} disabled:cursor-default`}
                >
                  {opt.text}
                </motion.button>
              );
            })}
          </div>

          <AnimatePresence>
            {isRevealed && reveal && (
              <motion.p
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                className={`mt-4 text-sm font-semibold ${reveal.isCorrect ? "text-mint" : "text-coral"}`}
              >
                {reveal.isCorrect ? pick(MICROCOPY_CORRECT) : pick(MICROCOPY_WRONG)}{" "}
                <span className="text-plum/50 font-normal">({reveal.isCorrect ? "+10" : "+0"})</span>
              </motion.p>
            )}
          </AnimatePresence>

          {!isRevealed && (
            <motion.button
              disabled={!selectedOption || locked}
              onClick={isGuessing ? onSubmitGuess : onSubmitAnswer}
              whileHover={selectedOption && !locked ? { scale: 1.02, y: -1 } : {}}
              whileTap={selectedOption && !locked ? { scale: 0.97 } : {}}
              className={`w-full mt-5 py-3 rounded-full text-white font-semibold disabled:opacity-40 transition-shadow ${
                selectedOption && !locked ? "shimmer-sweep bg-rose shadow-glow hover:shadow-glow-lg" : "bg-rose"
              }`}
            >
              {locked ? "💕 Locked in — waiting for your partner…" : isGuessing ? "Lock in my guess" : "Lock in my answer"}
            </motion.button>
          )}
          {!isRevealed && locked && partnerLocked === false && (
            <motion.p
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ repeat: Infinity, duration: 1.8 }}
              className="text-center text-xs text-plum/40 mt-2"
            >
              ⏳ Waiting for your partner…
            </motion.p>
          )}

          {isRevealed && (
            <motion.button
              whileHover={{ scale: 1.02, y: -1 }}
              whileTap={{ scale: 0.97 }}
              onClick={onNextQuestion}
              className="w-full mt-5 py-3 rounded-full bg-plum text-white font-semibold hover:bg-plum-light hover:shadow-soft transition-all"
            >
              {question.index + 1 >= question.total ? "See final result 🏆" : "Next question →"}
            </motion.button>
          )}
        </motion.div>
      </AnimatePresence>

      <p className="text-center text-xs text-plum/40 mt-4">
        Score — you: <AnimatedNumber value={scores[myPlayerId] || 0} className="font-semibold text-plum/60" /> · them:{" "}
        <AnimatedNumber value={scores[partnerId] || 0} className="font-semibold text-plum/60" />
      </p>
    </div>
  );
}

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}
