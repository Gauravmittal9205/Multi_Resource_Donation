import axios from 'axios';
import { auth } from '../firebase';

const API_URL = `${import.meta.env.VITE_API_URL}`;

// Get auth token for API requests
const getAuthToken = async (): Promise<string> => {
  const user = auth.currentUser;
  if (!user) throw new Error('No authenticated user');
  return await user.getIdToken();
};

export interface CreateContactData {
  firebaseUid?: string;
  userType?: 'donor' | 'ngo';
  organizationName?: string;
  name: string;
  email: string;
  phone?: string;
  queryType?: string;
  message: string;
}

export interface HelpMessage {
  _id: string;
  firebaseUid?: string;
  userType?: 'donor' | 'ngo';
  organizationName?: string;
  name: string;
  email: string;
  phone?: string;
  queryType?: string;
  message: string;
  status: 'new' | 'read' | 'closed';
  createdAt: string;
  updatedAt: string;
}

// Create contact message
export const createContact = async (contactData: CreateContactData) => {
  try {
    const response = await axios.post(
      `${API_URL}/contacts`,
      contactData,
      {
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );
    return response.data;
  } catch (error: any) {
    console.error('Error creating contact:', error);
    throw error;
  }
};

// Get all help messages (Admin)
export const getAllHelpMessages = async (filters?: {
  status?: 'new' | 'read' | 'closed';
  userType?: 'donor' | 'ngo';
  queryType?: string;
}) => {
  try {
    const token = await getAuthToken();
    const response = await axios.get(`${API_URL}/contacts/admin/all`, {
      params: filters,
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    return response.data as { success: boolean; count: number; data: HelpMessage[] };
  } catch (error: any) {
    console.error('Error fetching help messages:', error);
    throw error;
  }
};

// Update help message status (Admin)
export const updateHelpMessageStatus = async (messageId: string, status: 'new' | 'read' | 'closed') => {
  try {
    const token = await getAuthToken();
    const response = await axios.put(
      `${API_URL}/contacts/admin/${messageId}`,
      { status },
      {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        }
      }
    );
    return response.data as { success: boolean; data: HelpMessage };
  } catch (error: any) {
    console.error('Error updating help message status:', error);
    throw error;
  }
};


