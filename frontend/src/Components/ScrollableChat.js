import { Avatar, Tooltip, useToast } from '@chakra-ui/react'
import { DeleteIcon } from '@chakra-ui/icons'
import React, { useEffect, useState } from 'react'
import ScrollableFeed from 'react-scrollable-feed'
import { formatDate, isFirstMessageofDay, isLastMessage, isSameSender, isSameSenderMargin } from '../config/ChatLogics'
import { ChatState } from '../Context/ChatProvider'
import axios from 'axios'
import io from 'socket.io-client';
import { CgMailForward } from 'react-icons/cg';
import ForwardModal from './miscellaneous/ForwardModal'

const ENDPOINT = "http://localhost:5000";
var socket;

const ScrollableChat = ({ messages, setMessages }) => {
    const { user, selectedChat } = ChatState();
    const [currY, setCurrY] = useState(400);

    const toast = useToast();

    useEffect(() => {
        socket = io(ENDPOINT);
        socket.emit("setup", user);
    }, [user]);

    const displayDeleteIcon = (id) => {
        id = 'delete' + id;
        const icon = document.getElementById(id);
        icon.style.display === 'block' ?
            icon.style.display = 'none' :
            icon.style.display = 'block';
    };

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

    useEffect(() => {
        const mouseMoveEvent = (e) => {
            setCurrY(e.clientY);
        };
        window.addEventListener('mousemove', mouseMoveEvent);
    }, []);

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
                        {m.sender._id === user._id &&
                            <DeleteIcon
                                color='red'
                                cursor='pointer'
                                marginTop={5}
                                float='right' display={'none'} id={`delete${m._id}`}
                                onClick={() => deleteMessage(m)}
                            />
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
                            <span id={`span${m._id}`}
                                style={{
                                    backgroundColor: `${m.sender._id === user._id ? "#BEE3F8" : "#B9F5D0"}`,
                                    borderRadius: "20px",
                                    padding: "5px 15px",
                                    maxWidth: "75%",
                                    marginLeft: isSameSenderMargin(messages, m, i, user._id),
                                    marginTop: (isSameSender(messages, m, i) ? 3 : 10),
                                    left: 0,
                                    display: 'inline-block',
                                }}
                                onDoubleClick={() => displayDeleteIcon(m._id)}
                            >
                                <ForwardModal content={m.content} messages={messages} setMessages={setMessages}>
                                {
                                    document.getElementById(`span${m._id}`) && currY >= document.getElementById(`span${m._id}`).getBoundingClientRect().top && currY <= document.getElementById(`span${m._id}`).getBoundingClientRect().bottom &&
                                    <span style={{
                                        position:'absolute',
                                        marginLeft: '-44px',
                                        cursor: 'pointer',
                                        fontSize:'30px',
                                        top:document.getElementById(`span${m._id}`).getBoundingClientRect().top
                                    }}
                                    >
                                        {
                                            m.sender._id === user._id &&
                                            <CgMailForward />
                                        }
                                    </span>
                                }
                                </ForwardModal>
                                {m.content}
                                <ForwardModal content={m.content} messages={messages} setMessages={setMessages}>
                                {
                                    document.getElementById(`span${m._id}`) && currY >= document.getElementById(`span${m._id}`).getBoundingClientRect().top && currY <= document.getElementById(`span${m._id}`).getBoundingClientRect().bottom &&
                                    <span style={{
                                        position:'absolute',
                                        marginLeft: '44px',
                                        cursor: 'pointer',
                                        fontSize:'30px',
                                        top:document.getElementById(`span${m._id}`).getBoundingClientRect().top
                                    }}
                                    >
                                        {
                                            m.sender._id !== user._id &&
                                            <CgMailForward />
                                        }
                                    </span>
                                }
                                </ForwardModal>
                                <span
                                    style={{ fontSize: '10px', marginLeft: '4px', color: '#555' }}>
                                    {m.createdAt.toString().slice(11, 16)}
                                </span>
                            </span>
                        </div>
                    </span>
                ))}
            </>
        </ScrollableFeed>
    )
}

export default ScrollableChat