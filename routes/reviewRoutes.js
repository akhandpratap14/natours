const express = require('express');
const reviewController = require('./../controller/reviewController');
const authController = require('./../controller/authController');

const router = express.Router({ mergeParams: true });

router.use(authController.protect);

router.route('/').get(reviewController.getAllReview).post(
    authController.restrictTo('user'), 
    reviewController.setToursUserIds, reviewController.createReview);

router.route('/:id').delete(reviewController.deleteReview).
    patch(authController.restrictTo('user', 'admin'), reviewController.reviewPatch).
    get(reviewController.getReviewById);

// router.get('/getAllReview', authController.protect, reviewController.getAllReview);
// router.post('/createReview', authController.protect, authController.restrictTo('user'), reviewController.createReview);

module.exports = router;
