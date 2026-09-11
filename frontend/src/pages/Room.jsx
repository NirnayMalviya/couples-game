import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { apiGet, getSocket, loadSession } from "../lib/socket.js";
import PackagePicker from "../components/PackagePicker.jsx";
import PlayerBar from "../components/PlayerBar.jsx";
import FinalResult from "../components/FinalResult.jsx";

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

  const copyCode = () => navigator.clipboard?.writeText(code);
  const copyLink = () => navigator.clipboard?.writeText(`${window.location.origin}/join/${code}`);

  if (!session) return null;

  return (
    <div className="min-h-screen bg-cream bg-grain-fade px-6 py-10">
      {banner && (
        <div className="max-w-md mx-auto mb-4 text-center text-sm bg-lavender/20 text-plum rounded-full px-4 py-2">{banner}</div>
      )}
      {error && (
        <div className="max-w-md mx-auto mb-4 text-center text-sm bg-coral/10 text-coral rounded-full px-4 py-2">{error}</div>
      )}

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
        <div className="max-w-md mx-auto">
          <div className="postcard p-6 mb-6 text-center">
            <p className="text-xs uppercase tracking-widest text-plum/40 mb-2">Room code</p>
            <p className="font-display text-3xl text-plum mb-3">{code}</p>
            <div className="flex gap-2 justify-center">
              <button onClick={copyCode} className="text-sm px-4 py-1.5 rounded-full bg-plum/5 text-plum hover:bg-plum/10">
                Copy code
              </button>
              <button onClick={copyLink} className="text-sm px-4 py-1.5 rounded-full bg-plum/5 text-plum hover:bg-plum/10">
                Copy invite link
              </button>
            </div>
          </div>

          <PlayerBar players={players} myPlayerId={myPlayerId} totalQuestions={0} currentIndex={0} />

          {players.length < 2 ? (
            <p className="text-center text-plum/60 mt-6">⏳ Waiting for your partner to join…</p>
          ) : (
            <div className="mt-8">
              <h3 className="font-display text-xl text-plum text-center mb-4">Choose a package</h3>
              <PackagePicker packages={packages} selectedId={packageId} onSelect={isHost ? selectPackage : () => {}} disabled={!isHost} />
              {isHost ? (
                <button
                  disabled={!packageId}
                  onClick={startGame}
                  className="w-full mt-6 py-3 rounded-full bg-rose text-white font-semibold shadow-soft disabled:opacity-50 hover:bg-rose-dark transition-colors"
                >
                  Start the game 💕
                </button>
              ) : (
                <p className="text-center text-sm text-plum/50 mt-4">Waiting for your partner to pick a package and start…</p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function GameScreen({ game, reveal, players, myPlayerId, selectedOption, setSelectedOption, hasAnswered, hasGuessed, partnerLocked, onSubmitAnswer, onSubmitGuess, onNextQuestion }) {
  const { state, question, scores } = game;
  const isGuessing = state === "GUESSING_PHASE";
  const isRevealed = state === "ANSWER_REVEAL";
  const locked = (isGuessing ? hasGuessed : hasAnswered) || isRevealed;

  return (
    <div className="max-w-md mx-auto">
      <PlayerBar players={players} myPlayerId={myPlayerId} totalQuestions={question.total} currentIndex={question.index} />

      <AnimatePresence mode="wait">
        <motion.div
          key={`${question.id}-${state}`}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="postcard p-6 mt-6"
        >
          <p className="text-xs uppercase tracking-widest text-plum/40 mb-2">
            {isGuessing || isRevealed ? "Guess your partner 👀" : "Answer for yourself"}
          </p>
          <p className="font-display text-xl text-plum mb-5">
            {question.emoji} {question.text}
          </p>

          <div className="grid gap-2.5">
            {question.options.map((opt) => {
              let cls = "border-plum/12 bg-white";
              if (isRevealed && reveal) {
                if (opt.id === reveal.actualPartnerOptionId) cls = "border-mint bg-mint/10";
                else if (opt.id === reveal.guessedOptionId) cls = "border-coral bg-coral/10";
                else cls = "border-plum/10 bg-white opacity-60";
              } else if (selectedOption === opt.id) {
                cls = "border-rose bg-rose/10";
              }
              return (
                <button
                  key={opt.id}
                  disabled={locked}
                  onClick={() => setSelectedOption(opt.id)}
                  className={`option-btn text-left px-4 py-3 rounded-xl border-2 ${cls} disabled:cursor-default`}
                >
                  {opt.text}
                </button>
              );
            })}
          </div>

          {isRevealed && reveal && (
            <p className={`mt-4 text-sm font-semibold ${reveal.isCorrect ? "text-mint" : "text-coral"}`}>
              {reveal.isCorrect ? pick(MICROCOPY_CORRECT) : pick(MICROCOPY_WRONG)}{" "}
              <span className="text-plum/50 font-normal">({reveal.isCorrect ? "+10" : "+0"})</span>
            </p>
          )}

          {!isRevealed && (
            <button
              disabled={!selectedOption || locked}
              onClick={isGuessing ? onSubmitGuess : onSubmitAnswer}
              className="w-full mt-5 py-3 rounded-full bg-rose text-white font-semibold disabled:opacity-40 hover:bg-rose-dark transition-colors"
            >
              {locked ? "💕 Locked in — waiting for your partner…" : isGuessing ? "Lock in my guess" : "Lock in my answer"}
            </button>
          )}
          {!isRevealed && locked && partnerLocked === false && (
            <p className="text-center text-xs text-plum/40 mt-2">⏳ Waiting for your partner…</p>
          )}

          {isRevealed && (
            <button onClick={onNextQuestion} className="w-full mt-5 py-3 rounded-full bg-plum text-white font-semibold hover:bg-plum-light transition-colors">
              {question.index + 1 >= question.total ? "See final result 🏆" : "Next question →"}
            </button>
          )}
        </motion.div>
      </AnimatePresence>

      <p className="text-center text-xs text-plum/40 mt-4">
        Score — you: {scores[myPlayerId] || 0} · them: {scores[Object.keys(scores).find((id) => id !== myPlayerId)] || 0}
      </p>
    </div>
  );
}

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}
