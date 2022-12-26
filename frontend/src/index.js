import { ColorModeScript } from '@chakra-ui/react';
import React from 'react';
import * as ReactDOM from 'react-dom/client';
import App from './App';
import {BrowserRouter} from 'react-router-dom';
import ChatProvider from './Context/ChatProvider';

const container = document.getElementById('root');
const root = ReactDOM.createRoot(container);

root.render(
  <ChatProvider>
    <BrowserRouter>
      <ColorModeScript />
      <App />
    </BrowserRouter>
  </ChatProvider>
);
