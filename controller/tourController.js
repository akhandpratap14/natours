const fs = require('fs');
const Tour = require('../models/tourModel');
const catchAsync = require('./../utils/catchAsync');
const AppError = require('../utils/appError');
const factory = require('./handlerFactory');

exports.aliasTopTours = (req, res, next) => {
    req.query.limit = '5';
    req.query.sort = '-ratingsAverage,price';
    req.query.fields = 'name,price,ratingsAverage,summary,difficulty';
    next(); 
};

exports.getTourById = factory.getOne(Tour, { path: 'reviews' });
exports.tourPatch = factory.updateMe(Tour);
exports.createTour = factory.createOne(Tour);
exports.tourDelete = factory.deleteOne(Tour);
exports.getAllTours = factory.getAllDoc(Tour);

// exports.getAllTours = catchAsync(async (req, res) => {

//     const features = new APIFeatures(Tour.find(), req.query)
//     .filter()
//     .limit()
//     .sort()
//     .pagination();

//     // Execute Query
//     const tours = await features.query;

//     res.status(200).json({
//         status: 'Succes',
//         results: tours.length,
//         data: {
//             tours
//         }
//     });
// });

// exports.createTour = catchAsync(async (req, res, next) => {

//     const newTour = await Tour.create(req.body);
//     res.status(200).json({
//         status: 'Success',
//         data: {
//             tour: newTour
//         }
//     });
// });

// exports.getTourById = catchAsync(async (req, res) => {

//     const tour = await Tour.findById(req.params.id).populate('reviews');

//     if(!tour)  {
//         return next(new AppError('No tour found with that ID', 404));
//     }

//     res.status(200).json({
//         status: 'Succes',
//         data: {
//             tour
//         }
//     });
// });

// exports.tourPatch = catchAsync(async (req, res) => {

//     const tour = await Tour.findByIdAndUpdate(req.params.id, req.body, {
//         runValidators: true,
//         new: true
//     });

//     if(!tour)  {
//         return next(new AppError('No tour found with that ID', 404));
//     }

//     res.status(200).json({
//         status: 'Success',
//         tour
//     });
// });

// exports.tourDelete = catchAsync(async (req, res) => {

//     const tour = await Tour.findByIdAndDelete(req.params.id);

//     if(!tour)  {
//         return next(new AppError('No tour found with that ID', 404));
//     }

//     res.status(200).json({
//         status: 'Success',
//         message: 'Tour Deleted'
//     });
// });

exports.getTourStats = catchAsync(async (req, res) => {

    const stats = await Tour.aggregate([
        {
            $match: {ratingsAverage: { $gte: 4.5 }}
        },
        {
            $group: {
                _id: {$toUpper: '$difficulty' },
                numTours: { $sum: 1},
                numRatings: { $sum: '$ratingsQuantity'},
                avgRating: { $avg: '$ratingsAverage'},
                avgPrice: { $avg: '$price' },
                minPrice: { $min: '$price' },
            }
        },
        {
            $sort: { avgPrice: 1}
        },
        {
            $match: { _id: { $ne: 'EASY '}}
        }
    ]);
    res.status(200).json({
        status: 'Success',
        data: stats
    });

});

exports.getMonthlyPlan = catchAsync(async (req, res) => {

    const year = req.params.year * 1;
    const plan = await Tour.aggregate([
        {
            $unwind: '$startDates' 
        },
        {
            $match: {
                startDates: {
                    $gte: new Date(`${year}-01-01`),
                    $lte: new Date(`${year}-12-31`),
                }
            }
        },
        {
            $group: {
                _id: {
                    $month: '$startDates'
                },
                numTourStarts: {
                    $sum: 1
                },
                tours: { $push: '$name'}
            },
            
        },
        {
            $addFields: { month: '$_id' }
        },
        {
            $project: {
                _id: 0
            }
        },
        {
            $sort: {
                numTourStarts: -1
            }
        },
        {
            $limit: 12 
        }
    ]);
    res.status(200).json({
        status: 'Success',
        data: plan
    });

});