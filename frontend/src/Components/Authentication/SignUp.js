import { Button, FormControl, FormLabel, Input, InputGroup, InputRightElement, useToast, VStack } from '@chakra-ui/react';
import React, { useState } from 'react';
import axios from 'axios';
import { useHistory } from 'react-router-dom';
import Upload from '../miscellaneous/Cloudinary';

const SignUp = () => {
    const [show, setShow] = useState(false);
    const [name, setName] = useState();
    const [email, setEmail] = useState();
    const [password, setPassword] = useState();
    const [confirmpassword, setConfirmpassword] = useState();
    const [pic, setPic] = useState();
    const [loading, setLoading] = useState(false);
    const toast = useToast();
    const history = useHistory();

    const handleClick = () => setShow(!show);

    const submitHandler = async () => {
        setLoading(true);
        if (!name || !email || !password || !confirmpassword) {
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
        if (password !== confirmpassword) {
            toast({
                title: "Passwords Do Not Match",
                status: "warning",
                duration: 5000,
                isClosable: true,
                position: "bottom",
            });
            setLoading(false);
            return;
        }
        try {
            const config = {
                headers: {
                    "Content-type": "application/json",
                },
            };
            await axios.post(
                "/api/user",
                {
                    name,
                    email,
                    password,
                    pic,
                },
                config
            );
            toast({
                title: "Registration Successful. Please Verify your email.",
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
    };
    
    return (
        <VStack spacing="5px">
            <FormControl id='first-name' isRequired>
                <FormLabel>Name</FormLabel>
                <Input 
                    placeholder="Enter your name" 
                    onChange={e => setName(e.target.value)} 
                />
            </FormControl>

            <FormControl id='email' isRequired>
                <FormLabel>Email</FormLabel>
                <Input 
                    type={'email'}
                    placeholder="Enter your e-mail" 
                    onChange={e => setEmail(e.target.value)} 
                />
            </FormControl>

            <FormControl id='password' isRequired>
                <FormLabel>Password</FormLabel>
                <InputGroup>
                    <Input 
                        type={ show ? 'text' : 'password' }
                        placeholder="Enter your password" 
                        onChange={e => setPassword(e.target.value)} 
                    />
                    <InputRightElement width="4.5rem">
                        <Button h="1.75rem" size="sm" onClick={handleClick}>
                            { show ? "Hide" : "Show" }
                        </Button>
                    </InputRightElement>
                </InputGroup>
            </FormControl>

            <FormControl id='confirm-password' isRequired>
                <FormLabel>Confirm Password</FormLabel>
                <InputGroup>
                    <Input 
                        type={ show ? 'text' : 'password' }
                        placeholder="Confirm password" 
                        onChange={e => setConfirmpassword(e.target.value)} 
                    />
                    <InputRightElement width="4.5rem">
                        <Button h="1.75rem" size="sm" onClick={handleClick}>
                            { show ? "Hide" : "Show" }
                        </Button>
                    </InputRightElement>
                </InputGroup>
            </FormControl>

            <FormControl id="pic">
                <FormLabel>Upload your Picture</FormLabel>
                    <Input
                        type="file"
                        p={1.5}
                        accept="image/*"
                        onChange={(e) => Upload(e.target.files[0], setPic, setLoading)}
                    />
            </FormControl>

            <Button
                colorScheme="blue"
                width="100%"
                style={{ marginTop: 15 }}
                onClick={submitHandler}
                isLoading={loading}
            >
                Sign Up
            </Button>
        </VStack>
    );
};

export default SignUp;
