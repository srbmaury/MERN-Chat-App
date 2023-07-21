import { Box, Button, FormControl, FormLabel, Input, Text, useToast } from '@chakra-ui/react';
import React, { useState, useEffect } from 'react';
import { useHistory } from 'react-router-dom/cjs/react-router-dom.min';
import axios from 'axios';

const EnterEmail = ({ setOtpPage, email, setEmail }) => {
    const history = useHistory();
    const toast = useToast();

    const [loading, setLoading] = useState(false);
    const [loadingText, setLoadingText] = useState("Please wait");
    const [dotsCount, setDotsCount] = useState(1);
    
    const animationDuration = 500;

    const sendResetPasswordEmail = async () => {
        if (!email) {
            toast({
                title: "Please Enter your email id",
                status: "warning",
                duration: 5000,
                isClosable: true,
                position: "bottom",
            });
            return;
        }

        setLoading(true);

        try {
            await axios.post(
                "/api/otp/generate",
                { email }
            );
            setOtpPage(true);
        } catch (error) {
            toast({
                title: "Failed to generate OTP",
                description: error.response.data.message,
                status: "error",
                duration: 5000,
                isClosable: true,
                position: "bottom",
            });
        }

        setLoading(false);
    };

    const animateLoadingText = () => {
        if (loading) {
            setDotsCount((prevCount) => (prevCount + 1) % 4);
            setLoadingText("Please wait" + ".".repeat(dotsCount));
        }
    };

    useEffect(() => {
        const intervalId = setInterval(animateLoadingText, animationDuration);
        return () => clearInterval(intervalId);
    });

    return (
        <Box bg="white" w="100%" p={4} borderRadius="lg" borderWidth="1px">
            <Text fontSize="xl" mb={4}>Forgot Password?</Text>
            <FormControl id="e-mail" isRequired>
                <FormLabel>Email Address</FormLabel>
                <Input
                    value={email}
                    type="email"
                    placeholder="Enter Your Email Address"
                    onChange={e => setEmail(e.target.value)}
                />
            </FormControl>
            <Box display="flex" justifyContent="space-between">
                <Button
                    colorScheme="green"
                    h="2rem"
                    size="sm"
                    style={{ marginTop: 15 }}
                    onClick={() => history.push('/')}
                >
                    Back
                </Button>
                {loading ? (
                    <Text
                        color="blue.500"
                        fontSize="sm"
                        fontWeight="bold"
                        style={{ marginTop: 15 }}
                        width={95}
                    >
                        {loadingText}
                    </Text>
                ) : (
                    <Button
                        colorScheme="blue"
                        h="2rem"
                        size="sm"
                        style={{ marginTop: 15 }}
                        onClick={sendResetPasswordEmail}
                    >
                        Send OTP
                    </Button>
                )}
            </Box>
        </Box>
    );
};

export default EnterEmail;
