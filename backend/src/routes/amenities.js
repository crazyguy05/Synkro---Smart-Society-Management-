import { Router } from 'express';
import { auth } from '../middleware/auth.js';
import { createAmenity, deleteAmenity, toggleAvailability, listAmenities, requestBooking, updateBookingStatus } from '../controllers/amenityController.js';

const router = Router();

router.get('/', auth(), listAmenities);
router.post('/', auth('admin'), createAmenity);
router.delete('/:id', auth('admin'), deleteAmenity);
router.patch('/:id/toggle', auth('admin'), toggleAvailability);
router.post('/:id/book', auth('resident'), requestBooking);
router.patch('/:id/bookings/:bookingId', auth('admin'), updateBookingStatus);

export default router;
