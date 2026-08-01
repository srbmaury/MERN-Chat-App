import { io } from "socket.io-client";
import { SOCKET_URL } from "./runtime";

let socket;
export const getSocket = (token) => {
  if (!socket) {
    socket?.disconnect();
    socket = io(SOCKET_URL, { auth: token ? { token } : {}, withCredentials: true });
  }
  return socket;
};

export const disconnectSocket = () => {
  socket?.disconnect();
  socket = undefined;
};
