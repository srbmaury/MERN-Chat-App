import React, { useEffect } from 'react';
import Draggable from 'react-draggable';
import { ChatState } from '../../Context/ChatProvider';
import { io } from 'socket.io-client';
import { Box } from '@chakra-ui/react';

const ENDPOINT = "http://localhost:5000";
var socket;

const GameInvitation = () => {
    const { user, selectedChat, gameStatus, setGameStatus, gameRequestTime, setPlayArenaVisibility } = ChatState();

    useEffect(() => {
        socket = io(ENDPOINT);
        socket.emit("setup", user);
    }, [user]);

    useEffect(() => {
        socket.on('no response close game', () => {
            const outerElement = document.getElementById('outer');
            const innerElement = document.getElementById('inner');
            if (outerElement && innerElement) {
                outerElement.style.backgroundColor = 'red';
                innerElement.innerText = 'Player did not respond';
                setTimeout(() => {
                    setGameStatus(false);
                }, 3000);
            }
        });
    }, [setGameStatus]);

    useEffect(() => {
        socket.on('accepted play request', (name) => {
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
        });
    }, [setGameStatus]);

    useEffect(() => {
        socket.on('rejected play request', (name) => {
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
        });
    }, [setGameStatus]);

    useEffect(() => {
        const interval = setInterval(() => {
            const newTime = new Date();
            if ((newTime - gameRequestTime) / 1000 > 5) {
                document.getElementById('outer').style.backgroundColor = "red";
                document.getElementById('inner').innerHTML = "Player is offline";
                if((newTime - gameRequestTime) / 1000 > 8){
                    clearInterval(interval);
                    setGameStatus(false);
                }
            }
        }, 1000);
    
        return () => {
            clearInterval(interval);
        };
    }, [gameRequestTime]);

    return (
        <Draggable style={{ zIndex: 200 }}>
            <Box>
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
