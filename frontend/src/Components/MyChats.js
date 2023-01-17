import { Avatar, Box, Button, Stack, Text, useToast } from '@chakra-ui/react';
import React, { useCallback, useEffect, useState } from 'react';
import { ChatState } from '../Context/ChatProvider';
import axios from 'axios';
import { AddIcon, DeleteIcon } from '@chakra-ui/icons';
import ChatLoading from './ChatLoading';
import { getSender, getSenderFull } from '../config/ChatLogics';
import GroupChatModal from './miscellaneous/GroupChatModal';
import LatestMessage from './LatestMessage';
import io from 'socket.io-client';

const ENDPOINT = "http://localhost:5000";
var socket;
const MyChats = ({ fetchAgain }) => {
  const [loggedUser, setLoggedUser] = useState();
  const [prevSelectedChat, setPrevSelectedChat] = useState();

  const { selectedChat, setSelectedChat, user, chats, setChats } = ChatState();

  const toast = useToast();

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
  },[user, setChats, toast]);

  useEffect(() => {
    try {
      setLoggedUser(JSON.parse(localStorage.getItem('userInfo')));
      fetchChats();
    } catch (error) {

    }
  }, [fetchAgain, fetchChats]);

  const f = (e, chatId) => {
    e.preventDefault();
    setPrevSelectedChat(selectedChat);
    let delete_icon = document.getElementById(`d${chatId}`);
    (delete_icon.style.display === 'block') ? (delete_icon.style.display = 'none') : (delete_icon.style.display = 'block')
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

  return (
    <Box
      display={{ base: selectedChat ? 'none' : 'flex', md: 'flex' }}
      flexDir="column"
      alignItems="center"
      padding={3}
      backgroundColor="white"
      width={{ base: '100%', md: '31%' }}
      borderRadius="lg"
      borderWidth="1px"
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
        {chats ? (
          <Stack overflowY={'scroll'}>
            {chats.map(chat => (
              <Box
                onClick={() => setSelectedChat(chat)}
                cursor="pointer"
                bg={selectedChat === chat ? '#38B2AC' : '#E8E8E8'}
                color={selectedChat === chat ? 'white' : 'black'}
                px={3}
                py={2}
                borderRadius="lg"
                key={chat._id}
                onContextMenu={(e) => f(e, chat._id)}
              >
                <Avatar
                  mr={2}
                  size="sm"
                  cursor="pointer"
                  name={getSender(loggedUser, chat.users, chat)}
                  src={getSenderFull(loggedUser, chat.users, chat).pic}
                  marginTop="6px"
                />
                <Box
                  maxWidth="90%"
                  display="inline-block"
                >
                  <Text>
                    {!chat.isGroupChat
                      ? getSender(loggedUser, chat.users, chat)
                      : chat.chatName}
                  </Text>
                  <Text>
                    <LatestMessage currChat={chat} />
                  </Text>
                </Box>
                <DeleteIcon
                  id={`d${chat._id}`}
                  display="none"
                  float="right"
                  marginTop="15px"
                  boxSize="20px"
                  color="red"
                  onClick={() => deleteChat(chat)}
                />
              </Box>
            ))}
          </Stack>
        ) : (
          <ChatLoading />
        )}
      </Box>
    </Box>
  );
};

export default MyChats;