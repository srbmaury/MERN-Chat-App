import { ColorModeScript } from '@chakra-ui/react';
import React from 'react';
import * as ReactDOM from 'react-dom/client';
import App from './App';
import { BrowserRouter } from 'react-router-dom';
import ChatProvider from './Context/ChatProvider';
import axios from 'axios';
import { API_BASE_URL } from './config/runtime';

axios.defaults.baseURL = API_BASE_URL;
axios.defaults.withCredentials = true;

const container = document.getElementById('root');
const root = ReactDOM.createRoot(container);

root.render(
  <BrowserRouter>
    <ChatProvider>
      <ColorModeScript />
      <App />
    </ChatProvider>
  </BrowserRouter>
);
