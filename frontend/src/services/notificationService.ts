import axios from 'axios';
import { auth } from '../firebase';

const API_URL = 'http://localhost:5000/api/v1';

// Get auth token for API requests
const getAuthToken = async (): Promise<string> => {
  const user = auth.currentUser;
  if (!user) throw new Error('No authenticated user');
  return await user.getIdToken();
};

export interface Notification {
  _id: string;
  recipientFirebaseUid: string;
  category: 'donations' | 'pickups' | 'system';
  title: string;
  message: string;
  donationId?: string;
  redirectUrl?: string;
  read: boolean;
  readAt: string | null;
  createdAt: string;
  updatedAt: string;
  donationId_populated?: {
    resourceType: string;
    status: string;
  };
}

export interface NotificationsResponse {
  success: boolean;
  count: number;
  unreadCount: number;
  data: Notification[];
}

// Get all notifications for logged in donor
export const getMyNotifications = async (params?: {
  category?: string;
  includeRead?: boolean;
  limit?: number;
}): Promise<NotificationsResponse> => {
  try {
    const token = await getAuthToken();
    const response = await axios.get(`${API_URL}/notifications`, {
      headers: { Authorization: `Bearer ${token}` },
      params
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching notifications:', error);
    throw error;
  }
};

// Mark notification as read
export const markNotificationAsRead = async (id: string): Promise<any> => {
  try {
    const token = await getAuthToken();
    const response = await axios.put(
      `${API_URL}/notifications/${id}/read`,
      {},
      {
        headers: { Authorization: `Bearer ${token}` }
      }
    );
    return response.data;
  } catch (error) {
    console.error('Error marking notification as read:', error);
    throw error;
  }
};

// Mark all notifications as read
export const markAllNotificationsAsRead = async (): Promise<any> => {
  try {
    const token = await getAuthToken();
    const response = await axios.put(
      `${API_URL}/notifications/read-all`,
      {},
      {
        headers: { Authorization: `Bearer ${token}` }
      }
    );
    return response.data;
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    throw error;
  }
};

