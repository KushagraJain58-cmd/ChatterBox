const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = mongoose.Schema(
	{
		name: { type: 'String', required: true },
		email: { type: 'String', required: true, unique: true },
		password: { type: 'String', required: true },
		pic: {
			type: 'String',
			default: 'https://icon-library.com/images/anonymous-avatar-icon/anonymous-avatar-icon-25.jpg'
		}
	},
	{
		timestamps: true
	}
);

userSchema.methods.matchPassword = async function(enteredPass) {
	return await bcrypt.compare(enteredPass, this.password);
};

userSchema.pre('save', async function(next) {
	if (!this.isModified) {
		//if current pass is not modified then move on to the next)don't run the code after it
		next();
	}

	const salt = await bcrypt.genSalt(10); //encryption
	this.password = await bcrypt.hash(this.password, salt);
}); //before saving user to our db, it's gonna encrypt the pass

const User = mongoose.model('User', userSchema);

module.exports = User;
