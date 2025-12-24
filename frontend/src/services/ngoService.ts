import axios from 'axios';
import { auth } from '../firebase';
import { EmailAuthProvider, reauthenticateWithCredential, updatePassword as firebaseUpdatePassword } from 'firebase/auth';

const API_URL = 'http://localhost:5000/api/v1';

// Get auth token for API requests
const getAuthToken = async (): Promise<string> => {
  const user = auth.currentUser;
  if (!user) throw new Error('No authenticated user');
  return await user.getIdToken();
};

// Get current NGO profile
export const getNgoProfile = async () => {
  try {
    const token = await getAuthToken();
    const response = await axios.get(`${API_URL}/ngos/me`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching NGO profile:', error);
    throw error;
  }
};

// Create or update NGO profile
export const saveNgoProfile = async (profileData: any) => {
  try {
    const token = await getAuthToken();
    const response = await axios.post(
      `${API_URL}/ngos`,
      profileData,
      {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        }
      }
    );
    return response.data;
  } catch (error) {
    console.error('Error saving NGO profile:', error);
    throw error;
  }
};

// Upload document (certificate or logo)
export const uploadDocument = async (documentType: 'registrationCertificate' | 'logo', file: File) => {
  try {
    // First, upload the file to your storage service
    // This is a placeholder - replace with your actual file upload logic
    const formData = new FormData();
    formData.append('file', file);
    
    // Example: Upload to Firebase Storage or your preferred storage
    // const storageRef = ref(storage, `ngos/${auth.currentUser?.uid}/${documentType}/${file.name}`);
    // const snapshot = await uploadBytes(storageRef, file);
    // const downloadURL = await getDownloadURL(snapshot.ref);
    
    // For now, we'll just return a mock URL
    const downloadURL = `https://example.com/uploads/${file.name}`;
    
    // Then save the document reference to the profile
    const token = await getAuthToken();
    const response = await axios.put(
      `${API_URL}/ngos/documents`,
      {
        documentType,
        url: downloadURL,
        filename: file.name
      },
      {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        }
      }
    );
    
    return response.data;
  } catch (error) {
    console.error('Error uploading document:', error);
    throw error;
  }
};

// Update password
export const updatePassword = async (currentPassword: string, newPassword: string) => {
  try {
    const user = auth.currentUser;
    if (!user || !user.email) throw new Error('No authenticated user');
    
    // Reauthenticate user
    const credential = EmailAuthProvider.credential(user.email, currentPassword);
    await reauthenticateWithCredential(user, credential);
    
    // Update password
    await firebaseUpdatePassword(user, newPassword);
    
    return { success: true };
  } catch (error) {
    console.error('Error updating password:', error);
    throw error;
  }
};
