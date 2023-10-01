import { useHistory } from "react-router-dom";
const { createContext, useContext, useEffect, useState } = require("react");

const ChatContext = createContext();

const ChatProvider = ({children}) => {
    const [user, setUser] = useState();
    const [selectedChat, setSelectedChat] = useState();
    const [chats, setChats] = useState([]);
    const [notification, setNotification] = useState([]);
    const [newLatestMessage, setNewLatestMessage] = useState();
    const [gameStatus, setGameStatus] = useState(false);
    const [gameRequestTime, setGameRequestTime] = useState();
    const [playArenaVisibility, setPlayArenaVisibility] = useState(false);

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
            setChats,
            notification, 
            setNotification,
            newLatestMessage, 
            setNewLatestMessage,
            gameStatus, 
            setGameStatus,
            gameRequestTime, 
            setGameRequestTime,
            playArenaVisibility, 
            setPlayArenaVisibility
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