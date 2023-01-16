import React, { useEffect, useState } from 'react'
import io from 'socket.io-client';
import { ChatState } from '../Context/ChatProvider';

const ENDPOINT = "http://localhost:5000";
var socket;

const LatestMessage = ({ currChat }) => {
  const { user, newLatestMessage } = ChatState();
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

  useEffect(() => {
    if(newLatestMessage !== undefined &&  currChat._id === newLatestMessage.chat._id)
      setLatestMessage(newLatestMessage);
  }, [newLatestMessage]);
  
  return (
    <>
      {latestMessage !== undefined && latestMessage !== null && (
        (latestMessage.sender._id === user._id ? "You: " : `${latestMessage.sender.name.split(' ')[0]}: `) + 
        (latestMessage.content.length > 40 ?
        `${latestMessage.content.slice(0,37)} ...` : latestMessage.content)
      )}
    </>
  )
}

export default LatestMessage
