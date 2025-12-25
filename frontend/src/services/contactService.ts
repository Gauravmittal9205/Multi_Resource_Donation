import axios from 'axios';
import { auth } from '../firebase';

const API_URL = 'http://localhost:5000/api/v1';

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

