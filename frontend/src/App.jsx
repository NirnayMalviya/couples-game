import { Routes, Route } from "react-router-dom";
import Landing from "./pages/Landing.jsx";
import CreateGame from "./pages/CreateGame.jsx";
import JoinGame from "./pages/JoinGame.jsx";
import Room from "./pages/Room.jsx";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/create" element={<CreateGame />} />
      <Route path="/join" element={<JoinGame />} />
      <Route path="/join/:code" element={<JoinGame />} />
      <Route path="/room/:code" element={<Room />} />
    </Routes>
  );
}
