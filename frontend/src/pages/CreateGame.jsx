import { useState } from "react";
import { useNavigate } from "react-router-dom";
import NicknameForm from "../components/NicknameForm.jsx";
import { apiPost, saveSession } from "../lib/socket.js";

export default function CreateGame() {
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  async function handleSubmit({ nickname, avatar }) {
    setLoading(true);
    setError("");
    try {
      const { roomCode, roomId, playerId } = await apiPost("/rooms", { nickname, avatar });
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
      <NicknameForm
        title="Create your game 💕"
        subtitle="You'll get a code to share with your partner right after this."
        submitLabel="Create the room"
        onSubmit={handleSubmit}
        error={error}
        loading={loading}
      />
    </div>
  );
}
