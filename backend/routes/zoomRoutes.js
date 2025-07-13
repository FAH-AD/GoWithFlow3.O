import express from 'express';
import { createZoomMeeting } from '../zoom/zoomMeeting.js';

const router = express.Router();

router.post('/meeting', async (req, res) => {
  try {
    const { topic } = req.body;
    const meeting = await createZoomMeeting(topic);
    res.status(200).json(meeting);
  } catch (err) {
    console.error('Zoom meeting error:', err.response?.data || err.message);
    res.status(500).json({ error: 'Failed to create Zoom meeting' });
  }
});

export default router;
