import { Box, Button, FormControl, FormLabel, Input, VStack, useToast } from '@chakra-ui/react';
import React, { useState } from 'react';
import { useHistory } from 'react-router-dom';
import axios from 'axios';

const NewPassword = ({ setOtpPage, email }) => {
    const [otp, setOtp] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmNewPassword, setConfirmNewPassword] = useState('');
    const [loading, setLoading] = useState(false);

    const history = useHistory();
    const toast = useToast();

    const changePassword = async () => {
        setLoading(true);
        if (!otp || !newPassword || !confirmNewPassword) {
            toast({
                title: "Please Fill all the Feilds",
                status: "warning",
                duration: 5000,
                isClosable: true,
                position: "bottom",
            });
            setLoading(false);
            return;
        }
        if(newPassword !== confirmNewPassword){
            toast({
                title: "Entered Passwords do not match",
                status: "warning",
                duration: 5000,
                isClosable: true,
                position: "bottom",
            });
            setLoading(false);
            return;
        }

        try {
            const { data } = await axios.post(
                "/api/otp/verify",
                { email, otp, newPassword }
            );

            toast({
                title: data.message,
                status: "success",
                duration: 5000,
                isClosable: true,
                position: "bottom",
            });
            setLoading(false);
            history.push("/");
        } catch (error) {
            toast({
                title: "Error Occured!",
                description: error.response.data.message,
                status: "error",
                duration: 5000,
                isClosable: true,
                position: "bottom",
            });
            setLoading(false);
        }
    }
    return (
        <Box bg="white" w="100%" p={4} borderRadius="lg" borderWidth="1px">
            <VStack spacing="10px">
                <FormControl id="otp" isRequired>
                    <FormLabel>OTP</FormLabel>
                    <Input
                        value={otp}
                        type="text"
                        placeholder="Enter OTP"
                        onChange={e => setOtp(e.target.value)}
                    />
                </FormControl>
                <FormControl id="new-password" isRequired>
                    <FormLabel>New Password</FormLabel>
                    <Input
                        value={newPassword}
                        type="password"
                        placeholder="Enter New Password"
                        onChange={e => setNewPassword(e.target.value)}
                    />
                </FormControl>
                <FormControl id="new-password-again" isRequired>
                    <FormLabel>Confirm New Password</FormLabel>
                    <Input
                        value={confirmNewPassword}
                        type="password"
                        placeholder="Confirm New Password"
                        onChange={e => setConfirmNewPassword(e.target.value)}
                    />
                </FormControl>
            </VStack>
            <Box display="flex" justifyContent="space-between">
                <Button
                    colorScheme="green"
                    h="2rem"
                    size="sm"
                    style={{ marginTop: 15 }}
                    onClick={() => setOtpPage(false)}
                >
                    Back
                </Button>
                <Button
                    colorScheme="blue"
                    h="2rem"
                    size="sm"
                    style={{ marginTop: 15 }}
                    onClick={changePassword}
                    isLoading={loading}
                >
                    Change Password
                </Button>
            </Box>
        </Box>
    );
};

export default NewPassword;
