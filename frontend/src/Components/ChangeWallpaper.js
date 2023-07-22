import React, { useState } from 'react';
import {
    Box,
    Image,
    Grid,
    GridItem,
    Button,
    Modal,
    ModalOverlay,
    ModalContent,
    ModalHeader,
    ModalBody,
    ModalCloseButton,
    Input,
    InputGroup,
    InputRightElement,
    useToast,
    Spinner,
    Checkbox,
    ModalFooter,
} from '@chakra-ui/react';
import axios from 'axios';
import { ChatState } from '../Context/ChatProvider';

const ChngeWallpaper = ({ setChangeWallpaperDisplay, setWallPaper, chatId }) => {
    const [isModalOpen, setIsModalOpen] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [wallpaperOptions, setWallpaperOptions] = useState([]);
    const [loading, setLoading] = useState("0");
    const [allChats, setAllChats] = useState(false);

    const colorOptions = [
        '#FF0000', '#00FF00', '#0000FF', '#FFFF00', '#FF00FF', '#00FFFF',
        '#FFA500', '#800080', '#008080', '#008000', '#800000', '#000080',
        '#808080', '#C0C0C0', '#FFC0CB', '#FFD700', '#ADFF2F', '#FF4500',
        '#DA70D6', '#00CED1', '#FF1493', '#FFDAB9', '#FFA07A', '#FFB6C1',
        '#FFDEAD', '#98FB98', '#FFEFD5', '#F0E68C', '#DDA0DD', '#D3D3D3',
        '#CD5C5C', '#FF8C00', '#FF69B4', '#FF7F50', '#8A2BE2', '#FFFAF0',
        '#20B2AA', '#87CEFA', '#FFFAFA', '#FF00FF', '#F0F8FF', '#E8E8E8',
        '#FFF0F5', '#FFC0CB', '#FFD700', '#ADFF2F', '#FF4500', '#DA70D6',
        '#00CED1', '#FF1493', '#FFDAB9', '#FFA07A', '#FFB6C1', '#FFDEAD',
        '#98FB98', '#FFEFD5', '#F0E68C', '#DDA0DD', '#D3D3D3', '#CD5C5C',
    ];

    const { user, chats, setChats } = ChatState();
    const toast = useToast();

    const changeWallpaper = async (wallpaperUrl) => {
        await updateWallpaper(wallpaperUrl);
        closeModal();
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setChangeWallpaperDisplay(false);
    };

    const changeBackgroundColor = async (color) => {
        await updateWallpaper(color);
        closeModal();
    };

    const updateWallpaper = async (wallpaperUrl) => {
        try {
            const config = {
                headers: {
                    Authorization: `Bearer ${user.token}`,
                },
            };
            let response;
            if (allChats) {
                response = await axios.post(`/api/chat/wallpaper`, { wallpaperUrl }, config);
            }
            else {
                response = await axios.post(`/api/chat/wallpaper/${chatId}`, { wallpaperUrl }, config);
            }
            toast({
                title: response.data.message,
                status: "success",
                duration: 5000,
                isClosable: true,
                position: "bottom",
            });
            setWallPaper(wallpaperUrl);
            const chatIndex = chats.findIndex(
                chat => chat._id === chatId
            );
            const wallPaperIndex = chats[chatIndex].wallPaper.findIndex(
                wallPaper => wallPaper.userId === user._id 
            );
            chats[chatIndex].wallPaper[wallPaperIndex].wallpaperUrl = wallpaperUrl;
        } catch (error) {
            toast({
                title: 'Error Occured!',
                description: error.response.data.message,
                status: 'error',
                duration: 5000,
                isClosable: true,
                position: 'bottom-left',
            });
        }
    };

    const fetchImages = async () => {
        setLoading("1");
        try {
            const config = {
                headers: {
                    Authorization: `Bearer ${user.token}`,
                },
            };

            const { data } = await axios.get(`/api/unsplash?query=${searchQuery}`, config);

            setWallpaperOptions(data.imageLinks);
            setLoading("2");
        } catch (error) {
            toast({
                title: 'Error Occured!',
                description: 'Failed to Load the chats',
                status: 'error',
                duration: 5000,
                isClosable: true,
                position: 'bottom-left',
            });
            setLoading("0");
        }
    };

    const handleSearch = () => {
        if (searchQuery && searchQuery !== "")
            fetchImages();
    };

    const handleSearchInputChange = (event) => {
        setSearchQuery(event.target.value);
    };

    return (
        <Modal isOpen={isModalOpen} onClose={closeModal}>
            <ModalOverlay />
            <ModalContent>
                <ModalHeader>Select Wallpaper</ModalHeader>
                <ModalCloseButton />
                <ModalBody>
                    <InputGroup mb={4} size="lg">
                        <Input
                            placeholder="Enter your search query..."
                            value={searchQuery}
                            onChange={handleSearchInputChange}
                            borderRadius="md"
                            bg="gray.100"
                            width="calc(100% - 4.5rem)"
                            _placeholder={{ color: 'gray.500' }}
                        />
                        <InputRightElement>
                            <Button size="md" paddingTop={3} paddingBottom={3} paddingLeft={35} paddingRight={35} onClick={handleSearch} colorScheme="blue">
                                Search
                            </Button>
                        </InputRightElement>
                    </InputGroup>
                    {loading === "1" &&
                        <Spinner
                            size="xl"
                            width={20}
                            height={20}
                            alignSelf="center"
                            margin="auto"
                        />}
                    {loading === "2" &&
                        <Grid templateColumns="repeat(3, 1fr)" gap={4} height={340} overflow="scroll">
                            {wallpaperOptions.map((wallpaperUrl, index) => (
                                <GridItem key={index}>
                                    <Image
                                        src={wallpaperUrl}
                                        alt={`Wallpaper ${index + 1}`}
                                        w="100%"
                                        h="200px"
                                        objectFit="cover"
                                        borderRadius="md"
                                        cursor="pointer"
                                        onClick={() => changeWallpaper(wallpaperUrl)}
                                    />
                                </GridItem>
                            ))}
                        </Grid>}
                    {loading === "0" && <Box mt={6}>
                        <p>Choose Background Color:</p>
                        <Grid templateColumns="repeat(6, 1fr)" gap={6} mt={2} height={340} overflow="scroll">
                            {colorOptions.map((color, index) => (
                                <GridItem key={index}>
                                    <Box
                                        bg={color}
                                        w="40px"
                                        h="40px"
                                        borderRadius="full"
                                        cursor="pointer"
                                        onClick={() => changeBackgroundColor(color)}
                                    />
                                </GridItem>
                            ))}
                        </Grid>
                    </Box>}
                </ModalBody>
                <ModalFooter>
                    <Checkbox value={allChats} onChange={e => setAllChats(e.target.checked)}>Do this for all chats</Checkbox>
                </ModalFooter>
            </ModalContent>
        </Modal>
    );
};

export default ChngeWallpaper;
