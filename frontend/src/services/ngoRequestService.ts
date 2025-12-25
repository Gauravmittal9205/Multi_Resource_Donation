import axios from 'axios';
import { auth } from '../firebase';

const API_URL = 'http://localhost:5000/api/v1';

// Get auth token for API requests
const getAuthToken = async (): Promise<string> => {
  const user = auth.currentUser;
  if (!user) throw new Error('No authenticated user');
  return await user.getIdToken();
};

export type RequestStatus = 'pending' | 'in_progress' | 'completed' | 'rejected' | 'cancelled';

export interface CreateNgoRequestData {
  requestTitle: string;
  category: 'food' | 'clothing' | 'medical' | 'education' | 'other';
  quantity: number;
  urgencyLevel: 'low' | 'medium' | 'high';
  description: string;
  neededBy?: string;
  images?: string[];
  status?: RequestStatus;
}

// Create NGO request
export const createNgoRequest = async (requestData: CreateNgoRequestData) => {
  try {
    const token = await getAuthToken();
    const response = await axios.post(
      `${API_URL}/ngo-requests`,
      requestData,
      {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        }
      }
    );
    return response.data;
  } catch (error: any) {
    console.error('Error creating NGO request:', error);
    throw error;
  }
};

// Get all requests for logged in NGO
export const getMyRequests = async (status?: string) => {
  try {
    const token = await getAuthToken();
    const params = status ? { status } : {};
    const response = await axios.get(`${API_URL}/ngo-requests`, {
      headers: { Authorization: `Bearer ${token}` },
      params
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching NGO requests:', error);
    throw error;
  }
};

// Get all NGO requests (admin only)
export const getAllNgoRequests = async () => {
  try {
    const token = await getAuthToken();
    const response = await axios.get(`${API_URL}/ngo-requests/admin/all`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching all NGO requests:', error);
    throw error;
  }
};

// Get NGO dashboard summary
export const getNgoDashboard = async () => {
  try {
    const token = await getAuthToken();
    const response = await axios.get(`${API_URL}/ngo-requests/dashboard`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching NGO dashboard:', error);
    throw error;
  }
};

// Get single request by ID
export const getRequest = async (id: string) => {
  try {
    const token = await getAuthToken();
    const response = await axios.get(`${API_URL}/ngo-requests/${id}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching request:', error);
    throw error;
  }
};

// Update request
export const updateRequest = async (id: string, requestData: Partial<CreateNgoRequestData> & { status?: RequestStatus | string }) => {
  try {
    const token = await getAuthToken();
    const response = await axios.put(
      `${API_URL}/ngo-requests/${id}`,
      requestData,
      {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        }
      }
    );
    return response.data;
  } catch (error) {
    console.error('Error updating request:', error);
    throw error;
  }
};

// Delete request
export const deleteRequest = async (id: string) => {
  try {
    const token = await getAuthToken();
    const response = await axios.delete(`${API_URL}/ngo-requests/${id}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
  } catch (error) {
    console.error('Error deleting request:', error);
    throw error;
  }
};

