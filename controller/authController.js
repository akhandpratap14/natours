const { promisify } = require('util');
const User = require('./../models/userModel');
const catchAsync = require('./../utils/catchAsync');
const jwt = require('jsonwebtoken');
const AppError = require('./../utils/appError');
const senEMail = require('./../utils/email');
const sendEmail = require('./../utils/email');
const crypto = require('crypto');
const factory = require('./handlerFactory');

const signToken = id => {
    return jwt.sign({id}, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRES_IN
    });
};

const createSendToken = (user, statusCode, res) => {
    const token = signToken(user._id);

    const cookieOptions = {
        expires: new Date(Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000),
        secure: true,
        httpOnly: true
    };

    if(process.env.NODE_ENV === 'production') cookieOptions.secure = true;

    res.cookie('jwt', token, cookieOptions);

    // remove password form output 
    user.password = undefined;

    res.status(statusCode).json({
        status: 'success',
        token,
        data: {
            user
        }
    });
};

exports.signup = catchAsync(async (req, res, next) => {
    const newUser = await User.create({
        name: req.body.name,
        email: req.body.email,
        password: req.body.password,
        passwordConfirm: req.body.passwordConfirm,
        role: req.body.role
    });
    createSendToken(newUser, 201, res);
});

exports.login = catchAsync( async (req, res, next) => {

    const { email, password } = req.body;

    // 1. check if email and pasword exist
    if(!email|| !password){
        return next(new AppError('Please provide email and password', 400));
    }

    //2. Check if user exists && password is correct
    const user = await User.findOne({ email }).select('+password');

    if(!user || (!await user.correctPassword(password, user.password))){
        return next(new AppError('Incorrect email or password', 401));
    }

    // 3. if everything ohkay, send token to client
    createSendToken(user, 201, res);
});

exports.isLoggedIn = catchAsync(async(req, res, next) => {

    if (req.cookies.jwt) {
        // 2. Verification token 
        const decoded = await promisify(jwt.verify)(req.cookies.jwt, process.env.JWT_SECRET);

    // 3. Check if user still exists
    const freshUser = await User.findById(decoded.id);
    console.log('fresherUser:::', freshUser);

    if(!freshUser){
        return next();
    }

    // 4. Check if user changed password after the token was issued
    if(freshUser.changedPasswordAfter(decoded.iat)){
        return next();
    }

    // THERE IS ALOGGED IN USER
    res.locals.user = freshUser;
    return next();
    }
    next();
});


exports.protect = catchAsync(async(req, res, next) => {

    // 1. Getting the token and check if its exist
    let token;
    if(req.headers.authorization && req.headers.authorization.startsWith('Bearer')){
        token = req.headers.authorization.split(' ')[1];
        // console.log("req.headers.authorizationreq.headers.authorization::", req.headers.authorization);
        // console.log("tokentokentoken::", token);
    } 
    else if (req.cookies.jwt) {
        token = req.cookies.jwt;
    }

    if(!token){
        return next( new AppError('You are not logged in. Please log in to get access', 401))
    }

    // 2. Verification token 
    const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);

    // 3. Check if user still exists
    const freshUser = await User.findById(decoded.id);
    if(!freshUser){
        return next(new AppError('The user belonging to this Token no longer exist', 401 ));
    }

    // 4. Check if user changed password after the token was issued
    if(freshUser.changedPasswordAfter(decoded.iat)){
        return next(new AppError('User recently changed Password! Please log in again', 401));
    }

    // GRANT ACCES TO PROTECTED ROUTE
    req.user = freshUser;
    next();
});

exports.restrictTo = (...roles) => {
    return (req, res, next) => {
        // roles ['admin', 'lead-guide'], role='user'
        if(!roles.includes(req.user.role)){
            return next(new AppError('You do not have permission to perform this action', 403));
        }
        next();
    }
};
exports.forgetPassword = catchAsync(async (req, res, next) => {
    // 1. Get user based on Posted Email
    const user = await User.findOne({ email: req.body.email });
    if(!user){
        return next(new AppError('There is no user with this email address.', 404));
    }

    // 2. Generate the random reset token
    const resetToken = user.createPasswordResetToken();
    await user.save({validateBeforeSave: false});

    // console.log("reserToken:::::>>>>", resetToken);

    // 3. Send it to user's email
    const resetURL = `${req.protocol}://${req.get('host')}/api/v1/users/resetPassword/${resetToken}`;
    // console.log("resetURL:::::>>>>", resetURL);

    const message = `Forget your password? Submit a PATCH request with your new password and
    passwordConfirm to: ${resetURL}. \n If you didntforget your password, please ignore this email!`;

    try {
        await sendEmail({
            email: user.email,
            subject: 'Your password reset token valid for 10 min',
            message
        });
    
        res.status(200).json({
            status: 'success',
            message: 'Token sent to email!'
        });

    } catch (err){
        user.passwordResetToken = undefined;
        user.passwordResetExpires = undefined;
        await user.save({validateBeforeSave: false});

        // res.status(500).json({
        //     status: 'success',
        //     message: err
        // });

        return next(new AppError('There was an error sending the email. try again later!', 500));
    }

});

exports.resetPassword = catchAsync( async (req, res, next) => {

    // 1. Get user based on the token 
    const hashedToken = crypto.createHash('sha256').update(req.params.token).digest('hex');

    // console.log(":::::", hashedToken);

    const user = await User.findOne({
        passwordResetToken: hashedToken,
        passwordResetExpires: {$gt: Date.now()}
    });

    // console.log(">>>>>>>", user);

    // 2. If token has not expired, and there is user, set the new password
    if(!user){
        return next(new AppError('Token is valid or has expired', 400))
    }

    user.password = req.body.password;
    user.passwordConfirm = req.body.passwordConfirm;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save();

    // 3. Update changedPasswordAt property

    // 4. Log the user in, send JWT
    createSendToken(user, 201, res);

});

exports.updatePasword = catchAsync( async (req, res, next) => {

    // console.log("<<<<<<<<<<<<<<<<<<<>>>>>>>>>>>>>>>>", req.body);

    // 1. Get user from the collection 
    const user = await User.findById(req.user.id).select('+password');
    // console.log("<<<<<<<<<<<<<<<<<<<>>>>>>>>>>>>>>>>",req.body);
    
    // 2. Check if posted password is correct 
    if (!(await user.correctPassword(req.body.passwordCurrent, user.password))){
        return next(new AppError('Your current password is wrong.', 401));
    }

    // 3. If the password is correct then update the password
    user.password = req.body.password;
    user.passwordConfirm = req.body.passwordConfirm;
    await user.save();
    user.find

    // 4. log user in, send jwt 
    createSendToken(user, 201, res);
});