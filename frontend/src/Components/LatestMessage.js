import { Box, Flex, Image } from '@chakra-ui/react';
import React, { useEffect, useState } from 'react';
import { getSocket } from '../config/socket';
import { formatDate2 } from '../config/ChatLogics';
import { ChatState } from '../Context/ChatProvider';

let socket;

const LatestMessage = ({ currChat }) => {
    const { user, newLatestMessage } = ChatState();
    const [latestMessage, setLatestMessage] = useState(currChat.latestMessage);

    useEffect(() => {
        setLatestMessage(currChat.latestMessage);
    }, [currChat.latestMessage]);

    useEffect(() => {
        socket = getSocket(user.token);
        socket.emit("setup", user);
    }, [user]);

    useEffect(() => {
        const onMessageReceived = (newMessageReceived) => {
            const particularChat = newMessageReceived.chat;
            if (currChat._id === particularChat._id) {
                setLatestMessage(newMessageReceived);
            }
        };

        const onLatestMessage = (particularChat) => {
            if (currChat._id === particularChat._id) {
                setLatestMessage(particularChat.latestMessage);
            }
        };
        socket.on('message received', onMessageReceived);
        socket.on('new latest message', onLatestMessage);
        return () => {
            socket.off('message received', onMessageReceived);
            socket.off('new latest message', onLatestMessage);
        };
    }, [currChat]);

    useEffect(() => {
        if (newLatestMessage && currChat._id === newLatestMessage.chat._id) {
            setLatestMessage(newLatestMessage);
        }
    }, [newLatestMessage, currChat]);

    return (
        <Flex
            style={{ width: '100%', display: 'flex',justifyContent:'space-between', alignItems: 'center' }}
        >
            <Box sx={{ display: "flex" }}>
                {latestMessage && (
                    <>
                        {latestMessage.sender._id === user._id ? "You: " : `${latestMessage.sender.name.split(' ')[0]}: `}
                    </>
                )}
                {latestMessage && latestMessage.media && latestMessage.media !== "" && (
                    <Image src={latestMessage.media} alt="Image" boxSize="20px" ml="1" mr="1" />
                )}
                {latestMessage && latestMessage.content && (
                    <>
                        {latestMessage.content.length > 30
                            ? `${latestMessage.content.slice(0, 27)} ...`
                            : latestMessage.content
                        }
                    </>
                )}
            </Box>
            <Box>
                {latestMessage && latestMessage.createdAt && formatDate2(latestMessage.createdAt)}
            </Box>
        </Flex>
    );
};

export default LatestMessage;
