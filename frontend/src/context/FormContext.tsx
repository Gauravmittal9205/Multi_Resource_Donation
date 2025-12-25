import { createContext, useContext, useState } from 'react';
import type { ReactNode } from 'react';

interface FormData {
  // Step 1: Basic Identity
  organizationType: string;
  ngoName: string;
  contactPerson: string;
  phone: string;
  
  // Step 2: Location Details
  city: string;
  state: string;
  pincode: string;
  pickupDeliveryPreference: string;
  
  // Step 3: Identity Proof
  aadhaarNumber: string;
  aadhaarCard: File | null;
  aadhaarCardName: string;
  aadhaarCardPreview: string;
  alternateIdType: string;
  alternateIdFile: File | null;
  alternateIdFileName: string;
  alternateIdFilePreview: string;
  
  // Step 4: Organization Documents
  registrationNumber: string;
  ngoCertificate: File | null;
  ngoCertificateName: string;
  ngoCertificatePreview: string;
  addressProof: File | null;
  addressProofName: string;
  addressProofPreview: string;
  
  // Step 5: Verification
  declarationAccepted: boolean;
  verificationConsent: boolean;
  
  // Legacy fields (keeping for backward compatibility)
  registrationDate: string;
  email: string;
  website: string;
  address: string;
  description: string;
  establishmentYear: number;
  termsAccepted: boolean;
}

interface FormContextType {
  formData: FormData;
  currentStep: number;
  updateFormData: (data: Partial<FormData>) => void;
  setCurrentStep: (step: number) => void;
  clearForm: () => void;
}

const defaultFormData: FormData = {
  // Step 1: Basic Identity
  organizationType: '',
  ngoName: '',
  contactPerson: '',
  phone: '',
  
  // Step 2: Location Details
  city: '',
  state: '',
  pincode: '',
  pickupDeliveryPreference: '',
  
  // Step 3: Identity Proof
  aadhaarNumber: '',
  aadhaarCard: null,
  aadhaarCardName: '',
  aadhaarCardPreview: '',
  alternateIdType: '',
  alternateIdFile: null,
  alternateIdFileName: '',
  alternateIdFilePreview: '',
  
  // Step 4: Organization Documents
  registrationNumber: '',
  ngoCertificate: null,
  ngoCertificateName: '',
  ngoCertificatePreview: '',
  addressProof: null,
  addressProofName: '',
  addressProofPreview: '',
  
  // Step 5: Verification
  declarationAccepted: false,
  verificationConsent: false,
  
  // Legacy fields
  registrationDate: '',
  email: '',
  website: '',
  address: '',
  description: '',
  establishmentYear: new Date().getFullYear(),
  termsAccepted: false
};

const FormContext = createContext<FormContextType | undefined>(undefined);

export const FormProvider: React.FC<{children: ReactNode}> = ({ children }) => {
  const [formData, setFormData] = useState<FormData>(defaultFormData);
  const [currentStep, setCurrentStep] = useState(1);

  const updateFormData = (data: Partial<FormData>) => {
    setFormData(prev => ({
      ...prev,
      ...data,
      // Ensure aadhaarCard, aadhaarCardName, and aadhaarCardPreview are always in sync
      ...(data.aadhaarCard && !data.aadhaarCardName && !data.aadhaarCardPreview 
        ? { 
            aadhaarCard: data.aadhaarCard,
            aadhaarCardName: data.aadhaarCard.name,
            aadhaarCardPreview: ''
          }
        : {})
    }));
  };

  const clearForm = () => {
    setFormData(defaultFormData);
    setCurrentStep(1);
  };

  return (
    <FormContext.Provider value={{ formData, currentStep, updateFormData, setCurrentStep, clearForm }}>
      {children}
    </FormContext.Provider>
  );
};

export const useForm = (): FormContextType => {
  const context = useContext(FormContext);
  if (!context) {
    throw new Error('useForm must be used within a FormProvider');
  }
  return context;
};
