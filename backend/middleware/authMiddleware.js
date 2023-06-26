const jwt = require('jsonwebtoken');
const asyncHandler = require('express-async-Handler');
const User = require('../models/userModel');

const protect = asyncHandler(async (req, res, next) => {
	let token;
	if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
		//means we have the token
		try {
			token = req.headers.authorization.split(' ')[1]; //Bearer modisnvxdf     //so here we remove the bearer and take the token

			//decode token id
			const decoded = jwt.verify(token, process.env.JWT_SECRET);
			req.user = await User.findById(decoded.id).select('-password'); //find the user in our db and return it without the password

			next(); //move on to the next operation
		} catch (error) {
			res.status(401);
			throw new Error('Not authorized, token failed');
		}
	}

	if (!token) {
		res.status(401);
		throw new Error('Not authorized, no token');
	}
});

module.exports = {
	protect
};
