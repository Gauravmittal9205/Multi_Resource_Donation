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

    if (!response.data.success) {
      console.error('Error in response:', response.data);
      throw new Error(response.data.message || 'Failed to fetch NGOs with active requests');
    }

    console.log(`Successfully fetched ${response.data.data?.length || 0} NGOs with active requests`);
    return response.data.data || [];
  } catch (error: any) {
    // Enhanced error logging
    const errorDetails = {
      name: error.name,
      message: error.message,
      code: error.code,
      status: error.response?.status,
      responseData: error.response?.data,
      config: {
        url: error.config?.url,
        method: error.config?.method,
        timeout: error.config?.timeout,
        headers: Object.keys(error.config?.headers || {}).reduce((acc, key) => {
          if (key.toLowerCase() !== 'authorization') {
            acc[key] = error.config?.headers[key];
          } else {
            acc[key] = 'Bearer [REDACTED]';
          }
          return acc;
        }, {} as Record<string, any>),
        params: error.config?.params
      }
    };
    
    console.error('Detailed error in getNgosWithActiveRequests:', JSON.stringify(errorDetails, null, 2));
    
    // User-friendly error messages
    if (error.code === 'ECONNABORTED') {
      throw new Error('Request timed out. The server is taking too long to respond.');
    } else if (error.response) {
      // Server responded with error status
      if (error.response.status === 401) {
        throw new Error('Your session has expired. Please log in again.');
      } else if (error.response.status === 403) {
        throw new Error('You do not have permission to view this resource.');
      } else if (error.response.status === 404) {
        throw new Error('The requested resource was not found.');
      } else if (error.response.status >= 500) {
        throw new Error('Server error. Please try again later or contact support.');
      } else {
        throw new Error(error.response.data?.message || `Server responded with status ${error.response.status}`);
      }
    } else if (error.request) {
      // No response received
      throw new Error('Unable to connect to the server. Please check your internet connection and try again.');
    } else {
      // Request setup error
      throw new Error(`Failed to process request: ${error.message}`);
    }
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


