export default function PlayerBar({ players, myPlayerId, totalQuestions, currentIndex, disconnectedId }) {
  const me = players.find((p) => p.playerId === myPlayerId);
  const partner = players.find((p) => p.playerId !== myPlayerId);

  const hearts =
    totalQuestions > 0
      ? Array.from({ length: totalQuestions }, (_, i) => (i < currentIndex ? "❤️" : "🤍")).join("")
      : null;

  return (
    <div className="max-w-lg mx-auto">
      <div className="flex items-center gap-3 mb-3">
        <PlayerChip player={me} isDisconnected={disconnectedId === myPlayerId} you />
        <div className="connector-line" />
        <PlayerChip player={partner} isDisconnected={partner && disconnectedId === partner.playerId} />
      </div>
      {hearts && <p className="text-center text-sm tracking-wide">{hearts}</p>}
      {hearts && (
        <p className="text-center text-xs text-plum/50 mt-0.5">
          Question {Math.min(currentIndex + 1, totalQuestions)} / {totalQuestions}
        </p>
      )}
    </div>
  );
}

function PlayerChip({ player, isDisconnected, you }) {
  if (!player) {
    return <div className="flex-1 text-center text-sm text-plum/40 italic">waiting for partner…</div>;
  }
  return (
    <div className="flex-1 flex flex-col items-center">
      <div className="w-11 h-11 rounded-full bg-white border border-plum/10 grid place-items-center text-xl shadow-card">
        {player.avatar}
      </div>
      <span className="text-xs mt-1 text-plum/70">
        {player.nickname}
        {you ? " (you)" : ""}
      </span>
      {isDisconnected && <span className="text-[10px] text-coral">offline</span>}
    </div>
  );
}
