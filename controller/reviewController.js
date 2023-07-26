const catchAsync = require('./../utils/catchAsync');
const Review = require('../models/reviewModel');
const factory = require('./handlerFactory');

exports.createReview = factory.createOne(Review);
exports.reviewPatch = factory.updateMe(Review);
exports.deleteReview = factory.deleteOne(Review);
exports.getReviewById = factory.getOne(Review);
exports.getAllReview = factory.getAllDoc(Review);

exports.setToursUserIds = catchAsync( async (req, res, next) => {
    if(!req.body.tour) req.body.tour = req.params.tourId;
    if(!req.body.user) req.body.user = req.user.id;
    next();
});

// exports.createReview = catchAsync(async (req, res, next) => {

//     const reviews = await Review.create(req.body);
//     res.status(200).json({
//         status: 'Success',
//         data: {
//             tour: reviews
//         }
//     });

//     console.log(req.requestTime);

// });

// exports.getAllReview = catchAsync( async (req, res, next) => {

    // let filter = {};

    // if(req.params.tourId) filter = { tour: req.params.tourId };

//     const reviews = await Review.find(filter);

//     res.status(200).json({
//         status: 'Succes',
//         results: reviews.length,
//         data: {
//             reviews
//         }
//     });

//     console.log(req.requestTime);

// });


