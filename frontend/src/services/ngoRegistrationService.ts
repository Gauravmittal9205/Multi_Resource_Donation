import axios from 'axios';
import { auth } from '../firebase';

const API_URL = 'http://localhost:5000/api/v1';

// Get auth token for API requests
const getAuthToken = async (): Promise<string> => {
  const user = auth.currentUser;
  if (!user) throw new Error('No authenticated user');
  return await user.getIdToken();
};

export interface NgoRegistrationData {
  // Step 1: Basic Identity
  organizationType: 'NGO' | 'Trust';
  ngoName: string;
  contactPerson: string;
  phone: string;
  
  // Step 2: Location Details
  city: string;
  state: string;
  pincode: string;
  pickupDeliveryPreference: 'Pickup' | 'Delivery' | 'Both';
  
  // Step 3: Identity Proof
  aadhaarNumber: string;
  aadhaarCard?: string; // URL or file path
  alternateIdType?: 'PAN' | 'Voter ID' | 'Passport' | '';
  alternateIdFile?: string; // URL or file path
  
  // Step 4: Organization Documents
  registrationNumber: string;
  ngoCertificate: string; // URL or file path
  addressProof: string; // URL or file path
  
  // Step 5: Verification
  declarationAccepted: boolean;
  verificationConsent: boolean;
}

// Create NGO registration
export const createNgoRegistration = async (registrationData: NgoRegistrationData) => {
  try {
    const token = await getAuthToken();
    const response = await axios.post(
      `${API_URL}/ngo-registration`,
      registrationData,
      {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        }
      }
    );
    return response.data;
  } catch (error: any) {
    console.error('Error creating NGO registration:', error);
    throw error;
  }
};

// Get my registration status
export const getMyRegistration = async () => {
  try {
    const token = await getAuthToken();
    const response = await axios.get(`${API_URL}/ngo-registration`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
  } catch (error: any) {
    if (error.response?.status === 404) {
      return null; // No registration found
    }
    console.error('Error fetching NGO registration:', error);
    throw error;
  }
};

