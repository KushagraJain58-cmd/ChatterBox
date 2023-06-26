const express = require('express');
const dotenv = require('dotenv');
const { chats } = require('./data/data');
const { connectDB } = require('./config/db');
const colors = require('colors');
const userRoutes = require('./routes/userRoutes');
const chatRoutes = require('./routes/chatRoutes');
const messageRoutes = require('./routes/messageRoutes');
const { notFound, errorHandler } = require('./middleware/errorMiddlerware');

dotenv.config();
connectDB();
const app = express();

app.use(express.urlencoded({ extended: true }));
app.use(express.json()); //to accept json data

app.use('/api/user', userRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/message', messageRoutes);

app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, console.log(`Server Started on PORT ${PORT}`.yellow.bold));

//Implementation of Socket IO

const io = require('socket.io')(server, {
	pingTimeout: 60000, //the amount of time it will wait while being inactive
	cors: {
		origin: 'http://localhost:3000'
	}
});

io.on('connection', (socket) => {
	console.log('Connected to Socket.io');
	socket.on('setup', (userData) => {
		socket.join(userData._id); //created a room for that particular user
		console.log(userData._id);
		socket.emit('connected');
	}); //take the user data from frontend

	socket.on('join chat', (room) => {
		socket.join(room);
		console.log('User Joined Room:' + room);
	});

	socket.on('typing', (room) => socket.in(room).emit('typing'));
	socket.on('stop typing', (room) => socket.in(room).emit('stop typing'));

	socket.on('new message', (newMessageRecieved) => {
		var chat = newMessageRecieved.chat;
		if (!chat.users) {
			return console.log('chat.users not defined');
		}
		chat.users.forEach((user) => {
			if (user._id === newMessageRecieved.sender._id) return;
			socket.in(user._id).emit('message recieved', newMessageRecieved);
		});
	});

	socket.off('setup', () => {
		console.log('USER DISCONNECTED');
		socket.leave(userData._id);
	});
}); //create our connection
