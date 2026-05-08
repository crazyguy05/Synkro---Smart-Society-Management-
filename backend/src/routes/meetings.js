import { Router } from 'express';
import {
  listMeetings, getMeeting, createMeeting, updateMeeting, deleteMeeting,
  setRsvp, addMotion, voteMotion, closeMotion,
} from '../controllers/meetingController.js';
import { auth } from '../middleware/auth.js';

const router = Router();

// listing / detail — any authenticated society member
router.get('/',    auth(), listMeetings);
router.get('/:id', auth(), getMeeting);

// admin actions
router.post('/',       auth('admin'), createMeeting);
router.patch('/:id',   auth('admin'), updateMeeting);
router.delete('/:id',  auth('admin'), deleteMeeting);
router.post('/:id/motions', auth('admin'), addMotion);
router.patch('/:id/motions/:motionId/close', auth('admin'), closeMotion);

// member actions
router.post('/:id/rsvp',                     auth(), setRsvp);
router.post('/:id/motions/:motionId/vote',   auth(), voteMotion);

export default router;
