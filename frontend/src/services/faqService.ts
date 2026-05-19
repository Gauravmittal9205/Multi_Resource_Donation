import axios from 'axios';

const API_URL = `${import.meta.env.VITE_API_URL}/faqs`;

export type FaqRole = 'donors' | 'ngos' | 'volunteers';

export interface FaqItem {
  _id: string;
  role: FaqRole;
  question: string;
  answer: string;
  order?: number;
  isActive?: boolean;
}

export const fetchFaqs = async (role?: FaqRole) => {
  const params: Record<string, string> = {};
  if (role) params.role = role;

  const response = await axios.get(API_URL, { params });
  return response.data as { success: boolean; count: number; data: FaqItem[] };
};
