import axios from 'axios';
import { auth } from '../firebase';

const API_URL = `${import.meta.env.VITE_API_URL}`;

// Get auth token for API requests
const getAuthToken = async (): Promise<string> => {
  const user = auth.currentUser;
  if (!user) throw new Error('No authenticated user');
  return await user.getIdToken();
};

export interface Donor {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  address?: {
    street?: string;
    city?: string;
    state?: string;
    zipCode?: string;
    country?: string;
  };
  firebaseUid: string;
  createdAt: string;
  isVerified: boolean;
  stats: {
    totalDonations: number;
    completedDonations: number;
    pendingDonations: number;
  };
}

export interface DonorsResponse {
  success: boolean;
  count: number;
  data: Donor[];
}

// Get all donors (Admin only)
export const getAllDonors = async (): Promise<DonorsResponse> => {
  try {
    const token = await getAuthToken();
    const response = await axios.get(`${API_URL}/users/admin/donors`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching donors:', error);
    throw error;
  }
};

export interface NotificationPayload {
  donorFirebaseUid: string;
  title: string;
  message: string;
}

export interface NotificationResponse {
  success: boolean;
  message: string;
  data: {
    donorFirebaseUid: string;
    title: string;
    message: string;
    sentAt: string;
  };
}

// Send notification to donor (Admin only)
export const sendNotificationToDonor = async (
  payload: NotificationPayload
): Promise<NotificationResponse> => {
  try {
    const token = await getAuthToken();
    const response = await axios.post(
      `${API_URL}/users/admin/notify`,
      payload,
      {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        }
      }
    );
    return response.data;
  } catch (error) {
    console.error('Error sending notification:', error);
    throw error;
  }
};

