import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ChatState } from '../Context/ChatProvider';
import {
    Box,
    Button,
    CircularProgress,
    CloseButton,
    FormControl,
    Icon,
    IconButton,
    Image,
    Input,
    InputGroup,
    InputLeftAddon,
    InputRightAddon,
    Modal,
    ModalBody,
    ModalCloseButton,
    ModalContent,
    ModalFooter,
    ModalHeader,
    ModalOverlay,
    Spinner,
    Text,
    Textarea,
    useDisclosure,
    useMediaQuery,
    useToast,
} from '@chakra-ui/react';
import { ArrowBackIcon } from '@chakra-ui/icons';
import { getSender, getSenderFull } from '../config/ChatLogics';
import ProfileModal from './miscellaneous/ProfileModal';
import UpdateGroupChatModal from './miscellaneous/UpdateGroupChatModal';
import axios from 'axios';
import ScrollableChat from './ScrollableChat';
import { getSocket } from '../config/socket';
import { IoMdSend } from 'react-icons/io';
import { GrAttachment } from 'react-icons/gr';
import Upload from './miscellaneous/Cloudinary';
import ChangeWallpaper from './ChangeWallpaper';
import EmojiPicker from './EmojiPicker';
import { FaSmile } from 'react-icons/fa';

var socket, selectedChatCompare;

const SingleChat = ({ fetchAgain, setFetchAgain }) => {
    const [messages, setMessages] = useState([]);
    const [loading, setLoading] = useState(false);
    const [sendPicLoading, setSendPicLoading] = useState(false);
    const [newMessage, setNewMessage] = useState('');
    const [socketConnected, setSocketConnected] = useState(false);
    const [typing, setTyping] = useState(false);
    const [istyping, setIsTyping] = useState(false);
    const [media, setMedia] = useState('');
    const [changeWallpaperDisplay, setChangeWallpaperDisplay] = useState(false);
    const [wallPaper, setWallPaper] = useState();
    const [messageToReply, setMessageToReply] = useState('');
    const [emojiDisplay, setEmojiDisplay] = useState(false);
    const toast = useToast();
    const inputRef = useRef(null);
    const [isLargerThanMobile] = useMediaQuery("(min-width: 768px)");
    const [ModalTitle, setModalTitle] = useState();
    const [foulMessage, setFoulMessage] = useState('');
    const { isOpen, onOpen, onClose } = useDisclosure();

    const { user, selectedChat, setSelectedChat, notification, setNotification, setNewLatestMessage, setGameStatus, setGameRequestTime } = ChatState();

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
        socket = getSocket(user.token);
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
        const onMessageReceived = (newMessageReceived) => {
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
        };
        socket?.on('message received', onMessageReceived);
        return () => socket?.off('message received', onMessageReceived);
    }, [fetchAgain, messages, notification, setFetchAgain, setNotification]);

    const sendMessage = async event => {
        if (newMessage === '/play' && !selectedChat.isGroupChat) {
            socket.emit('play request', selectedChat, user);
            setGameStatus(true);
            setGameRequestTime(new Date());
            setNewMessage('');
            return;
        }
        if (newMessage || media) {
            socket.emit('stop typing', selectedChat._id);
            setFoulMessage(newMessage);
            try {
                const config = {
                    headers: {
                        'Content-type': 'application/json',
                        Authorization: `Bearer ${user.token}`,
                    },
                };
                setNewMessage('');
                setMedia('');
                setMessageToReply('');
                const response = await axios.post(
                    '/api/message',
                    {
                        content: newMessage,
                        chatId: selectedChat._id,
                        media: media,
                        messageId: messageToReply && messageToReply._id
                    },
                    config
                );
                const { data } = response;
                const moderationCategory = response.headers['x-moderation-category'];
                if (moderationCategory && moderationCategory !== 'Neither') {
                    setModalTitle(moderationCategory);
                    onOpen();
                } else {
                    setFoulMessage('');
                }

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

    const submitForReview = async event => {
        try {
            const config = {
                headers: {
                    'Content-type': 'application/json',
                    Authorization: `Bearer ${user.token}`,
                },
            };
            await axios.post('/api/user/submitForReview', { foulMessage }, config);
            toast({
                title: 'Submitted for Review',
                status: 'success',
                duration: 5000,
                isClosable: true,
                position: 'bottom',
            });
            onClose();
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
            onClose();
        }
    }

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

    const handleEmojiClick = () => {
        setEmojiDisplay(!emojiDisplay);
    };

    useEffect(() => {
        setNewMessage('');
        setMedia('');
        setMessageToReply('');
        setEmojiDisplay(false);
    }, [selectedChat]);

    return (
        <>
            {changeWallpaperDisplay && <ChangeWallpaper setChangeWallpaperDisplay={setChangeWallpaperDisplay} setWallPaper={setWallPaper} chatId={selectedChat._id} />}

            {selectedChat ? (
                <>
                    <Box
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
                                <Box>
                                    {getSender(user, selectedChat.users)}
                                    {getSenderFull(user, selectedChat.users)?.isBot && (
                                        <Text as="span" ml={2} fontSize="xs" color="teal.500">AI</Text>
                                    )}
                                </Box>
                                {getSenderFull(user, selectedChat.users) && (
                                    <ProfileModal user={getSenderFull(user, selectedChat.users)} />
                                )}
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
                    </Box>
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
                                <ScrollableChat messages={messages} setMessages={setMessages} setNewMessage={setNewMessage} setMessageToReply={setMessageToReply} inputRef={inputRef} />
                            </div>
                        )}
                        {messageToReply &&
                            <Box
                                width="100%"
                                height="70px"
                                borderTopRadius="10px"
                                display="flex"
                                alignItems="center"
                                justifyContent="space-between"
                                backgroundColor="blue.400"
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
                                            color="white"
                                            fontSize="18px"
                                            fontWeight="bold"
                                        >
                                            {messageToReply.content.length > 50 ? messageToReply.content.slice(0, 47) + "..." : messageToReply.content}
                                        </Text> : "Image"}
                                </span>
                                <CloseButton
                                    size="sm"
                                    top="5px"
                                    right="5px"
                                    float="right"
                                    onClick={() => setMessageToReply('')}
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
                                justifyContent="space-between"
                                backgroundColor="blue.500"
                                padding="5px"
                            >
                                <Box display="flex" justifyContent="flex-start">
                                    <Image src={media} boxSize="60px" borderRadius="50%" marginRight="10px" />
                                    <Box color="white" fontSize="18px" fontWeight="bold">
                                        Image
                                    </Box>
                                </Box>
                                <CloseButton
                                    size="sm"
                                    top="5px"
                                    right="5px"
                                    float="right"
                                    onClick={() => setMedia('')}
                                />
                            </Box>
                        }
                        <Box position="relative" width="100%">
                            {emojiDisplay &&
                                <EmojiPicker
                                    setEmojiDisplay={setEmojiDisplay}
                                    newMessage={newMessage}
                                    setNewMessage={setNewMessage}
                                    inputRef={inputRef}
                                />
                            }
                            <FormControl isRequired mt={3}>
                            {istyping ?
                                <div>
                                    <Text fontSize="sm" color="gray.500" mb={2}>Typing…</Text>
                                </div>
                                : <></>}
                            <InputGroup>
                                {isLargerThanMobile && <Box
                                    display="flex"
                                    flexDir="column"
                                >
                                    <InputLeftAddon style={{ width: '20px', height: (newMessage.split('\n').length - 1) * 20 + 'px', maxHeight: "160px", backgroundColor: "transparent", borderColor: "transparent" }} cursor="pointer">
                                        <span ></span>
                                    </InputLeftAddon>
                                    <InputLeftAddon
                                        as="button"
                                        type="button"
                                        aria-label="Open emoji picker"
                                        pointerEvents="auto"
                                        cursor="pointer"
                                        onClick={handleEmojiClick}
                                    >
                                        <Icon as={FaSmile} color="gray.500" />
                                    </InputLeftAddon>
                                </Box>}
                                <Textarea
                                    variant="filled"
                                    bg="#E0E0E0"
                                    placeholder="Enter a message..."
                                    onChange={typingHandler}
                                    value={newMessage}
                                    resize="none"
                                    overflowY={{ base: 'hidden', lg: 'auto' }}
                                    width="100%"
                                    id="main-input-field"
                                    ref={inputRef}
                                    style={{
                                        height: (newMessage.split('\n').length * 20 + 22) + 'px',
                                        minHeight: '40px',
                                        maxHeight: '200px',
                                    }}
                                />
                                <Box
                                    display="flex"
                                    flexDir="column"
                                >
                                    <InputRightAddon style={{ width: '20px', height: (newMessage.split('\n').length - 1) * 20 + 'px', maxHeight: "160px", backgroundColor: "transparent", borderColor: "transparent" }} cursor="pointer">
                                        <span ></span>
                                    </InputRightAddon>
                                    <Box
                                        display="flex"
                                        flexDir="initial"
                                    >
                                        <InputRightAddon backgroundColor="transparent" borderColor="transparent">
                                            <label htmlFor="fileInput">
                                                <GrAttachment size={20} color="#004D40" cursor="pointer" />
                                            </label>
                                            <Input type="file" id="fileInput" onChange={(e) => Upload(e.target.files[0], setMedia, setSendPicLoading)} sx={{ display: "none" }} />
                                        </InputRightAddon>
                                        <InputRightAddon
                                            as="button"
                                            type="button"
                                            aria-label="Send message"
                                            onClick={sendMessage}
                                        >
                                            {sendPicLoading ? (
                                                <CircularProgress isIndeterminate size="30px" color="#004D40" />
                                            ) : (
                                                <IoMdSend
                                                    color="#004D40"
                                                    cursor="pointer"
                                                />
                                            )}
                                        </InputRightAddon>
                                    </Box>
                                </Box>
                            </InputGroup>
                            </FormControl>
                        </Box>
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
            <Modal isOpen={isOpen} onClose={onClose}>
                <ModalOverlay />
                <ModalContent>
                    <ModalHeader>{ModalTitle} Detected</ModalHeader>
                    <ModalCloseButton />
                    <ModalBody>
                        Your account may be blocked if such repeated contents are detected.<br />
                        If you believe there was a mistake, please submit for review.<br />
                        Please note unless you click on Submit for Review button, this will not be seen by any member of our team.
                    </ModalBody>

                    <ModalFooter>
                        <Button variant='ghost' onClick={submitForReview}>Submit for Review</Button>
                    </ModalFooter>
                </ModalContent>
            </Modal>
        </>
    );
};

export default SingleChat;
