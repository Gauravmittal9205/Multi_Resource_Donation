import React, { useState } from 'react';
import { useForm } from '../context/FormContext';

interface NgoRegistrationProps {
  onBack: () => void;
  onSuccess: () => void;
}

const NgoRegistration: React.FC<NgoRegistrationProps> = ({ onBack, onSuccess }) => {
  const [isSubmitted, setIsSubmitted] = useState(false);
  const { formData, currentStep, updateFormData, setCurrentStep, clearForm } = useForm();

  const [errors, setErrors] = useState<Record<string, string>>({});

  const steps = [
    { id: 1, name: 'Basic Information' },
    { id: 2, name: 'Contact Details' },
    { id: 3, name: 'Organization Info' },
    { id: 4, name: 'Aadhaar Upload' },
    { id: 5, name: 'Review & Submit' },
  ];

  const isFirstStep = currentStep === 1;
  const isLastStep = currentStep === steps.length;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target as HTMLInputElement;
    const checked = type === 'checkbox' ? (e.target as HTMLInputElement).checked : undefined;
    
    updateFormData({
      [name]: type === 'checkbox' ? checked : value
    });
  };

  const handleAadhaarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      
      if (file.type.startsWith('image/')) {
        reader.onloadend = () => {
          updateFormData({
            aadhaarCard: file,
            aadhaarCardName: file.name,
            aadhaarCardPreview: reader.result as string
          });
        };
        reader.readAsDataURL(file);
      } else {
        updateFormData({
          aadhaarCard: file,
          aadhaarCardName: file.name,
          aadhaarCardPreview: ''
        });
      }
    }
  };

  const validateStep = (step: number): boolean => {
    const newErrors: Record<string, string> = {};
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const phoneRegex = /^[6-9]\d{9}$/;
    const nameRegex = /^[a-zA-Z\s]{3,50}$/;
    const currentYear = new Date().getFullYear();

    if (step === 1) {
      // NGO Name validation
      if (!formData.ngoName.trim()) {
        newErrors.ngoName = 'NGO name is required';
      } else if (formData.ngoName.trim().length < 3) {
        newErrors.ngoName = 'NGO name must be at least 3 characters';
      } else if (formData.ngoName.trim().length > 100) {
        newErrors.ngoName = 'NGO name cannot exceed 100 characters';
      }

      // Registration Number validation (only check if not empty)
      if (!formData.registrationNumber.trim()) {
        newErrors.registrationNumber = 'Registration number is required';
      }

      // Registration Date validation
      if (!formData.registrationDate) {
        newErrors.registrationDate = 'Registration date is required';
      } else {
        const selectedDate = new Date(formData.registrationDate);
        const minDate = new Date('1900-01-01');
        const maxDate = new Date();
        
        if (selectedDate < minDate) {
          newErrors.registrationDate = 'Registration date is too far in the past';
        } else if (selectedDate > maxDate) {
          newErrors.registrationDate = 'Registration date cannot be in the future';
        }
      }
    } 
    
    else if (step === 2) {
      // Contact Person validation
      if (!formData.contactPerson.trim()) {
        newErrors.contactPerson = 'Contact person is required';
      } else if (!nameRegex.test(formData.contactPerson.trim())) {
        newErrors.contactPerson = 'Please enter a valid name (only letters and spaces, 3-50 characters)';
      }

      // Phone validation
      if (!formData.phone.trim()) {
        newErrors.phone = 'Phone number is required';
      } else if (!phoneRegex.test(formData.phone.trim())) {
        newErrors.phone = 'Please enter a valid 10-digit phone number';
      }

      // Email validation
      if (!formData.email.trim()) {
        newErrors.email = 'Email is required';
      } else if (!emailRegex.test(formData.email.trim())) {
        newErrors.email = 'Please enter a valid email address';
      } else if (formData.email.length > 100) {
        newErrors.email = 'Email cannot exceed 100 characters';
      }

      // Website validation (optional but must be valid if provided)
      if (formData.website && formData.website.trim() !== '') {
        try {
          new URL(formData.website.startsWith('http') ? formData.website : `https://${formData.website}`);
        } catch (e) {
          newErrors.website = 'Please enter a valid website URL';
        }
      }

      // Address validation
      if (!formData.address.trim()) {
        newErrors.address = 'Address is required';
      } else if (formData.address.trim().length < 10) {
        newErrors.address = 'Address must be at least 10 characters';
      } else if (formData.address.trim().length > 200) {
        newErrors.address = 'Address cannot exceed 200 characters';
      }
    } 
    
    else if (step === 3) {
      // Description validation
      if (!formData.description.trim()) {
        newErrors.description = 'Organization description is required';
      } else if (formData.description.trim().length < 50) {
        newErrors.description = 'Description must be at least 50 characters';
      } else if (formData.description.trim().length > 1000) {
        newErrors.description = 'Description cannot exceed 1000 characters';
      }

      // Establishment Year validation
      if (!formData.establishmentYear) {
        newErrors.establishmentYear = 'Establishment year is required';
      } else if (formData.establishmentYear < 1800 || formData.establishmentYear > currentYear) {
        newErrors.establishmentYear = `Please enter a valid year between 1800 and ${currentYear}`;
      }
    } 
    
    else if (step === 4) {
      // Aadhaar Card validation
      if (!formData.aadhaarCard) {
        newErrors.aadhaarCard = 'Aadhaar card is required';
      } else if (formData.aadhaarCard.size > 5 * 1024 * 1024) { // 5MB limit
        newErrors.aadhaarCard = 'File size should not exceed 5MB';
      } else if (!['image/jpeg', 'image/png', 'image/jpg'].includes(formData.aadhaarCard.type)) {
        newErrors.aadhaarCard = 'Only JPG, JPEG, and PNG files are allowed';
      }
    } 
    
    else if (step === 5) {
      // Terms and Conditions validation
      if (!formData.termsAccepted) {
        newErrors.termsAccepted = 'You must accept the terms and conditions to proceed';
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const nextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(currentStep + 1);
      setErrors({});
      // Scroll to top when moving to next step
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      // Scroll to the first error if validation fails
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
    } else {
      onBack();
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isLastStep) {
      if (validateStep(currentStep)) {
        console.log('Form submitted:', formData);
        setIsSubmitted(true);
        // Clear form and reset after showing success message
        setTimeout(() => {
          clearForm();
          onSuccess();
        }, 3000);
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
          <svg
            className="h-10 w-10 text-green-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5 13l4 4L19 7"
            />
          </svg>
        </div>
        <h3 className="mt-4 text-2xl font-medium text-gray-900">Registration Successful!</h3>
        <p className="mt-2 text-gray-600">Thank you for registering your NGO with us.</p>
        <p className="mt-1 text-gray-500">You will be redirected to the home page shortly...</p>
      </div>
    );
  }

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <StepHeader 
              title="Basic Information" 
              description="Tell us about your organization" 
            />
            <div>
              <label className="block text-base font-medium text-gray-800 mb-1">NGO Name *</label>
              <input
                type="text"
                name="ngoName"
                value={formData.ngoName}
                onChange={handleChange}
                required
                className={`mt-1 block w-full rounded-xl text-base px-4 py-3 border-2 ${
                  errors.ngoName ? 'border-red-300' : 'border-gray-200 hover:border-gray-300'
                } shadow-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition duration-150`}
              />
              {renderError('ngoName')}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-base font-medium text-gray-800 mb-1">Registration Number *</label>
                <input
                  type="text"
                  name="registrationNumber"
                  value={formData.registrationNumber}
                  onChange={handleChange}
                  required
                  placeholder="e.g., 1234/5678/90 or ABC-1234-XY"
                  className={`mt-1 block w-full rounded-xl text-base px-4 py-3 border-2 ${
                    errors.registrationNumber ? 'border-red-300' : 'border-gray-200 hover:border-gray-300'
                  } shadow-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition duration-150`}
                />
                <p className="mt-1 text-sm text-gray-500">
                  Enter your organization's registration number
                </p>
                {renderError('registrationNumber')}
              </div>
              <div>
                <label className="block text-base font-medium text-gray-800 mb-1">Registration Date *</label>
                <input
                  type="date"
                  name="registrationDate"
                  value={formData.registrationDate}
                  onChange={handleChange}
                  required
                  className={`mt-1 block w-full rounded-xl text-base px-4 py-3 border-2 ${
                    errors.registrationDate ? 'border-red-300' : 'border-gray-200 hover:border-gray-300'
                  } shadow-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition duration-150`}
                />
                {renderError('registrationDate')}
              </div>
            </div>
          </div>
        );
      case 2:
        return (
          <div className="space-y-6">
            <StepHeader 
              title="Contact Information" 
              description="How can we reach you?" 
            />
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-base font-medium text-gray-800 mb-1">Contact Person *</label>
                <input
                  type="text"
                  name="contactPerson"
                  value={formData.contactPerson}
                  onChange={handleChange}
                  required
                  className={`mt-1 block w-full rounded-xl text-base px-4 py-3 border-2 ${
                    errors.contactPerson ? 'border-red-300' : 'border-gray-200 hover:border-gray-300'
                  } shadow-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition duration-150`}
                />
                {renderError('contactPerson')}
              </div>
              <div>
                <label className="block text-base font-medium text-gray-800 mb-1">Phone Number *</label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  required
                  className={`mt-1 block w-full rounded-xl text-base px-4 py-3 border-2 ${
                    errors.phone ? 'border-red-300' : 'border-gray-200 hover:border-gray-300'
                  } shadow-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition duration-150`}
                />
                {renderError('phone')}
              </div>
            </div>
            <div>
              <label className="block text-base font-medium text-gray-800 mb-1">Email *</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                className={`mt-1 block w-full rounded-xl text-base px-4 py-3 border-2 ${
                  errors.email ? 'border-red-300' : 'border-gray-200 hover:border-gray-300'
                } shadow-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition duration-150`}
              />
              {renderError('email')}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-base font-medium text-gray-800 mb-1">Website</label>
                <input
                  type="url"
                  name="website"
                  value={formData.website}
                  onChange={handleChange}
                  placeholder="https://example.com"
                  className="mt-1 block w-full rounded-xl text-base px-4 py-3 border-2 border-gray-200 hover:border-gray-300 shadow-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition duration-150"
                />
              </div>
              <div>
                <label className="block text-base font-medium text-gray-800 mb-1">Year of Establishment</label>
                <select
                  name="establishmentYear"
                  value={formData.establishmentYear}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-xl text-base px-4 py-3 border-2 border-gray-200 hover:border-gray-300 shadow-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition duration-150"
                >
                  {Array.from({length: 50}, (_, i) => new Date().getFullYear() - i).map(year => (
                    <option key={year} value={year}>{year}</option>
                  ))}
                </select>
              </div>
            </div>
            <div>
              <label className="block text-base font-medium text-gray-800 mb-1">Address *</label>
              <textarea
                name="address"
                value={formData.address}
                onChange={handleChange}
                required
                rows={3}
                className={`mt-1 block w-full rounded-xl text-base px-4 py-3 border-2 ${
                  errors.address ? 'border-red-300' : 'border-gray-200 hover:border-gray-300'
                } shadow-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition duration-150`}
              />
              {renderError('address')}
            </div>
          </div>
        );
      case 3:
        return (
          <div className="space-y-6">
            <StepHeader 
              title="Organization Details" 
              description="Tell us more about your work" 
            />
            <div>
              <label className="block text-base font-medium text-gray-800 mb-1">About Your Organization *</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                required
                rows={6}
                placeholder="Tell us about your organization's mission, vision, and activities..."
                className={`mt-1 block w-full rounded-xl text-base px-4 py-3 border-2 ${
                  errors.description ? 'border-red-300' : 'border-gray-200 hover:border-gray-300'
                } shadow-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition duration-150`}
              />
              {renderError('description')}
            </div>
          </div>
        );
      case 4:
        return (
          <div className="space-y-6">
            <StepHeader 
              title="Aadhaar Card Upload" 
              description="Please upload a clear photo of your Aadhaar Card (Front Side)" 
            />
            <div className={`border-2 ${
              errors['aadhaarCard'] ? 'border-red-300 bg-red-50' : 'border-dashed border-gray-300 hover:border-emerald-400'
            } rounded-xl p-8 text-center transition-all duration-200`}>
              <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
                <div className="space-y-1 text-center">
                  <svg
                    className="mx-auto h-12 w-12 text-gray-400"
                    stroke="currentColor"
                    fill="none"
                    viewBox="0 0 48 48"
                    aria-hidden="true"
                  >
                    <path
                      d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                      strokeWidth={2}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                  <div className="flex text-sm text-gray-600 justify-center">
                    <label
                      htmlFor="aadhaarCard"
                      className="relative cursor-pointer bg-white rounded-md font-medium text-emerald-600 hover:text-emerald-500 focus-within:outline-none"
                    >
                      <span>Upload Aadhaar Card</span>
                      <input
                        id="aadhaarCard"
                        name="aadhaarCard"
                        type="file"
                        className="sr-only"
                        onChange={handleAadhaarUpload}
                        accept="image/*"
                        required
                      />
                    </label>
                    <p className="pl-1">(Front side only)</p>
                  </div>
                  <p className="text-sm text-gray-500 mt-2">JPG, JPEG, or PNG up to 5MB</p>
                  {errors['aadhaarCard'] && (
                    <p className="mt-2 text-sm text-red-600">{errors['aadhaarCard']}</p>
                  )}
                </div>
              </div>
            </div>
            
            {formData.aadhaarCardPreview && formData.aadhaarCard && (
              <div className="mt-6 p-4 border border-green-200 bg-green-50 rounded-lg">
                <div className="flex items-center space-x-4">
                  <img 
                    src={formData.aadhaarCardPreview} 
                    alt="Aadhaar Card Preview" 
                    className="h-32 w-auto object-contain rounded-md border border-gray-200"
                  />
                  <div className="text-left">
                    <p className="text-sm font-medium text-green-800">Aadhaar Card (Front)</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {formData.aadhaarCard.type || 'Image'} • 
                      {`Size: ${Math.round(formData.aadhaarCard.size / 1024)} KB`}
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        updateFormData({
                          aadhaarCard: null,
                          aadhaarCardName: '',
                          aadhaarCardPreview: ''
                        });
                      }}
                      className="mt-2 text-xs text-red-600 hover:text-red-800"
                    >
                      Remove and upload again
                    </button>
                  </div>
                </div>
              </div>
            )}
            
            <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <h4 className="text-sm font-medium text-blue-800 mb-2">Note:</h4>
              <ul className="text-sm text-blue-700 space-y-1 list-disc pl-5">
                <li>Upload a clear photo of the front side of your Aadhaar Card</li>
                <li>Make sure all details are clearly visible</li>
                <li>File should be in JPG, JPEG, or PNG format</li>
                <li>Maximum file size: 5MB</li>
              </ul>
            </div>
          </div>
        );
      case 5:
        return (
          <div className="space-y-8">
            <StepHeader 
              title="Review Your Information" 
              description="Please verify all details before submitting" 
            />
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="text-xl font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-100">Basic Information</h4>
              <dl className="grid grid-cols-1 gap-x-4 gap-y-2 sm:grid-cols-2">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <dt className="text-sm font-medium text-gray-500">NGO Name</dt>
                  <dd className="mt-1 text-base text-gray-900 font-medium">{formData.ngoName}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Registration Number</dt>
                  <dd className="mt-1 text-sm text-gray-900">{formData.registrationNumber}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Registration Date</dt>
                  <dd className="mt-1 text-sm text-gray-900">{formData.registrationDate}</dd>
                </div>
              </dl>

              <h4 className="text-xl font-semibold text-gray-900 mt-8 mb-4 pb-2 border-b border-gray-100">Contact Information</h4>
              <dl className="grid grid-cols-1 gap-x-4 gap-y-2 sm:grid-cols-2">
                <div>
                  <dt className="text-sm font-medium text-gray-500">Contact Person</dt>
                  <dd className="mt-1 text-sm text-gray-900">{formData.contactPerson}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Phone</dt>
                  <dd className="mt-1 text-sm text-gray-900">{formData.phone}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Email</dt>
                  <dd className="mt-1 text-sm text-gray-900">{formData.email}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Website</dt>
                  <dd className="mt-1 text-sm text-gray-900">{formData.website || 'Not provided'}</dd>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <dt className="text-sm font-medium text-gray-500">Address</dt>
                  <dd className="mt-2 text-base text-gray-900 whitespace-pre-line">{formData.address}</dd>
                </div>
              </dl>

              <h4 className="text-xl font-semibold text-gray-900 mt-8 mb-4 pb-2 border-b border-gray-100">Organization Details</h4>
              <div>
                <dt className="text-sm font-medium text-gray-500">About</dt>
                <dd className="mt-1 text-sm text-gray-900 whitespace-pre-line">{formData.description}</dd>
              </div>
              <div className="mt-4">
                <dt className="text-sm font-medium text-gray-500">Year of Establishment</dt>
                <dd className="mt-1 text-sm text-gray-900">{formData.establishmentYear}</dd>
              </div>

              <div className="mt-10 pt-6 border-t border-gray-200">
                <div className="flex items-start">
                  <div className="flex items-center h-6">
                    <input
                      id="terms"
                      name="termsAccepted"
                      type="checkbox"
                      checked={formData.termsAccepted as boolean}
                      onChange={handleChange}
                      className={`focus:ring-emerald-500 h-5 w-5 border-2 ${
                        errors.termsAccepted 
                          ? 'border-red-300 text-red-600' 
                          : 'border-gray-300 text-emerald-600 hover:border-emerald-400'
                      } rounded`}
                      required
                    />
                  </div>
                  <div className="ml-3 text-base">
                    <label htmlFor="terms" className={`font-medium ${
                      errors.termsAccepted ? 'text-red-600' : 'text-gray-800'
                    }`}>
                      I certify that all the information provided is accurate and complete to the best of my knowledge.
                      {errors.termsAccepted && (
                        <p className="text-red-600 text-sm font-normal mt-1 flex items-center">
                          <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                          </svg>
                          {errors.termsAccepted}
                        </p>
                      )}
                    </label>
                  </div>
                </div>
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
                  <span className="text-lg">{step.name}</span>
                </div>
              ))}
            </nav>
          </div>

          {/* Main Content */}
          <div className="md:w-3/4 p-10 overflow-y-auto max-h-[600px]">
            <form onSubmit={handleSubmit} className="space-y-8">
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
                    className="px-8 py-3 bg-gradient-to-r from-emerald-600 to-emerald-700 text-white text-lg font-semibold rounded-xl hover:from-emerald-700 hover:to-emerald-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 shadow-lg shadow-emerald-100 hover:shadow-emerald-200 transition-all"
                  >
                    {isLastStep ? 'Submit Application' : 'Continue →'}
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
