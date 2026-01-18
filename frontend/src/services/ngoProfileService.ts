import axios from 'axios';
import { auth } from '../firebase';

const API_URL = `${import.meta.env.VITE_API_URL}/ngo-profile`;

const getAuthToken = async (): Promise<string> => {
  const user = auth.currentUser;
  if (!user) throw new Error('No authenticated user');
  return await user.getIdToken();
};

export type NgoFocusArea =
  | 'Education'
  | 'Health'
  | 'Hunger'
  | 'Disaster'
  | 'Environment'
  | 'Animal Welfare'
  | 'Women Empowerment'
  | 'Elderly Care'
  | 'Other';

export type NgoBeneficiaryType = 'Children' | 'Women' | 'Elderly' | 'Disabled' | 'Animals' | 'Communities' | 'Other';

export type NgoResourceKey = 'Food' | 'Clothes' | 'Medicines' | 'Books' | 'Blood' | 'Funds' | 'Devices' | 'Essentials';

export interface NgoProfile {
  firebaseUid: string;
  basic: {
    logoUrl: string;
    tagline: string;
    aboutHtml: string;
    contactPersonName: string;
    phone: string;
    email: string;
    website: string;
    socialLinks: {
      facebook: string;
      instagram: string;
      linkedin: string;
      twitter: string;
      youtube: string;
    };
  };
  operationalAreas: string[];
  mission: {
    missionStatement: string;
    visionStatement: string;
    focusAreas: string[];
    beneficiaryTypes: string[];
    foundedYear: number | null;
  };
  acceptance: {
    resources: Record<string, unknown>;
  };
  logistics: {
    pickupAvailable: boolean;
    pickupAreas: string[];
    preferredPickupTime: string;
    dropLocation: string;
    emergencyAcceptance: boolean;
  };
  monetary: {
    bankName: string;
    accountName: string;
    accountNumber: string;
    ifsc: string;
    upiId: string;
    minimumDonationAmount: number | null;
    purposeAllocation: string;
  };
}

export const getMyNgoProfile = async () => {
  const token = await getAuthToken();
  const res = await axios.get(`${API_URL}/me`, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
  return res.data as { success: boolean; data: NgoProfile | null };
};

export const upsertMyNgoProfile = async (payload: Partial<NgoProfile>) => {
  const token = await getAuthToken();
  const res = await axios.put(`${API_URL}/me`, payload, {
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    }
  });
  return res.data as { success: boolean; data: NgoProfile };
};
