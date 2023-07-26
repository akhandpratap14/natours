const catchAsync = require('./../utils/catchAsync');
const AppError = require('../utils/appError');
const APIFeatures = require('./../utils/apiFeatures');

exports.createOne = Model => catchAsync(async (req, res, next) => {

    const newDoc = await Model.create(req.body);
    res.status(200).json({
        status: 'Success',
        data: {
            tour: newDoc
        }
    });
});

exports.deleteOne = Model => catchAsync(async (req, res, next) => {

    const doc = await Model.findByIdAndDelete(req.params.id);

    if(!doc)  {
        return next(new AppError('No document found with that ID', 404));
    }

    res.status(204).json({
        status: 'Success',
        message: 'Tour Deleted'
    });
});

exports.updateMe = Model => catchAsync(async (req, res) => {

    const doc = await Model.findByIdAndUpdate(req.params.id, req.body, {
        runValidators: true,
        new: true
    });

    if(!doc)  {
        return next(new AppError('No doc found with that ID', 404));
    }

    res.status(200).json({
        status: 'Success',
        doc
    });
});

exports.getOne = (Model, popOptions) =>catchAsync(async (req, res) => {

    let query = await Model.findById(req.params.id);

    if(popOptions) query = query.populate(popOptions);

    const doc =  await query;

    // const doc = await Model.findById(req.params.id).populate('reviews');

    if(!doc)  {
        return next(new AppError('No doc found with that ID', 404));
    }

    res.status(200).json({
        status: 'Succes',
        data: {
            doc
        }
    });
});

exports.getAllDoc = Model => catchAsync(async (req, res) => {

    let filter = {};

    if(req.params.tourId) filter = { tour: req.params.tourId };

    const features = new APIFeatures(Model.find(filter), req.query)
    .filter()
    .limit()
    .sort()
    .pagination();

    // Execute Query
    const doc = await features.query;

    res.status(200).json({
        status: 'Succes',
        results: doc.length,
        data: {
            doc
        }
    });
});
