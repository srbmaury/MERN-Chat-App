import { Box, Container, Text } from '@chakra-ui/react';
import React, { useState } from 'react'
import EnterEmail from '../Components/Authentication/EnterEmail';
import NewPassword from '../Components/Authentication/NewPassword';

const ForgotPasswordPage = () => {
    const [otpPage, setOtpPage] = useState(false);
    const [email, setEmail] = useState();
    return (
        <Container maxW="xl" centerContent>
            <Box
                display="flex"
                justifyContent="center"
                p={3}
                bg="white"
                w="100%"
                m="40px 0 15px 0"
                borderRadius="lg"
                borderWidth="1px"
            >
                <Text fontSize="4xl" fontFamily="work sans">
                    Talk-A-Tive
                </Text>
            </Box>
            {otpPage ?
                <NewPassword
                    setOtpPage={setOtpPage}
                    email={email}
                /> :
                <EnterEmail
                    setOtpPage={setOtpPage}
                    email={email}
                    setEmail={setEmail}
                />}
        </Container>
    )
}

export default ForgotPasswordPage
