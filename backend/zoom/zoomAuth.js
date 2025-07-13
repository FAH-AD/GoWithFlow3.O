import axios from 'axios';
import qs from 'qs';
import dotenv from 'dotenv';
dotenv.config();

export const getZoomAccessToken = async () => {
  const tokenUrl = `https://zoom.us/oauth/token`;

  const payload = qs.stringify({
    grant_type: 'account_credentials',
    account_id: process.env.ZOOM_ACCOUNT_ID,
  });

  const basicAuth = Buffer.from(
    `${process.env.ZOOM_CLIENT_ID}:${process.env.ZOOM_CLIENT_SECRET}`
  ).toString('base64');

  const headers = {
    Authorization: `Basic ${basicAuth}`,
    'Content-Type': 'application/x-www-form-urlencoded',
  };

  const response = await axios.post(tokenUrl, payload, { headers });

  return response.data.access_token;
};
