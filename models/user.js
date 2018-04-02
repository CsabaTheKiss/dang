const mongoose = require('mongoose');
const Schema = mongoose.Schema;
mongoose.Promise = global.Promise;

const md5 = require('md5');
const validator = require('validator');
const mongodbErrorHandler = require('mongoose-mongodb-errors');
const passportLocalMongoose = require('passport-local-mongoose');

const userSchema = new Schema({
    email: {
        type: String,
        unique: true,
        lowercase: true,
        trim: true,
        validate: [ validator.isEmail, 'Invalid Email Address' ],
        required: 'Please supply an email address'
    },
    name: {
        type: String,
        required: 'Please supply a name',
        trim: true
    }
});

// adding authetincation to the Schema, using email address for auth.
userSchema.plugin(passportLocalMongoose, { usernameField: 'email' });
// 'unique' gives ugly errors, this one adds much nicer errors for that
userSchema.plugin(mongodbErrorHandler);

module.exports = mongoose.model('User', userSchema);
