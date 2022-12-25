import React from 'react';
import {
  ChakraProvider,
  theme,
} from '@chakra-ui/react';
import HomePage from './Pages/HomePage';
import { Route } from 'react-router-dom';
import ChatPage from './Pages/ChatPage';
import './App.css';

function App() {
  return (
    <div className="App">
      <ChakraProvider theme={theme}>
        <Route exact path="/" component={HomePage} />
        <Route path='/chats' component={ChatPage} />
      </ChakraProvider>
    </div>
  );
}

export default App;
