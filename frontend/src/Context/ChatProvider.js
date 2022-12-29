import { useHistory } from "react-router-dom";
const { createContext, useContext, useEffect, useState } = require("react");

const ChatContext = createContext();

const ChatProvider = ({children}) => {
    const [user, setUser] = useState();
    const [selectedChat, setSelectedChat] = useState();
    const [chats, setChats] = useState([]);

    const history = useHistory();
    
    useEffect(() => {
        const userInfo = JSON.parse(localStorage.getItem("userInfo"));
        setUser(userInfo);
    }, [history]);

    return(
        <ChatContext.Provider
        value={{
            user,
            setUser,
            selectedChat, 
            setSelectedChat,
            chats, 
            setChats
          }}
        >
            {children}
        </ChatContext.Provider>
    )
}

export const ChatState = () => {
    return useContext(ChatContext);
}

export default ChatProvider;