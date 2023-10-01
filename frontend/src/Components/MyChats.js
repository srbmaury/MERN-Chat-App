import { Avatar, Box, Button, MenuDivider, MenuItem, MenuList, Modal, ModalBody, ModalCloseButton, ModalContent, ModalFooter, ModalHeader, ModalOverlay, Stack, useDisclosure, useToast } from '@chakra-ui/react';
import React, { useCallback, useEffect, useState } from 'react';
import { ChatState } from '../Context/ChatProvider';
import axios from 'axios';
import { AddIcon } from '@chakra-ui/icons';
import { GoMute } from 'react-icons/go';
import ChatLoading from './ChatLoading';
import { getSender, getSenderFull } from '../config/ChatLogics';
import GroupChatModal from './miscellaneous/GroupChatModal';
import LatestMessage from './LatestMessage';
import { ContextMenu } from 'chakra-ui-contextmenu';
import io from 'socket.io-client';
import GameInvitation from './Gamification/GameInvitation';
import PlayArena from './Gamification/PlayArena';

const ENDPOINT = "http://localhost:5000";
var socket;
const MyChats = ({ fetchAgain }) => {
    const [loggedUser, setLoggedUser] = useState();
    const [prevSelectedChat, setPrevSelectedChat] = useState();
    const [mutedChats, setMutedChats] = useState([]);
    const [statement, setStatement] = useState("");
    const [myTurn, setMyTurn] = useState(true);

    const { selectedChat, setSelectedChat, user, chats, setChats, playArenaVisibility, setPlayArenaVisibility } = ChatState();

    const toast = useToast();
    const { isOpen, onOpen, onClose } = useDisclosure();
    const [requestedChat, setRequestedChat] = useState("");

    useEffect(() => {
        socket = io(ENDPOINT);
        socket.emit("setup", user);
    }, [user]);

    const fetchChats = useCallback(async () => {
        try {
            const config = {
                headers: {
                    Authorization: `Bearer ${user.token}`,
                },
            };

            const { data } = await axios.get('/api/chat', config);
            setChats(data);
        } catch (error) {
            toast({
                title: 'Error Occured!',
                description: 'Failed to Load the chats',
                status: 'error',
                duration: 5000,
                isClosable: true,
                position: 'bottom-left',
            });
        }
    }, [user, setChats, toast]);

    useEffect(() => {
        try {
            setLoggedUser(JSON.parse(localStorage.getItem('userInfo')));
            fetchChats();
        } catch (error) {

        }
    }, [fetchAgain, fetchChats]);

    const f = (e) => {
        e.preventDefault();
        setPrevSelectedChat(selectedChat);
    }

    const deleteChat = async (chat) => {
        const chatId = chat._id;
        try {
            const response = await fetch(`/api/chat/${chatId}`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${loggedUser.token}`
                }
            });
            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.error);
            }
            setSelectedChat(prevSelectedChat);
            const updatedChats = chats.filter(c => c._id !== chat._id);
            if (selectedChat !== undefined && selectedChat !== null && selectedChat._id === chat._id)
                setSelectedChat();
            setChats(updatedChats);
            socket.emit('chat deleted', chat);
            return data;
        } catch (err) {
            throw err;
        }
    };

    useEffect(() => {
        socket.on('remove chat', (chat) => {
            setSelectedChat(prevSelectedChat);
            const updatedChats = chats.filter(c => c._id !== chat._id);
            if (selectedChat !== undefined && selectedChat !== null && selectedChat._id === chat._id)
                setSelectedChat();
            setChats(updatedChats);
        });
        return () => {
            socket.off("remove chat");
        }
    }, [chats, selectedChat, prevSelectedChat, setSelectedChat, setChats]);

    useEffect(() => {
        async function fetchMutedChats() {
            try {
                const config = {
                    headers: {
                        'Content-type': 'application/json',
                        Authorization: `Bearer ${user.token}`,
                    },
                };
                const res = await axios.get('/api/chat/muted', config);
                setMutedChats(res.data.data);
            } catch (err) {
                console.log(err);
            }
        }
        fetchMutedChats();
    }, []);

    const changeMuteStatus = async (chatId) => {
        try {
            const config = {
                headers: {
                    'Content-type': 'application/json',
                    Authorization: `Bearer ${user.token}`,
                },
            };
            const res = await axios.post(`/api/chat/${chatId}`, { user: user }, config);
            if (res.data.success) {
                let chats = [...mutedChats];
                if (res.data.data.mutedUsers.includes(user._id)) {
                    chats.push(res.data.data);
                } else {
                    chats = chats.filter(chat => chat._id !== chatId);
                }
                setMutedChats(chats);
            }
        } catch (err) {
            console.log(err);
        }
    };

    useEffect(() => {
        if (isOpen) {
            const timeoutId = setTimeout(() => {
            socket.emit('player did not respond', requestedChat, user);
                onClose();
            }, 5000);

            return () => {
                clearTimeout(timeoutId);
            };
        }
    }, [isOpen]);

    useEffect(() => {
        socket.on('received play request', (chat, u) => {
            setStatement(u.name + " requested you to play");
            setRequestedChat(chat);
            onOpen();
        });
        return () => {
            socket.off('received play request');
        };
    }, []);

    const accept = () => {
        setSelectedChat(requestedChat);
        setPlayArenaVisibility(true);
        setMyTurn(false);
        socket.emit('accept play request', requestedChat, user);
        onClose();
    }

    const reject = () => {
        socket.emit('reject play request', requestedChat, user);
        onClose();
    }

    return (
    <>
        <Box
            display={{ base: selectedChat ? 'none' : 'flex', md: 'flex' }}
            flexDir="column"
            alignItems="center"
            padding={3}
            backgroundColor="white"
            width={{ base: '100%', md: '31%' }}
            borderRadius="lg"
            borderWidth="1px"
            justifyContent="flex-start"
            position="fixed"
            height="88.7vh"
        >
            <Box
                pb={3}
                px={3}
                fontSize={{ base: '28px', md: '30px' }}
                fontFamily="Work sans"
                display="flex"
                width="100%"
                justifyContent="space-between"
                alignItems="center"
            >
                My Chats
                <GroupChatModal>
                    <Button
                        display="flex"
                        fontSize={{ base: '17px', md: '10px', lg: '17px' }}
                        rightIcon={<AddIcon />}
                    >
                        New Group Chat
                    </Button>
                </GroupChatModal>
            </Box>
            <Box
                display="flex"
                flexDir="column"
                padding={3}
                bg="#F8F8F8"
                width="100%"
                height="100%"
                borderRadius="lg"
                overflowY="hidden"
            >
                <Modal isOpen={isOpen} onClose={reject}>
                    <ModalOverlay />
                    <ModalContent>
                        <ModalHeader>Modal Title</ModalHeader>
                        <ModalCloseButton />
                        <ModalBody>
                            {statement}
                        </ModalBody>

                        <ModalFooter>
                            <Button colorScheme='green' mr={3} onClick={accept}>
                                Accept
                            </Button>
                            <Button colorScheme='red' mr={3} onClick={reject}>
                                Reject
                            </Button>
                        </ModalFooter>
                    </ModalContent>
                </Modal>
                {chats ? (
                    <Stack>
                        {chats.map(chat => (
                            <ContextMenu
                                key={chat._id}
                                renderMenu={() => (
                                    <MenuList>
                                        <MenuItem onClick={() => changeMuteStatus(chat._id)}>
                                            {mutedChats.find(mutedChat => mutedChat._id === chat._id) ? 'Unmute' : 'Mute'}
                                        </MenuItem>
                                        <MenuDivider />
                                        <MenuItem>
                                            <div
                                                id={`d${chat._id}`}
                                                onClick={() => deleteChat(chat)}
                                            >
                                                Delete
                                            </div>
                                        </MenuItem>
                                    </MenuList>
                                )}
                            >
                                {
                                    ref =>
                                        <Box
                                            onClick={() => setSelectedChat(chat)}
                                            cursor="pointer"
                                            bg={selectedChat === chat ? '#38B2AC' : '#E8E8E8'}
                                            color={selectedChat === chat ? 'white' : 'black'}
                                            px={3}
                                            py={2}
                                            borderRadius="lg"
                                            onContextMenu={(e) => f(e)}
                                            ref={ref}
                                        >
                                            <Avatar
                                                mr={2}
                                                size="sm"
                                                cursor="pointer"
                                                name={getSender(loggedUser, chat.users, chat)}
                                                src={chat.isGroupChat ? 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQDZqg5vL6300Pfadt6T_PhpiYSXEn8gosMY-eE7k0FJczKzLA&s' : getSenderFull(loggedUser, chat.users, chat).pic}
                                                marginTop="6px"
                                            />
                                            <Box
                                                width="85%"
                                                display="inline-block"
                                            >
                                                {!chat.isGroupChat
                                                    ? getSender(loggedUser, chat.users, chat)
                                                    : chat.chatName}
                                                <LatestMessage currChat={chat} />
                                                {mutedChats.find(mutedChat => mutedChat._id === chat._id) &&
                                                    <GoMute
                                                        style={{ position: 'fixed', marginTop: '-35px', marginLeft: '-30px' }}
                                                    />
                                                }
                                            </Box>
                                        </Box>
                                }
                            </ContextMenu>
                        ))}
                    </Stack>
                ) : (
                    <ChatLoading />
                )}
            </Box>
        </Box>
        <GameInvitation />
        {playArenaVisibility && <PlayArena myTurn={myTurn} setMyTurn={setMyTurn} /> }
    </>
    );
};

export default MyChats;