import React, { useCallback, useEffect, useState } from 'react';
import { useDisclosure } from '@chakra-ui/hooks';
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  Button,
  IconButton,
  useToast,
  Box,
  FormControl,
  Input,
  Spinner,
} from '@chakra-ui/react';
import { ViewIcon } from '@chakra-ui/icons';
import { ChatState } from '../../Context/ChatProvider';
import UserBadgeItem from './../UserAvatar/UserBadgeItem';
import axios from 'axios';
import UserListItem from '../UserAvatar/UserListItem';

const UpdateGroupChatModal = ({ fetchAgain, setFetchAgain }) => {
  const { isOpen, onOpen, onClose } = useDisclosure();

  const [groupChatName, setGroupChatName] = useState('');
  const [search, setSearch] = useState('');
  const [searchResult, setSearchResult] = useState([]);
  const [loading, setLoading] = useState(false);
  const [renameloading, setRenameLoading] = useState(false);
  const toast = useToast();
  const { selectedChat, setSelectedChat, user } = ChatState();

  const handleAddUser = async user1 => {
    if (selectedChat.users.find(u => u._id === user1._id)) {
      toast({
        title: 'User Already in group!',
        status: 'error',
        duration: 5000,
        isClosable: true,
        position: 'bottom',
      });
      return;
    }

    try {
      setLoading(true);
      const config = {
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
      };
      const { data } = await axios.put(
        `/api/chat/groupadd`,
        {
          chatId: selectedChat._id,
          userId: user1._id,
        },
        config
      );
      setSelectedChat(data);
      setFetchAgain(!fetchAgain);
      setLoading(false);
    } catch (error) {
      toast({
        title: 'Error Occured!',
        description: error.response.data.message,
        status: 'error',
        duration: 5000,
        isClosable: true,
        position: 'bottom',
      });
      setLoading(false);
    }
  };

  const handleRemove = async (user1, type) => {
    if(type == 1)
        if(selectedChat.groupAdmin._id !== user._id || user1._id === selectedChat.groupAdmin._id) 
            return
    try {
      setLoading(true);
      const config = {
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
      };
      const { data } = await axios.put(
        `/api/chat/groupremove`,
        {
          chatId: selectedChat._id,
          userId: user1._id,
        },
        config
      );

      user1._id === user._id ? setSelectedChat() : setSelectedChat(data);
      setFetchAgain(!fetchAgain);
      setLoading(false);
    } catch (error) {
      toast({
        title: 'Error Occured!',
        description: error.response.data.message,
        status: 'error',
        duration: 5000,
        isClosable: true,
        position: 'bottom',
      });
      setLoading(false);
    }
  };

  const handleRename = async () => {
    if (!groupChatName) return;
    try {
      setRenameLoading(true);
      const config = {
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
      };

      const { data } = await axios.put(
        `/api/chat/rename`,
        {
          chatId: selectedChat._id,
          chatName: groupChatName,
        },
        config
      );
      setSelectedChat(data);
      setFetchAgain(!fetchAgain);
      setRenameLoading(false);
    } catch (error) {
      toast({
        title: 'Error Occured!',
        description: error.response.data.message,
        status: 'error',
        duration: 5000,
        isClosable: true,
        position: 'bottom',
      });
      setRenameLoading(false);
    }
    setGroupChatName('');
  };

  const handleSearch = useCallback(async () => {
    if (!search) {
      return;
    }

    try {
      setLoading(true);
      const config = {
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
      };
      const { data } = await axios.get(`/api/user?search=${search}`, config);
      setLoading(false);
      setSearchResult(data);
    } catch (error) {
      toast({
        title: 'Error Occured!',
        description: 'Failed to Load the Search Results',
        status: 'error',
        duration: 5000,
        isClosable: true,
        position: 'bottom-left',
      });
    }
  },[user, search, toast]);

  useEffect(() => {
    handleSearch();
  }, [search, handleSearch]);

  return (
    <>
      <IconButton
        display={{ base: 'flex' }}
        icon={<ViewIcon />}
        onClick={onOpen}
      />
      <Modal isOpen={isOpen} onClose={onClose} isCentered>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader
            fontSize={'35px'}
            fontFamily="Work sans"
            display={'flex'}
            justifyContent="center"
          >
            {selectedChat.chatName}
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <Box width={'100%'} display="flex" flexWrap={'wrap'} pb={3}>
              {selectedChat.users.map(u => (
                <UserBadgeItem
                  key={u._id}
                  user={u}
                  handleFunction={() => handleRemove(u, 1)}
                  displayCloseIcon={selectedChat.groupAdmin._id === user._id && u._id !== selectedChat.groupAdmin._id}
                />
              ))}
            </Box>
            <FormControl display="flex">
              <Input
                placeholder="Chat Name"
                mb={3}
                value={groupChatName}
                onChange={e => setGroupChatName(e.target.value)}
              />
              <Button
                variant="solid"
                colorScheme="teal"
                ml={1}
                isLoading={renameloading}
                onClick={handleRename}
              >
                Update
              </Button>
            </FormControl>
            {selectedChat.groupAdmin._id === user._id ? (
              <>
                <FormControl>
                  <Input
                    placeholder="Add User to group"
                    mb={1}
                    onChange={e => setSearch(e.target.value)}
                  />
                </FormControl>
                <Box maxHeight={'200px'} overflowY="scroll">
                  {loading ? (
                    <Spinner size="lg" />
                  ) : (
                    searchResult?.map(user => (
                      <UserListItem
                        key={user._id}
                        user={user}
                        handleFunction={() => handleAddUser(user)}
                      />
                    ))
                  )}
                </Box>
              </>
            ) : (
              <></>
            )}
          </ModalBody>

          <ModalFooter>
            <Button colorScheme="red" mr={3} onClick={() => handleRemove(user, 2)}>
              Leave group
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
};

export default UpdateGroupChatModal;
