import axios from 'axios';
import { auth } from '../firebase';

const API_URL = `${import.meta.env.VITE_API_URL}`;

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

// Get all NGOs with active requests (Admin only)
export interface NgoWithRequests {
  _id: string;
  firebaseUid?: string; // Add firebaseUid field
  ngoName: string;
  email: string;
  phone: string;
  location: {
    city: string;
    state: string;
    pincode: string;
    address: string;
  };
  organizationType: string;
  registrationNumber: string;
  requests: Array<{
    _id: string;
    requestTitle: string;
    category: string;
    quantity: number;
    urgencyLevel: string;
    description: string;
    status: string;
    neededBy?: string;
    createdAt: string;
  }>;
}

export const getNgosWithActiveRequests = async (): Promise<NgoWithRequests[]> => {
  try {
    const token = await getAuthToken();
    console.log('Making API call to fetch active NGO requests...');
    
    // Add a timestamp to prevent caching
    const timestamp = new Date().getTime();
    const url = `${API_URL}/ngo-requests/admin/active?t=${timestamp}`;
    
    console.log('Request URL:', url);
    
    const response = await axios.get(url, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      },
      timeout: 10000 // 10 second timeout
    });
    
    console.log('API Response Status:', response.status, response.statusText);
    
    if (!response.data) {
      console.error('Empty response received');
      throw new Error('Received empty response from server');
    }
    
    if (response.status !== 200) {
      console.error('Unexpected status code:', response.status);
      throw new Error(`Server responded with status: ${response.status}`);
    }
    
    if (!response.data.success) {
      console.error('API response indicates failure:', response.data);
      throw new Error(response.data.error || 'Failed to fetch NGO requests');
    }
    
    const ngos = Array.isArray(response.data.data) ? response.data.data : [];
    console.log(`Found ${ngos.length} NGOs with active requests`);
    
    return ngos;
  } catch (error: any) {
    const errorDetails = {
      name: error.name,
      message: error.message,
      stack: error.stack,
      response: error.response ? {
        status: error.response.status,
        statusText: error.response.statusText,
        data: error.response.data,
        headers: error.response.headers
      } : 'No response',
      request: error.request ? 'Request was made but no response received' : 'No request was made',
      config: {
        url: error.config?.url,
        method: error.config?.method,
        headers: error.config?.headers,
        params: error.config?.params
      }
    };
    
    console.error('Detailed error in getNgosWithActiveRequests:', JSON.stringify(errorDetails, null, 2));
    
    // Return empty array instead of throwing to prevent UI from breaking
    // But log the error for debugging
    return [];
  }
};

// Update request status (Admin only)
export const updateNgoRequestStatus = async (id: string, status: string) => {
  try {
    const token = await getAuthToken();
    const response = await axios.put(
      `${API_URL}/ngo-requests/admin/${id}`,
      { status },
      {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        }
      }
    );
    return response.data;
  } catch (error) {
    console.error('Error updating request status:', error);
    throw error;
  }
};


