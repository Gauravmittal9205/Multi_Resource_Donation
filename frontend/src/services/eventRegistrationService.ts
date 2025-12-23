import axios from 'axios';

const API_URL = 'http://localhost:5000/api/v1/event-registrations';

export interface EventRegistrationData {
  eventId: string;
  eventTitle: string;
  eventType: 'food' | 'training' | 'fundraising' | 'other';
  name: string;
  email: string;
  phone: string;
  message?: string;
}

export const registerForEvent = async (registrationData: EventRegistrationData) => {
  try {
    const response = await axios.post(API_URL, registrationData);
    return response.data;
  } catch (error: any) {
    if (error.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      throw new Error(
        error.response.data?.message ||
          error.response.data?.error ||
          'Error registering for event'
      );
    } else if (error.request) {
      // The request was made but no response was received
      throw new Error('No response from server. Please try again later.');
    } else {
      // Something happened in setting up the request that triggered an Error
      throw new Error('Error setting up registration request');
    }
  }
};

export const getEventRegistrations = async (token: string) => {
  try {
    const response = await axios.get(API_URL, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response.data;
  } catch (error: any) {
    throw new Error(
      error.response?.data?.message || 'Error fetching event registrations'
    );
  }
};

export const getEventRegistrationsByEvent = async (eventId: string, token: string) => {
  try {
    const response = await axios.get(`${API_URL}/event/${eventId}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response.data;
  } catch (error: any) {
    throw new Error(
      error.response?.data?.message || 'Error fetching event registrations'
    );
  }
};
