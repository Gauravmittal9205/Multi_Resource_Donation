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
  ngoFirebaseUid: string;
  type: 'request_approved' | 'request_rejected' | 'registration_approved' | 'registration_rejected';
  title: string;
  message: string;
  relatedId: string;
  relatedType: 'request' | 'registration';
  isRead: boolean;
  readAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface NotificationsResponse {
  success: boolean;
  count: number;
  unreadCount: number;
  data: Notification[];
}

// Get all notifications for logged in NGO
export const getMyNotifications = async (): Promise<NotificationsResponse> => {
  try {
    const token = await getAuthToken();
    const response = await axios.get(`${API_URL}/notifications`, {
      headers: { Authorization: `Bearer ${token}` }
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

