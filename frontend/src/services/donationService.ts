import axios from 'axios';
import { auth } from '../firebase';

const API_URL = 'http://localhost:5000/api/v1/donations';
const NOTIFICATIONS_URL = 'http://localhost:5000/api/v1/notifications';

const getAuthToken = async (): Promise<string> => {
  const user = auth.currentUser;
  if (!user) throw new Error('No authenticated user');
  return await user.getIdToken();
};

export type DonationStatus = 'pending' | 'assigned' | 'volunteer_assigned' | 'picked' | 'completed' | 'cancelled';

export interface DonationPayload {
  resourceType: 'Food' | 'Clothes' | 'Books' | 'Medical Supplies' | 'Other Essentials' | 'Blood' | 'Funds' | 'Devices';
  quantity: number;
  unit: 'kg' | 'items' | 'packets' | 'boxes' | 'units' | 'inr';
  address: {
    addressLine: string;
    city: string;
    state: string;
    pincode: string;
  };
  pickup: {
    pickupDate: string; // ISO date string
    timeSlot: 'Morning' | 'Afternoon' | 'Evening';
  };
  notes?: string;
  images?: string[];
  details?: Record<string, unknown>;
}

export interface DonationItem {
  _id: string;
  donorFirebaseUid: string;
  resourceType: DonationPayload['resourceType'];
  quantity: number;
  unit: DonationPayload['unit'];
  address: DonationPayload['address'];
  pickup: { pickupDate: string; timeSlot: DonationPayload['pickup']['timeSlot'] };
  notes?: string;
  images: string[];
  details: Record<string, unknown>;
  status: DonationStatus;
  createdAt: string;
  updatedAt: string;
}

export interface DonorDashboardResponse {
  summary: {
    totalDonations: number;
    activePickups: number;
    completedDonations: number;
  };
  impact?: {
    peopleHelped: number;
    ngosConnected: number;
    resourcesDonated: number;
    foodSavedKg?: number;
  };
  activity: { label: string; count: number }[];
  recentDonations: DonationItem[];
  lastDonationDate?: string | null;
  activeDonations?: number;
  donationsByType?: { resourceType: DonationPayload['resourceType']; count: number; totalQuantity: number }[];
}

export interface DonorProfile {
  firebaseUid: string;
  basic?: {
    name?: string;
    email?: string;
    phone?: string;
  };
  location?: {
    pickupAddress?: string;
    pincode?: string;
    city?: string;
    state?: string;
  };
  preferences?: {
    preferredPickupTime?: string;
  };
}

export const createDonation = async (payload: DonationPayload) => {
  const token = await getAuthToken();
  const response = await axios.post(
    API_URL,
    payload,
    {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      }
    }
  );

  try {
    window.dispatchEvent(new CustomEvent('donationCreated'));
  } catch {
    // ignore
  }

  return response.data as { success: boolean; data: DonationItem };
};

export const fetchDonorDashboard = async () => {
  const token = await getAuthToken();
  const response = await axios.get(`${API_URL}/dashboard`, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
  return response.data as { success: boolean; data: DonorDashboardResponse };
};

export const fetchMyDonations = async (status?: DonationStatus) => {
  const token = await getAuthToken();
  const response = await axios.get(API_URL, {
    params: status ? { status } : undefined,
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
  return response.data as { success: boolean; count: number; data: DonationItem[] };
};

export const fetchMyDonationsPaged = async (params?: {
  status?: DonationStatus;
  resourceType?: DonationPayload['resourceType'] | '';
  page?: number;
  limit?: number;
}) => {
  const token = await getAuthToken();
  const response = await axios.get(API_URL, {
    params: {
      ...(params?.status ? { status: params.status } : {}),
      ...(params?.resourceType ? { resourceType: params.resourceType } : {}),
      ...(params?.page ? { page: params.page } : {}),
      ...(params?.limit ? { limit: params.limit } : {}),
    },
    headers: {
      Authorization: `Bearer ${token}`
    }
  });

  return response.data as {
    success: boolean;
    count: number;
    total?: number;
    page?: number;
    pages?: number;
    limit?: number;
    data: DonationItem[];
  };
};

export const fetchDonorProfileByUid = async (firebaseUid: string) => {
  const response = await axios.get(`http://localhost:5000/api/v1/profile/${encodeURIComponent(firebaseUid)}`);
  return response.data as { success: boolean; data: DonorProfile };
};

export type NotificationCategory = 'donations' | 'pickups' | 'ngo_requests' | 'impact' | 'system';

export interface NotificationItem {
  _id: string;
  recipientFirebaseUid: string;
  category: NotificationCategory;
  title: string;
  message: string;
  read: boolean;
  readAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export const fetchMyNotifications = async (params?: { category?: 'all' | NotificationCategory; includeRead?: boolean; limit?: number }) => {
  const token = await getAuthToken();
  const response = await axios.get(NOTIFICATIONS_URL, {
    params,
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
  return response.data as { success: boolean; count: number; data: NotificationItem[] };
};

export const markNotificationRead = async (id: string) => {
  const token = await getAuthToken();
  const response = await axios.put(
    `${NOTIFICATIONS_URL}/${encodeURIComponent(id)}/read`,
    {},
    {
      headers: {
        Authorization: `Bearer ${token}`
      }
    }
  );
  return response.data as { success: boolean; data: NotificationItem };
};

export const markAllNotificationsRead = async () => {
  const token = await getAuthToken();
  const response = await axios.put(
    `${NOTIFICATIONS_URL}/read-all`,
    {},
    {
      headers: {
        Authorization: `Bearer ${token}`
      }
    }
  );
  return response.data as { success: boolean; data: {} };
};

// Admin function to fetch all donations
export interface AdminDonationItem extends DonationItem {
  donorName: string;
  donorEmail: string;
  donorPhone: string;
}

export interface AdminDonationsResponse {
  success: boolean;
  count: number;
  data: AdminDonationItem[];
}

export const fetchAllDonations = async (filters?: {
  status?: DonationStatus;
  resourceType?: string;
  city?: string;
  startDate?: string;
  endDate?: string;
}) => {
  const token = await getAuthToken();
  const response = await axios.get(`${API_URL}/admin/all`, {
    params: filters,
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
  return response.data as AdminDonationsResponse;
};

export interface NGO {
  _id: string;
  name: string;
  email: string;
  organizationName: string;
  firebaseUid: string;
}

export interface NGOsResponse {
  success: boolean;
  count: number;
  data: NGO[];
}

export const fetchAllNGOs = async () => {
  const token = await getAuthToken();
  const response = await axios.get(`${API_URL}/admin/ngos`, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
  return response.data as NGOsResponse;
};

export interface UpdateDonationPayload {
  ngoFirebaseUid?: string;
  status?: DonationStatus;
  requestId?: string;
}

export const updateDonation = async (donationId: string, payload: UpdateDonationPayload) => {
  const token = await getAuthToken();
  const response = await axios.put(`${API_URL}/admin/${donationId}`, payload, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
  return response.data as { success: boolean; data: AdminDonationItem };
};

// NGO functions
export const fetchNgoAssignedDonations = async () => {
  const token = await getAuthToken();
  const response = await axios.get(`${API_URL}/ngo/assigned`, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
  return response.data as { success: boolean; count: number; data: DonationItem[] };
};

export interface AssignVolunteerPayload {
  volunteerId?: string;
  volunteerName: string;
  volunteerPhone?: string;
}

export const assignVolunteer = async (donationId: string, payload: AssignVolunteerPayload) => {
  const token = await getAuthToken();
  const response = await axios.put(`${API_URL}/ngo/${donationId}/assign-volunteer`, payload, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
  return response.data as { success: boolean; data: DonationItem };
};

export const updateNgoDonationStatus = async (donationId: string, status: 'volunteer_assigned' | 'picked' | 'completed') => {
  const token = await getAuthToken();
  const response = await axios.put(`${API_URL}/ngo/${donationId}/status`, { status }, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
  return response.data as { success: boolean; data: DonationItem };
};