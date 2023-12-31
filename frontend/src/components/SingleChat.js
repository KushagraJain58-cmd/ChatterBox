import React, { Fragment } from 'react';
import { useEffect, useState } from 'react';
import { ChatState } from '../context/ChatProvider';
import { Box, FormControl, IconButton, Input, Spinner, Text } from '@chakra-ui/react';
import { ArrowBackIcon } from '@chakra-ui/icons';
import { getSender, getSenderFull } from '../config/chatLogics';
import { useToast } from '@chakra-ui/toast';
import ProfileModel from './miscellaneous/ProfileModel';
import UpdateGroupChatModel from './miscellaneous/UpdateGroupChatModel';
import axios from 'axios';
import './style.css';
import ScrollableChat from './ScrollableChat';
import io from 'socket.io-client';

const ENDPOINT = 'http://localhost:5000';
var socket, selectedChatCompare;

const SingleChat = ({ fetchAgain, setFetchAgain }) => {
	const { user, selectedChat, setSelectedChat } = ChatState();
	const [ messages, setMessages ] = useState([]);
	const [ loading, setLoading ] = useState(false);
	const [ newMessage, setNewMessage ] = useState('');
	const [ typing, setTyping ] = useState(false);
	const [ isTyping, setIsTyping ] = useState(false);
	const [ socketConnected, setSocketConnected ] = useState(false);
	const toast = useToast();

	const fetchMessages = async () => {
		if (!selectedChat) return;

		try {
			const config = {
				headers: {
					Authorization: `Bearer ${user.token}`
				}
			};

			setLoading(true);

			const { data } = await axios.get(`/api/message/${selectedChat._id}`, config);
			console.log(messages);
			setMessages(data);
			setLoading(false);

			socket.emit('join chat', selectedChat._id);
		} catch (error) {
			toast({
				title: 'Error Occured!',
				description: 'Failed to Load the Messages',
				status: 'error',
				duration: 5000,
				isClosable: true,
				position: 'bottom'
			});
		}
	};

	useEffect(() => {
		socket = io(ENDPOINT);
		socket.emit('setup', user);
		socket.on('connected', () => setSocketConnected(true));
		socket.on('typing', () => setIsTyping(true));
		socket.on('stop typing', () => setIsTyping(false));
	}, []);

	useEffect(
		() => {
			fetchMessages();

			selectedChatCompare = selectedChat;
			// eslint-disable-next-line
		},
		[ selectedChat ]
	);

	const sendMessage = async (event) => {
		if (event.key === 'Enter' && newMessage) {
			socket.emit('stop typing', selectedChat._id);
			try {
				const config = {
					headers: {
						'Content-type': 'application/json',
						Authorization: `Bearer ${user.token}`
					}
				};
				setNewMessage('');
				const { data } = await axios.post(
					'/api/message',
					{
						content: newMessage,
						chatId: selectedChat._id
					},
					config
				);
				console.log(data);
				socket.emit('new message', data);
				setMessages([ ...messages, data ]);
			} catch (error) {
				toast({
					title: 'Error Occured!',
					description: 'Failed to send the Message',
					status: 'error',
					duration: 5000,
					isClosable: true,
					position: 'bottom'
				});
			}
		}
	};

	useEffect(() => {
		socket.on('message recieved', (newMessageRecieved) => {
			if (
				!selectedChatCompare || // if chat is not selected or doesn't match current chat
				selectedChatCompare._id !== newMessageRecieved.chat._id
			) {
				// if (!notification.includes(newMessageRecieved)) {
				//   setNotification([newMessageRecieved, ...notification]);
				//   setFetchAgain(!fetchAgain);
				// }
			} else {
				setMessages([ ...messages, newMessageRecieved ]);
			}
		});
	});

	const typingHandler = (e) => {
		setNewMessage(e.target.value);

		if (!socketConnected) return;

		if (!typing) {
			setTyping(true);
			socket.emit('typing', selectedChat._id);
		}
		let lastTypingTime = new Date().getTime();
		var timerLength = 3000;
		setTimeout(() => {
			var timeNow = new Date().getTime();
			var timeDiff = timeNow - lastTypingTime;
			if (timeDiff >= timerLength && typing) {
				socket.emit('stop typing', selectedChat._id);
				setTyping(false);
			}
		}, timerLength);
	};

	return (
		<Fragment>
			{selectedChat ? (
				<Fragment>
					<Text
						fontSize={{ base: '28px', md: '30px' }}
						pb={3}
						px={2}
						w="100%"
						fontFamily="Work sans"
						display="flex"
						justifyContent={{ base: 'space-between' }}
						alignItems="center"
					>
						<IconButton
							d={{ base: 'flex', md: 'none' }}
							icon={<ArrowBackIcon />}
							onClick={() => setSelectedChat('')}
						/>
						{!selectedChat.isGroupChat ? (
							<Fragment>
								{getSender(user, selectedChat.users)}
								<ProfileModel user={getSenderFull(user, selectedChat.users)} />
							</Fragment>
						) : (
							<Fragment>
								{selectedChat.chatName.toUpperCase()}
								<UpdateGroupChatModel
									fetchMessages={fetchMessages}
									fetchAgain={fetchAgain}
									setFetchAgain={setFetchAgain}
								/>
							</Fragment>
						)}
					</Text>
					<Box
						display="flex"
						flexDir="column"
						justifyContent="flex-end"
						p={3}
						bg="#E8E8E8"
						w="100%"
						h="100%"
						borderRadius="lg"
						overflowY="hidden"
					>
						{loading ? (
							<Spinner size="xl" w={20} h={20} alignSelf="center" margin="auto" />
						) : (
							<div className="messages">
								<ScrollableChat messages={messages} />
							</div>
						)}
						<FormControl onKeyDown={sendMessage} id="first-name" isRequired mt={3}>
							{isTyping ? <div>Loading....</div> : <Fragment />}
							<Input
								variant="filled"
								bg="#E0E0E0"
								placeholder="Enter a message.."
								value={newMessage}
								onChange={typingHandler}
							/>
						</FormControl>
					</Box>
				</Fragment>
			) : (
				<Box display="flex" alignItems="center" justifyContent="center" h="100%">
					<Text fontSize="3xl" pb={3} fontFamily="Work sans">
						Click on a user to start Chatting
					</Text>
				</Box>
			)}
		</Fragment>
	);
};

export default SingleChat;
