import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import NicknameForm from "../components/NicknameForm.jsx";
import { apiPost, saveSession } from "../lib/socket.js";

export default function JoinGame() {
  const { code: codeFromUrl } = useParams();
  const [code, setCode] = useState(codeFromUrl || "");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  async function handleSubmit({ nickname, avatar }) {
    const roomCode = code.trim().toUpperCase();
    if (!roomCode) return setError("Enter the room code your partner sent you.");
    setLoading(true);
    setError("");
    try {
      const { roomId, playerId } = await apiPost(`/rooms/${roomCode}/join`, { nickname, avatar });
      saveSession({ roomCode, roomId, playerId });
      navigate(`/room/${roomCode}`);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-cream bg-grain-fade grid place-items-center px-6 py-12">
      <div className="max-w-md w-full mx-auto mb-4">
        {!codeFromUrl && (
          <>
            <label className="block text-sm font-semibold text-plum/80 mb-1">Room code</label>
            <input
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="LOVE-7K92"
              className="w-full rounded-xl border border-plum/15 px-4 py-3 mb-2 uppercase tracking-wide focus:outline-none focus:ring-2 focus:ring-rose/40"
            />
          </>
        )}
      </div>
      <NicknameForm
        title="Join their game 💕"
        subtitle="You're about to find out how well they actually know you."
        submitLabel="Join the Love Game ❤️"
        onSubmit={handleSubmit}
        error={error}
        loading={loading}
      />
    </div>
  );
}
