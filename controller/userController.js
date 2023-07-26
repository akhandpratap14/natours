const User = require('../models/userModel');
const catchAsync = require('./../utils/catchAsync');
const AppError = require('../utils/appError');
const factory = require('./handlerFactory');

const filterObj = (obj, ...allowedFields) => {
    const newObj = { };
    Object.keys(obj).forEach(el => {
        if(allowedFields.includes(el)) newObj[el] = obj[el];
    });
    return newObj;
}

exports.updateMe = catchAsync( async(req, res, next) => {

    // 1. create error if user Post password data
    if((req.body.password || req.body.passwordConfirm)){
        return next(new AppError('This route is not for password updates. Please use /updateMyPassword.', 400));
    }

    // 2. Filtered out unwanted fields names that are not allowed to be updated
    const filteredBody = filterObj(req.body, 'name', 'email');

    // 3. Update user document
    const updatedUser = await User.findById(req.user.id, filteredBody, {new: true, runValidators: true});

    res.status(200).json({
        status: 'success',
        data: updatedUser
    });
});

exports.deleteMe = catchAsync( async (req, res, next) => {

    await User.findByIdAndUpdate(req.user.id, { active: false });

    res.status(204).json({
        status: 'success',
        data: null
    })

});

exports.getMe = catchAsync( async (req, res, next) => {
    req.params.id = req.user.id;
    next();
});

exports.updateUserById = factory.updateMe(User);
exports.deleteUser = factory.deleteOne(User);
exports.getUserById = factory.getOne(User);
exports.getAllUsers = factory.getAllDoc(User);

// exports.getAllUsers = catchAsync(async (req, res) => {
//     const users = await User.find();

//     res.status(200).json({
//         status: 'Succes',
//         results: users.length,
//         data: {
//             users
//         }
//     });
//     console.log(req.requestTime);
// });

// exports.getUserById = (req, res) => {
//     console.log(req.requestTime);
//     res.status(500).json({
//         status: 'Failed',
//         requestedAt: req.requestTime,
//         message: 'No Method Implented'
//     })
// }

// exports.updateUserById = (req, res) => {
//     console.log(req.requestTime);
//     res.status(500).json({
//         status: 'Failed',
//         requestedAt: req.requestTime,
//         message: 'No Method Implented'
//     })
// }


