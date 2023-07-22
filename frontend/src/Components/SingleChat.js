import React, { useCallback, useEffect, useState } from 'react';
import { ChatState } from '../Context/ChatProvider';
import {
    Box,
    CircularProgress,
    CloseButton,
    FormControl,
    IconButton,
    Image,
    Input,
    InputGroup,
    InputRightElement,
    Spinner,
    Text,
    useToast,
} from '@chakra-ui/react';
import { ArrowBackIcon } from '@chakra-ui/icons';
import { getSender, getSenderFull } from '../config/ChatLogics';
import ProfileModal from './miscellaneous/ProfileModal';
import UpdateGroupChatModal from './miscellaneous/UpdateGroupChatModal';
import axios from 'axios';
import ScrollableChat from './ScrollableChat';
import animationData from '../animations/typing.json'

import io from 'socket.io-client';
import Lottie from 'react-lottie';
import { IoMdSend } from 'react-icons/io';
import { GrAttachment } from 'react-icons/gr';
import Upload from './miscellaneous/Cloudinary';
import ChangeWallpaper from './ChangeWallpaper';

const ENDPOINT = "http://localhost:5000";
var socket, selectedChatCompare;

const SingleChat = ({ fetchAgain, setFetchAgain }) => {
    const [messages, setMessages] = useState([]);
    const [loading, setLoading] = useState(false);
    const [sendPicLoading, setSendPicLoading] = useState(false);
    const [newMessage, setNewMessage] = useState('');
    const [socketConnected, setSocketConnected] = useState(false);
    const [typing, setTyping] = useState(false);
    const [istyping, setIsTyping] = useState(false);
    const [media, setMedia] = useState();
    const [changeWallpaperDisplay, setChangeWallpaperDisplay] = useState(false);
    const [wallPaper, setWallPaper] = useState();
    const [messageToReply, setMessageToReply] = useState();

    const toast = useToast();

    const defaultOptions = {
        loop: true,
        autoplay: true,
        animationData: animationData,
        rendererSettings: {
            preserveAspectRatio: "xMidYMid slice",
        },
    };

    const { user, selectedChat, setSelectedChat, notification, setNotification, setNewLatestMessage } = ChatState();

    useEffect(() => {
        setMessageToReply();
        setMedia();
    }, [selectedChat]);

    const fetchMessages = useCallback(async () => {
        if (!selectedChat) return;
        setLoading(true);
        try {
            const config = {
                headers: {
                    Authorization: `Bearer ${user.token}`,
                },
            };

            const { data } = await axios.get(
                `/api/message/${selectedChat._id}`,
                config
            );

            setMessages(data);
            setLoading(false);

            socket.emit('join chat', selectedChat._id);
        } catch (error) {
            console.log(error);
            toast({
                title: 'Error Occured!',
                description: error.response.data.message,
                status: 'error',
                duration: 5000,
                isClosable: true,
                position: 'bottom',
            });
        }
    }, [user.token, selectedChat, toast]);

    useEffect(() => {
        socket = io(ENDPOINT);
        socket.emit("setup", user);
        socket.on('connected', () => setSocketConnected(true));
        socket.on('typing', () => setIsTyping(true));
        socket.on('stop typing', () => setIsTyping(false));
    }, [user]);

    useEffect(() => {
        fetchMessages();
        selectedChatCompare = selectedChat;
        if (selectedChat) {
            selectedChat.wallPaper.forEach(w => {
                if (w.userId === user._id) {
                    setWallPaper(w.wallpaperUrl);
                    return;
                }
            });
        }
    }, [user._id, selectedChat, fetchMessages]);

    useEffect(() => {
        socket.on('message received', (newMessageReceived) => {
            if (!selectedChatCompare || selectedChatCompare._id !== newMessageReceived.chat._id) {
                let mutedChats = JSON.parse(localStorage.getItem("mutedChats")) || [];
                if (mutedChats.includes(newMessageReceived.chat._id)) return;
                if (!notification.includes(newMessageReceived)) {
                    setNotification([newMessageReceived, ...notification]);
                    setFetchAgain(!fetchAgain);
                }
            } else {
                setMessages([...messages, newMessageReceived]);
            }
        });
    });

    const handleClick = async event => {
        if (event.key === 'Enter')
            sendMessage();
    }

    const sendMessage = async event => {
        if (newMessage || media) {
            socket.emit('stop typing', selectedChat._id);
            try {
                const config = {
                    headers: {
                        'Content-type': 'application/json',
                        Authorization: `Bearer ${user.token}`,
                    },
                };

                setNewMessage('');
                setMedia();
                setMessageToReply()
                const { data } = await axios.post(
                    '/api/message',
                    {
                        content: newMessage,
                        chatId: selectedChat._id,
                        media: media,
                        messageId: messageToReply && messageToReply._id
                    },
                    config
                );

                socket.emit('new message', data);
                setNewLatestMessage(data);
                setMessages([...messages, data]);
            } catch (error) {
                toast({
                    title: 'Error Occured!',
                    description: 'Failed to send the Message',
                    status: 'error',
                    duration: 5000,
                    isClosable: true,
                    position: 'bottom',
                });
            }
        }
    };

    const typingHandler = e => {
        setNewMessage(e.target.value);

        // typing indicator logic
        if (!socketConnected) return;

        if (!typing) {
            setTyping(true);
            socket.emit('typing', selectedChat._id);
        }

        let lastTypingTime = new Date().getTime();
        var timerLength = 3000;
        setTimeout(() => {
            var timeNow = new Date().getTime();
            var timeDiff = timeNow - lastTypingTime;
            if (timeDiff >= timerLength && typing) {
                socket.emit('stop typing', selectedChat._id);
                setTyping(false);
            }
        }, timerLength);
    };

    const changeWallpaper = async (e) => {
        e.preventDefault();
        if (e.target.tagName === 'DIV')
            setChangeWallpaperDisplay(true);
    }
    return (
        <>
            {changeWallpaperDisplay && <ChangeWallpaper setChangeWallpaperDisplay={setChangeWallpaperDisplay} setWallPaper={setWallPaper} chatId={selectedChat._id} />}

            {selectedChat ? (
                <>
                    <Text
                        fontSize={{ base: '28px', md: '30px' }}
                        pb={3}
                        px={2}
                        width="100%"
                        fontFamily="Work sans"
                        display="flex"
                        justifyContent={{ base: 'space-between' }}
                        alignItems="center"
                    >
                        <IconButton
                            display={{ base: 'flex', md: 'none' }}
                            icon={<ArrowBackIcon />}
                            onClick={() => setSelectedChat('')}
                        />
                        {!selectedChat.isGroupChat ? (
                            <>
                                {getSender(user, selectedChat.users)}
                                <ProfileModal user={getSenderFull(user, selectedChat.users)} />
                            </>
                        ) : (
                            <>
                                {selectedChat.chatName.toUpperCase()}
                                <UpdateGroupChatModal
                                    fetchAgain={fetchAgain}
                                    setFetchAgain={setFetchAgain}
                                />
                            </>
                        )}
                    </Text>
                    <Box
                        display={'flex'}
                        flexDir="column"
                        justifyContent={'flex-end'}
                        padding={3}
                        bg={wallPaper && wallPaper.startsWith('#') ? wallPaper : '#E0E0E0'}
                        backgroundImage={wallPaper && !wallPaper.startsWith('#') ? `url(${wallPaper})` : 'none'}
                        backgroundSize="cover"
                        width={'100%'}
                        height={'100%'}
                        borderRadius="lg"
                        overflowY={'hidden'}
                        onContextMenu={e => changeWallpaper(e)}
                    >
                        {loading ? (
                            <Spinner
                                size="xl"
                                width={20}
                                height={20}
                                alignSelf="center"
                                margin="auto"
                            />
                        ) : (
                            <div className='messages'>
                                <ScrollableChat messages={messages} setMessages={setMessages} messageToReply={messageToReply} setMessageToReply={setMessageToReply} />
                            </div>
                        )}
                        {messageToReply &&
                            <Box
                                width="100%"
                                height="70px"
                                borderRadius="10px"
                                display="flex"
                                alignItems="center"
                                justifyContent="space-between"
                                backgroundColor="blue.500"
                                padding="5px"
                            >
                                <span
                                    style={{
                                        display: "flex",
                                        justifyContent: "flex-start",
                                    }}
                                >
                                    {messageToReply.media && messageToReply.media !== "" &&
                                        <Image
                                            src={messageToReply.media}
                                            boxSize="60px"
                                            borderRadius="50%"
                                            marginRight="10px" />}
                                    {messageToReply.content && messageToReply.content !== "" ?
                                        <Text
                                            fontSize={20}
                                            color="white"
                                        >
                                            {messageToReply.content.length > 50 ? messageToReply.content.slice(0, 47) + "..." : messageToReply.content}
                                        </Text> : "Image"}
                                </span>
                                <CloseButton
                                    size="sm"
                                    top="5px"
                                    right="5px"
                                    float="right"
                                    onClick={() => setMessageToReply()}
                                />
                            </Box>
                        }
                        {media &&
                            <Box
                                width="100%"
                                height="70px"
                                borderRadius="10px"
                                display="flex"
                                alignItems="center"
                                justifyContent="flex-start"
                                backgroundColor="blue.500"
                                padding="5px"
                            >
                                <Image src={media} boxSize="60px" borderRadius="50%" marginRight="10px" />
                                <Box color="white" fontSize="18px" fontWeight="bold">
                                    Image
                                </Box>
                            </Box>
                        }
                        <FormControl onKeyDown={handleClick} isRequired mt={3}>
                            {istyping ?
                                <div>
                                    <Lottie
                                        options={defaultOptions}
                                        width={70}
                                        style={{ marginBottom: 15, marginLeft: 0 }}
                                    />
                                </div>
                                : <></>}
                            <InputGroup>
                                <Input
                                    variant="filled"
                                    bg="#E0E0E0"
                                    placeholder="Enter a message..."
                                    onChange={typingHandler}
                                    value={newMessage}
                                    width="calc(100% - 4.5rem)"
                                />
                                <InputRightElement width="4.5rem">
                                    <label htmlFor="fileInput">
                                        <GrAttachment size={20} color="#004D40" cursor="pointer" style={{ marginRight: '10px' }} />
                                    </label>
                                    <Input type="file" id="fileInput" onChange={(e) => Upload(e.target.files[0], setMedia, setSendPicLoading)} sx={{ display: "none" }} />
                                    {sendPicLoading ? (
                                        <CircularProgress isIndeterminate size="30px" color="#004D40" />
                                    ) : (
                                        <IoMdSend
                                            size={30}
                                            color="#004D40"
                                            cursor="pointer"
                                            onClick={sendMessage}
                                        />
                                    )}
                                </InputRightElement>
                            </InputGroup>
                        </FormControl>
                    </Box>
                </>
            ) : (
                <Box
                    display="flex"
                    alignItems="center"
                    justifyContent="center"
                    height="100%"
                >
                    <Text fontSize="3xl" pb={3} fontFamily="Work sans">
                        Click on a user to start chatting
                    </Text>
                </Box>
            )}
        </>
    );
};

export default SingleChat;