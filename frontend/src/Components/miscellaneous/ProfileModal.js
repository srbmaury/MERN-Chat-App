import { ViewIcon } from '@chakra-ui/icons';
import {
    Modal,
    ModalOverlay,
    ModalContent,
    ModalHeader,
    ModalFooter,
    ModalBody,
    ModalCloseButton,
    Button,
    useDisclosure,
    IconButton,
    Text,
    Image,
    FormControl,
    Input,
    useToast,
} from '@chakra-ui/react';
import { useState } from 'react';
import { ChatState } from '../../Context/ChatProvider';
import axios from 'axios'
import Upload from './Cloudinary';

const ProfileModal = (props) => {
    const { isOpen, onOpen, onClose } = useDisclosure();
    const { user, setUser } = ChatState();
    const toast = useToast();

    const [pic, setPic] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async e => {
        try {
            const config = {
                headers: {
                    "Content-type": "application/json",
                    'Authorization': `Bearer ${user.token}`,
                }
            };
            const { data } = await axios.put(
                `/api/user/update`,
                {
                    id: user._id,
                    pic: pic,
                },
                config
            );

            setTimeout(() => {
                setUser(data);
                localStorage.setItem("userInfo", JSON.stringify(data));
            }, 3000);

            toast({
                title: "Profile picture updated",
                status: "success",
                duration: 3000,
                isClosable: true,
                position: "bottom",
            });
            onClose();
        } catch (err) {
            toast({
                title: "Update failed!",
                status: "warning",
                duration: 3000,
                isClosable: true,
                position: "bottom",
            });
        }
    }

    return (
        <>
            {props.children ? (
                <span onClick={onOpen}>{props.children}</span>
            ) : (
                <IconButton
                    display={{ base: 'flex' }}
                    icon={<ViewIcon />}
                    onClick={onOpen}
                />
            )}

            <Modal size="lg" isOpen={isOpen} onClose={onClose} isCentered>
                <ModalOverlay />
                <ModalContent height="410px" >
                    <ModalHeader
                        fontSize={'40px'}
                        fontFamily="Work sans"
                        display={'flex'}
                        justifyContent="center"
                    >
                        {props.user.name}
                    </ModalHeader>
                    <ModalCloseButton />
                    <ModalBody
                        display={"flex"}
                        flexDirection="column"
                        alignItems={"center"}
                        justifyContent="center"
                    >
                        <Image
                            borderRadius={'full'}
                            boxSize="150px"
                            src={props.user.pic}
                            alt={props.user.name}
                        />
                        <Text
                            fontSize={{ base: '28px', md: '30px' }}
                            fontFamily="Work sans"
                        >
                            Email: {props.user.email}
                        </Text>
                    </ModalBody>


                    <ModalFooter>
                        {props.user._id === user._id &&
                            <>
                                <FormControl id="pic">
                                    <Input
                                        type="file"
                                        width='90%'
                                        display='inline-block'
                                        p={1.5}
                                        accept="image/*"
                                        onChange={(e) => Upload(e.target.files[0], setPic, setLoading)}
                                    />
                                </FormControl>
                                <Button isLoading={loading} colorScheme='teal' variant='ghost' mr={3} onClick={handleSubmit}>
                                    Change
                                </Button>
                            </>
                        }
                        <Button colorScheme="blue" mr={3} onClick={onClose}>
                            Close
                        </Button>
                    </ModalFooter>
                </ModalContent>
            </Modal>
        </>
    );
};

export default ProfileModal;
