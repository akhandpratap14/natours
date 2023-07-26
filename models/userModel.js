/* eslint-disable node/no-unsupported-features/es-syntax */
/* eslint-disable prettier/prettier */
const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

// name , email , photo, passord, password confirm 

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        require: [true, 'A tour must have Name'],
    },

    email: {
        type: String,
        unique: true,
        require: [true, 'Please provide your email'],
        lowercase: true,
        validator: [validator.isEmail, 'Please provide a valid email']
    },

    photo: String,

    password: {
        type: String,
        required: [true, 'Please provide a password'],
        minlength: 8,
        select: false
    },

    passwordConfirm: {
        type: String,
        requiured: [true, 'Please confirm password'],
        validator: {
            validator: function(el){
                return el === this.password;
            }
        }
    }, 

    role: {
        type: String,
        enum: ['user', 'guide', 'lead-guide', 'admin'],
        default: 'user'
    },

    // panel: String,

    passwordChangedAt: {
        type: Date
    },

    passwordResetToken: {
        type: String
    },

    passwordResetExpires: {
        type: Date
    },

    active: {
        type: Boolean,
        default: true,
        select: true
    }

});

userSchema.pre('save', async function(next) {
    if(!this.isModified('password')) return next();

    this.password = await bcrypt.hash(this.password, 12);

    this.passwordConfirm = undefined;

    next();

});

userSchema.pre('save', function(next){
    
    if(!this.isModified('password') || this.isNew) return next();

    this.passwordChangedAt = Date.now() - 1000;

    next();

});

userSchema.pre(/^find/, function(next) {

    // this points to current query 
    this.find({ active: { $ne: false } });
    next();

});


userSchema.methods.correctPassword = async function(canidatePassword, userPassword){
    return await bcrypt.compare(canidatePassword, userPassword);
}

userSchema.methods.changedPasswordAfter = function(JWTTimestamp) {

    if(this.passwordChangedAt){
        const changedTimestamp = parseInt(this.passwordChangedAt.getTime() / 1000);
        console.log(this.passwordChangedAt, JWTTimestamp);
        return JWTTimestamp < changedTimestamp;
    }

    return false;
};

userSchema.methods.createPasswordResetToken = function(){
    const resetToken = crypto.randomBytes(32).toString('hex');
    this.passwordResetToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');

    this.passwordResetExpires = Date.now() + 10 * 60 * 1000;

    console.log({resetToken}, " ::::{",this.passwordResetExpires, "}");

    console.log("reset user><><><><> ",resetToken);
    
    return resetToken;
};

const User = mongoose.model('User', userSchema);

module.exports = User;