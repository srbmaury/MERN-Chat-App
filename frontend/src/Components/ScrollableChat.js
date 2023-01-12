import { Avatar, Tooltip } from '@chakra-ui/react'
import React from 'react'
import ScrollableFeed from 'react-scrollable-feed'
import { formatDate, isFirstMessageofDay, isLastMessage, isSameSender, isSameSenderMargin } from '../config/ChatLogics'
import { ChatState } from '../Context/ChatProvider'

const ScrollableChat = ({ messages }) => {
    const { user, selectedChat } = ChatState();
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
                                        margin: 'auto'
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
                            <span
                                style={{
                                    backgroundColor: `${m.sender._id === user._id ? "#BEE3F8" : "#B9F5D0"
                                        }`,
                                    borderRadius: "20px",
                                    padding: "5px 15px",
                                    maxWidth: "75%",
                                    marginLeft: isSameSenderMargin(messages, m, i, user._id),
                                    marginTop: (isSameSender(messages, m, i) ? 3 : 10),
                                    left: 0,
                                    display: 'inline-block'
                                }}
                            >
                                {m.content}
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
