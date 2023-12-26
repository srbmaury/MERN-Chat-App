import { Avatar, Box, Image, MenuDivider, MenuItem, MenuList, Text, Tooltip, useToast } from '@chakra-ui/react'
import React, { useState, useEffect } from 'react'
import ScrollableFeed from 'react-scrollable-feed'
import { formatDate, isFirstMessageofDay, isLastMessage, isSameSender, isSameSenderMargin } from '../config/ChatLogics'
import { ChatState } from '../Context/ChatProvider'
import axios from 'axios'
import io from 'socket.io-client';
import ForwardModal from './miscellaneous/ForwardModal'
import { ContextMenu } from 'chakra-ui-contextmenu'
import '../App.css'

const ENDPOINT = "https://mern-chat-app-hs5n.onrender.com";
var socket;

const ScrollableChat = ({ messages, setMessages, setNewMessage, setMessageToReply, inputRef }) => {
    const { user, selectedChat } = ChatState();
    const [forwardModalOpen, setForwardModalOpen] = useState(false);
    const toast = useToast();

    useEffect(() => {
        socket = io(ENDPOINT);
        socket.emit("setup", user);
    }, [user]);

    const deleteMessage = async (message) => {
        const messageId = message._id;
        try {
            const config = {
                headers: {
                    'Content-type': 'application/json',
                    Authorization: `Bearer ${user.token}`,
                },
            };
            const { data } = await axios.delete(`/api/message/${messageId}`, config);
            const chat = data.chat;
            socket.emit('deleted message', chat, message);
            setMessages(messages.filter(m => m._id !== messageId));
        } catch (error) {
            toast({
                title: 'Error Occured!',
                description: 'Failed to delete the Message',
                status: 'error',
                duration: 5000,
                isClosable: true,
                position: 'bottom',
            });
        }
    }

    useEffect(() => {
        socket.on('new latest message', (particularChat, message) => {
            if (user._id !== message.sender._id && selectedChat._id === particularChat._id) {
                setMessages(messages.filter(m => m._id !== message._id));
            }
        });
    });

    const scroll = (id) => {
        const targetSpan = document.getElementById(id);
        if (targetSpan) {
            targetSpan.scrollIntoView({ behavior: 'smooth' });
            targetSpan.parentElement.style.backgroundColor = '#D3D3D3';
            targetSpan.parentElement.style.borderRadius = '15px';

            setTimeout(function () {
                targetSpan.parentElement.style.backgroundColor = '';
                targetSpan.parentElement.style.borderRadius = '';
            }, 2000);
        }
    }

    const SmartReply = async m => {
        const content = m.content;
        if (!content) {
            toast({
                title: 'Error Occured!',
                description: 'Can\'t reply to Image-only messages',
                status: 'error',
                duration: 5000,
                isClosable: true,
                position: 'bottom',
            });
            return;
        }
        setMessageToReply(m);
        try {
            const config = {
                headers: {
                    'Content-type': 'application/json',
                    Authorization: `Bearer ${user.token}`,
                },
            };
            const { data } = await axios.post(`/api/openai/smartReply`, { content }, config);
            setNewMessage(data.smartReply);
            inputRef.current.focus();
        } catch (error) {
            toast({
                title: 'Error Occured!',
                description: 'Failed to generate smart reply',
                status: 'error',
                duration: 5000,
                isClosable: true,
                position: 'bottom',
            });
        }
    }
    return (
        <ScrollableFeed>
            <>
                {selectedChat.isGroupChat &&
                    <div style={{ height: '40px' }}>
                        <div
                            style={{
                                maxWidth: 'max-content',
                                height: '30px',
                                fontSize: '15px',
                                padding: '5px 10px',
                                borderRadius: '7px',
                                backgroundColor: 'rgb(219, 219, 244)',
                                textAlign: 'center',
                                margin: 'auto'
                            }}
                        >
                            {(user._id !== selectedChat.groupAdmin._id) ? <>{selectedChat.groupAdmin.name} added you to this group</> : "You created this group"}
                        </div>
                    </div>
                }

                {messages && messages.map((m, i) => (
                    <ForwardModal key={m._id} content={m.content} media={m.media} messages={messages} setMessages={setMessages} forwardModalOpen={forwardModalOpen} setForwardModalOpen={setForwardModalOpen}>
                        <span key={m._id}>
                            {
                                isFirstMessageofDay(messages, m, i) &&
                                <div style={{ height: '40px' }}>
                                    <div
                                        style={{
                                            maxWidth: 'max-content',
                                            height: '30px',
                                            fontSize: '15px',
                                            padding: '5px 10px',
                                            borderRadius: '7px',
                                            backgroundColor: 'rgb(219, 219, 244)',
                                            textAlign: 'center',
                                            margin: '10px auto'
                                        }}
                                    >
                                        {formatDate(m.createdAt.toString())}
                                    </div>
                                </div>
                            }
                            <div style={{ display: 'flex' }}>
                                {
                                    (isSameSender(messages, m, i, user._id)
                                        || isLastMessage(messages, i, user._id)
                                    ) && (
                                        <Tooltip
                                            label={m.sender.name}
                                            placement="bottom-start"
                                            hasArrow
                                        >
                                            <Avatar
                                                mt="7px"
                                                mr={1}
                                                size="sm"
                                                cursor="pointer"
                                                name={m.sender.name}
                                                src={m.sender.pic}
                                            />
                                        </Tooltip>
                                    )
                                }
                                <ContextMenu
                                    key={m._id}
                                    renderMenu={() => (
                                        <MenuList>
                                            <MenuItem onClick={() => { setMessageToReply(m); inputRef.current.focus(); }} >
                                                Reply
                                            </MenuItem>
                                            {m.sender._id !== user._id && <span><MenuDivider />
                                                <MenuItem>
                                                    <div
                                                        onClick={() => SmartReply(m)}
                                                    >
                                                        Smart Reply
                                                    </div>
                                                </MenuItem>
                                            </span>}
                                            <MenuDivider />
                                            <MenuItem onClick={() => setForwardModalOpen(true)}>
                                                Forward
                                            </MenuItem>
                                            {m.sender._id === user._id && <span><MenuDivider />
                                                <MenuItem>
                                                    <div
                                                        id={`d${m._id}`}
                                                        onClick={() => deleteMessage(m)}
                                                    >
                                                        Delete
                                                    </div>
                                                </MenuItem>
                                            </span>}
                                        </MenuList>
                                    )}
                                >
                                    {
                                        ref =>
                                            <span id={`span${m._id}`}
                                                style={{
                                                    backgroundColor: `${m.sender._id === user._id ? "#BEE3F8" : "#B9F5D0"}`,
                                                    borderRadius: "20px",
                                                    padding: "5px 15px",
                                                    maxWidth: m.media ? 200 : "75%",
                                                    marginLeft: isSameSenderMargin(messages, m, i, user._id),
                                                    marginTop: (isSameSender(messages, m, i) ? 3 : 10),
                                                    left: 0,
                                                    display: 'inline-block',
                                                }}
                                                onContextMenu={e => e.preventDefault()}
                                                ref={ref}
                                            >

                                                {m.isReplyTo && (
                                                    <Box
                                                        onClick={() => scroll(`span${m.isReplyTo._id}`)}
                                                        style={{
                                                            display: "flex",
                                                            flexDirection: "row",
                                                            alignItems: "center",
                                                            borderLeft: "3px solid #ccc",
                                                            backgroundColor: user && m.isReplyTo.sender !== user._id ? "#DDFFE8" : "#C4E6F9",
                                                            paddingLeft: "10px",
                                                            cursor: "pointer",
                                                            borderRadius: "5px"
                                                        }}
                                                    >
                                                        {m.isReplyTo.media && (
                                                            <Avatar src={m.isReplyTo.media} marginRight={3} />
                                                        )}
                                                        <Text
                                                            margin={2}
                                                        >
                                                            {m.isReplyTo.content ? (m.isReplyTo.content.length > 50
                                                                ? m.isReplyTo.content.slice(0, 47) + "..."
                                                                : m.isReplyTo.content)
                                                                : "Image"}
                                                        </Text>
                                                    </Box>
                                                )}
                                                {m.media && <Image src={m.media} boxSize={200} alt="Image" />}
                                                {m.content && m.content}
                                                <span
                                                    style={{ fontSize: '10px', marginLeft: '4px', color: '#555' }}>
                                                    {m.createdAt.toString().slice(11, 16)}
                                                </span>
                                            </span>
                                    }
                                </ContextMenu>
                            </div>
                        </span>
                    </ForwardModal>
                ))
                }
            </>
        </ScrollableFeed >
    )
}

export default ScrollableChat