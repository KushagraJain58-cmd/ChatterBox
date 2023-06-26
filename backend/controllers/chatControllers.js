const asyncHandler = require('express-async-handler');
const Chat = require('../models/chatModel');
const User = require('../models/userModel');

const accessChat = asyncHandler(async (req, res) => {
	//creating or fetching one on one chat
	const { userId } = req.body; //this is the user id we are sending
	if (!userId) {
		console.log('UserId param not sent with request');
		return res.sendStatus(400);
	}

	var isChat = await Chat.find({
		isGroupChat: false,
		$and: [
			{ users: { $elemMatch: { $eq: req.user._id } } }, //it should be equal to current user logged in and the user id we are sending
			{ users: { $elemMatch: { $eq: userId } } }
		]
	})
		.populate('users', '-password')
		.populate('latestMessage');

	isChat = await User.populate(isChat, {
		//final data of our chat
		path: 'latestMessage.sender',
		select: 'name pic email'
	});

	if (isChat.length > 0) {
		res.send(isChat[0]);
	} else {
		var chatData = {
			chatName: 'sender',
			isGroupChat: false,
			users: [ req.user._id, userId ] //current logged in user and user id with which we are creating a chat
		};
		try {
			const createdChat = await Chat.create(chatData);

			const FullChat = await Chat.findOne({ _id: createdChat.id }).populate('users', '-password');

			res.status(200).send(FullChat);
		} catch (error) {
			res.status(400);
			throw new Error(error.message);
		}
	}
});

const fetchChats = asyncHandler(async (req, res) => {
	try {
		Chat.find({ users: { $elemMatch: { $eq: req.user._id } } })
			.populate('users', '-password')
			.populate('groupAdmin', '-password')
			.populate('latestMessage')
			.sort({ updatedAt: -1 })
			.then(async (results) => {
				results = await User.populate(results, {
					path: 'latestMessage.sender',
					select: 'name pic email'
				});
				res.status(200).send(results);
			});
	} catch (error) {
		res.status(400);
		throw new Error(error.message);
	}
});

const createGroupChat = asyncHandler(async (req, res) => {
	if (!req.body.users || !req.body.name) {
		return res.status(400).send({ message: 'Please fill all the feilds' });
	}

	var users = JSON.parse(req.body.users);

	if (users.length < 2) {
		return res.status(400).send('More than 2 users are required to form a group chat');
	}

	users.push(req.user); //current user logged in

	try {
		const groupChat = await Chat.create({
			chatName: req.body.name,
			users: users,
			isGroupChat: true,
			groupAdmin: req.user
		});

		const fullGroupChat = await Chat.findOne({ _id: groupChat._id })
			.populate('users', '-password')
			.populate('groupAdmin', '-password');

		res.status(200).json(fullGroupChat);
	} catch (error) {
		res.status(400);
		throw new Error(error.message);
	}
});

const renameGroup = asyncHandler(async (req, res) => {
	const { chatId, chatName } = req.body;

	const updatedChat = await Chat.findByIdAndUpdate(
		chatId,
		{
			chatName
		},
		{
			new: true //return the updated value
		}
	)
		.populate('users', '-password')
		.populate('groupAdmin', '-password');

	if (!updatedChat) {
		res.status(404);
		throw new Error('Chat Not Found');
	} else {
		res.json(updatedChat);
	}
});

const addToGroup = asyncHandler(async (req, res) => {
	const { chatId, userId } = req.body;

	const added = await Chat.findByIdAndUpdate(
		chatId,
		{
			$push: { users: userId } //push inside the user array the user id which we were suppose to add in the group
		},
		{
			new: true
		}
	)
		.populate('users', '-password')
		.populate('groupAdmin', '-password');
	if (!added) {
		res.status(404);
		throw new Error('Chat Not Found');
	} else {
		res.json(added);
	}
});

const removeFromGroup = asyncHandler(async (req, res) => {
	const { chatId, userId } = req.body;

	const removed = await Chat.findByIdAndUpdate(
		chatId,
		{
			$pull: { users: userId } //push inside the user array the user id which we were suppose to add in the group
		},
		{
			new: true
		}
	)
		.populate('users', '-password')
		.populate('groupAdmin', '-password');
	if (!removed) {
		res.status(404);
		throw new Error('Chat Not Found');
	} else {
		res.json(removed);
	}
});

module.exports = {
	accessChat,
	fetchChats,
	createGroupChat,
	renameGroup,
	addToGroup,
	removeFromGroup
};
