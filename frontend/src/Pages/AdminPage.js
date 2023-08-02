import {
    Table,
    Thead,
    Tbody,
    Tr,
    Th,
    Td,
    TableCaption,
    TableContainer,
    Box,
    Checkbox,
    useToast,
    CircularProgress,
} from '@chakra-ui/react';
import React, { useEffect, useState } from 'react';
import SideDrawer from '../Components/miscellaneous/SideDrawer';
import axios from 'axios';
import { ChatState } from '../Context/ChatProvider';

const AdminPage = () => {
    const [userMessages, setUserMessages] = useState([]);
    const { user } = ChatState();
    const [messageValueArray, setMessageValueArray] = useState([]);
    const [tmpArray, setTmpArray] = useState([]);
    const [isLoading, setIsLoading] = useState(false); // State for loading

    const toast = useToast();

    useEffect(() => {
        const fetchUserMessages = async () => {
            try {
                const response = await axios.get('/api/user/submittedForReview', {
                    headers: {
                        Authorization: `Bearer ${user.token}`,
                    },
                });

                const usersWithSubmitForReview = response.data.usersWithSubmitForReview.map(user => ({
                    ...user,
                    submittedForReview: user.submittedForReview.map(message => ({
                        message: message,
                        offensive: false,
                        hateful: false,
                        neither: false,
                        insertIntoSheet: false,
                    })),
                }));

                setUserMessages(usersWithSubmitForReview);
            } catch (error) {
                toast({
                    title: 'Error',
                    description: error.response.data.message,
                    status: 'error',
                    duration: 3000,
                    isClosable: true,
                });
            }
        };

        fetchUserMessages();
    }, []);
    const handleCheckboxChange = (userId, message, category) => {
        const existingIndex = tmpArray.findIndex(
            item => item.userId === userId && item.message === message
        );

        if (existingIndex !== -1) {
            setTmpArray(prevArray => {
                const newArray = [...prevArray];
                newArray[existingIndex] = {
                    userId,
                    message,
                    category
                };
                return newArray;
            });
        } else {
            setTmpArray(prevArray => [
                ...prevArray,
                { userId, message, category }
            ]);
        }
    };

    const handleSaveToSheet = async () => {
        setIsLoading(true);
        try {
            const response = await axios.post(
                '/api/googlesheet/save-to-sheet',
                {
                    dataToInsert: messageValueArray,
                },
                {
                    headers: {
                        'Content-type': 'application/json',
                        Authorization: `Bearer ${user.token}`,
                    },
                }
            );

            toast({
                title: 'Data Saved',
                description: response.data.message,
                status: 'success',
                duration: 3000,
                isClosable: true,
            });
            handleReview();
        } catch (error) {
            toast({
                title: 'Error',
                description: 'Error saving data to Google Sheet',
                status: 'error',
                duration: 3000,
                isClosable: true,
            });
        } finally {
            setIsLoading(false);
        }
    };

    const handleReview = async () => {
        try {
            const response = await axios.post(
                '/api/user/review',
                {
                    messages: tmpArray,
                },
                {
                    headers: {
                        'Content-type': 'application/json',
                        Authorization: `Bearer ${user.token}`,
                    },
                }
            );

            toast({
                title: 'Review Completed',
                description: response.data.message,
                status: 'success',
                duration: 3000,
                isClosable: true,
            });
        } catch (error) {
            toast({
                title: 'Error',
                description: 'Error during the review process',
                status: 'error',
                duration: 3000,
                isClosable: true,
            });
        } 
    };

    const handleFourthCheckboxChange = (userId, message) => {
        const existingIndex = tmpArray.findIndex(
            item => item.userId === userId && item.message === message
        );

        if (existingIndex !== -1) {
            const isPresent = messageValueArray.findIndex(
                item => item.message === message
            );
            if (isPresent !== -1)
                messageValueArray[isPresent].category = tmpArray[existingIndex].category;
            else {
                setMessageValueArray(prevArray => [
                    ...prevArray,
                    { message: message, category: tmpArray[existingIndex].category }
                ]);
            }
        } else {
            toast({
                title: 'Error',
                description: 'Please select a value from the table',
                status: 'error',
                duration: 3000,
                isClosable: true,
            });
        }
    };

    return (
        <Box bg="white" width="100%">
            <SideDrawer />
            <Box my={4}>
                {isLoading && (
                    <Box display="flex" justifyContent="center" alignItems="center">
                        <CircularProgress isIndeterminate color="blue.500" />
                        <Box ml={2}>Saving data...</Box>
                    </Box>
                )}
            </Box>
            <TableContainer>
                <Table variant="simple">
                    <TableCaption cursor="pointer" onClick={handleSaveToSheet}>Save</TableCaption>
                    <Thead>
                        <Tr>
                            <Th>User</Th>
                            <Th>Message</Th>
                            <Th>Hateful</Th>
                            <Th>Offensive</Th>
                            <Th>Neither</Th>
                            <Th>Insert into sheet</Th>
                        </Tr>
                    </Thead>
                    <Tbody>
                        {userMessages.map((user, userIndex) =>
                            user.submittedForReview.map((message, messageIndex) => (
                                <Tr key={`${userIndex}-${messageIndex}`}>
                                    {messageIndex === 0 && <Td rowSpan={user.submittedForReview.length}>{user.name}</Td>}
                                    <Td>{message.message}</Td>
                                    <Td>
                                        <Checkbox
                                            isChecked={tmpArray.some(
                                                item => item.userId === user._id && item.message === message.message && item.category === 0
                                            )}
                                            onChange={() => handleCheckboxChange(user._id, message.message, 0)}
                                        />
                                    </Td>
                                    <Td>
                                        <Checkbox
                                            isChecked={tmpArray.some(
                                                item => item.userId === user._id && item.message === message.message && item.category === 1
                                            )}
                                            onChange={() => handleCheckboxChange(user._id, message.message, 1)}
                                        />
                                    </Td>
                                    <Td>
                                        <Checkbox
                                            isChecked={tmpArray.some(
                                                item => item.userId === user._id && item.message === message.message && item.category === 2
                                            )}
                                            onChange={() => handleCheckboxChange(user._id, message.message, 2)}
                                        />
                                    </Td>
                                    <Td>
                                        <Checkbox
                                            isChecked={messageValueArray.findIndex(
                                                item => item.message === message.message
                                            ) !== -1}
                                            disabled={messageValueArray.findIndex(
                                                item => item.message === message.message
                                            ) !== -1}
                                            onChange={() => handleFourthCheckboxChange(user._id, message.message)}
                                        />
                                    </Td>
                                </Tr>
                            ))
                        )}
                    </Tbody>
                </Table>
            </TableContainer>
        </Box>
    );
};

export default AdminPage;
