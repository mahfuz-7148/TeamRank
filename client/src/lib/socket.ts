import { io, type Socket } from "socket.io-client";
import { API_URL } from "./api";

// Optional override, e.g. when the socket server runs on a different host.
const configuredUrl = process.env.NEXT_PUBLIC_SOCKET_URL;
const SOCKET_URL = configuredUrl && configuredUrl.length > 0 ? configuredUrl : API_URL;

// Vercel's serverless API cannot broadcast Socket.IO events, so don't open a
// doomed connection there. Polling still keeps the UI fresh. Set
// NEXT_PUBLIC_SOCKET_URL to force-enable realtime on any other host.
function isVercelHost(url: string): boolean {
  try {
    return /\.vercel\.app$/i.test(new URL(url).hostname);
  } catch {
    return false;
  }
}

const isVercelServerless = !configuredUrl && isVercelHost(API_URL);

let socket: Socket | null = null;

/**
 * One shared Socket.IO connection for the whole app.
 * Socket.IO reconnects automatically and keeps working across route changes.
 */
export function getSocket(): Socket {
  if (!socket) {
    socket = io(SOCKET_URL, {
      transports: ["websocket", "polling"],
      autoConnect: !isVercelServerless,
      withCredentials: true,
      reconnection: true,
      reconnectionDelay: 800,
      reconnectionDelayMax: 4000,
    });
  }
  return socket;
}
