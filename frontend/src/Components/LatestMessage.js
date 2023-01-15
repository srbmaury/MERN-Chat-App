import React, { useEffect, useState } from 'react'
import io from 'socket.io-client';
import { ChatState } from '../Context/ChatProvider';

const ENDPOINT = "http://localhost:5000";
var socket;

const LatestMessage = ({ currChat }) => {
  const { user } = ChatState();
  const [latestMessage, setLatestMessage] = useState(currChat.latestMessage);

  useEffect(() => {
    socket = io(ENDPOINT);
    socket.emit("setup", user);
  }, [user]);

  useEffect(() => {
    socket.on('message received', (newMessageReceived) => {
      var particularChat = newMessageReceived.chat;
      if(currChat._id === particularChat._id){
        setLatestMessage(newMessageReceived);
      }
    });
  });

  useEffect(() => {
    socket.on('new latest message', (particularChat) => {
      if(currChat._id === particularChat._id){
        setLatestMessage(particularChat.latestMessage);
      }
    });
  });

  return (
    <>
      {latestMessage !== undefined && (
        (latestMessage.sender._id === user._id ? "You: " : `${latestMessage.sender.name.split(' ')[0]}: `) + 
        (latestMessage.content.length > 50 ?
        `${latestMessage.content.slice(0,47)} ...` : latestMessage.content)
      )}
    </>
  )
}

export default LatestMessage
