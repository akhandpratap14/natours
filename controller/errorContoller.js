const AppError = require('./../utils/appError');

const handleCastErrorDB = err => {
    const message = `Invalid ${err.path}: ${err.value}`;
    return new AppError(message, 400);
};

const handleDuplicateFieldDB = err => {

    let value = err.keyPattern;
    value = Object.keys(value)[0];

    const duplicateValue = err.keyValue.name;

    const message = `Duplicate field value: ${duplicateValue}. Please use another value!`;

    return new AppError(message, 400);
};

const handleValidationErrorDB = err => {
    const errors = Object.values(err.errors).map(el => el.message);
    const message = `Invalid input data. ${errors.join('. ')}`;
    return new AppError(message, 400);
};

const handleJWTError = () => new AppError('Invalid Token. Please Login Again', 401);

const handleTokenExpiredError = () => new AppError('Your token has expired! Please login Again');

const sendErrorDev = (err, res) => {
    res.status(err.statusCode).json({
        status: err.status,
        error: err,
        message: err.message,
        stack: err.stack
    });
};

const sendErrorProd = (err, res) => {
    if(err.isOperational){
        res.status(err.statusCode).json({
            status: err.status, 
            message: err.message,
        });
    } else {
        console.log('ERROR', err);
        res.status(500).json({
            status: 'error',
            message: 'something went very wrong',
        });
    }
};

module.exports = (err, req, res, next) => {

    // console.log(err.stack);

    err.statusCode = err.statusCode || 500;
    err.status = err.status || 'error';

    if(process.env.NODE_ENV === 'development'){
        sendErrorDev(err, res);
    } else if (process.env.NODE_ENV === 'production'){

        let error = Object.assign(err); 
        
        if(error.name === 'CastError') error = handleCastErrorDB(error);
        if(error.code === 11000) error = handleDuplicateFieldDB(error);
        if(error.name === 'ValidationError') error = handleValidationErrorDB(error);
        if(error.name == 'JasonWebTokenError') error = handleJWTError();
        if(error.name === 'TokenExpiredError') error = handleTokenExpiredError();

        sendErrorProd(error, res);
    }
    next();
};