import React, { useEffect } from 'react';
import Draggable from 'react-draggable';
import { ChatState } from '../../Context/ChatProvider';
import { getSocket } from '../../config/socket';
import { Box } from '@chakra-ui/react';

var socket;

const GameInvitation = () => {
    const { user, selectedChat, gameStatus, setGameStatus, gameRequestTime, setPlayArenaVisibility } = ChatState();

    useEffect(() => {
        socket = getSocket(user.token);
        socket.emit("setup", user);
    }, [user]);

    useEffect(() => {
        const onNoResponse = () => {
            const outerElement = document.getElementById('outer');
            const innerElement = document.getElementById('inner');
            if (outerElement && innerElement) {
                outerElement.style.backgroundColor = 'red';
                innerElement.innerText = 'Player did not respond';
                setTimeout(() => {
                    setGameStatus(false);
                }, 3000);
            }
        };
        socket?.on('no response close game', onNoResponse);
        return () => socket?.off('no response close game', onNoResponse);
    }, [setGameStatus]);

    useEffect(() => {
        const onAccepted = (name) => {
            const outerElement = document.getElementById('outer');
            const innerElement = document.getElementById('inner');
            if (outerElement && innerElement) {
                outerElement.style.backgroundColor = 'green';
                outerElement.style.width = '350px';
                innerElement.innerText = `${name} accepted your play request`;
                setTimeout(() => {
                    setGameStatus(false);
                }, 0);
            }
            setPlayArenaVisibility(true);
        };
        socket?.on('accepted play request', onAccepted);
        return () => socket?.off('accepted play request', onAccepted);
    }, [setGameStatus, setPlayArenaVisibility]);

    useEffect(() => {
        const onRejected = (name) => {
            const outerElement = document.getElementById('outer');
            const innerElement = document.getElementById('inner');
            if (outerElement && innerElement) {
                outerElement.style.backgroundColor = 'red';
                outerElement.style.width = '350px';
                innerElement.innerText = `${name} rejected your play request`;
                setTimeout(() => {
                    setGameStatus(false);
                }, 3000);
            }
        };
        socket?.on('rejected play request', onRejected);
        return () => socket?.off('rejected play request', onRejected);
    }, [setGameStatus]);

    useEffect(() => {
        const interval = setInterval(() => {
            const newTime = new Date();
            if ((newTime - gameRequestTime) / 1000 > 5) {
                const outerElement = document.getElementById('outer');
                const innerElement = document.getElementById('inner');
                if (outerElement) outerElement.style.backgroundColor = "red";
                if (innerElement) innerElement.innerText = "Player is offline";
                if((newTime - gameRequestTime) / 1000 > 8){
                    clearInterval(interval);
                    setGameStatus(false);
                }
            }
        }, 1000);
    
        return () => {
            clearInterval(interval);
        };
    }, [gameRequestTime, setGameStatus]);

    return (
        <Draggable>
            <Box position="relative" zIndex={200}>
                {gameStatus && (
                    <Box
                        id="outer"
                        backgroundColor="blue"
                        height="30px"
                        borderRadius="5px"
                        color="white"
                        padding="5px"
                        width="200px"
                        display={{
                            base: !selectedChat ? "flex" : "none",
                            md: "flex",
                        }}
                    >
                        <Box id="inner">Waiting for response...</Box>
                    </Box>
                )}
            </Box>
        </Draggable>
    );
}

export default GameInvitation;
