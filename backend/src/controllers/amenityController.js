import Amenity from '../models/amenity.js';

// Admin: create amenity
export const createAmenity = async (req, res) => {
  try {
    const amenity = await Amenity.create(req.body);
    res.json(amenity);
  } catch (e) {
    res.status(500).json({ message: 'Failed to create amenity' });
  }
};

// Admin: delete amenity
export const deleteAmenity = async (req, res) => {
  try {
    await Amenity.findByIdAndDelete(req.params.id);
    res.json({ message: 'Deleted' });
  } catch (e) {
    res.status(500).json({ message: 'Failed to delete amenity' });
  }
};

// Admin: toggle availability
export const toggleAvailability = async (req, res) => {
  try {
    const amenity = await Amenity.findById(req.params.id);
    if (!amenity) return res.status(404).json({ message: 'Not found' });
    amenity.available = !amenity.available;
    await amenity.save();
    res.json(amenity);
  } catch (e) {
    res.status(500).json({ message: 'Failed to update' });
  }
};

// All: list amenities
export const listAmenities = async (_req, res) => {
  try {
    const amenities = await Amenity.find()
      .populate('bookings.resident', 'name apartment email')
      .sort('name');
    res.json(amenities);
  } catch (e) {
    res.status(500).json({ message: 'Failed to fetch amenities' });
  }
};

// Resident: request booking
export const requestBooking = async (req, res) => {
  try {
    const { date, timeSlot, purpose } = req.body;
    if (!date || !timeSlot) return res.status(400).json({ message: 'Date and time slot required' });
    const amenity = await Amenity.findById(req.params.id);
    if (!amenity) return res.status(404).json({ message: 'Amenity not found' });
    if (!amenity.available) return res.status(400).json({ message: 'Amenity is not available' });
    amenity.bookings.push({ resident: req.user.id, date, timeSlot, purpose });
    await amenity.save();
    await amenity.populate('bookings.resident', 'name apartment email');
    res.json(amenity);
  } catch (e) {
    res.status(500).json({ message: 'Failed to request booking' });
  }
};

// Admin: approve or reject booking
export const updateBookingStatus = async (req, res) => {
  try {
    const { status, adminNote } = req.body;
    if (!['approved', 'rejected'].includes(status))
      return res.status(400).json({ message: 'Invalid status' });
    const amenity = await Amenity.findById(req.params.id);
    if (!amenity) return res.status(404).json({ message: 'Amenity not found' });
    const booking = amenity.bookings.id(req.params.bookingId);
    if (!booking) return res.status(404).json({ message: 'Booking not found' });
    booking.status = status;
    if (adminNote) booking.adminNote = adminNote;
    await amenity.save();
    await amenity.populate('bookings.resident', 'name apartment email');
    res.json(amenity);
  } catch (e) {
    res.status(500).json({ message: 'Failed to update booking' });
  }
};
