# MERN Stack Chat App

Welcome to the MERN Stack Chat App! This application allows users to securely communicate with others through one-to-one or group chats. With features like email verification, password encryption, message forwarding, and more, the MERN Stack Chat App ensures a safe and seamless chatting experience.

## One-to-one Chat
![One-to-one Chat](https://res.cloudinary.com/dnimsxcmh/image/upload/v1690005398/uploads/11fdf0aed2dea50d256e02077187532e_sq3ixw.png)

## Group Chat
![Group Chat](https://res.cloudinary.com/dnimsxcmh/image/upload/v1690005371/uploads/3a9bc13088daea7424943d52f860c91e_nnnbky.png)

## Features

- **Email Verification:** User email addresses are verified during the registration process to ensure secure access to the app.
- **Password Encryption:** User passwords are encrypted using bcryptjs to protect user data.
- **Message Encryption:** Messages are encrypted using the `crypto` library for enhanced security.
- **Sending Photos** Users can also send photos, that too in encrypted form.
- **One-to-One and Group Chats:** Users can create both one-to-one and group chats to communicate with others.
- **Message Management:** Users have the ability to delete or forward messages within the app.
- **User Search:** Users can search for other users to initiate conversations with them.
- **Status Updates:** Users can update their status with photo and caption which expires after 24 hours.
- **Profile Picture:** Users can update their profile picture to personalize their account.
- **Notifications:** Users receive notifications for new messages, ensuring they never miss important conversations.
- **Mute Chats:** Users can mute specific chats to stop receiving notifications temporarily.
- **Delete Chats** Users can also delete a specific chat.
- **Chat Wallpaper** Users can update wallpaper of a particular chat or all at once.
- **Reset Password** Users can reset their account password if they forget.

## Technologies Used

The MERN Stack Chat App is built using the following technologies:

- **MongoDB:** A popular NoSQL database for storing user information and chat messages.
- **Express.js:** A flexible web application framework for building the server-side of the app.
- **React.js:** A powerful JavaScript library for building the user interface.
- **Node.js:** A server-side JavaScript runtime environment used for running the server and handling requests.
- **Socket.IO:** A real-time bidirectional event-based communication library for instant messaging functionality.
- **Chakra UI:** A simple and accessible component library for building user interfaces.
- **bcryptjs:** A library for encrypting user passwords securely.
- **dotenv:** A module for loading environment variables from a `.env` file.
- **express-async-handler:** A utility to handle asynchronous errors in Express.js.
- **fs:** A built-in Node.js module for working with the file system.
- **googleapis:** A library for interacting with various Google APIs.
- **http-proxy-middleware:** A middleware for proxying requests in Express.js.
- **jsonwebtoken:** A library for creating and verifying JSON Web Tokens (JWT).
- **moment-timezone:** A library for working with dates and timezones in JavaScript.
- **mongoose:** An Object Data Modeling (ODM) library for MongoDB and Node.js.
- **nodemailer:** A module for sending emails using Node.js.
- **react-overflow:** A React component for handling overflow content.
- **Cloudinary:** A clod-based media-management platform.
- **node-cron** A cron-like task scheduler for nodeJS.
## Installation

To run the MERN Stack Chat App locally, follow these steps:

1. Clone the repository: `git clone https://github.com/srbmaury/MERN-Chat-App.git`
2. Navigate to the project directory: `cd MERN-Chat-App`
3. Install the backend dependencies: `npm install`
4. Install the frontend dependencies: `cd frontend` then `npm install`
5. Create a `.env` file in the root directory with the following environment variables:
- For Connection to MongoDB and Login
```plaintext
PORT=3000
MONGO_URI=your-mongodb-connection-string
JWT_SECRET=your-jwt-secret
````
- For Sending Email
```
ENCRYPTION_KEY=your-encryption-key
CLIENT_ID=your-client-id
CLIENT_SECRET=your-client-secret
REFRESH_TOKEN=your-refresh-token
EMAIL_ID=your-email-id
```
- For Working with Photos
```
CLOUD_NAME=your-cloudinary-cloud-name
API_KEY=your-cloudinary-api-key
API_SECRET=your-cloudinary-api-secret
UPLOAD_PRESET=cloudinary-upload-preset
```
- For Otp During Password Reset
```
OTP_EXPIRATION_TIME_SECONDS = 600
```
- For Searching Photos for Wallpaper
```
UNSPLASH_ACCESS_KEY=your-unsplash-access-key
```
Make sure to replace the placeholder values (`your-mongodb-connection-string`, `your-jwt-secret`, etc.) with the actual values specific to your environment and setup.

Made with ❤️ by [srbmaury](https://github.com/srbmaury)