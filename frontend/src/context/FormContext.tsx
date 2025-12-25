import { createContext, useContext, useState } from 'react';
import type { ReactNode } from 'react';

interface FormData {
  // Step 1: Basic Information
  ngoName: string;
  registrationNumber: string;
  registrationDate: string;
  
  // Step 2: Contact Information
  contactPerson: string;
  phone: string;
  email: string;
  website: string;
  address: string;
  
  // Step 3: Organization Details
  description: string;
  establishmentYear: number;
  
  // Step 4: Documents
  aadhaarCard: File | null;
  aadhaarCardName: string;
  aadhaarCardPreview: string;
  
  // Step 5: Review & Submit
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
  // Step 1: Basic Information
  ngoName: '',
  registrationNumber: '',
  registrationDate: '',
  
  // Step 2: Contact Information
  contactPerson: '',
  phone: '',
  email: '',
  website: '',
  address: '',
  
  // Step 3: Organization Details
  description: '',
  establishmentYear: new Date().getFullYear(),
  
  // Step 4: Documents
  aadhaarCard: null,
  aadhaarCardName: '',
  aadhaarCardPreview: '',
  
  // Step 5: Review & Submit
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
