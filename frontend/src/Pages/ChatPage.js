import { Box } from '@chakra-ui/react';
import React, { useEffect, useState } from 'react'
import { useHistory } from 'react-router-dom';
import ChatBox from '../Components/ChatBox';
import SideDrawer from '../Components/miscellaneous/SideDrawer';
import MyChats from '../Components/MyChats';
import { ChatState } from '../Context/ChatProvider'
import AdminPage from './AdminPage';

const ChatPage = () => {
    const { user } = ChatState();
    const [fetchAgain, setFetchAgain] = useState(false);

    useEffect(() => {
        setFetchAgain(!fetchAgain);
    }, [user]);

    const history = useHistory();

    useEffect(() => {
        const user = JSON.parse(localStorage.getItem('userInfo'));
        if (!user) history.push('/');
    }, [user, history]);

    return (
        <>
            {user && user.isAdmin ?
                <AdminPage /> :
                <div style={{ width: "100%" }}>
                    {user && <SideDrawer />}
                    <Box
                        display="flex"
                        justifyContent="space-between"
                        width="100%"
                        height="91.5vh"
                        padding="10px"
                    >
                        {user && <MyChats fetchAgain={fetchAgain} />}
                        {user && <ChatBox fetchAgain={fetchAgain} setFetchAgain={setFetchAgain} />}
                    </Box>
                </div>
            }
        </>
    )
}

export default ChatPage
