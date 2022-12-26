import { Box } from '@chakra-ui/react';
import React from 'react'
import ChatBox from '../Components/ChatBox';
import SideDrawer from '../Components/miscellaneous/SideDrawer';
import MyChats from '../Components/MyChats';
import { ChatState } from '../Context/ChatProvider'

const ChatPage = () => {
  const { user } = ChatState();

  return (
    <div style={{width: "100%" }}>
      { user && <SideDrawer /> } 
      <Box
        display="flex"
        justifyContent="space-between"
        width="100%"
        height="91.5vh"
        padding="10px"
      >
        {user && <MyChats />}
        {user && <ChatBox />}
      </Box>
    </div>
  )
}

export default ChatPage
