const express = require('express');
const morgan = require('morgan');
const AppError = require('./utils/appError');
const globalErrorHandler = require('./controller/errorContoller')
const UserRouter = require('./routes/userRoutes');
const TourRouter = require('./routes/tourRoutes'); 
const ReviewRouter = require('./routes/reviewRoutes'); 
const viewsRouter = require('./routes/viewsRoutes'); 
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');
const path = require('path');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const app = express(); 

app.set('view engine', 'pug');
app.set('views', path.join(__dirname, 'views'));

// GLOBAL MIDDLEWARE

// Serving Static files 
// app.use(express.static(`${__dirname}/public`));
app.use(express.static(path.join(__dirname, 'public')));

app.use(
    cors({
      origin: 'http://localhost:5000',
      credentials: true,
    })
);

// Set Security HTTP headers
app.use(helmet.contentSecurityPolicy({
    directives: {
        defaultSrc: ["'self'", 'https:', 'http:', 'data:', 'ws:'],
        baseUri: ["'self'"],
        fontSrc: ["'self'", 'https:', 'http:', 'data:'],
        scriptSrc: ["'self'", 'https:', 'http:', 'blob:'],
        styleSrc: ["'self'", "'unsafe-inline'", 'https:', 'http:'],
    },
    })
    );

// Development Logging 
if(process.env.NODE_ENV === 'development'){
    app.use(morgan('dev'));
}

// Limit requests from same API
const limiter = rateLimit({
    max: 50,
    windowMs: 60 * 60 * 1000,
    message: 'Too many requests from this IP, please try again in an hour'
});

app.use(limiter);

// Body Parser, reading data from body into req.body
app.use(express.json({ limit: '10kb' }));
app.use(cookieParser());

// Data sanitization against NoSQL query Injection
app.use(mongoSanitize());

// Data sanitization against XSS
app.use(xss());

// Prevent parameter pollution 
app.use(hpp({
    whitelist: [
        'duration', 'ratingsQuantity', 'ratingsAverage', 'maxGroupSize', 'difficulty', 'price'
    ]
}));

// Test Middleware
app.use((req, res, next) => {
    req.requestTime = new Date().toISOString();
    console.log(req.cookies);
    next();
});

// ROUTES
app.use('/', viewsRouter);
app.use('/api/v1/tours', TourRouter);
app.use('/api/v1/users', UserRouter);
app.use('/api/v1/reviews', ReviewRouter);

app.all('*', (req, res, next) => {
    next(new AppError(`Cant find ${req.originalUrl} on this server`));
});

app.use(globalErrorHandler);

module.exports = app;
