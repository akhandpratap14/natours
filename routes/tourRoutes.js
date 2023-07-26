const express = require('express');
const tourController = require('./../controller/tourController');
const authController = require('./../controller/authController');
const reviewRouter = require('./../routes/reviewRoutes');

const router = express.Router();

router.route('/top-5-cheap').get(tourController.aliasTopTours, tourController.getAllTours);

router.route('/tour-stats').get(tourController.getTourStats);
router.route('/monthly-plan/:year').get(authController.protect, authController.restrictTo('admin', 'lead-guide', 'guide'), tourController.getMonthlyPlan);

router.route('/').get(tourController.getAllTours).
    post(authController.restrictTo('admin', 'lead-guide'),tourController.createTour);

router.route('/:id').get(authController.protect, 
    authController.restrictTo('admin'), tourController.getTourById).
    patch(tourController.tourPatch).delete(authController.protect, 
    authController.restrictTo('admin'), 
    tourController.tourDelete);


router.use('/:tourId/reviews', reviewRouter);

module.exports = router;








