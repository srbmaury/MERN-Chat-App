import { Avatar, Modal, ModalBody, ModalCloseButton, ModalContent, ModalHeader, ModalOverlay, useDisclosure, useToast } from "@chakra-ui/react";
import axios from "axios";
import { getSender, getSenderFull } from "../../config/ChatLogics";
import { ChatState } from '../../Context/ChatProvider';
import { useEffect } from 'react';

const ForwardModal = ({ children, content, media, messages, setMessages, forwardModalOpen, setForwardModalOpen }) => {
    const { isOpen, onOpen, onClose } = useDisclosure();
    const { user, chats, selectedChat, setChats, setNewLatestMessage } = ChatState();
    const toast = useToast();

    const forwardMessage = async chatId => {
        try {
            const config = {
                headers: {
                    'Content-type': 'application/json',
                    Authorization: `Bearer ${user.token}`,
                },
            };

            const { data } = await axios.post(
                '/api/message',
                {
                    content: content,
                    media: media,
                    chatId: chatId,
                },
                config
            );

            if (selectedChat?._id === chatId) {
                setMessages([...messages, data]);
            }
            setNewLatestMessage(data);
            const chatToSetToTop = chats.find(chat => chat._id === chatId);
            const updatedChats = [chatToSetToTop, ...chats.filter(chat => chat._id !== chatId)];
            setChats(updatedChats);
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
        onClose();
        setForwardModalOpen(false);
    };

    useEffect(() => {
        if (forwardModalOpen) {
            onOpen();
        }
    }, [forwardModalOpen, onOpen]);

    const closeModal = () => {
        onClose();
        setForwardModalOpen(false);
    };

    return (
        <>
            <span>{children}</span>
            <Modal isOpen={isOpen} onClose={closeModal}>
                <ModalOverlay />
                <ModalContent>
                    <ModalHeader>Forward to..</ModalHeader>
                    <ModalCloseButton />
                    <ModalBody>
                        {chats.map(c => (
                            <div
                                key={c._id}
                                style={{
                                    marginBottom: '10px',
                                    cursor: 'pointer'
                                }}
                                onClick={() => forwardMessage(c._id)}
                            >
                                <Avatar
                                    mr={2}
                                    size="sm"
                                    cursor="pointer"
                                    name={getSender(user, c.users, c)}
                                    src={c.isGroupChat ? 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQDZqg5vL6300Pfadt6T_PhpiYSXEn8gosMY-eE7k0FJczKzLA&s' : getSenderFull(user, c.users, c)?.pic}
                                />
                                {c.isGroupChat ? c.chatName : getSender(user, c.users)}
                            </div>
                        ))}
                    </ModalBody>
                </ModalContent>
            </Modal>
        </>
    );
}

export default ForwardModal;
