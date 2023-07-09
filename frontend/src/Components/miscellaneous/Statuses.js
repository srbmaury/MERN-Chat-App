import { Avatar, Box, Button, FormControl, FormLabel, Image, Input, Modal, ModalBody, ModalCloseButton, ModalContent, ModalHeader, ModalOverlay, Stack, Text, Textarea, useDisclosure, useToast } from '@chakra-ui/react'
import React, { useCallback, useEffect, useState } from 'react'
import { ChatState } from '../../Context/ChatProvider';
import axios from 'axios';
import { AddIcon, DeleteIcon } from '@chakra-ui/icons';

const Statuses = (props) => {
    const [statuses, setStatuses] = useState([]);
    const { user } = ChatState();
    const toast = useToast();

    const [text, setText] = useState("");
    const [media, setMedia] = useState("");

    const [loading, setLoading] = useState(false);

    const { isOpen, onOpen, onClose } = useDisclosure();
    
    const Upload = (media) => {
        setLoading(true);
        if (media === undefined) {
            toast({
                title: 'Please select an image!',
                status: 'warning',
                duration: 3000,
                isClosable: true,
                position: 'bottom'
            });
            setLoading(false);
            return;
        }

        if (media.type === 'image/jpeg' || media.type === 'image/png') {
            const data = new FormData();
            data.append('file', media);
            data.append('upload_preset', 'chat-app');
            data.append('cloud_name', 'dnimsxcmh');
            fetch('https://api.cloudinary.com/v1_1/dnimsxcmh/image/upload', {
                method: 'post',
                body: data,
            }).then(res => res.json())
                .then(data => {
                    console.log("HO GYA");
                    setMedia(data.url.toString());
                    setLoading(false);
                })
                .catch(err => {
                    console.log("ERR");
                    console.log(err);
                    setLoading(false);
                });
        } else {
            toast({
                title: "Please Select an Image!",
                status: "warning",
                duration: 3000,
                isClosable: true,
                position: "bottom",
            });
            setLoading(false);
            return;
        }
    }
    const handleSave = () => {

        if (!media || !text) {
            toast({
                title: 'Error Occured!',
                status: 'error',
                duration: 5000,
                isClosable: true,
                position: 'bottom-left',
            });
            return;
        }
        addStatus();
        onClose();
    };

    const fetchStatuses = useCallback(async () => {
        try {
            const config = {
                headers: {
                    Authorization: `Bearer ${user.token}`,
                },
            };

            const { data } = await axios.get('/api/status', config);
            setStatuses(data);
            const status = statuses.find((status) => status.user._id === user._id);
            if (status) {
                setText(status.text);
                setMedia(status.media);
            }
        } catch (error) {
            toast({
                title: 'Error Occured!',
                description: 'Failed to Load the stasues',
                status: 'error',
                duration: 5000,
                isClosable: true,
                position: 'bottom-left',
            });
        }
    }, [user, statuses, toast]);

    const addStatus = async () => {
        try {
            const config = {
                headers: {
                    Authorization: `Bearer ${user.token}`,
                },
            };

            const data = {
                text: text,
                media: media,
            };
            console.log(data);
            await axios.post('/api/status', data, config);
            toast({
                title: 'Status Updated!',
                status: 'success',
                duration: 5000,
                isClosable: true,
                position: 'bottom-left',
            });
        } catch (error) {
            console.log(error);
            toast({
                title: 'Error Occurred!',
                description: 'Failed to add the status',
                status: 'error',
                duration: 5000,
                isClosable: true,
                position: 'bottom-left',
            });
        }
    };

    const deleteStatus = async () => {
        try {
            const config = {
                headers: {
                    Authorization: `Bearer ${user.token}`,
                },
            };

            // Fetch all statuses
            const response = await axios.get('/api/status', config);
            const statuses = response.data;

            // Find the status with matching user ID
            const statusToDelete = statuses.find(status => status.user._id === user._id);

            if (!statusToDelete) {
                toast({
                    title: 'Status Not Found!',
                    status: 'warning',
                    duration: 5000,
                    isClosable: true,
                    position: 'bottom-left',
                });
                return;
            }

            // Delete the status
            await axios.delete(`/api/status/${statusToDelete._id}`, config);

            toast({
                title: 'Status Deleted!',
                status: 'success',
                duration: 5000,
                isClosable: true,
                position: 'bottom-left',
            });
            setMedia("");
            setText("");
        } catch (error) {
            console.log(error);
            toast({
                title: 'Error Occurred!',
                description: 'Failed to delete the status',
                status: 'error',
                duration: 5000,
                isClosable: true,
                position: 'bottom-left',
            });
        }
    };

    useEffect(() => {
        fetchStatuses();
    }, [props.isModalOpen, fetchStatuses]);

    const [todisplayName, setTodisplayName] = useState('');
    const [todisplayPic, setTodisplayPic] = useState('');
    const [todisplaytext, setTodisplayText] = useState('');
    const [dusraOpen, setDusraOpen] = useState(false);

    const displayPhoto = (name, media, text) => {
        setTodisplayName(name);
        setTodisplayPic(media);
        setTodisplayText(text);
        setDusraOpen(true);
    }
    return (
        <>
            <Modal isOpen={props.isModalOpen} onClose={props.handleCloseModal}>
                <ModalOverlay />
                <ModalContent>
                    <ModalHeader>Statuses</ModalHeader>
                    <ModalCloseButton />
                    <ModalBody>
                        <Stack spacing={3}>
                            {text === "" ? (
                                <Box
                                    display="flex"
                                    onClick={onOpen}
                                >
                                    <Box
                                        maxWidth={10}
                                        boxSize={8}
                                        borderWidth={2}
                                        borderStyle="dashed"
                                        borderRadius="50%"
                                        borderColor="gray.400"
                                        cursor="pointer"
                                    >
                                        <AddIcon ml={1.5} color="gray.400" />
                                    </Box>
                                    <Text
                                        fontSize={16}
                                        fontWeight={400}
                                        ml={3}
                                    >
                                        Add Status
                                    </Text>
                                </Box>
                            ) : (
                                <Box
                                    display="flex"
                                >
                                    <Avatar
                                        size="md"
                                        cursor="pointer"
                                        name={user.name}
                                        src={media}
                                        onClick={()=>displayPhoto(user.name, media, text)}
                                    />
                                    <Box my={-1} >
                                        <Text
                                            fontSize={16}
                                            fontWeight={600}
                                            ml={3}
                                        >
                                            {user.name}
                                        </Text>
                                        <Text
                                            fontSize={16}
                                            fontWeight={400}
                                            ml={3}
                                        >
                                            {text}
                                        </Text>
                                    </Box>
                                    <DeleteIcon
                                        ml={40}
                                        color="red"
                                        cursor="pointer"
                                        onClick={deleteStatus}
                                    />
                                </Box>
                            )}
                            {statuses.map((status, index) => (
                                (status.user._id !== user._id &&
                                    <Box
                                        display="flex"
                                        key={index}
                                    >
                                        <Avatar
                                            size="md"
                                            cursor="pointer"
                                            name={status.user.name}
                                            src={status.media}
                                            onClick={()=>displayPhoto(status.user.name, status.media, status.text)}
                                        />
                                        <Box my={-1} >
                                            <Text
                                                fontSize={16}
                                                fontWeight={600}
                                                ml={3}
                                            >
                                                {status.user.name}
                                            </Text>
                                            <Text
                                                fontSize={16}
                                                fontWeight={400}
                                                ml={3}
                                            >
                                                {status.text}
                                            </Text>
                                        </Box>
                                    </Box>
                                )
                            ))}
                        </Stack>
                    </ModalBody>
                </ModalContent>
            </Modal>

            <Modal isOpen={isOpen} onClose={onClose}>
                <ModalOverlay />
                <ModalContent>
                    <ModalHeader>Upload Image and Caption</ModalHeader>
                    <ModalCloseButton />
                    <ModalBody>
                        <FormControl>
                            <FormLabel>Upload Image</FormLabel>
                            <Input type="file" onChange={(e) => Upload(e.target.files[0])} />
                        </FormControl>
                        <FormControl mt={4}>
                            <FormLabel>Caption</FormLabel>
                            <Textarea rows={4} onChange={(e) => setText(e.target.value)} />
                        </FormControl>
                        <Button mt={4} colorScheme="blue" onClick={handleSave} isLoading={loading}>
                            Save
                        </Button>
                    </ModalBody>
                </ModalContent>
            </Modal>
            <Modal isOpen={dusraOpen} onClose={()=>setDusraOpen(false)}>
                <ModalOverlay />
                <ModalContent>
                    <ModalHeader>{todisplayName}</ModalHeader>
                    <ModalCloseButton />
                    <ModalBody>
                        <Image src={todisplayPic} />
                    </ModalBody>
                    <Text ml={5} textAlign="center">{todisplaytext}</Text>
                </ModalContent>
            </Modal>
        </>
    )
}

export default Statuses
