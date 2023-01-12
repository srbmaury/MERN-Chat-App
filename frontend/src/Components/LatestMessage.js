import React, { useEffect, useState } from 'react'
import io from 'socket.io-client';
import { ChatState } from '../Context/ChatProvider';

const ENDPOINT = "http://localhost:5000";
var socket;

const LatestMessage = ({chat}) => {
  const { user } = ChatState();
  const [latestMessage, setLatestMessage] = useState(chat.latestMessage);

  useEffect(() => {
    socket = io(ENDPOINT);
    socket.emit("setup", user);
  }, []);

  useEffect(() => {
    socket.on('message received', (newMessageReceived) => {
      setLatestMessage(newMessageReceived);
    });
  });

  useEffect(() => {
    console.log(latestMessage);
  }, [latestMessage]);
  
  return (
    <>
      {latestMessage !== undefined && latestMessage.content}
    </>
  )
}

export default LatestMessage
