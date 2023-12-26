import React, { useEffect, useState } from 'react';
import { ChatState } from '../../Context/ChatProvider';
import { io } from 'socket.io-client';
import { Box, Button, Center, Text, Grid, GridItem } from '@chakra-ui/react';

const ENDPOINT = "https://mern-chat-app-hs5n.onrender.com";
var socket;

const TicTacToe = ({ myTurn, setMyTurn }) => {
    const [board, setBoard] = useState(Array(9).fill(null));
    const [xIsNext, setXIsNext] = useState(true);
    const [timer, setTimer] = useState(10);
    const [isTimerActive, setIsTimerActive] = useState(false);

    const { user, chats, selectedChat, setPlayArenaVisibility } = ChatState();

    useEffect(() => {
        socket = io(ENDPOINT);
        socket.emit("setup", user);
        setIsTimerActive(myTurn);
    }, [user, myTurn]);

    const handleClick = (index) => {
        if (!myTurn) return;
        const newBoard = [...board];
        if (calculateWinner(board) || newBoard[index]) return;

        newBoard[index] = xIsNext ? 'X' : 'O';
        setBoard(newBoard);
        setXIsNext(!xIsNext);
        setMyTurn(false);
        socket.emit('player moved', newBoard, chats.find(x => x._id === selectedChat._id), user, xIsNext);

        setTimer(10);
        setIsTimerActive(false);
    };

    useEffect(() => {
        let timeoutId;

        if (isTimerActive) {
            timeoutId = setTimeout(() => {
                if (timer > 0) {
                    setTimer(timer - 1);
                } else {
                    setPlayArenaVisibility(false);
                }
            }, 1000);
        }

        return () => clearTimeout(timeoutId);
    }, [timer, isTimerActive, setPlayArenaVisibility]);

    useEffect(() => {
        socket.on('your turn', (newBoard, xIsNext) => {
            setBoard(newBoard);
            setXIsNext(!xIsNext);
            setMyTurn(true);
            setIsTimerActive(true);
        });
    });

    const renderSquare = (index) => {
        const squareStyle = {
            width: '100px',
            height: '100px',
            fontSize: '24px',
            fontWeight: 'bold',
            textAlign: 'center',
            border: '1px solid #999',
            cursor: 'pointer',
            backgroundColor: calculateWinner(board) && calculateWinner(board).includes(index) ? 'lightgreen' : 'lightblue',
        };

        return (
            <Button
                style={squareStyle}
                onClick={() => handleClick(index)}
            >
                {board[index]}
            </Button>
        );
    };

    useEffect(() => {
        if (calculateWinner(board)) {
            setTimeout(() => {
                setPlayArenaVisibility(false);
            }, 5000);
        }
    });

    const winner = calculateWinner(board);
    const status = winner
        ? (myTurn ? 'You Lost' : 'You Won')
        : `Next player: ${xIsNext ? 'X' : 'O'}` + (myTurn ? ' (You)' : ' (Opponent)');

    const boardStyle = {
        backgroundColor: 'lightgray',
        padding: '20px',
        borderRadius: '10px',
        boxShadow: '0px 0px 10px rgba(0, 0, 0, 0.2)',
    };

    const gameStatusStyle = {
        fontSize: '24px',
        fontWeight: 'bold',
        marginBottom: '20px',
    };

    return (
        <Box style={boardStyle}>
            <Text style={gameStatusStyle}>
                {status}
            </Text>
            <Center>
                <Box style={{ visibility: (winner && myTurn) ? 'visible' : 'hidden' }}>
                    <Text fontSize='20px' m={2}>
                        Time Left: {timer} seconds
                    </Text>
                </Box>
            </Center>
            <Center>
                <Grid templateColumns="repeat(3, 100px)" gap={4}>
                    <GridItem>{renderSquare(0)}</GridItem>
                    <GridItem>{renderSquare(1)}</GridItem>
                    <GridItem>{renderSquare(2)}</GridItem>
                    <GridItem>{renderSquare(3)}</GridItem>
                    <GridItem>{renderSquare(4)}</GridItem>
                    <GridItem>{renderSquare(5)}</GridItem>
                    <GridItem>{renderSquare(6)}</GridItem>
                    <GridItem>{renderSquare(7)}</GridItem>
                    <GridItem>{renderSquare(8)}</GridItem>
                </Grid>
            </Center>
        </Box>
    );
}

function calculateWinner(squares) {
    const lines = [
        [0, 1, 2],
        [3, 4, 5],
        [6, 7, 8],
        [0, 3, 6],
        [1, 4, 7],
        [2, 5, 8],
        [0, 4, 8],
        [2, 4, 6],
    ];

    for (let i = 0; i < lines.length; i++) {
        const [a, b, c] = lines[i];
        if (squares[a] && squares[a] === squares[b] && squares[a] === squares[c]) {
            return [a, b, c];
        }
    }

    return null;
}

export default TicTacToe;
