import React, { useEffect, useState } from 'react';
import { FiUser, FiFileText } from 'react-icons/fi';
import { EmailAuthProvider, reauthenticateWithCredential, updatePassword } from 'firebase/auth';
import type { User as FirebaseUser } from 'firebase/auth';

interface NgoProfilePageProps {
  user: FirebaseUser;
}

const NgoProfilePage: React.FC<NgoProfilePageProps> = ({ user: propUser }) => {
  // Form state
  const [isEditing, setIsEditing] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [showCurrentPassword] = useState(false);
  const [showNewPassword] = useState(false);
  const [showConfirmNewPassword] = useState(false);

  // NGO Profile Data
  const [profile, setProfile] = useState({
    organizationName: '',
    registrationNumber: '',
    contactPerson: '',
    email: '',
    phone: '',
    address: {
      street: '',
      city: '',
      state: '',
      pincode: '',
      country: 'India',
    },
    website: '',
    description: '',
    areasOfOperation: [] as string[],
    establishedYear: '',
    certificateUrl: '',
    logoUrl: '',
  });

  // Available areas of operation
  const availableAreas = [
    'Food Distribution',
    'Education',
    'Healthcare',
    'Women Empowerment',
    'Child Welfare',
    'Environment',
    'Disaster Relief',
    'Elderly Care',
    'Animal Welfare',
    'Other'
  ];

  // Load NGO profile data
  useEffect(() => {
    if (!propUser?.uid) return;
    
    const fetchNgoProfile = async () => {
      try {
        // Replace with your actual API endpoint
        const response = await fetch(`http://localhost:5000/api/v1/ngos/${propUser.uid}`, {
          headers: {
            'Authorization': `Bearer ${await propUser.getIdToken()}`
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          setProfile(prev => ({
            ...prev,
            ...data,
            address: {
              ...prev.address,
              ...(data.address || {})
            }
          }));
        } else {
          // Initialize with user data if no profile exists
          setProfile(prev => ({
            ...prev,
            email: propUser.email || '',
            contactPerson: propUser.displayName || '',
            organizationName: propUser.displayName || ''
          }));
        }
      } catch (error) {
        console.error('Error loading NGO profile:', error);
        setFormError('Failed to load profile. Please try again.');
      }
    };
    
    fetchNgoProfile();
  }, [propUser]);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    
    try {
      const response = await fetch(`http://localhost:5000/api/v1/ngos/${propUser.uid}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await propUser.getIdToken()}`
        },
        body: JSON.stringify(profile)
      });
      
      if (!response.ok) {
        throw new Error('Failed to save profile');
      }
      
      setFormError('Profile saved successfully!');
      setTimeout(() => setFormError(null), 3000);
      setIsEditing(false);
    } catch (error) {
      console.error('Error saving profile:', error);
      setFormError('Failed to save profile. Please try again.');
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (newPassword !== confirmNewPassword) {
      setFormError('New passwords do not match');
      return;
    }
    
    try {
      const credential = EmailAuthProvider.credential(
        propUser.email || '',
        currentPassword
      );
      
      await reauthenticateWithCredential(propUser, credential);
      await updatePassword(propUser, newPassword);
      
      setFormError('Password updated successfully!');
      setShowChangePassword(false);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmNewPassword('');
      
      setTimeout(() => setFormError(null), 3000);
    } catch (error) {
      console.error('Error changing password:', error);
      setFormError('Failed to update password. Please check your current password.');
    }
  };


  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">NGO Profile</h1>
            <p className="mt-1 text-sm text-gray-500">
              Manage your organization's profile and settings
            </p>
          </div>
          
          <div className="flex space-x-3">
            {!isEditing ? (
              <>
                <button
                  type="button"
                  onClick={() => setIsEditing(true)}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500"
                >
                  <FiUser className="-ml-1 mr-2 h-4 w-4" />
                  Edit Profile
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveProfile}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500"
                >
                  Save Changes
                </button>
              </>
            )}
          </div>
        </div>

        {formError && (
          <div className={`p-3 rounded-md ${formError.includes('success') ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
            {formError}
          </div>
        )}

        {/* Organization Information */}
        <div className="bg-white shadow overflow-hidden sm:rounded-lg">
          <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
            <h3 className="text-lg leading-6 font-medium text-gray-900">Organization Information</h3>
          </div>
          
          <div className="px-4 py-5 sm:p-6">
            <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
              {/* Organization Name */}
              <div className="sm:col-span-4">
                <label className="block text-sm font-medium text-gray-700">
                  Organization Name <span className="text-red-500">*</span>
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    value={profile.organizationName}
                    onChange={(e) => setProfile({...profile, organizationName: e.target.value})}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm"
                    required
                  />
                ) : (
                  <p className="mt-1 text-sm text-gray-900">{profile.organizationName || '—'}</p>
                )}
              </div>

              {/* Registration Number */}
              <div className="sm:col-span-4">
                <label className="block text-sm font-medium text-gray-700">
                  Registration Number <span className="text-red-500">*</span>
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    value={profile.registrationNumber}
                    onChange={(e) => setProfile({...profile, registrationNumber: e.target.value})}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm"
                    required
                  />
                ) : (
                  <p className="mt-1 text-sm text-gray-900">{profile.registrationNumber || '—'}</p>
                )}
              </div>

              {/* Contact Person */}
              <div className="sm:col-span-4">
                <label className="block text-sm font-medium text-gray-700">
                  Contact Person <span className="text-red-500">*</span>
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    value={profile.contactPerson}
                    onChange={(e) => setProfile({...profile, contactPerson: e.target.value})}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm"
                    required
                  />
                ) : (
                  <p className="mt-1 text-sm text-gray-900">{profile.contactPerson || '—'}</p>
                )}
              </div>

              {/* Email */}
              <div className="sm:col-span-4">
                <label className="block text-sm font-medium text-gray-700">
                  Email <span className="text-red-500">*</span>
                </label>
                {isEditing ? (
                  <input
                    type="email"
                    value={profile.email}
                    onChange={(e) => setProfile({...profile, email: e.target.value})}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm"
                    required
                  />
                ) : (
                  <p className="mt-1 text-sm text-gray-900">{profile.email || '—'}</p>
                )}
              </div>

              {/* Phone */}
              <div className="sm:col-span-4">
                <label className="block text-sm font-medium text-gray-700">
                  Phone <span className="text-red-500">*</span>
                </label>
                {isEditing ? (
                  <div className="mt-1 flex rounded-md shadow-sm">
                    <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-300 bg-gray-50 text-gray-500 text-sm">
                      +91
                    </span>
                    <input
                      type="tel"
                      value={profile.phone?.replace(/^\+91/, '') || ''}
                      onChange={(e) => {
                        const phone = e.target.value.replace(/\D/g, '').slice(0, 10);
                        setProfile({...profile, phone: phone ? `+91${phone}` : ''});
                      }}
                      className="flex-1 min-w-0 block w-full rounded-none rounded-r-md border-gray-300 focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm p-2 border"
                      placeholder="9876543210"
                      maxLength={10}
                      required
                    />
                  </div>
                ) : (
                  <p className="mt-1 text-sm text-gray-900">{profile.phone || '—'}</p>
                )}
              </div>

              {/* Website */}
              <div className="sm:col-span-4">
                <label className="block text-sm font-medium text-gray-700">
                  Website
                </label>
                {isEditing ? (
                  <input
                    type="url"
                    value={profile.website}
                    onChange={(e) => setProfile({...profile, website: e.target.value})}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm"
                    placeholder="https://example.com"
                  />
                ) : (
                  <p className="mt-1 text-sm text-gray-900">
                    {profile.website ? (
                      <a href={profile.website.startsWith('http') ? profile.website : `https://${profile.website}`} 
                         target="_blank" 
                         rel="noopener noreferrer"
                         className="text-emerald-600 hover:text-emerald-500">
                        {profile.website}
                      </a>
                    ) : '—'}
                  </p>
                )}
              </div>

              {/* Established Year */}
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-gray-700">
                  Established Year
                </label>
                {isEditing ? (
                  <input
                    type="number"
                    min="1900"
                    max={new Date().getFullYear()}
                    value={profile.establishedYear}
                    onChange={(e) => setProfile({...profile, establishedYear: e.target.value})}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm"
                    placeholder="e.g. 2010"
                  />
                ) : (
                  <p className="mt-1 text-sm text-gray-900">{profile.establishedYear || '—'}</p>
                )}
              </div>

              {/* Description */}
              <div className="sm:col-span-6">
                <label className="block text-sm font-medium text-gray-700">
                  About Your Organization
                </label>
                {isEditing ? (
                  <textarea
                    rows={4}
                    value={profile.description}
                    onChange={(e) => setProfile({...profile, description: e.target.value})}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm"
                    placeholder="Tell us about your organization, its mission, and activities..."
                  />
                ) : (
                  <p className="mt-1 text-sm text-gray-900 whitespace-pre-line">
                    {profile.description || '—'}
                  </p>
                )}
              </div>

              {/* Areas of Operation */}
              <div className="sm:col-span-6">
                <label className="block text-sm font-medium text-gray-700">
                  Areas of Operation <span className="text-red-500">*</span>
                </label>
                {isEditing ? (
                  <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                    {availableAreas.map((area) => (
                      <div key={area} className="flex items-start">
                        <div className="flex items-center h-5">
                          <input
                            id={`area-${area}`}
                            name="areas"
                            type="checkbox"
                            className="focus:ring-emerald-500 h-4 w-4 text-emerald-600 border-gray-300 rounded"
                            checked={profile.areasOfOperation.includes(area)}
                            onChange={(e) => {
                              const { checked } = e.target;
                              setProfile(prev => ({
                                ...prev,
                                areasOfOperation: checked
                                  ? [...prev.areasOfOperation, area]
                                  : prev.areasOfOperation.filter(a => a !== area)
                              }));
                            }}
                          />
                        </div>
                        <div className="ml-3 text-sm">
                          <label htmlFor={`area-${area}`} className="font-medium text-gray-700">
                            {area}
                          </label>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {profile.areasOfOperation.length > 0 ? (
                      profile.areasOfOperation.map((area) => (
                        <span 
                          key={area}
                          className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800"
                        >
                          {area}
                        </span>
                      ))
                    ) : (
                      <p className="text-sm text-gray-500">No areas specified</p>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Address Section */}
        <div className="bg-white shadow overflow-hidden sm:rounded-lg">
          <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
            <h3 className="text-lg leading-6 font-medium text-gray-900">Address</h3>
          </div>
          
          <div className="px-4 py-5 sm:p-6">
            <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
              {/* Street Address */}
              <div className="sm:col-span-6">
                <label className="block text-sm font-medium text-gray-700">
                  Street Address <span className="text-red-500">*</span>
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    value={profile.address.street}
                    onChange={(e) => setProfile({
                      ...profile,
                      address: { ...profile.address, street: e.target.value }
                    })}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm"
                    required
                  />
                ) : (
                  <p className="mt-1 text-sm text-gray-900">{profile.address.street || '—'}</p>
                )}
              </div>

              {/* City */}
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-gray-700">
                  City <span className="text-red-500">*</span>
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    value={profile.address.city}
                    onChange={(e) => setProfile({
                      ...profile,
                      address: { ...profile.address, city: e.target.value }
                    })}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm"
                    required
                  />
                ) : (
                  <p className="mt-1 text-sm text-gray-900">{profile.address.city || '—'}</p>
                )}
              </div>

              {/* State */}
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-gray-700">
                  State <span className="text-red-500">*</span>
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    value={profile.address.state}
                    onChange={(e) => setProfile({
                      ...profile,
                      address: { ...profile.address, state: e.target.value }
                    })}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm"
                    required
                  />
                ) : (
                  <p className="mt-1 text-sm text-gray-900">{profile.address.state || '—'}</p>
                )}
              </div>

              {/* Pincode */}
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-gray-700">
                  Pincode <span className="text-red-500">*</span>
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    value={profile.address.pincode}
                    onChange={(e) => {
                      const pincode = e.target.value.replace(/\D/g, '').slice(0, 6);
                      setProfile({
                        ...profile,
                        address: { ...profile.address, pincode }
                      });
                    }}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm"
                    maxLength={6}
                    required
                  />
                ) : (
                  <p className="mt-1 text-sm text-gray-900">{profile.address.pincode || '—'}</p>
                )}
              </div>

              {/* Country */}
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-gray-700">
                  Country
                </label>
                <p className="mt-1 text-sm text-gray-900">India</p>
              </div>
            </div>
          </div>
        </div>

        {/* Documents Section */}
        <div className="bg-white shadow overflow-hidden sm:rounded-lg">
          <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
            <h3 className="text-lg leading-6 font-medium text-gray-900">Documents</h3>
          </div>
          
          <div className="px-4 py-5 sm:p-6">
            <div className="space-y-6">
              {/* Registration Certificate */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Registration Certificate
                </label>
                {isEditing ? (
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
                      <div className="flex text-sm text-gray-600">
                        <label
                          htmlFor="certificate-upload"
                          className="relative cursor-pointer bg-white rounded-md font-medium text-emerald-600 hover:text-emerald-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-emerald-500"
                        >
                          <span>Upload a file</span>
                          <input
                            id="certificate-upload"
                            name="certificate-upload"
                            type="file"
                            className="sr-only"
                            accept=".pdf,.jpg,.jpeg,.png"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                // Handle file upload logic here
                                console.log('Uploading file:', file);
                                // Update the certificate URL after upload
                                // setProfile({...profile, certificateUrl: uploadedFileUrl});
                              }
                            }}
                          />
                        </label>
                        <p className="pl-1">or drag and drop</p>
                      </div>
                      <p className="text-xs text-gray-500">PDF, JPG, PNG up to 5MB</p>
                    </div>
                  </div>
                ) : profile.certificateUrl ? (
                  <div className="flex items-center">
                    <FiFileText className="h-5 w-5 text-gray-400 mr-2" />
                    <span className="text-sm text-gray-900">Certificate uploaded</span>
                    <a
                      href={profile.certificateUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="ml-2 text-sm text-emerald-600 hover:text-emerald-500"
                    >
                      View
                    </a>
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">No certificate uploaded</p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Account Security */}
        <div className="bg-white shadow overflow-hidden sm:rounded-lg">
          <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
            <h3 className="text-lg leading-6 font-medium text-gray-900">Account Security</h3>
          </div>
          
          <div className="px-4 py-5 sm:p-6">
            <div className="space-y-6">
              <div>
                <h4 className="text-sm font-medium text-gray-700">Change Password</h4>
                <p className="mt-1 text-sm text-gray-500">
                  Update your account password
                </p>
                <div className="mt-4">
                  <button
                    type="button"
                    onClick={() => setShowChangePassword(!showChangePassword)}
                    className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500"
                  >
                    Change Password
                  </button>
                </div>

                {showChangePassword && (
                  <form className="mt-4 space-y-4" onSubmit={handlePasswordChange}>
                    <div>
                      <label htmlFor="current-password" className="block text-sm font-medium text-gray-700">
                        Current Password
                      </label>
                      <div className="mt-1 relative rounded-md shadow-sm">
                        <input
                          id="current-password"
                          name="current-password"
                          type={showCurrentPassword ? 'text' : 'password'}
                          value={currentPassword}
                          onChange={(e) => setCurrentPassword(e.target.value)}
                          className="block w-full pr-10 border-gray-300 focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm rounded-md"
                          required
                        />
                      </div>
                    </div>

                    <div>
                      <label htmlFor="new-password" className="block text-sm font-medium text-gray-700">
                        New Password
                      </label>
                      <div className="mt-1 relative rounded-md shadow-sm">
                        <input
                          id="new-password"
                          name="new-password"
                          type={showNewPassword ? 'text' : 'password'}
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          className="block w-full pr-10 border-gray-300 focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm rounded-md"
                          required
                          minLength={6}
                        />
                      </div>
                    </div>

                    <div>
                      <label htmlFor="confirm-new-password" className="block text-sm font-medium text-gray-700">
                        Confirm New Password
                      </label>
                      <div className="mt-1 relative rounded-md shadow-sm">
                        <input
                          id="confirm-new-password"
                          name="confirm-new-password"
                          type={showConfirmNewPassword ? 'text' : 'password'}
                          value={confirmNewPassword}
                          onChange={(e) => setConfirmNewPassword(e.target.value)}
                          className="block w-full pr-10 border-gray-300 focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm rounded-md"
                          required
                          minLength={6}
                        />
                      </div>
                    </div>

                    <div className="flex space-x-3">
                      <button
                        type="submit"
                        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500"
                      >
                        Update Password
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setShowChangePassword(false);
                          setCurrentPassword('');
                          setNewPassword('');
                          setConfirmNewPassword('');
                        }}
                        className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Account Deletion */}
        <div className="bg-white shadow overflow-hidden sm:rounded-lg">
          <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
            <h3 className="text-lg leading-6 font-medium text-gray-900">Danger Zone</h3>
          </div>
          
          <div className="px-4 py-5 sm:p-6">
            <div className="sm:flex sm:items-center sm:justify-between">
              <div>
                <h4 className="text-sm font-medium text-gray-700">Delete Account</h4>
                <p className="mt-1 text-sm text-gray-500">
                  Permanently delete your account and all associated data.
                </p>
              </div>
              <div className="mt-4 sm:mt-0">
                <button
                  type="button"
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                  onClick={() => {
                    if (window.confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
                      // Handle account deletion
                      console.log('Account deletion requested');
                    }
                  }}
                >
                  Delete Account
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NgoProfilePage;
