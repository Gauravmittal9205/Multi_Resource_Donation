import axios from 'axios';
import { auth } from '../firebase';

const API_URL = `${import.meta.env.VITE_API_URL}`;

// Get auth token for API requests
const getAuthToken = async (): Promise<string> => {
  const user = auth.currentUser;
  if (!user) throw new Error('No authenticated user');
  return await user.getIdToken();
};

export interface CreateFeedbackData {
  subject: string;
  feedbackType: 'suggestion' | 'bug' | 'feature' | 'complaint' | 'other';
  description: string;
  rating?: number;
  screenshot?: string;
  contactPermission?: boolean;
}

// Create feedback
export const createFeedback = async (feedbackData: CreateFeedbackData) => {
  try {
    const token = await getAuthToken();
    const response = await axios.post(
      `${API_URL}/feedback`,
      feedbackData,
      {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        }
      }
    );
    return response.data;
  } catch (error: any) {
    console.error('Error creating feedback:', error);
    throw error;
  }
};

// Get all feedback for logged in NGO
export const getMyFeedback = async (status?: string, feedbackType?: string) => {
  try {
    const token = await getAuthToken();
    const params: any = {};
    if (status) params.status = status;
    if (feedbackType) params.feedbackType = feedbackType;
    const response = await axios.get(`${API_URL}/feedback`, {
      headers: { Authorization: `Bearer ${token}` },
      params
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching feedback:', error);
    throw error;
  }
};

// Get single feedback by ID
export const getFeedback = async (id: string) => {
  try {
    const token = await getAuthToken();
    const response = await axios.get(`${API_URL}/feedback/${id}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching feedback:', error);
    throw error;
  }
};

// Update feedback
export const updateFeedback = async (id: string, feedbackData: Partial<CreateFeedbackData>) => {
  try {
    const token = await getAuthToken();
    const response = await axios.put(
      `${API_URL}/feedback/${id}`,
      feedbackData,
      {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        }
      }
    );
    return response.data;
  } catch (error) {
    console.error('Error updating feedback:', error);
    throw error;
  }
};

// Delete feedback
export const deleteFeedback = async (id: string) => {
  try {
    const token = await getAuthToken();
    const response = await axios.delete(`${API_URL}/feedback/${id}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
  } catch (error) {
    console.error('Error deleting feedback:', error);
    throw error;
  }
};


