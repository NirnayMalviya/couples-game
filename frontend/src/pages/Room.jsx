import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { apiGet, getSocket, loadSession } from "../lib/socket.js";
import PackageSpinner from "../components/PackageSpinner.jsx";
import PlayerBar from "../components/PlayerBar.jsx";
import FinalResult from "../components/FinalResult.jsx";
import RevealBreakdown from "../components/RevealBreakdown.jsx";

export default function Room() {
  const { code } = useParams();
  const navigate = useNavigate();
  const session = useMemo(() => loadSession(), []);

  const [packages, setPackages] = useState([]);
  const [players, setPlayers] = useState([]);
  const [packageId, setPackageId] = useState(null);
  const [spinning, setSpinning] = useState(false);
  const [banner, setBanner] = useState(null);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(null); // "code" | "link" | null

  // Round state
  const [gameId, setGameId] = useState(null);
  const [phase, setPhase] = useState(null); // "ANSWERING" | "GUESSING" | "REVEAL" | "FINAL_RESULT" | null
  const [questions, setQuestions] = useState([]);
  const [scores, setScores] = useState({});
  const [localIndex, setLocalIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState(null);
  const [partnerDonePhase, setPartnerDonePhase] = useState(false);
  const [revealData, setRevealData] = useState(null); // { results, maxPossible }
  const [finalResult, setFinalResult] = useState(null);

  const myPlayerId = session?.playerId;
  const roomId = session?.roomId;
  const isHost = players.find((p) => p.playerId === myPlayerId)?.isHost;
  const partnerId = players.find((p) => p.playerId !== myPlayerId)?.playerId;

  function resetRound() {
    setGameId(null);
    setPhase(null);
    setQuestions([]);
    setLocalIndex(0);
    setSelectedOption(null);
    setPartnerDonePhase(false);
    setRevealData(null);
    setFinalResult(null);
  }

  useEffect(() => {
    if (!session || session.roomCode !== code) {
      navigate(`/join/${code}`);
      return;
    }
    apiGet("/packages").then(setPackages).catch(() => {});

    const socket = getSocket();
    socket.emit("join-socket-room", { roomId: session.roomId, playerId: session.playerId });

    socket.on("room-update", (data) => {
      setPlayers(data.players);
      setPackageId(data.packageId);
      if (data.status === "GAME_READY" || data.status === "WAITING_FOR_PARTNER") {
        resetRound();
      }
    });

    socket.on("package-exhausted", (data) => setBanner(data.message));

    socket.on("game-started", ({ gameId, scores, questions }) => {
      setBanner(null);
      setFinalResult(null);
      setRevealData(null);
      setGameId(gameId);
      setPhase("ANSWERING");
      setQuestions(questions);
      setScores(scores);
      setLocalIndex(0);
      setSelectedOption(null);
      setPartnerDonePhase(false);
    });

    socket.on("player-finished-answering", ({ playerId }) => {
      if (playerId !== session.playerId) setPartnerDonePhase(true);
    });
    socket.on("player-finished-guessing", ({ playerId }) => {
      if (playerId !== session.playerId) setPartnerDonePhase(true);
    });

    socket.on("guessing-phase", ({ questions }) => {
      setPhase("GUESSING");
      setQuestions(questions);
      setLocalIndex(0);
      setSelectedOption(null);
      setPartnerDonePhase(false);
    });

    socket.on("reveal-all", ({ results, scores, maxPossible }) => {
      setPhase("REVEAL");
      setScores(scores);
      setRevealData({ results: results[session.playerId], maxPossible });
    });

    socket.on("game-complete", (data) => {
      setPhase("FINAL_RESULT");
      setFinalResult(data);
    });

    socket.on("resume-game", ({ gameId, state, scores, questions, answeredIds, guessedIds, revealResults, maxPossible }) => {
      setGameId(gameId);
      setPhase(state);
      setQuestions(questions);
      setScores(scores);
      setSelectedOption(null);
      if (state === "ANSWERING") setLocalIndex(answeredIds.length);
      if (state === "GUESSING") setLocalIndex(guessedIds.length);
      if (state === "REVEAL" && revealResults) setRevealData({ results: revealResults, maxPossible });
    });

    socket.on("partner-disconnected", () => setBanner("💕 Your partner disconnected — they can rejoin any time."));
    socket.on("partner-reconnected", () => setBanner("They're back! ❤️"));
    socket.on("error-toast", (d) => setError(d.message));

    return () => {
      socket.off("room-update");
      socket.off("package-exhausted");
      socket.off("game-started");
      socket.off("player-finished-answering");
      socket.off("player-finished-guessing");
      socket.off("guessing-phase");
      socket.off("reveal-all");
      socket.off("game-complete");
      socket.off("resume-game");
      socket.off("partner-disconnected");
      socket.off("partner-reconnected");
      socket.off("error-toast");
    };
  }, [code]);

  function handleSpinResult(id) {
    setPackageId(id);
    getSocket().emit("select-package", { roomId, packageId: id });
  }

  function startGame() {
    getSocket().emit("start-game", { roomId });
  }

  function lockIn() {
    if (!selectedOption || !questions[localIndex]) return;
    const q = questions[localIndex];
    const socket = getSocket();
    if (phase === "ANSWERING") {
      socket.emit("submit-answer", { roomId, gameId, questionId: q.id, optionId: selectedOption, playerId: myPlayerId });
    } else if (phase === "GUESSING") {
      socket.emit("submit-guess", { roomId, gameId, questionId: q.id, guessedOptionId: selectedOption, playerId: myPlayerId });
    }
    setSelectedOption(null);
    setLocalIndex((i) => i + 1);
  }

  function finishRound() {
    getSocket().emit("finish-round", { roomId, gameId });
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

  const iAmDoneWithPhase = localIndex >= questions.length && questions.length > 0;

  return (
    <div className="min-h-screen bg-cream bg-grain-fade px-6 py-10">
      <AnimatePresence>
        {banner && (
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="max-w-md mx-auto mb-4 text-center text-sm bg-lavender/20 text-plum rounded-full px-4 py-2">
            {banner}
          </motion.div>
        )}
        {error && (
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="max-w-md mx-auto mb-4 text-center text-sm bg-coral/10 text-coral rounded-full px-4 py-2">
            {error}
          </motion.div>
        )}
      </AnimatePresence>

      {phase === "FINAL_RESULT" && finalResult ? (
        <FinalResult
          players={players}
          myPlayerId={myPlayerId}
          scores={finalResult.scores}
          winnerPlayerId={finalResult.winnerPlayerId}
          isPerfectMatch={finalResult.isPerfectMatch}
          onPlayAgain={playAgain}
          onChoosePackage={playAgain}
        />
      ) : phase === "REVEAL" && revealData ? (
        <RevealBreakdown
          questions={questions}
          myResults={revealData.results}
          myScore={scores[myPlayerId] || 0}
          partnerScore={scores[partnerId] || 0}
          maxPossible={revealData.maxPossible}
          onFinish={finishRound}
        />
      ) : phase === "ANSWERING" || phase === "GUESSING" ? (
        <RoundPlay
          phase={phase}
          questions={questions}
          localIndex={localIndex}
          iAmDoneWithPhase={iAmDoneWithPhase}
          partnerDonePhase={partnerDonePhase}
          players={players}
          myPlayerId={myPlayerId}
          selectedOption={selectedOption}
          setSelectedOption={setSelectedOption}
          onLockIn={lockIn}
        />
      ) : (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="max-w-md mx-auto">
          <div className="postcard p-6 mb-6 text-center">
            <p className="text-xs uppercase tracking-widest text-plum/40 mb-2">Room code</p>
            <p className="font-display text-3xl text-plum mb-3 tracking-wide">{code}</p>
            <div className="flex gap-2 justify-center">
              <motion.button whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.95 }} onClick={copyCode} className="btn-press text-sm px-4 py-1.5 rounded-full bg-plum/5 text-plum hover:bg-plum/10 transition-colors">
                {copied === "code" ? "Copied! ✓" : "Copy code"}
              </motion.button>
              <motion.button whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.95 }} onClick={copyLink} className="btn-press text-sm px-4 py-1.5 rounded-full bg-plum/5 text-plum hover:bg-plum/10 transition-colors">
                {copied === "link" ? "Copied! ✓" : "Copy invite link"}
              </motion.button>
            </div>
          </div>

          <PlayerBar players={players} myPlayerId={myPlayerId} totalQuestions={0} currentIndex={0} />

          {players.length < 2 ? (
            <motion.p animate={{ opacity: [0.5, 1, 0.5] }} transition={{ repeat: Infinity, duration: 2 }} className="text-center text-plum/60 mt-6">
              ⏳ Waiting for your partner to join…
            </motion.p>
          ) : (
            <div className="mt-8">
              <h3 className="font-display text-xl text-plum text-center mb-4">Spin for a package</h3>
              <PackageSpinner
                packages={packages}
                selectedId={packageId}
                onSpinResult={handleSpinResult}
                disabled={!isHost}
                spinning={spinning}
                setSpinning={setSpinning}
              />
              {isHost ? (
                <motion.button
                  disabled={!packageId || spinning}
                  onClick={startGame}
                  whileHover={packageId && !spinning ? { scale: 1.02, y: -1 } : {}}
                  whileTap={packageId && !spinning ? { scale: 0.97 } : {}}
                  className="shimmer-sweep w-full mt-6 py-3 rounded-full bg-rose text-white font-semibold shadow-glow disabled:opacity-50 disabled:shadow-none hover:shadow-glow-lg transition-shadow"
                >
                  Start the game 💕
                </motion.button>
              ) : (
                <p className="text-center text-sm text-plum/50 mt-4">Waiting for your partner to start…</p>
              )}
            </div>
          )}
        </motion.div>
      )}
    </div>
  );
}

function RoundPlay({ phase, questions, localIndex, iAmDoneWithPhase, partnerDonePhase, players, myPlayerId, selectedOption, setSelectedOption, onLockIn }) {
  const isGuessing = phase === "GUESSING";
  const question = questions[Math.min(localIndex, questions.length - 1)];

  if (!question) return null;

  return (
    <div className="max-w-md mx-auto">
      <PlayerBar players={players} myPlayerId={myPlayerId} totalQuestions={questions.length} currentIndex={Math.min(localIndex, questions.length)} />

      {iAmDoneWithPhase ? (
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="postcard p-8 mt-6 text-center">
          <p className="font-display text-xl text-plum mb-2">
            💕 {isGuessing ? "All your guesses are locked!" : "Your answers are locked!"}
          </p>
          <motion.p animate={{ opacity: [0.5, 1, 0.5] }} transition={{ repeat: Infinity, duration: 1.8 }} className="text-plum/60 text-sm">
            {partnerDonePhase ? "Wrapping things up…" : "⏳ Waiting for your partner to finish…"}
          </motion.p>
        </motion.div>
      ) : (
        <AnimatePresence mode="wait">
          <motion.div
            key={`${question.id}-${phase}`}
            initial={{ opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -24 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            className="postcard p-6 mt-6"
          >
            <p className="text-xs uppercase tracking-widest text-plum/40 mb-2">
              {isGuessing ? "Guess your partner 👀" : "Answer for yourself"}
            </p>
            <p className="font-display text-xl text-plum mb-5">
              {question.emoji} {question.text}
            </p>

            <div className="grid gap-2.5">
              {question.options.map((opt, i) => (
                <motion.button
                  key={opt.id}
                  onClick={() => setSelectedOption(opt.id)}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04, duration: 0.25 }}
                  whileHover={{ scale: 1.015, y: -2 }}
                  whileTap={{ scale: 0.985 }}
                  className={`option-btn text-left px-4 py-3 rounded-xl border-2 ${
                    selectedOption === opt.id ? "border-rose bg-rose/10 shadow-glow" : "border-plum/12 bg-white"
                  }`}
                >
                  {opt.text}
                </motion.button>
              ))}
            </div>

            <motion.button
              disabled={!selectedOption}
              onClick={onLockIn}
              whileHover={selectedOption ? { scale: 1.02, y: -1 } : {}}
              whileTap={selectedOption ? { scale: 0.97 } : {}}
              className={`w-full mt-5 py-3 rounded-full text-white font-semibold disabled:opacity-40 transition-shadow ${
                selectedOption ? "shimmer-sweep bg-rose shadow-glow hover:shadow-glow-lg" : "bg-rose"
              }`}
            >
              {isGuessing ? "Lock in my guess" : "Lock in my answer"}
              {localIndex + 1 < questions.length ? " →" : ""}
            </motion.button>
          </motion.div>
        </AnimatePresence>
      )}
    </div>
  );
}
