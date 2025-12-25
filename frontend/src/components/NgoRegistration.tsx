import React, { useState } from 'react';
import { useForm } from '../context/FormContext';
import { createNgoRegistration } from '../services/ngoRegistrationService';

interface NgoRegistrationProps {
  onBack: () => void;
  onSuccess: () => void;
}

const NgoRegistration: React.FC<NgoRegistrationProps> = ({ onBack, onSuccess }) => {
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string>('');
  const { formData, currentStep, updateFormData, setCurrentStep, clearForm } = useForm();

  const [errors, setErrors] = useState<Record<string, string>>({});

  const steps = [
    { id: 1, name: 'Basic Identity', section: 'Basic Information' },
    { id: 2, name: 'Location Details', section: 'Location' },
    { id: 3, name: 'Identity Proof', section: 'Identity Proof' },
    { id: 4, name: 'Organization Documents', section: 'Organization Proof' },
    { id: 5, name: 'Verification', section: 'Verification' },
    { id: 6, name: 'Review & Submit', section: 'Review & Submit' },
  ];

  const isFirstStep = currentStep === 1;
  const isLastStep = currentStep === steps.length;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target as HTMLInputElement;
    const checked = type === 'checkbox' ? (e.target as HTMLInputElement).checked : undefined;
    
    updateFormData({
      [name]: type === 'checkbox' ? checked : value
    });
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors({ ...errors, [name]: '' });
    }
  };

  const handleFileUpload = (fieldName: string, e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      
      if (file.type.startsWith('image/') || file.type === 'application/pdf') {
        reader.onloadend = () => {
          updateFormData({
            [fieldName]: file,
            [`${fieldName}Name`]: file.name,
            [`${fieldName}Preview`]: reader.result as string
          });
        };
        reader.readAsDataURL(file);
      } else {
        updateFormData({
          [fieldName]: file,
          [`${fieldName}Name`]: file.name,
          [`${fieldName}Preview`]: ''
        });
      }
    }
  };

  const maskAadhaar = (aadhaar: string) => {
    if (!aadhaar || aadhaar.length !== 12) return aadhaar;
    return `**** **** ${aadhaar.slice(-4)}`;
  };

  const validateStep = (step: number): boolean => {
    const newErrors: Record<string, string> = {};
    const phoneRegex = /^[6-9]\d{9}$/;
    const aadhaarRegex = /^\d{12}$/;
    const pincodeRegex = /^\d{6}$/;
    const nameRegex = /^[a-zA-Z\s]{2,50}$/;

    if (step === 1) {
      // Organization Type
      if (!formData.organizationType) {
        newErrors.organizationType = 'Please select organization type';
      }

      // Organization/NGO Name
      if (!formData.ngoName?.trim()) {
        newErrors.ngoName = 'Organization/NGO name is required';
      } else if (formData.ngoName.trim().length < 3) {
        newErrors.ngoName = 'Name must be at least 3 characters';
      } else if (formData.ngoName.trim().length > 100) {
        newErrors.ngoName = 'Name cannot exceed 100 characters';
      }

      // Contact Person Name
      if (!formData.contactPerson?.trim()) {
        newErrors.contactPerson = 'Contact person name is required';
      } else if (!nameRegex.test(formData.contactPerson.trim())) {
        newErrors.contactPerson = 'Please enter a valid name (only letters and spaces, 2-50 characters)';
      }

      // Mobile Number (read-only, but validate if exists)
      if (formData.phone && !phoneRegex.test(formData.phone.trim())) {
        newErrors.phone = 'Please enter a valid 10-digit phone number';
      }
    } 
    
    else if (step === 2) {
      // City
      if (!formData.city?.trim()) {
        newErrors.city = 'City is required';
      } else if (formData.city.trim().length < 2) {
        newErrors.city = 'City must be at least 2 characters';
      }

      // State
      if (!formData.state?.trim()) {
        newErrors.state = 'State is required';
      }

      // Pincode
      if (!formData.pincode?.trim()) {
        newErrors.pincode = 'Pincode is required';
      } else if (!pincodeRegex.test(formData.pincode.trim())) {
        newErrors.pincode = 'Please enter a valid 6-digit pincode';
      }

      // Pickup/Delivery Preference
      if (!formData.pickupDeliveryPreference) {
        newErrors.pickupDeliveryPreference = 'Please select pickup/delivery preference';
      }
    } 
    
    else if (step === 3) {
      // Aadhaar Number
      if (!formData.aadhaarNumber?.trim()) {
        newErrors.aadhaarNumber = 'Aadhaar number is required';
      } else if (!aadhaarRegex.test(formData.aadhaarNumber.trim())) {
        newErrors.aadhaarNumber = 'Aadhaar number must be exactly 12 digits';
      }

      // Aadhaar Card Upload
      if (!formData.aadhaarCard) {
        // Check if alternate ID is provided
        if (!formData.alternateIdType || !formData.alternateIdFile) {
          newErrors.aadhaarCard = 'Please upload Aadhaar card or provide alternate ID';
        }
      } else if (formData.aadhaarCard.size > 5 * 1024 * 1024) {
        newErrors.aadhaarCard = 'File size should not exceed 5MB';
      }

      // Alternate ID validation (if Aadhaar not provided)
      if (!formData.aadhaarCard) {
        if (formData.alternateIdType && !formData.alternateIdFile) {
          newErrors.alternateIdFile = 'Please upload alternate ID document';
        }
      }
    } 
    
     else if (step === 4) {
       // NGO Certificate Upload
       if (!formData.ngoCertificate) {
         newErrors.ngoCertificate = 'Please upload NGO certificate';
       } else if (formData.ngoCertificate.size > 10 * 1024 * 1024) {
         newErrors.ngoCertificate = 'File size should not exceed 10MB';
       }

       // Address Proof
       if (!formData.addressProof) {
         newErrors.addressProof = 'Please upload address proof document';
       } else if (formData.addressProof.size > 10 * 1024 * 1024) {
         newErrors.addressProof = 'File size should not exceed 10MB';
       }
     }
    
    else if (step === 5) {
      // Declaration
      if (!formData.declarationAccepted) {
        newErrors.declarationAccepted = 'You must accept the declaration to proceed';
      }

      // Consent for Verification
      if (!formData.verificationConsent) {
        newErrors.verificationConsent = 'You must provide consent for verification';
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const nextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(currentStep + 1);
      setErrors({});
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      const firstError = Object.keys(errors)[0];
      if (firstError) {
        const element = document.querySelector(`[name="${firstError}"]`);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
      setErrors({});
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLastStep) {
      if (validateStep(currentStep)) {
        setIsSubmitting(true);
        setSubmitError('');

        try {
          // Convert file objects to base64 strings for now
          // In production, you would upload files to cloud storage first
          const aadhaarCardBase64 = formData.aadhaarCardPreview || '';
          const alternateIdFileBase64 = formData.alternateIdFilePreview || '';
          const ngoCertificateBase64 = formData.ngoCertificatePreview || '';
          const addressProofBase64 = formData.addressProofPreview || '';

          const registrationData = {
            organizationType: formData.organizationType as 'NGO' | 'Trust',
            ngoName: formData.ngoName,
            contactPerson: formData.contactPerson,
            phone: formData.phone,
            city: formData.city,
            state: formData.state,
            pincode: formData.pincode,
            pickupDeliveryPreference: formData.pickupDeliveryPreference as 'Pickup' | 'Delivery' | 'Both',
            aadhaarNumber: formData.aadhaarNumber,
            aadhaarCard: aadhaarCardBase64,
            alternateIdType: (formData.alternateIdType === 'PAN' || formData.alternateIdType === 'Voter ID' || formData.alternateIdType === 'Passport') 
              ? formData.alternateIdType as 'PAN' | 'Voter ID' | 'Passport' 
              : '' as '',
            alternateIdFile: alternateIdFileBase64,
            ngoCertificate: ngoCertificateBase64,
            addressProof: addressProofBase64,
            declarationAccepted: formData.declarationAccepted as boolean,
            verificationConsent: formData.verificationConsent as boolean
          };

          await createNgoRegistration(registrationData);
          setIsSubmitted(true);
          
          setTimeout(() => {
            clearForm();
            onSuccess();
          }, 3000);
        } catch (error: any) {
          console.error('Registration submission error:', error);
          setSubmitError(
            error.response?.data?.error || 
            error.message || 
            'Failed to submit registration. Please try again.'
          );
        } finally {
          setIsSubmitting(false);
        }
      }
    } else {
      nextStep();
    }
  };

  const renderError = (field: string) => {
    return errors[field] ? (
      <p className="mt-1.5 text-sm text-red-600 flex items-start">
        <svg className="w-4 h-4 mt-0.5 mr-1 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
        </svg>
        {errors[field]}
      </p>
    ) : null;
  };

  const StepHeader = ({ title, description }: { title: string; description?: string }) => (
    <div className="mb-8">
      <h3 className="text-2xl font-bold text-gray-900">{title}</h3>
      {description && <p className="mt-2 text-gray-600">{description}</p>}
    </div>
  );

  if (isSubmitted) {
    return (
      <div className="text-center py-16">
        <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100">
          <svg className="h-10 w-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h3 className="mt-4 text-2xl font-medium text-gray-900">Registration Successful!</h3>
        <p className="mt-2 text-gray-600">Your registration is under verification.</p>
        <p className="mt-1 text-gray-500">You will be redirected to the dashboard shortly...</p>
      </div>
    );
  }

  const renderStep = () => {
    switch (currentStep) {
      case 1: // Basic Identity
        return (
          <div className="space-y-6">
            <StepHeader 
              title="Basic Information" 
              description="Aap kaun ho? Clearly define karna" 
            />
            <div>
              <label className="block text-base font-medium text-gray-800 mb-1">
                Organization Type <span className="text-red-500">*</span>
              </label>
              <select
                name="organizationType"
                value={formData.organizationType || ''}
                onChange={handleChange}
                required
                className={`mt-1 block w-full rounded-xl text-base px-4 py-3 border-2 ${
                  errors.organizationType ? 'border-red-300' : 'border-gray-200 hover:border-gray-300'
                } shadow-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition duration-150`}
              >
                <option value="">Select organization type</option>
                <option value="NGO">NGO</option>
                <option value="Trust">Trust</option>
              </select>
              {renderError('organizationType')}
              <p className="mt-1 text-sm text-gray-500">Verification rules depend karte hain</p>
            </div>

            <div>
              <label className="block text-base font-medium text-gray-800 mb-1">
                Organization / NGO Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="ngoName"
                value={formData.ngoName || ''}
                onChange={handleChange}
                required
                placeholder="e.g., Helping Hands Foundation"
                className={`mt-1 block w-full rounded-xl text-base px-4 py-3 border-2 ${
                  errors.ngoName ? 'border-red-300' : 'border-gray-200 hover:border-gray-300'
                } shadow-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition duration-150`}
              />
              {renderError('ngoName')}
            </div>

            <div>
              <label className="block text-base font-medium text-gray-800 mb-1">
                Contact Person Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="contactPerson"
                value={formData.contactPerson || ''}
                onChange={handleChange}
                required
                placeholder="e.g., Rahul Sharma"
                className={`mt-1 block w-full rounded-xl text-base px-4 py-3 border-2 ${
                  errors.contactPerson ? 'border-red-300' : 'border-gray-200 hover:border-gray-300'
                } shadow-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition duration-150`}
              />
              {renderError('contactPerson')}
            </div>

            <div>
              <label className="block text-base font-medium text-gray-800 mb-1">
                Mobile Number <span className="text-red-500">*</span>
              </label>
              <input
                type="tel"
                name="phone"
                value={formData.phone || ''}
                onChange={handleChange}
                required
                maxLength={10}
                pattern="[6-9][0-9]{9}"
                placeholder="Enter 10-digit mobile number"
                className={`mt-1 block w-full rounded-xl text-base px-4 py-3 border-2 ${
                  errors.phone ? 'border-red-300' : 'border-gray-200 hover:border-gray-300'
                } shadow-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition duration-150`}
              />
              {renderError('phone')}
            </div>
          </div>
        );

      case 2: // Location Details
        return (
          <div className="space-y-6">
            <StepHeader 
              title="Location" 
              description="Logistics & regional validation" 
            />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-base font-medium text-gray-800 mb-1">
                  City <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="city"
                  value={formData.city || ''}
                  onChange={handleChange}
                  required
                  className={`mt-1 block w-full rounded-xl text-base px-4 py-3 border-2 ${
                    errors.city ? 'border-red-300' : 'border-gray-200 hover:border-gray-300'
                  } shadow-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition duration-150`}
                />
                {renderError('city')}
              </div>

              <div>
                <label className="block text-base font-medium text-gray-800 mb-1">
                  State <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="state"
                  value={formData.state || ''}
                  onChange={handleChange}
                  required
                  className={`mt-1 block w-full rounded-xl text-base px-4 py-3 border-2 ${
                    errors.state ? 'border-red-300' : 'border-gray-200 hover:border-gray-300'
                  } shadow-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition duration-150`}
                />
                {renderError('state')}
              </div>
            </div>

            <div>
              <label className="block text-base font-medium text-gray-800 mb-1">
                Pincode <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="pincode"
                value={formData.pincode || ''}
                onChange={handleChange}
                required
                maxLength={6}
                pattern="[0-9]{6}"
                className={`mt-1 block w-full rounded-xl text-base px-4 py-3 border-2 ${
                  errors.pincode ? 'border-red-300' : 'border-gray-200 hover:border-gray-300'
                } shadow-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition duration-150`}
              />
              {renderError('pincode')}
            </div>

            <div>
              <label className="block text-base font-medium text-gray-800 mb-1">
                Pickup / Delivery Preference <span className="text-red-500">*</span>
              </label>
              <select
                name="pickupDeliveryPreference"
                value={formData.pickupDeliveryPreference || ''}
                onChange={handleChange}
                required
                className={`mt-1 block w-full rounded-xl text-base px-4 py-3 border-2 ${
                  errors.pickupDeliveryPreference ? 'border-red-300' : 'border-gray-200 hover:border-gray-300'
                } shadow-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition duration-150`}
              >
                <option value="">Select preference</option>
                <option value="Pickup">Pickup</option>
                <option value="Delivery">Delivery</option>
                <option value="Both">Both</option>
              </select>
              {renderError('pickupDeliveryPreference')}
            </div>
          </div>
        );

      case 3: // Identity Proof
        return (
          <div className="space-y-6">
            <StepHeader 
              title="Identity Proof" 
              description="Individual / authorized person ki identity confirm karna" 
            />
            <div>
              <label className="block text-base font-medium text-gray-800 mb-1">
                Aadhaar Number <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="aadhaarNumber"
                value={formData.aadhaarNumber || ''}
                onChange={handleChange}
                required
                maxLength={12}
                pattern="[0-9]{12}"
                placeholder="Enter 12-digit Aadhaar number"
                className={`mt-1 block w-full rounded-xl text-base px-4 py-3 border-2 ${
                  errors.aadhaarNumber ? 'border-red-300' : 'border-gray-200 hover:border-gray-300'
                } shadow-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition duration-150`}
              />
              {formData.aadhaarNumber && formData.aadhaarNumber.length === 12 && (
                <p className="mt-2 text-sm font-medium text-gray-700">
                  Display: {maskAadhaar(formData.aadhaarNumber)}
                </p>
              )}
              {renderError('aadhaarNumber')}
            </div>

            <div>
              <label className="block text-base font-medium text-gray-800 mb-1">
                Upload Aadhaar Card (Front side) <span className="text-red-500">*</span>
              </label>
              {!formData.aadhaarCardPreview ? (
                <div className={`mt-1 border-2 ${
                  errors.aadhaarCard ? 'border-red-300 bg-red-50' : 'border-dashed border-gray-300 hover:border-emerald-400'
                } rounded-xl p-8 text-center transition-all duration-200`}>
                  <div className="space-y-1 text-center">
                    <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                      <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    <div className="flex text-sm text-gray-600 justify-center">
                      <label htmlFor="aadhaarCard" className="relative cursor-pointer bg-white rounded-md font-medium text-emerald-600 hover:text-emerald-500">
                        <span>Upload Aadhaar Card</span>
                        <input
                          id="aadhaarCard"
                          name="aadhaarCard"
                          type="file"
                          className="sr-only"
                          onChange={(e) => handleFileUpload('aadhaarCard', e)}
                          accept="image/*"
                        />
                      </label>
                      <p className="pl-1">(Front side only)</p>
                    </div>
                    <p className="text-sm text-gray-500">JPG, JPEG, or PNG up to 5MB</p>
                  </div>
                </div>
              ) : null}
              {formData.aadhaarCardPreview && (
                <div className="mt-4 p-4 border border-green-200 bg-green-50 rounded-lg">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center space-x-4">
                      <img src={formData.aadhaarCardPreview} alt="Aadhaar Preview" className="h-32 w-auto object-contain rounded-md" />
                      <div>
                        <p className="text-sm font-medium text-green-800">{formData.aadhaarCardName}</p>
                        <p className="text-xs text-gray-500 mt-1">Aadhaar Card uploaded</p>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <label className="cursor-pointer px-4 py-2 bg-emerald-600 text-white text-sm font-medium rounded-lg hover:bg-emerald-700 transition-colors">
                      <span>Edit</span>
                      <input
                        key={formData.aadhaarCardName}
                        type="file"
                        className="sr-only"
                        onChange={(e) => handleFileUpload('aadhaarCard', e)}
                        accept="image/*"
                      />
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        updateFormData({
                          aadhaarCard: null,
                          aadhaarCardName: '',
                          aadhaarCardPreview: ''
                        });
                      }}
                      className="px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 transition-colors"
                    >
                      Discard
                    </button>
                  </div>
                </div>
              )}
              {renderError('aadhaarCard')}
            </div>

            <div className="border-t pt-6">
              <p className="text-sm font-medium text-gray-700 mb-4">Alternate ID (Optional - if Aadhaar not available)</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-base font-medium text-gray-800 mb-1">Alternate ID Type</label>
                  <select
                    name="alternateIdType"
                    value={formData.alternateIdType || ''}
                    onChange={handleChange}
                    className="mt-1 block w-full rounded-xl text-base px-4 py-3 border-2 border-gray-200 hover:border-gray-300 shadow-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  >
                    <option value="">Select ID type</option>
                    <option value="PAN">PAN</option>
                    <option value="Voter ID">Voter ID</option>
                    <option value="Passport">Passport</option>
                  </select>
                </div>
                <div>
                  <label className="block text-base font-medium text-gray-800 mb-1">Upload Alternate ID</label>
                  {!formData.alternateIdFilePreview ? (
                    <input
                      type="file"
                      name="alternateIdFile"
                      onChange={(e) => handleFileUpload('alternateIdFile', e)}
                      accept="image/*,application/pdf"
                      className="mt-1 block w-full rounded-xl text-base px-4 py-3 border-2 border-gray-200 hover:border-gray-300 shadow-sm"
                    />
                  ) : (
                    <div className="mt-1 p-4 border border-green-200 bg-green-50 rounded-lg">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <p className="text-sm font-medium text-green-800">{formData.alternateIdFileName}</p>
                          <p className="text-xs text-gray-500 mt-1">Alternate ID uploaded</p>
                        </div>
                      </div>
                      <div className="flex gap-3">
                        <label className="cursor-pointer px-4 py-2 bg-emerald-600 text-white text-sm font-medium rounded-lg hover:bg-emerald-700 transition-colors">
                          <span>Edit</span>
                          <input
                            key={formData.alternateIdFileName}
                            type="file"
                            className="sr-only"
                            onChange={(e) => handleFileUpload('alternateIdFile', e)}
                            accept="image/*,application/pdf"
                          />
                        </label>
                        <button
                          type="button"
                          onClick={() => {
                            updateFormData({
                              alternateIdFile: null,
                              alternateIdFileName: '',
                              alternateIdFilePreview: ''
                            });
                          }}
                          className="px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 transition-colors"
                        >
                          Discard
                        </button>
                      </div>
                    </div>
                  )}
                  {renderError('alternateIdFile')}
                </div>
              </div>
            </div>
          </div>
        );

      case 4: // Organization Documents
        return (
          <div className="space-y-6">
            <StepHeader 
              title="Organization Proof" 
              description="Organization real hai ya nahi — ye verify hota hai" 
            />
<div>
              <label className="block text-base font-medium text-gray-800 mb-1">
                Upload NGO Certificate <span className="text-red-500">*</span>
              </label>
              {!formData.ngoCertificatePreview ? (
                <div className={`mt-1 border-2 ${
                  errors.ngoCertificate ? 'border-red-300 bg-red-50' : 'border-dashed border-gray-300 hover:border-emerald-400'
                } rounded-xl p-8 text-center transition-all duration-200`}>
                  <div className="space-y-1 text-center">
                    <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                      <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    <label htmlFor="ngoCertificate" className="relative cursor-pointer bg-white rounded-md font-medium text-emerald-600 hover:text-emerald-500">
                      <span>Upload NGO Certificate</span>
                      <input
                        id="ngoCertificate"
                        name="ngoCertificate"
                        type="file"
                        className="sr-only"
                        onChange={(e) => handleFileUpload('ngoCertificate', e)}
                        accept="image/*,application/pdf"
                        required
                      />
                    </label>
                    <p className="text-sm text-gray-500">PDF or Image up to 10MB</p>
                  </div>
                </div>
              ) : null}
              {formData.ngoCertificatePreview && (
                <div className="mt-4 p-4 border border-green-200 bg-green-50 rounded-lg">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <p className="text-sm font-medium text-green-800">{formData.ngoCertificateName}</p>
                      <p className="text-xs text-gray-500 mt-1">NGO Certificate uploaded</p>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <label className="cursor-pointer px-4 py-2 bg-emerald-600 text-white text-sm font-medium rounded-lg hover:bg-emerald-700 transition-colors">
                      <span>Edit</span>
                      <input
                        key={formData.ngoCertificateName}
                        type="file"
                        className="sr-only"
                        onChange={(e) => handleFileUpload('ngoCertificate', e)}
                        accept="image/*,application/pdf"
                      />
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        updateFormData({
                          ngoCertificate: null,
                          ngoCertificateName: '',
                          ngoCertificatePreview: ''
                        });
                      }}
                      className="px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 transition-colors"
                    >
                      Discard
                    </button>
                  </div>
                </div>
              )}
              {renderError('ngoCertificate')}
            </div>

            <div>
              <label className="block text-base font-medium text-gray-800 mb-1">
                Address Proof <span className="text-red-500">*</span>
              </label>
              <p className="text-sm text-gray-600 mb-2">Upload one document (Electricity bill / Rent agreement / Govt letter)</p>
              {!formData.addressProofPreview ? (
                <div className={`mt-1 border-2 ${
                  errors.addressProof ? 'border-red-300 bg-red-50' : 'border-dashed border-gray-300 hover:border-emerald-400'
                } rounded-xl p-8 text-center transition-all duration-200`}>
                  <div className="space-y-1 text-center">
                    <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                      <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    <label htmlFor="addressProof" className="relative cursor-pointer bg-white rounded-md font-medium text-emerald-600 hover:text-emerald-500">
                      <span>Upload Address Proof</span>
                      <input
                        id="addressProof"
                        name="addressProof"
                        type="file"
                        className="sr-only"
                        onChange={(e) => handleFileUpload('addressProof', e)}
                        accept="image/*,application/pdf"
                        required
                      />
                    </label>
                    <p className="text-sm text-gray-500">PDF or Image up to 10MB</p>
                  </div>
                </div>
              ) : null}
              {formData.addressProofPreview && (
                <div className="mt-4 p-4 border border-green-200 bg-green-50 rounded-lg">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <p className="text-sm font-medium text-green-800">{formData.addressProofName}</p>
                      <p className="text-xs text-gray-500 mt-1">Address Proof uploaded</p>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <label className="cursor-pointer px-4 py-2 bg-emerald-600 text-white text-sm font-medium rounded-lg hover:bg-emerald-700 transition-colors">
                      <span>Edit</span>
                      <input
                        key={formData.addressProofName}
                        type="file"
                        className="sr-only"
                        onChange={(e) => handleFileUpload('addressProof', e)}
                        accept="image/*,application/pdf"
                      />
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        updateFormData({
                          addressProof: null,
                          addressProofName: '',
                          addressProofPreview: ''
                        });
                      }}
                      className="px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 transition-colors"
                    >
                      Discard
                    </button>
                  </div>
                </div>
              )}
              {renderError('addressProof')}
            </div>
          </div>
        );

      case 5: // Verification & Declaration
        return (
          <div className="space-y-6">
            <StepHeader 
              title="Verification" 
              description="System Action: Status set to Verification Pending, Admin notified for review" 
            />
            <div className="space-y-6">
              <div className="flex items-start">
                <div className="flex items-center h-6">
                  <input
                    id="declaration"
                    name="declarationAccepted"
                    type="checkbox"
                    checked={formData.declarationAccepted as boolean || false}
                    onChange={handleChange}
                    className={`focus:ring-emerald-500 h-5 w-5 border-2 ${
                      errors.declarationAccepted 
                        ? 'border-red-300 text-red-600' 
                        : 'border-gray-300 text-emerald-600 hover:border-emerald-400'
                    } rounded`}
                    required
                  />
                </div>
                <div className="ml-3 text-base">
                  <label htmlFor="declaration" className={`font-medium ${
                    errors.declarationAccepted ? 'text-red-600' : 'text-gray-800'
                  }`}>
                    I confirm that all the information and documents provided are true.
                  </label>
                  {renderError('declarationAccepted')}
                </div>
              </div>

              <div className="flex items-start">
                <div className="flex items-center h-6">
                  <input
                    id="verificationConsent"
                    name="verificationConsent"
                    type="checkbox"
                    checked={formData.verificationConsent as boolean || false}
                    onChange={handleChange}
                    className={`focus:ring-emerald-500 h-5 w-5 border-2 ${
                      errors.verificationConsent 
                        ? 'border-red-300 text-red-600' 
                        : 'border-gray-300 text-emerald-600 hover:border-emerald-400'
                    } rounded`}
                    required
                  />
                </div>
                <div className="ml-3 text-base">
                  <label htmlFor="verificationConsent" className={`font-medium ${
                    errors.verificationConsent ? 'text-red-600' : 'text-gray-800'
                  }`}>
                    I allow the platform to verify my details.
                  </label>
                  {renderError('verificationConsent')}
                </div>
              </div>
            </div>
          </div>
        );

      case 6: // Review & Submit
        return (
          <div className="space-y-8">
            <StepHeader 
              title="Review & Submit" 
              description="Please review all information before submitting" 
            />
            <div className="bg-gray-50 p-6 rounded-lg space-y-6">
              <div>
                <h4 className="text-xl font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-200">Basic Information</h4>
                <dl className="grid grid-cols-1 gap-x-4 gap-y-3 sm:grid-cols-2">
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Organization Type</dt>
                    <dd className="mt-1 text-base text-gray-900 font-medium">{formData.organizationType}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Organization/NGO Name</dt>
                    <dd className="mt-1 text-base text-gray-900 font-medium">{formData.ngoName}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Contact Person</dt>
                    <dd className="mt-1 text-sm text-gray-900">{formData.contactPerson}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Mobile Number</dt>
                    <dd className="mt-1 text-sm text-gray-900">{formData.phone}</dd>
                  </div>
                </dl>
              </div>

              <div>
                <h4 className="text-xl font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-200">Location</h4>
                <dl className="grid grid-cols-1 gap-x-4 gap-y-3 sm:grid-cols-2">
                  <div>
                    <dt className="text-sm font-medium text-gray-500">City</dt>
                    <dd className="mt-1 text-sm text-gray-900">{formData.city}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">State</dt>
                    <dd className="mt-1 text-sm text-gray-900">{formData.state}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Pincode</dt>
                    <dd className="mt-1 text-sm text-gray-900">{formData.pincode}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Pickup/Delivery Preference</dt>
                    <dd className="mt-1 text-sm text-gray-900">{formData.pickupDeliveryPreference}</dd>
                  </div>
                </dl>
              </div>

              <div>
                <h4 className="text-xl font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-200">Identity Proof</h4>
                <dl className="grid grid-cols-1 gap-x-4 gap-y-3">
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Aadhaar Number</dt>
                    <dd className="mt-1 text-sm text-gray-900 font-mono">
                      {formData.aadhaarNumber ? maskAadhaar(formData.aadhaarNumber) : 'Not provided'}
                    </dd>
                  </div>
                  {formData.alternateIdType && (
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Alternate ID</dt>
                      <dd className="mt-1 text-sm text-gray-900">{formData.alternateIdType}</dd>
                    </div>
                  )}
                </dl>
              </div>

              <div>
                <h4 className="text-xl font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-200">Organization Documents</h4>
                <dl className="grid grid-cols-1 gap-x-4 gap-y-3">
                  {formData.registrationNumber && (
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Registration Number</dt>
                      <dd className="mt-1 text-sm text-gray-900">{formData.registrationNumber}</dd>
                    </div>
                  )}
                </dl>
              </div>

              <div className="pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => setCurrentStep(1)}
                  className="text-emerald-600 hover:text-emerald-700 font-medium"
                >
                  Edit any step →
                </button>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-10">
      <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
        <div className="md:flex min-h-[600px]">
          {/* Sidebar */}
          <div className="md:w-1/4 bg-gradient-to-b from-emerald-600 to-emerald-700 p-8 text-white">
            <h2 className="text-3xl font-bold mb-8">Registration</h2>
            <nav className="space-y-4">
              {steps.map((step) => (
                <div
                  key={step.id}
                  className={`flex items-center p-4 rounded-xl transition-all ${
                    currentStep === step.id
                      ? 'bg-white/20 backdrop-blur-sm shadow-lg transform -translate-x-1'
                      : 'opacity-90 hover:opacity-100 hover:bg-white/10'
                  }`}
                >
                  <span className={`flex items-center justify-center w-10 h-10 rounded-full font-semibold text-lg mr-4 ${
                    currentStep >= step.id
                      ? 'bg-white text-emerald-700'
                      : 'bg-white/20 border-2 border-white/30'
                  }`}>
                    {currentStep > step.id ? '✓' : step.id}
                  </span>
                  <div className="flex-1">
                    <div className="text-sm font-medium">{step.name}</div>
                    <div className="text-xs opacity-80">{step.section}</div>
                  </div>
                </div>
              ))}
            </nav>
          </div>

          {/* Main Content */}
          <div className="md:w-3/4 p-10 overflow-y-auto max-h-[600px]">
            <form onSubmit={handleSubmit} className="space-y-8">
              {submitError && (
                <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-600 flex items-start">
                    <svg className="w-5 h-5 mt-0.5 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                    {submitError}
                  </p>
                </div>
              )}
              {renderStep()}

              <div className="flex flex-col sm:flex-row justify-between pt-8 mt-8 border-t border-gray-200">
                <button
                  type="button"
                  onClick={prevStep}
                  className={`px-8 py-3 text-lg rounded-xl font-medium mb-4 sm:mb-0 ${
                    isFirstStep
                      ? 'text-gray-400 cursor-not-allowed bg-gray-100'
                      : 'text-emerald-700 hover:bg-emerald-50 border-2 border-emerald-100'
                  }`}
                  disabled={isFirstStep}
                >
                  ← Previous Step
                </button>
                <div className="flex flex-col sm:flex-row gap-4">
                  <button
                    type="button"
                    onClick={onBack}
                    className="px-8 py-3 text-lg text-gray-700 bg-white border-2 border-gray-200 rounded-xl font-medium hover:bg-gray-50 transition-colors"
                  >
                    Save & Exit
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className={`px-8 py-3 bg-gradient-to-r from-emerald-600 to-emerald-700 text-white text-lg font-semibold rounded-xl hover:from-emerald-700 hover:to-emerald-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 shadow-lg shadow-emerald-100 hover:shadow-emerald-200 transition-all ${
                      isSubmitting ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                  >
                    {isSubmitting ? (
                      <span className="flex items-center">
                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Submitting...
                      </span>
                    ) : (
                      isLastStep ? 'Submit Registration' : 'Continue →'
                    )}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NgoRegistration;

