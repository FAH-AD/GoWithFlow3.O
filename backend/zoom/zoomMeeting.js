import axios from 'axios';
import { getZoomAccessToken } from './zoomAuth.js';
import dotenv from 'dotenv';
dotenv.config();

export const createZoomMeeting = async (topic = "Chat Zoom Meeting") => {
  const accessToken = await getZoomAccessToken();

  const payload = {
    topic,
    type: 1, // Instant meeting
    settings: {
      host_video: true,
      participant_video: true,
      join_before_host: true,
    },
  };

  const response = await axios.post(
    `https://api.zoom.us/v2/users/${process.env.ZOOM_USER_ID}/meetings`,
    payload,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    }
  );

  return response.data;
};
