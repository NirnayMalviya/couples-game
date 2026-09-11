import { io } from "socket.io-client";

export const API_URL = import.meta.env.VITE_API_URL || "http://localhost:4000";

let socket;
export function getSocket() {
  if (!socket) {
    socket = io(API_URL, { autoConnect: true, transports: ["websocket", "polling"] });
  }
  return socket;
}

export async function apiPost(path, body) {
  const res = await fetch(`${API_URL}/api${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Something went wrong.");
  return data;
}

export async function apiGet(path) {
  const res = await fetch(`${API_URL}/api${path}`);
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Something went wrong.");
  return data;
}

// Local session storage — lets a refresh rejoin the same room/player.
export function saveSession({ roomCode, roomId, playerId }) {
  sessionStorage.setItem("cg_session", JSON.stringify({ roomCode, roomId, playerId }));
}
export function loadSession() {
  try {
    return JSON.parse(sessionStorage.getItem("cg_session") || "null");
  } catch {
    return null;
  }
}
