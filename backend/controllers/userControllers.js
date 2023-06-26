const asyncHandler = require('express-async-Handler');
const User = require('../models/userModel');
const generateToken = require('../config/generateToken');

//@description     Register new user
//@route           POST /api/user/
//@access          Public

const registerUser = asyncHandler(async (req, res) => {
	const { name, email, password, pic } = req.body;

	if (!name || !email || !password) {
		res.status(400);
		throw new Error('Please Enter all the Fields');
	}

	const userExists = await User.findOne({ email });

	if (userExists) {
		res.status(400);
		throw new Error('User already exists');
	}

	const user = await User.create({
		name,
		email,
		password,
		pic
	});

	if (user) {
		res.status(201).json({
			_id: user._id,
			name: user.name,
			email: user.email,
			pic: user.pic,
			token: generateToken(user._id)
		});
	} else {
		res.status(400);
		throw new Error('Failed to Create the User');
	}
});

//@description     Auth the user
//@route           POST /api/users/login
//@access          Public

const authUser = asyncHandler(async (req, res) => {
	//login our user
	const { email, password } = req.body;

	const user = await User.findOne({ email });

	if (user && (await user.matchPassword(password))) {
		//if user exists and password matches
		res.json({
			_id: user._id,
			name: user.name,
			email: user.email,
			pic: user.pic,
			token: generateToken(user._id)
		});
	} else {
		res.status(400);
		throw new Error('Invalid Email or Password');
	}
});

// /api/user?search=kush

const allUsers = asyncHandler(async (req, res) => {
	const keyword = req.query.search
		? {
				$or: [
					{ name: { $regex: req.query.search, $options: 'i' } }, //check if the query inside the search matches the name of the user
					{ email: { $regex: req.query.search, $options: 'i' } }
				]
			}
		: {};

	const users = await User.find(keyword).find({ _id: { $ne: req.user._id } }); //except the current user, return all other user that is part of search result
	res.send(users);
});

module.exports = { registerUser, authUser, allUsers };
