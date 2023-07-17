import { Box, Flex } from '@chakra-ui/react';
import React, { useEffect, useState } from 'react'
import io from 'socket.io-client';
import { formatDate2 } from '../config/ChatLogics';
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
            if (currChat._id === particularChat._id) {
                setLatestMessage(newMessageReceived);
            }
        });
    });

    useEffect(() => {
        socket.on('new latest message', (particularChat) => {
            if (currChat._id === particularChat._id) {
                setLatestMessage(particularChat.latestMessage);
            }
        });
    });

    useEffect(() => {
        if (newLatestMessage !== undefined && currChat._id === newLatestMessage.chat._id)
            setLatestMessage(newLatestMessage);
    }, [newLatestMessage, currChat._id]);

    return (
        <>
            <Flex style={{ width: '100%', display: 'flex', justifyContent: 'space-between' }}>
                <Box>
                    {latestMessage !== undefined && latestMessage !== null && (
                        (latestMessage.sender._id === user._id ? "You: " : `${latestMessage.sender.name.split(' ')[0]}: `) +
                        (latestMessage.content.length > 30 ?
                            `${latestMessage.content.slice(0, 27)} ...` : latestMessage.content)
                    )}
                </Box>
                <Box>
                    {latestMessage !== undefined && latestMessage !== null && (
                        formatDate2(latestMessage.createdAt)
                    )}
                </Box>
            </Flex>
        </>
    )
}

export default LatestMessage
