import type { User } from 'firebase/auth';
import { useState, useEffect } from 'react';
import { createNgoRequest, getMyRequests } from '../services/ngoRequestService';
import { createFeedback } from '../services/feedbackService';
import { createContact } from '../services/contactService';

interface NgoDashboardProps {
  user: User | null;
  onBack: () => void;
}

export default function NgoDashboard({ user, onBack }: NgoDashboardProps) {
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  
  // Form state for create request
  const [formData, setFormData] = useState({
    requestTitle: '',
    category: '',
    quantity: '',
    urgencyLevel: '',
    description: '',
    neededBy: '',
    images: [] as File[],
    // Dynamic fields based on category
    // Food category fields
    foodType: '',
    foodCategory: '',
    approxWeight: '',
    expiryTime: '',
    // Clothing category fields
    clothingType: '',
    condition: '',
    season: '',
    // Medical category fields
    medicalType: '',
    expiryDate: '',
    storageRequirements: '',
    // Education category fields
    bookType: '',
    subject: '',
    ageGroup: '',
    // Other category fields
    itemType: '',
    specifications: ''
  });
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);
  const [formFieldErrors, setFormFieldErrors] = useState<Record<string, string>>({});

  // Form state for feedback
  const [feedbackData, setFeedbackData] = useState({
    subject: '',
    feedbackType: '',
    description: '',
    rating: 0,
    screenshot: null as File | null,
    contactPermission: false
  });
  const [feedbackLoading, setFeedbackLoading] = useState(false);
  const [feedbackError, setFeedbackError] = useState<string | null>(null);
  const [feedbackSuccess, setFeedbackSuccess] = useState<string | null>(null);
  const [feedbackFieldErrors, setFeedbackFieldErrors] = useState<Record<string, string>>({});

  // State for FAQ dropdowns
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null);

  // Form state for contact form
  const [contactData, setContactData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });
  const [contactLoading, setContactLoading] = useState(false);
  const [contactError, setContactError] = useState<string | null>(null);
  const [contactSuccess, setContactSuccess] = useState<string | null>(null);
  const [contactFieldErrors, setContactFieldErrors] = useState<Record<string, string>>({});

  // State for My Requests tab
  const [myRequests, setMyRequests] = useState<any[]>([]);
  const [requestsLoading, setRequestsLoading] = useState(false);
  const [requestsError, setRequestsError] = useState<string | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false);
    }, 500);
    
    return () => clearTimeout(timer);
  }, []);

  // Fetch requests when My Requests tab is active
  useEffect(() => {
    if (activeTab === 'my-requests') {
      loadMyRequests();
    }
  }, [activeTab]);

  const loadMyRequests = async () => {
    setRequestsLoading(true);
    setRequestsError(null);
    try {
      const response = await getMyRequests();
      if (response.success && response.data) {
        setMyRequests(response.data);
      }
    } catch (error: any) {
      console.error('Error loading requests:', error);
      setRequestsError(error.response?.data?.message || 'Failed to load requests. Please try again.');
    } finally {
      setRequestsLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-4xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-gray-800">Authentication Required</h2>
          <p className="text-gray-600 mt-2">Please sign in to access the dashboard</p>
          <button
            onClick={onBack}
            className="mt-6 px-6 py-2 bg-emerald-600 text-white rounded-md hover:bg-emerald-700 transition-colors"
          >
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Creative Header */}
      <div className="bg-gradient-to-r from-emerald-600 to-teal-500 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:justify-between md:items-center py-6">
            {/* Left Section with Title - Hidden on mobile, shown on md+ */}
            <div className="hidden md:flex items-center">
              <div className="text-left">
                <h1 className="text-3xl md:text-4xl font-bold text-white drop-shadow-md">NGO Dashboard</h1>
                <p className="text-sm md:text-base text-white/90 font-medium mt-1">Making a difference, one donation at a time</p>
              </div>
            </div>

            {/* Mobile Title - Only shown on mobile */}
            <div className="md:hidden mb-4">
              <h1 className="text-2xl font-bold text-white drop-shadow-md">NGO Dashboard</h1>
              <p className="text-sm text-white/90 mt-1">Making a difference, one donation at a time</p>
            </div>

            {/* Right Section with User Info */}
            <div className="flex items-center justify-end space-x-3 group cursor-pointer">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-semibold text-white drop-shadow">{user?.displayName || 'NGO User'}</p>
                <p className="text-xs text-white/80">{user?.email}</p>
              </div>
              <div className="relative">
                {user?.photoURL ? (
                  <div className="relative group">
                    <img
                      src={user.photoURL}
                      alt={user.displayName || 'User'}
                      className="w-12 h-12 rounded-full border-2 border-white/80 shadow-md transition-all duration-300 group-hover:scale-105"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-400 rounded-full border-2 border-white"></div>
                  </div>
                ) : (
                  <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center text-white text-xl font-bold shadow-lg transition-all duration-300 group-hover:bg-white/30 group-hover:scale-105">
                    {user?.displayName?.charAt(0) || user?.email?.charAt(0).toUpperCase()}
                    <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-400 rounded-full border-2 border-white"></div>
                  </div>
                )}
              </div>
              <svg className="w-5 h-5 text-white/80 transform transition-transform group-hover:translate-x-1 hidden sm:block" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced Navigation Tabs */}
      <div className="bg-white border-b shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-1 overflow-x-auto py-1 hide-scrollbar">
            {[
              { 
                id: 'overview', 
                label: 'Overview',
                icon: (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                  </svg>
                ) 
              },
              { 
                id: 'create-request', 
                label: 'Create Request',
                icon: (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                ) 
              },
              { 
                id: 'my-requests', 
                label: 'My Requests',
                icon: (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                ) 
              },
              { 
                id: 'incoming-donations', 
                label: 'Donations',
                icon: (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                ) 
              },
              { 
                id: 'pickups-deliveries', 
                label: 'Pickups',
                icon: (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M13 16V8a1 1 0 00-1-1H4a1 1 0 00-1 1v8a1 1 0 001 1h1m8-2h1m4 0h2a1 1 0 001-1v-3.65a1 1 0 00-.22-.624l-3.48-4.35A1 1 0 0014.38 7H14m-8 7h7m-7 0v2a1 1 0 001 1h2" />
                  </svg>
                ) 
              },
              { 
                id: 'feedback', 
                label: 'Feedback',
                icon: (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                  </svg>
                ) 
              },
              { 
                id: 'help-support', 
                label: 'Help',
                icon: (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                ) 
              },
              { 
                id: 'settings', 
                label: 'Settings',
                icon: (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                ) 
              },
              { 
                id: 'signout', 
                label: 'Sign Out',
                icon: (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                ) 
              }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => tab.id === 'signout' ? onBack() : setActiveTab(tab.id)}
                className={`flex items-center space-x-2 px-4 py-3 rounded-lg mx-1 transition-all duration-200 ${
                  activeTab === tab.id
                    ? 'bg-emerald-50 text-emerald-600 shadow-sm'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-800'
                } ${tab.id === 'signout' ? 'text-red-500 hover:bg-red-50' : ''}`}
              >
                <span className={`${activeTab === tab.id ? 'opacity-100' : 'opacity-70'}`}>
                  {tab.icon}
                </span>
                <span className="text-sm font-medium whitespace-nowrap">{tab.label}</span>
                {activeTab === tab.id && (
                  <span className="absolute bottom-0 left-1/2 w-6 h-1 bg-emerald-500 rounded-full -translate-x-1/2"></span>
                )}
              </button>
            ))}
          </nav>
        </div>
        <style dangerouslySetInnerHTML={{
          __html: `
            .hide-scrollbar::-webkit-scrollbar {
              display: none;
            }
            .hide-scrollbar {
              -ms-overflow-style: none;
              scrollbar-width: none;
            }
          `
        }} />
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* 1. Profile & Verification Status */}
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-medium text-gray-900">Profile & Verification Status</h2>
              </div>
              <div className="p-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between">
                  <div>
                    <h3 className="text-lg font-medium">Helping Hands Foundation</h3>
                    <p className="text-gray-600 flex items-center mt-1">
                      <svg className="w-4 h-4 mr-1 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      Mumbai, Maharashtra
                    </p>
                  </div>
                  <div className="mt-4 md:mt-0">
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-yellow-100 text-yellow-800">
                      <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Verification Pending
                    </span>
                    <button className="ml-3 px-4 py-2 bg-emerald-600 text-white text-sm font-medium rounded-md hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500">
                      Complete Profile
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* 2. Action Required Panel */}
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200 bg-amber-50">
                <h2 className="text-lg font-medium text-amber-800 flex items-center">
                  <svg className="w-5 h-5 mr-2 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  Action Required
                </h2>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="flex items-start p-3 bg-red-50 rounded-lg">
                    <div className="flex-shrink-0">
                      <div className="flex items-center justify-center h-8 w-8 rounded-full bg-red-100 text-red-600">
                        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                        </svg>
                      </div>
                    </div>
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-red-800">2 Pending Registration Steps</h3>
                      <p className="mt-1 text-sm text-red-700">Complete verification to receive donations</p>
                    </div>
                  </div>

                  <div className="flex items-start p-3 bg-blue-50 rounded-lg">
                    <div className="flex-shrink-0">
                      <div className="flex items-center justify-center h-8 w-8 rounded-full bg-blue-100 text-blue-600">
                        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                        </svg>
                      </div>
                    </div>
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-blue-800">3 Pending Pickups</h3>
                      <p className="mt-1 text-sm text-blue-700">Schedule pickups for donations</p>
                    </div>
                  </div>

                  <div className="flex items-start p-3 bg-amber-50 rounded-lg">
                    <div className="flex-shrink-0">
                      <div className="flex items-center justify-center h-8 w-8 rounded-full bg-amber-100 text-amber-600">
                        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                        </svg>
                      </div>
                    </div>
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-amber-800">5 Unread Messages</h3>
                      <p className="mt-1 text-sm text-amber-700">From potential donors</p>
                    </div>
                  </div>

                  <div className="flex items-start p-3 bg-purple-50 rounded-lg">
                    <div className="flex-shrink-0">
                      <div className="flex items-center justify-center h-8 w-8 rounded-full bg-purple-100 text-purple-600">
                        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                        </svg>
                      </div>
                    </div>
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-purple-800">Proof Upload Required</h3>
                      <p className="mt-1 text-sm text-purple-700">For 2 recent donations</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* 3. Key Numbers */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white rounded-lg shadow p-6 border-l-4 border-emerald-500">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-500">Active Requests</p>
                    <p className="mt-1 text-2xl font-bold text-gray-900">8</p>
                  </div>
                  <div className="flex-shrink-0 bg-emerald-100 rounded-lg p-3">
                    <svg className="w-6 h-6 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                  </div>
                </div>
              </div>
              
              <div className="bg-white rounded-lg shadow p-6 border-l-4 border-blue-500">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-500">Incoming Donations</p>
                    <p className="mt-1 text-2xl font-bold text-gray-900">5</p>
                  </div>
                  <div className="flex-shrink-0 bg-blue-100 rounded-lg p-3">
                    <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                </div>
              </div>
              
              <div className="bg-white rounded-lg shadow p-6 border-l-4 border-yellow-500">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-500">Pending Pickups</p>
                    <p className="mt-1 text-2xl font-bold text-gray-900">3</p>
                  </div>
                  <div className="flex-shrink-0 bg-yellow-100 rounded-lg p-3">
                    <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16V8a1 1 0 00-1-1H4a1 1 0 00-1 1v8a1 1 0 001 1h1m8-2h1m4 0h2a1 1 0 001-1v-3.65a1 1 0 00-.22-.624l-3.48-4.35A1 1 0 0014.38 7H14m-8 7h7m-7 0v2a1 1 0 001 1h2" />
                    </svg>
                  </div>
                </div>
              </div>
              
              <div className="bg-white rounded-lg shadow p-6 border-l-4 border-red-500">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-500">Inventory Alerts</p>
                    <p className="mt-1 text-2xl font-bold text-gray-900">2</p>
                  </div>
                  <div className="flex-shrink-0 bg-red-100 rounded-lg p-3">
                    <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.618 5.984A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016zM12 9v2m0 4h.01" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>

            {/* 4. Urgent Needs Highlight */}
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200 bg-red-50">
                <h2 className="text-lg font-medium text-red-800 flex items-center">
                  <svg className="w-5 h-5 mr-2 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  Urgent Needs
                </h2>
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  <div className="flex items-start">
                    <div className="flex-shrink-0 pt-0.5">
                      <div className="flex items-center justify-center h-5 w-5 rounded-full bg-red-100 text-red-600">
                        <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 8 8">
                          <circle cx="4" cy="4" r="3" />
                        </svg>
                      </div>
                    </div>
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-gray-900">Rice & Pulses - High Urgency</h3>
                      <div className="mt-1 text-sm text-gray-500">
                        <span className="font-medium">Needed by:</span> Today | 
                        <span className="ml-1">Request ID: #REQ-0042</span>
                      </div>
                      <div className="mt-1 text-xs text-red-600">
                        <span className="font-medium">Only 12 hours left</span> to fulfill this request
                      </div>
                    </div>
                    <div className="ml-auto">
                      <button className="inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500">
                        View Details
                      </button>
                    </div>
                  </div>

                  <div className="flex items-start">
                    <div className="flex-shrink-0 pt-0.5">
                      <div className="flex items-center justify-center h-5 w-5 rounded-full bg-yellow-100 text-yellow-600">
                        <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 8 8">
                          <circle cx="4" cy="4" r="3" />
                        </svg>
                      </div>
                    </div>
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-gray-900">Winter Blankets - Medium Urgency</h3>
                      <div className="mt-1 text-sm text-gray-500">
                        <span className="font-medium">Needed by:</span> 2 days | 
                        <span className="ml-1">Request ID: #REQ-0039</span>
                      </div>
                      <div className="mt-1 text-xs text-amber-600">
                        <span className="font-medium">2 days left</span> to fulfill this request
                      </div>
                    </div>
                    <div className="ml-auto">
                      <button className="inline-flex items-center px-3 py-1 border border-gray-300 text-xs font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500">
                        View Details
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-medium text-gray-900">Available Donations</h2>
              </div>
              <div className="p-6">
                <div className="text-center py-12">
                  <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                  </svg>
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No donations available</h3>
                  <p className="mt-1 text-sm text-gray-500">New donations will appear here when available.</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'create-request' && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-medium text-gray-900">Create New Donation Request</h2>
              </div>
              <div className="p-6">
                {formSuccess && (
                  <div className="mb-4 p-4 bg-green-50 border-2 border-green-400 rounded-lg shadow-sm">
                    <div className="flex items-center">
                      <svg className="w-5 h-5 text-green-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <p className="text-sm font-semibold text-green-800">{formSuccess}</p>
                    </div>
                  </div>
                )}
                {formError && (
                  <div className="mb-4 p-4 bg-red-50 border-2 border-red-400 rounded-lg shadow-sm">
                    <div className="flex items-center">
                      <svg className="w-5 h-5 text-red-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <p className="text-sm font-semibold text-red-800">{formError}</p>
                    </div>
                  </div>
                )}
                <form 
                  className="space-y-6"
                  onSubmit={async (e) => {
                    e.preventDefault();
                    setFormError(null);
                    setFormSuccess(null);
                    setFormFieldErrors({});

                    // Validation
                    const errors: Record<string, string> = {};
                    
                    if (!formData.requestTitle.trim()) {
                      errors.requestTitle = 'Request title is required';
                    } else if (formData.requestTitle.trim().length < 5) {
                      errors.requestTitle = 'Request title must be at least 5 characters';
                    } else if (formData.requestTitle.trim().length > 100) {
                      errors.requestTitle = 'Request title must be less than 100 characters';
                    }

                    if (!formData.category) {
                      errors.category = 'Please select a category';
                    }

                    if (!formData.quantity) {
                      errors.quantity = 'Quantity is required';
                    } else {
                      const qty = Number(formData.quantity);
                      if (isNaN(qty) || qty < 1) {
                        errors.quantity = 'Quantity must be at least 1';
                      } else if (qty > 1000000) {
                        errors.quantity = 'Quantity is too large';
                      }
                    }

                    if (!formData.urgencyLevel) {
                      errors.urgencyLevel = 'Please select urgency level';
                    }

                    if (!formData.description.trim()) {
                      errors.description = 'Description is required';
                    } else if (formData.description.trim().length < 20) {
                      errors.description = 'Description must be at least 20 characters';
                    } else if (formData.description.trim().length > 1000) {
                      errors.description = 'Description must be less than 1000 characters';
                    }

                    if (formData.neededBy) {
                      const selectedDate = new Date(formData.neededBy);
                      const today = new Date();
                      today.setHours(0, 0, 0, 0);
                      if (selectedDate < today) {
                        errors.neededBy = 'Date cannot be in the past';
                      }
                    }

                    // Category-specific validations
                    if (formData.category === 'food') {
                      if (!formData.foodType) {
                        errors.foodType = 'Food type is required';
                      }
                      if (!formData.foodCategory) {
                        errors.foodCategory = 'Food category is required';
                      }
                    } else if (formData.category === 'clothing') {
                      if (!formData.clothingType) {
                        errors.clothingType = 'Clothing type is required';
                      }
                      if (!formData.condition) {
                        errors.condition = 'Condition is required';
                      }
                      if (!formData.season) {
                        errors.season = 'Season is required';
                      }
                    } else if (formData.category === 'medical') {
                      if (!formData.medicalType) {
                        errors.medicalType = 'Medical type is required';
                      }
                    } else if (formData.category === 'education') {
                      if (!formData.bookType) {
                        errors.bookType = 'Book type is required';
                      }
                    } else if (formData.category === 'other') {
                      if (!formData.itemType || !formData.itemType.trim()) {
                        errors.itemType = 'Item type is required';
                      }
                    }

                    if (Object.keys(errors).length > 0) {
                      setFormFieldErrors(errors);
                      return;
                    }

                    setFormLoading(true);

                    try {
                      const requestData: any = {
                        requestTitle: formData.requestTitle.trim(),
                        category: formData.category as 'food' | 'clothing' | 'medical' | 'education' | 'other',
                        quantity: Number(formData.quantity),
                        urgencyLevel: formData.urgencyLevel as 'low' | 'medium' | 'high',
                        description: formData.description.trim(),
                        neededBy: formData.neededBy || undefined,
                        images: [] // TODO: Handle image uploads
                      };

                      // Add category-specific fields
                      if (formData.category === 'food') {
                        requestData.foodType = formData.foodType;
                        requestData.foodCategory = formData.foodCategory;
                        requestData.approxWeight = formData.approxWeight ? Number(formData.approxWeight) : undefined;
                        requestData.expiryTime = formData.expiryTime || undefined;
                      } else if (formData.category === 'clothing') {
                        requestData.clothingType = formData.clothingType;
                        requestData.condition = formData.condition;
                        requestData.season = formData.season;
                      } else if (formData.category === 'medical') {
                        requestData.medicalType = formData.medicalType;
                        requestData.expiryDate = formData.expiryDate || undefined;
                        requestData.storageRequirements = formData.storageRequirements || undefined;
                      } else if (formData.category === 'education') {
                        requestData.bookType = formData.bookType;
                        requestData.subject = formData.subject || undefined;
                        requestData.ageGroup = formData.ageGroup || undefined;
                      } else if (formData.category === 'other') {
                        requestData.itemType = formData.itemType;
                        requestData.specifications = formData.specifications || undefined;
                      }

                      await createNgoRequest(requestData);
                      setFormSuccess('Request is created successfully!');
                      
                      // Reset form
                      setFormData({
                        requestTitle: '',
                        category: '',
                        quantity: '',
                        urgencyLevel: '',
                        description: '',
                        neededBy: '',
                        images: []
                      });

                      // Refresh requests and switch to my-requests tab after 3 seconds
                      setTimeout(() => {
                        loadMyRequests(); // Refresh the requests list
                        setActiveTab('my-requests');
                        setFormSuccess(null);
                      }, 3000);
                    } catch (error: any) {
                      setFormError(error.response?.data?.message || 'Failed to create request. Please try again.');
                    } finally {
                      setFormLoading(false);
                    }
                  }}
                >
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Request Title <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.requestTitle}
                      onChange={(e) => {
                        setFormData({ ...formData, requestTitle: e.target.value });
                        if (formFieldErrors.requestTitle) {
                          setFormFieldErrors({ ...formFieldErrors, requestTitle: '' });
                        }
                      }}
                      className={`mt-1 block w-full border rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 ${
                        formFieldErrors.requestTitle ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="e.g., Urgent Need: Winter Blankets for Homeless Shelter"
                      maxLength={100}
                    />
                    {formFieldErrors.requestTitle && (
                      <p className="mt-1 text-sm text-red-600">{formFieldErrors.requestTitle}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Category <span className="text-red-500">*</span>
                    </label>
                    <select
                      required
                      value={formData.category}
                      onChange={(e) => {
                        // Reset all dynamic fields when category changes
                        setFormData({ 
                          ...formData, 
                          category: e.target.value,
                          foodType: '',
                          foodCategory: '',
                          approxWeight: '',
                          expiryTime: '',
                          clothingType: '',
                          condition: '',
                          season: '',
                          medicalType: '',
                          expiryDate: '',
                          storageRequirements: '',
                          bookType: '',
                          subject: '',
                          ageGroup: '',
                          itemType: '',
                          specifications: ''
                        });
                        if (formFieldErrors.category) {
                          setFormFieldErrors({ ...formFieldErrors, category: '' });
                        }
                      }}
                      className={`mt-1 block w-full pl-3 pr-10 py-2 text-base border focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm rounded-md ${
                        formFieldErrors.category ? 'border-red-500' : 'border-gray-300'
                      }`}
                    >
                      <option value="">Select a category</option>
                      <option value="food">Food & Groceries</option>
                      <option value="clothing">Clothing</option>
                      <option value="medical">Medical Supplies</option>
                      <option value="education">Educational Materials</option>
                      <option value="other">Other</option>
                    </select>
                    {formFieldErrors.category && (
                      <p className="mt-1 text-sm text-red-600">{formFieldErrors.category}</p>
                    )}
                  </div>

                  {/* Dynamic Fields based on Category */}
                  {formData.category === 'food' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          Food Type <span className="text-red-500">*</span>
                        </label>
                        <select
                          required
                          value={formData.foodType}
                          onChange={(e) => {
                            setFormData({ ...formData, foodType: e.target.value });
                            if (formFieldErrors.foodType) {
                              setFormFieldErrors({ ...formFieldErrors, foodType: '' });
                            }
                          }}
                          className={`mt-1 block w-full pl-3 pr-10 py-2 text-base border rounded-md focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm ${
                            formFieldErrors.foodType ? 'border-red-500' : 'border-gray-300'
                          }`}
                        >
                          <option value="">Select food type</option>
                          <option value="Veg">Vegetarian</option>
                          <option value="Non-Veg">Non-Vegetarian</option>
                        </select>
                        {formFieldErrors.foodType && (
                          <p className="mt-1 text-sm text-red-600">{formFieldErrors.foodType}</p>
                        )}
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          Food Category <span className="text-red-500">*</span>
                        </label>
                        <select
                          required
                          value={formData.foodCategory}
                          onChange={(e) => {
                            setFormData({ ...formData, foodCategory: e.target.value });
                            if (formFieldErrors.foodCategory) {
                              setFormFieldErrors({ ...formFieldErrors, foodCategory: '' });
                            }
                          }}
                          className={`mt-1 block w-full pl-3 pr-10 py-2 text-base border rounded-md focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm ${
                            formFieldErrors.foodCategory ? 'border-red-500' : 'border-gray-300'
                          }`}
                        >
                          <option value="">Select category</option>
                          <option value="Cooked">Cooked</option>
                          <option value="Packed">Packed</option>
                          <option value="Raw">Raw</option>
                        </select>
                        {formFieldErrors.foodCategory && (
                          <p className="mt-1 text-sm text-red-600">{formFieldErrors.foodCategory}</p>
                        )}
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          Approximate Weight (kg)
                        </label>
                        <input
                          type="number"
                          min="0"
                          step="0.1"
                          value={formData.approxWeight}
                          onChange={(e) => setFormData({ ...formData, approxWeight: e.target.value })}
                          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-emerald-500 focus:border-emerald-500"
                          placeholder="e.g., 10.5"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          Expiry Time
                        </label>
                        <input
                          type="datetime-local"
                          value={formData.expiryTime}
                          onChange={(e) => setFormData({ ...formData, expiryTime: e.target.value })}
                          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-emerald-500 focus:border-emerald-500"
                        />
                      </div>
                    </div>
                  )}

                  {formData.category === 'clothing' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          Clothing Type <span className="text-red-500">*</span>
                        </label>
                        <select
                          required
                          value={formData.clothingType}
                          onChange={(e) => {
                            setFormData({ ...formData, clothingType: e.target.value });
                            if (formFieldErrors.clothingType) {
                              setFormFieldErrors({ ...formFieldErrors, clothingType: '' });
                            }
                          }}
                          className={`mt-1 block w-full pl-3 pr-10 py-2 text-base border rounded-md focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm ${
                            formFieldErrors.clothingType ? 'border-red-500' : 'border-gray-300'
                          }`}
                        >
                          <option value="">Select type</option>
                          <option value="Men">Men</option>
                          <option value="Women">Women</option>
                          <option value="Kids">Kids</option>
                        </select>
                        {formFieldErrors.clothingType && (
                          <p className="mt-1 text-sm text-red-600">{formFieldErrors.clothingType}</p>
                        )}
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          Condition <span className="text-red-500">*</span>
                        </label>
                        <select
                          required
                          value={formData.condition}
                          onChange={(e) => {
                            setFormData({ ...formData, condition: e.target.value });
                            if (formFieldErrors.condition) {
                              setFormFieldErrors({ ...formFieldErrors, condition: '' });
                            }
                          }}
                          className={`mt-1 block w-full pl-3 pr-10 py-2 text-base border rounded-md focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm ${
                            formFieldErrors.condition ? 'border-red-500' : 'border-gray-300'
                          }`}
                        >
                          <option value="">Select condition</option>
                          <option value="New">New</option>
                          <option value="Gently Used">Gently Used</option>
                        </select>
                        {formFieldErrors.condition && (
                          <p className="mt-1 text-sm text-red-600">{formFieldErrors.condition}</p>
                        )}
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          Season <span className="text-red-500">*</span>
                        </label>
                        <select
                          required
                          value={formData.season}
                          onChange={(e) => {
                            setFormData({ ...formData, season: e.target.value });
                            if (formFieldErrors.season) {
                              setFormFieldErrors({ ...formFieldErrors, season: '' });
                            }
                          }}
                          className={`mt-1 block w-full pl-3 pr-10 py-2 text-base border rounded-md focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm ${
                            formFieldErrors.season ? 'border-red-500' : 'border-gray-300'
                          }`}
                        >
                          <option value="">Select season</option>
                          <option value="Summer">Summer</option>
                          <option value="Winter">Winter</option>
                          <option value="All-season">All-season</option>
                        </select>
                        {formFieldErrors.season && (
                          <p className="mt-1 text-sm text-red-600">{formFieldErrors.season}</p>
                        )}
                      </div>
                    </div>
                  )}

                  {formData.category === 'medical' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          Medical Type <span className="text-red-500">*</span>
                        </label>
                        <select
                          required
                          value={formData.medicalType}
                          onChange={(e) => {
                            setFormData({ ...formData, medicalType: e.target.value });
                            if (formFieldErrors.medicalType) {
                              setFormFieldErrors({ ...formFieldErrors, medicalType: '' });
                            }
                          }}
                          className={`mt-1 block w-full pl-3 pr-10 py-2 text-base border rounded-md focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm ${
                            formFieldErrors.medicalType ? 'border-red-500' : 'border-gray-300'
                          }`}
                        >
                          <option value="">Select type</option>
                          <option value="Medicines">Medicines</option>
                          <option value="Medical Equipment">Medical Equipment</option>
                          <option value="First Aid Supplies">First Aid Supplies</option>
                          <option value="Sanitary Products">Sanitary Products</option>
                          <option value="Other">Other</option>
                        </select>
                        {formFieldErrors.medicalType && (
                          <p className="mt-1 text-sm text-red-600">{formFieldErrors.medicalType}</p>
                        )}
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          Expiry Date
                        </label>
                        <input
                          type="date"
                          value={formData.expiryDate}
                          onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })}
                          min={new Date().toISOString().split('T')[0]}
                          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-emerald-500 focus:border-emerald-500"
                        />
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700">
                          Storage Requirements
                        </label>
                        <textarea
                          rows={2}
                          value={formData.storageRequirements}
                          onChange={(e) => setFormData({ ...formData, storageRequirements: e.target.value })}
                          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-emerald-500 focus:border-emerald-500"
                          placeholder="e.g., Store in cool, dry place. Keep away from direct sunlight."
                        />
                      </div>
                    </div>
                  )}

                  {formData.category === 'education' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          Book Type <span className="text-red-500">*</span>
                        </label>
                        <select
                          required
                          value={formData.bookType}
                          onChange={(e) => {
                            setFormData({ ...formData, bookType: e.target.value });
                            if (formFieldErrors.bookType) {
                              setFormFieldErrors({ ...formFieldErrors, bookType: '' });
                            }
                          }}
                          className={`mt-1 block w-full pl-3 pr-10 py-2 text-base border rounded-md focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm ${
                            formFieldErrors.bookType ? 'border-red-500' : 'border-gray-300'
                          }`}
                        >
                          <option value="">Select type</option>
                          <option value="Textbooks">Textbooks</option>
                          <option value="Story Books">Story Books</option>
                          <option value="Reference Books">Reference Books</option>
                          <option value="Notebooks">Notebooks</option>
                          <option value="Stationery">Stationery</option>
                          <option value="Other">Other</option>
                        </select>
                        {formFieldErrors.bookType && (
                          <p className="mt-1 text-sm text-red-600">{formFieldErrors.bookType}</p>
                        )}
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          Subject
                        </label>
                        <input
                          type="text"
                          value={formData.subject}
                          onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-emerald-500 focus:border-emerald-500"
                          placeholder="e.g., Mathematics, Science"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          Age Group
                        </label>
                        <select
                          value={formData.ageGroup}
                          onChange={(e) => setFormData({ ...formData, ageGroup: e.target.value })}
                          className="mt-1 block w-full pl-3 pr-10 py-2 text-base border border-gray-300 rounded-md focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm"
                        >
                          <option value="">Select age group</option>
                          <option value="Pre-school (3-5 years)">Pre-school (3-5 years)</option>
                          <option value="Primary (6-10 years)">Primary (6-10 years)</option>
                          <option value="Middle (11-14 years)">Middle (11-14 years)</option>
                          <option value="High School (15-18 years)">High School (15-18 years)</option>
                        </select>
                      </div>
                    </div>
                  )}

                  {formData.category === 'other' && (
                    <div className="grid grid-cols-1 gap-4 p-4 bg-gray-50 border border-gray-200 rounded-lg">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          Item Type <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          value={formData.itemType}
                          onChange={(e) => {
                            setFormData({ ...formData, itemType: e.target.value });
                            if (formFieldErrors.itemType) {
                              setFormFieldErrors({ ...formFieldErrors, itemType: '' });
                            }
                          }}
                          className={`mt-1 block w-full border rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 ${
                            formFieldErrors.itemType ? 'border-red-500' : 'border-gray-300'
                          }`}
                          placeholder="e.g., Furniture, Electronics, Toys"
                        />
                        {formFieldErrors.itemType && (
                          <p className="mt-1 text-sm text-red-600">{formFieldErrors.itemType}</p>
                        )}
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          Specifications
                        </label>
                        <textarea
                          rows={3}
                          value={formData.specifications}
                          onChange={(e) => setFormData({ ...formData, specifications: e.target.value })}
                          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-emerald-500 focus:border-emerald-500"
                          placeholder="Please provide detailed specifications of the items needed..."
                        />
                      </div>
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Quantity Needed <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="1000000"
                      required
                      value={formData.quantity}
                      onChange={(e) => {
                        setFormData({ ...formData, quantity: e.target.value });
                        if (formFieldErrors.quantity) {
                          setFormFieldErrors({ ...formFieldErrors, quantity: '' });
                        }
                      }}
                      className={`mt-1 block w-32 border rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 ${
                        formFieldErrors.quantity ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="e.g., 50"
                    />
                    {formFieldErrors.quantity && (
                      <p className="mt-1 text-sm text-red-600">{formFieldErrors.quantity}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Urgency Level <span className="text-red-500">*</span>
                    </label>
                    <div className="mt-2 space-x-4">
                      <label className="inline-flex items-center">
                        <input 
                          type="radio" 
                          name="urgency" 
                          value="low" 
                          checked={formData.urgencyLevel === 'low'}
                          onChange={(e) => {
                            setFormData({ ...formData, urgencyLevel: e.target.value });
                            if (formFieldErrors.urgencyLevel) {
                              setFormFieldErrors({ ...formFieldErrors, urgencyLevel: '' });
                            }
                          }}
                          className="h-4 w-4 text-emerald-600 focus:ring-emerald-500" 
                        />
                        <span className="ml-2 text-sm text-gray-700">Low</span>
                      </label>
                      <label className="inline-flex items-center">
                        <input 
                          type="radio" 
                          name="urgency" 
                          value="medium" 
                          checked={formData.urgencyLevel === 'medium'}
                          onChange={(e) => {
                            setFormData({ ...formData, urgencyLevel: e.target.value });
                            if (formFieldErrors.urgencyLevel) {
                              setFormFieldErrors({ ...formFieldErrors, urgencyLevel: '' });
                            }
                          }}
                          className="h-4 w-4 text-yellow-500 focus:ring-yellow-500" 
                        />
                        <span className="ml-2 text-sm text-gray-700">Medium</span>
                      </label>
                      <label className="inline-flex items-center">
                        <input 
                          type="radio" 
                          name="urgency" 
                          value="high" 
                          checked={formData.urgencyLevel === 'high'}
                          onChange={(e) => {
                            setFormData({ ...formData, urgencyLevel: e.target.value });
                            if (formFieldErrors.urgencyLevel) {
                              setFormFieldErrors({ ...formFieldErrors, urgencyLevel: '' });
                            }
                          }}
                          className="h-4 w-4 text-red-600 focus:ring-red-500" 
                        />
                        <span className="ml-2 text-sm text-gray-700">High</span>
                      </label>
                    </div>
                    {formFieldErrors.urgencyLevel && (
                      <p className="mt-1 text-sm text-red-600">{formFieldErrors.urgencyLevel}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Description <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      rows={4}
                      required
                      value={formData.description}
                      onChange={(e) => {
                        setFormData({ ...formData, description: e.target.value });
                        if (formFieldErrors.description) {
                          setFormFieldErrors({ ...formFieldErrors, description: '' });
                        }
                      }}
                      className={`mt-1 block w-full border rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 ${
                        formFieldErrors.description ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="Please provide details about the items needed and how they will be used..."
                      maxLength={1000}
                    />
                    <div className="mt-1 flex justify-between">
                      {formFieldErrors.description ? (
                        <p className="text-sm text-red-600">{formFieldErrors.description}</p>
                      ) : (
                        <span></span>
                      )}
                      <p className="text-xs text-gray-500">{formData.description.length}/1000</p>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Needed By
                    </label>
                    <input
                      type="date"
                      value={formData.neededBy}
                      onChange={(e) => {
                        setFormData({ ...formData, neededBy: e.target.value });
                        if (formFieldErrors.neededBy) {
                          setFormFieldErrors({ ...formFieldErrors, neededBy: '' });
                        }
                      }}
                      min={new Date().toISOString().split('T')[0]}
                      className={`mt-1 block w-64 border rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 ${
                        formFieldErrors.neededBy ? 'border-red-500' : 'border-gray-300'
                      }`}
                    />
                    {formFieldErrors.neededBy && (
                      <p className="mt-1 text-sm text-red-600">{formFieldErrors.neededBy}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Upload Images (Optional)
                    </label>
                    <div className="mt-2 flex items-center">
                      <label className="cursor-pointer bg-white py-2 px-3 border border-gray-300 rounded-md shadow-sm text-sm leading-4 font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500">
                        <span>Choose Files</span>
                        <input 
                          type="file" 
                          className="sr-only" 
                          multiple 
                          accept="image/*"
                          onChange={(e) => {
                            if (e.target.files) {
                              const files = Array.from(e.target.files).slice(0, 5);
                              setFormData({ ...formData, images: files });
                            }
                          }}
                        />
                      </label>
                      <span className="ml-2 text-sm text-gray-500">
                        {formData.images.length > 0 ? `${formData.images.length} file(s) selected` : 'Up to 5 images'}
                      </span>
                    </div>
                  </div>

                  <div className="pt-4 flex justify-end space-x-3">
                    <button
                      type="button"
                      onClick={() => {
                        // Reset form fields
                        setFormData({
                          requestTitle: '',
                          category: '',
                          quantity: '',
                          urgencyLevel: '',
                          description: '',
                          neededBy: '',
                          images: [],
                          foodType: '',
                          foodCategory: '',
                          approxWeight: '',
                          expiryTime: '',
                          clothingType: '',
                          condition: '',
                          season: '',
                          medicalType: '',
                          expiryDate: '',
                          storageRequirements: '',
                          bookType: '',
                          subject: '',
                          ageGroup: '',
                          itemType: '',
                          specifications: ''
                        });
                        // Clear messages and errors
                        setFormError(null);
                        setFormSuccess(null);
                        setFormFieldErrors({});
                        // Stay on same page (don't navigate)
                      }}
                      disabled={formLoading}
                      className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 disabled:opacity-50"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={formLoading}
                      className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 disabled:opacity-50"
                    >
                      {formLoading ? 'Submitting...' : 'Submit Request'}
                    </button>
                  </div>
                </form>
                </div>
              </div>
            </div>
        )}

        {activeTab === 'my-requests' && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200 bg-emerald-50">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-medium text-emerald-800 flex items-center">
                    <svg className="w-5 h-5 mr-2 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                    My Requests
                  </h2>
                  <div className="flex items-center space-x-4">
                    <span className="text-sm text-emerald-700 font-medium">
                      Total: {myRequests.length} request{myRequests.length !== 1 ? 's' : ''}
                    </span>
                    <button
                      onClick={loadMyRequests}
                      disabled={requestsLoading}
                      className="px-4 py-2 text-sm font-medium text-emerald-700 bg-white border border-emerald-200 rounded-md hover:bg-emerald-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {requestsLoading ? 'Refreshing...' : 'Refresh'}
                    </button>
                  </div>
                </div>
              </div>

              <div className="p-6">
                {requestsError && (
                  <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
                    <p className="text-sm text-red-800">{requestsError}</p>
                  </div>
                )}

                {requestsLoading && myRequests.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
                    <p className="mt-4 text-sm text-gray-600">Loading requests...</p>
                  </div>
                ) : myRequests.length === 0 ? (
                  <div className="text-center py-12">
                    <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                    <h3 className="mt-2 text-sm font-medium text-gray-900">No requests found</h3>
                    <p className="mt-1 text-sm text-gray-500">Get started by creating your first donation request.</p>
                    <div className="mt-6">
                      <button
                        onClick={() => setActiveTab('create-request')}
                        className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500"
                      >
                        Create Request
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {myRequests.map((request: any) => (
                      <div
                        key={request._id}
                        className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-3 mb-3">
                              <h3 className="text-lg font-semibold text-gray-900">{request.requestTitle}</h3>
                              <span
                                className={`px-3 py-1 text-xs font-medium rounded-full ${
                                  request.status === 'pending'
                                    ? 'bg-yellow-100 text-yellow-800'
                                    : request.status === 'approved'
                                    ? 'bg-green-100 text-green-800'
                                    : request.status === 'fulfilled'
                                    ? 'bg-blue-100 text-blue-800'
                                    : 'bg-red-100 text-red-800'
                                }`}
                              >
                                {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                              </span>
                              <span
                                className={`px-3 py-1 text-xs font-medium rounded-full ${
                                  request.urgencyLevel === 'high'
                                    ? 'bg-red-100 text-red-800'
                                    : request.urgencyLevel === 'medium'
                                    ? 'bg-yellow-100 text-yellow-800'
                                    : 'bg-green-100 text-green-800'
                                }`}
                              >
                                {request.urgencyLevel.charAt(0).toUpperCase() + request.urgencyLevel.slice(1)} Priority
                              </span>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
                              <div>
                                <p className="text-sm font-medium text-gray-500">Category</p>
                                <p className="text-sm text-gray-900 capitalize">{request.category}</p>
                              </div>
                              <div>
                                <p className="text-sm font-medium text-gray-500">Quantity Needed</p>
                                <p className="text-sm text-gray-900">{request.quantity}</p>
                              </div>
                              {request.neededBy && (
                                <div>
                                  <p className="text-sm font-medium text-gray-500">Needed By</p>
                                  <p className="text-sm text-gray-900">
                                    {new Date(request.neededBy).toLocaleDateString()}
                                  </p>
                                </div>
                              )}
                            </div>

                            <div className="mb-4">
                              <p className="text-sm font-medium text-gray-500 mb-1">Description</p>
                              <p className="text-sm text-gray-900">{request.description}</p>
                            </div>

                            {/* Category-specific fields */}
                            {request.category === 'food' && (
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4 p-4 bg-green-50 rounded-lg">
                                {request.foodType && (
                                  <div>
                                    <p className="text-sm font-medium text-gray-500">Food Type</p>
                                    <p className="text-sm text-gray-900">{request.foodType}</p>
                                  </div>
                                )}
                                {request.foodCategory && (
                                  <div>
                                    <p className="text-sm font-medium text-gray-500">Food Category</p>
                                    <p className="text-sm text-gray-900">{request.foodCategory}</p>
                                  </div>
                                )}
                                {request.approxWeight && (
                                  <div>
                                    <p className="text-sm font-medium text-gray-500">Approximate Weight</p>
                                    <p className="text-sm text-gray-900">{request.approxWeight} kg</p>
                                  </div>
                                )}
                                {request.expiryTime && (
                                  <div>
                                    <p className="text-sm font-medium text-gray-500">Expiry Time</p>
                                    <p className="text-sm text-gray-900">
                                      {new Date(request.expiryTime).toLocaleString()}
                                    </p>
                                  </div>
                                )}
                              </div>
                            )}

                            {request.category === 'clothing' && (
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4 p-4 bg-blue-50 rounded-lg">
                                {request.clothingType && (
                                  <div>
                                    <p className="text-sm font-medium text-gray-500">Clothing Type</p>
                                    <p className="text-sm text-gray-900">{request.clothingType}</p>
                                  </div>
                                )}
                                {request.condition && (
                                  <div>
                                    <p className="text-sm font-medium text-gray-500">Condition</p>
                                    <p className="text-sm text-gray-900">{request.condition}</p>
                                  </div>
                                )}
                                {request.season && (
                                  <div>
                                    <p className="text-sm font-medium text-gray-500">Season</p>
                                    <p className="text-sm text-gray-900">{request.season}</p>
                                  </div>
                                )}
                              </div>
                            )}

                            {request.category === 'medical' && (
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4 p-4 bg-red-50 rounded-lg">
                                {request.medicalType && (
                                  <div>
                                    <p className="text-sm font-medium text-gray-500">Medical Type</p>
                                    <p className="text-sm text-gray-900">{request.medicalType}</p>
                                  </div>
                                )}
                                {request.expiryDate && (
                                  <div>
                                    <p className="text-sm font-medium text-gray-500">Expiry Date</p>
                                    <p className="text-sm text-gray-900">
                                      {new Date(request.expiryDate).toLocaleDateString()}
                                    </p>
                                  </div>
                                )}
                                {request.storageRequirements && (
                                  <div className="md:col-span-2">
                                    <p className="text-sm font-medium text-gray-500">Storage Requirements</p>
                                    <p className="text-sm text-gray-900">{request.storageRequirements}</p>
                                  </div>
                                )}
                              </div>
                            )}

                            {request.category === 'education' && (
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4 p-4 bg-yellow-50 rounded-lg">
                                {request.bookType && (
                                  <div>
                                    <p className="text-sm font-medium text-gray-500">Book Type</p>
                                    <p className="text-sm text-gray-900">{request.bookType}</p>
                                  </div>
                                )}
                                {request.subject && (
                                  <div>
                                    <p className="text-sm font-medium text-gray-500">Subject</p>
                                    <p className="text-sm text-gray-900">{request.subject}</p>
                                  </div>
                                )}
                                {request.ageGroup && (
                                  <div>
                                    <p className="text-sm font-medium text-gray-500">Age Group</p>
                                    <p className="text-sm text-gray-900">{request.ageGroup}</p>
                                  </div>
                                )}
                              </div>
                            )}

                            {request.category === 'other' && (
                              <div className="mb-4 p-4 bg-gray-50 rounded-lg">
                                {request.itemType && (
                                  <div className="mb-2">
                                    <p className="text-sm font-medium text-gray-500">Item Type</p>
                                    <p className="text-sm text-gray-900">{request.itemType}</p>
                                  </div>
                                )}
                                {request.specifications && (
                                  <div>
                                    <p className="text-sm font-medium text-gray-500">Specifications</p>
                                    <p className="text-sm text-gray-900">{request.specifications}</p>
                                  </div>
                                )}
                              </div>
                            )}

                            <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                              <div className="text-xs text-gray-500">
                                Created: {new Date(request.createdAt).toLocaleString()}
                                {request.updatedAt && request.updatedAt !== request.createdAt && (
                                  <span className="ml-4">
                                    Updated: {new Date(request.updatedAt).toLocaleString()}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'feedback' && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200 bg-emerald-50">
                <h2 className="text-lg font-medium text-emerald-800 flex items-center">
                  <svg className="w-5 h-5 mr-2 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                  </svg>
                  Share Your Feedback
                </h2>
              </div>
              <div className="p-6">
                {feedbackSuccess && (
                  <div className="mb-4 p-4 bg-green-50 border-2 border-green-400 rounded-lg shadow-sm">
                    <div className="flex items-center">
                      <svg className="w-5 h-5 text-green-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <p className="text-sm font-semibold text-green-800">{feedbackSuccess}</p>
                    </div>
                  </div>
                )}
                {feedbackError && (
                  <div className="mb-4 p-4 bg-red-50 border-2 border-red-400 rounded-lg shadow-sm">
                    <div className="flex items-center">
                      <svg className="w-5 h-5 text-red-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <p className="text-sm font-semibold text-red-800">{feedbackError}</p>
                    </div>
                  </div>
                )}
                <form 
                  className="space-y-6"
                  onSubmit={async (e) => {
                    e.preventDefault();
                    setFeedbackError(null);
                    setFeedbackSuccess(null);
                    setFeedbackFieldErrors({});

                    // Validation
                    const errors: Record<string, string> = {};
                    
                    if (!feedbackData.subject.trim()) {
                      errors.subject = 'Subject is required';
                    } else if (feedbackData.subject.trim().length < 3) {
                      errors.subject = 'Subject must be at least 3 characters';
                    } else if (feedbackData.subject.trim().length > 100) {
                      errors.subject = 'Subject must be less than 100 characters';
                    }

                    if (!feedbackData.feedbackType) {
                      errors.feedbackType = 'Please select feedback type';
                    }

                    if (!feedbackData.description.trim()) {
                      errors.description = 'Description is required';
                    } else if (feedbackData.description.trim().length < 10) {
                      errors.description = 'Description must be at least 10 characters';
                    } else if (feedbackData.description.trim().length > 2000) {
                      errors.description = 'Description must be less than 2000 characters';
                    }

                    if (Object.keys(errors).length > 0) {
                      setFeedbackFieldErrors(errors);
                      return;
                    }

                    setFeedbackLoading(true);

                    try {
                      const feedbackPayload = {
                        subject: feedbackData.subject.trim(),
                        feedbackType: feedbackData.feedbackType as 'suggestion' | 'bug' | 'feature' | 'complaint' | 'other',
                        description: feedbackData.description.trim(),
                        rating: feedbackData.rating > 0 ? feedbackData.rating : undefined,
                        screenshot: undefined, // TODO: Handle screenshot upload
                        contactPermission: feedbackData.contactPermission
                      };

                      await createFeedback(feedbackPayload);
                      setFeedbackSuccess('Feedback submitted successfully!');
                      
                      // Reset form
                      setFeedbackData({
                        subject: '',
                        feedbackType: '',
                        description: '',
                        rating: 0,
                        screenshot: null,
                        contactPermission: false
                      });

                      // Clear success message after 3 seconds
                      setTimeout(() => {
                        setFeedbackSuccess(null);
                      }, 3000);
                    } catch (error: any) {
                      setFeedbackError(error.response?.data?.message || 'Failed to submit feedback. Please try again.');
                    } finally {
                      setFeedbackLoading(false);
                    }
                  }}
                >
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Subject <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={feedbackData.subject}
                      onChange={(e) => {
                        setFeedbackData({ ...feedbackData, subject: e.target.value });
                        if (feedbackFieldErrors.subject) {
                          setFeedbackFieldErrors({ ...feedbackFieldErrors, subject: '' });
                        }
                      }}
                      className={`mt-1 block w-full border rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 ${
                        feedbackFieldErrors.subject ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="Briefly describe your feedback"
                      maxLength={100}
                    />
                    {feedbackFieldErrors.subject && (
                      <p className="mt-1 text-sm text-red-600">{feedbackFieldErrors.subject}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Feedback Type <span className="text-red-500">*</span>
                    </label>
                    <select
                      required
                      value={feedbackData.feedbackType}
                      onChange={(e) => {
                        setFeedbackData({ ...feedbackData, feedbackType: e.target.value });
                        if (feedbackFieldErrors.feedbackType) {
                          setFeedbackFieldErrors({ ...feedbackFieldErrors, feedbackType: '' });
                        }
                      }}
                      className={`mt-1 block w-full pl-3 pr-10 py-2 text-base border focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm rounded-md ${
                        feedbackFieldErrors.feedbackType ? 'border-red-500' : 'border-gray-300'
                      }`}
                    >
                      <option value="">Select feedback type</option>
                      <option value="suggestion">Suggestion</option>
                      <option value="bug">Bug Report</option>
                      <option value="feature">Feature Request</option>
                      <option value="complaint">Complaint</option>
                      <option value="other">Other</option>
                    </select>
                    {feedbackFieldErrors.feedbackType && (
                      <p className="mt-1 text-sm text-red-600">{feedbackFieldErrors.feedbackType}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Description <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      rows={5}
                      required
                      value={feedbackData.description}
                      onChange={(e) => {
                        setFeedbackData({ ...feedbackData, description: e.target.value });
                        if (feedbackFieldErrors.description) {
                          setFeedbackFieldErrors({ ...feedbackFieldErrors, description: '' });
                        }
                      }}
                      className={`mt-1 block w-full border rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 ${
                        feedbackFieldErrors.description ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="Please provide detailed feedback..."
                      maxLength={2000}
                    ></textarea>
                    <div className="mt-1 flex justify-between">
                      {feedbackFieldErrors.description ? (
                        <p className="text-sm text-red-600">{feedbackFieldErrors.description}</p>
                      ) : (
                        <span></span>
                      )}
                      <p className="text-xs text-gray-500">{feedbackData.description.length}/2000</p>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Rating
                    </label>
                    <div className="flex items-center space-x-2">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          className={`text-2xl focus:outline-none transition-colors ${
                            star <= feedbackData.rating ? 'text-yellow-400' : 'text-gray-300'
                          }`}
                          onClick={(e) => {
                            e.preventDefault();
                            setFeedbackData({ ...feedbackData, rating: star });
                          }}
                        >
                          ★
                        </button>
                      ))}
                      <span className="text-sm text-gray-500 ml-2">(Optional)</span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Upload Screenshot (Optional)
                    </label>
                    <div className="mt-1 flex items-center">
                      <label className="cursor-pointer bg-white py-2 px-3 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500">
                        <span>Choose File</span>
                        <input 
                          type="file" 
                          className="sr-only" 
                          accept="image/*"
                          onChange={(e) => {
                            if (e.target.files && e.target.files[0]) {
                              setFeedbackData({ ...feedbackData, screenshot: e.target.files[0] });
                            }
                          }}
                        />
                      </label>
                      <span className="ml-2 text-sm text-gray-500">
                        {feedbackData.screenshot ? feedbackData.screenshot.name : 'Max 5MB'}
                      </span>
                    </div>
                  </div>

                  <div className="pt-2">
                    <div className="flex items-start">
                      <div className="flex items-center h-5">
                        <input
                          id="contact-permission"
                          name="contact-permission"
                          type="checkbox"
                          checked={feedbackData.contactPermission}
                          onChange={(e) => setFeedbackData({ ...feedbackData, contactPermission: e.target.checked })}
                          className="focus:ring-emerald-500 h-4 w-4 text-emerald-600 border-gray-300 rounded"
                        />
                      </div>
                      <div className="ml-3 text-sm">
                        <label htmlFor="contact-permission" className="font-medium text-gray-700">
                          You may contact me regarding this feedback
                        </label>
                      </div>
                    </div>
                  </div>

                  <div className="pt-4 flex justify-end space-x-3">
                    <button
                      type="button"
                      onClick={() => {
                        // Reset form fields
                        setFeedbackData({
                          subject: '',
                          feedbackType: '',
                          description: '',
                          rating: 0,
                          screenshot: null,
                          contactPermission: false
                        });
                        // Clear messages and errors
                        setFeedbackError(null);
                        setFeedbackSuccess(null);
                        setFeedbackFieldErrors({});
                        // Stay on same page
                      }}
                      disabled={feedbackLoading}
                      className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 disabled:opacity-50"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={feedbackLoading}
                      className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 disabled:opacity-50"
                    >
                      {feedbackLoading ? 'Submitting...' : 'Submit Feedback'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'help-support' && (
          <div className="space-y-6">
            {/* Help Header */}
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="bg-gradient-to-r from-blue-600 to-cyan-500 px-6 py-8 text-white">
                <h1 className="text-2xl font-bold mb-2">How can we help you today?</h1>
                <p className="text-blue-100">Browse our resources and find answers to your questions</p>
              </div>
            </div>

            {/* Quick Links */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                {
                  title: 'Getting Started',
                  icon: (
                    <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                    </svg>
                  ),
                  description: 'Learn how to make the most of our platform',
                },
                {
                  title: 'FAQs',
                  icon: (
                    <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  ),
                  description: 'Find answers to common questions',
                },
                {
                  title: 'Video Tutorials',
                  icon: (
                    <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                  ),
                  description: 'Watch step-by-step guides',
                },
                {
                  title: 'Contact Support',
                  icon: (
                    <svg className="w-8 h-8 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  ),
                  description: 'Get in touch with our team',
                },
              ].map((item, index) => (
                <div
                  key={index}
                  className="bg-white p-6 rounded-lg shadow hover:shadow-md transition-shadow cursor-pointer border border-gray-100 hover:border-blue-100"
                >
                  <div className="flex items-center space-x-4">
                    <div className="p-2 bg-blue-50 rounded-full">
                      {item.icon}
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900">{item.title}</h3>
                      <p className="text-sm text-gray-500">{item.description}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* FAQ Section */}
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                <h2 className="text-lg font-medium text-gray-900">Frequently Asked Questions</h2>
              </div>
              <div className="divide-y divide-gray-200">
                {[
                  {
                    question: 'How do I create a new donation request?',
                    answer: 'To create a new donation request, navigate to the "Create Request" tab and fill out the required information including item details, quantity needed, and preferred delivery method.'
                  },
                  {
                    question: 'How can I track my donation requests?',
                    answer: 'You can track all your donation requests in the "My Requests" tab where you can see the status of each request and any updates from donors.'
                  },
                  {
                    question: 'What payment methods do you accept?',
                    answer: 'We accept various payment methods including credit/debit cards, UPI, and net banking. All transactions are secure and encrypted.'
                  },
                  {
                    question: 'How do I update my organization information?',
                    answer: 'You can update your organization details in the "Profile" section. All changes will be reviewed by our team before being applied.'
                  },
                ].map((faq, index) => {
                  const isOpen = openFaqIndex === index;
                  return (
                    <div key={index} className="p-6">
                      <button
                        className="w-full flex justify-between items-center text-left"
                        onClick={() => {
                          setOpenFaqIndex(isOpen ? null : index);
                        }}
                      >
                        <h3 className="font-medium text-gray-900">{faq.question}</h3>
                        <svg
                          className={`w-5 h-5 text-gray-500 transition-transform duration-200 ${
                            isOpen ? 'rotate-180' : ''
                          }`}
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                        </svg>
                      </button>
                      <div
                        className={`mt-2 text-gray-600 overflow-hidden transition-all duration-300 ${
                          isOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
                        }`}
                      >
                        <p className="pb-2">{faq.answer}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Contact Support */}
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                <h2 className="text-lg font-medium text-gray-900">Still need help?</h2>
                <p className="text-sm text-gray-500 mt-1">Our support team is here to help you</p>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Contact Information</h3>
                    <div className="space-y-4">
                      <div className="flex items-start">
                        <div className="flex-shrink-0 bg-blue-100 p-2 rounded-full">
                          <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                          </svg>
                        </div>
                        <div className="ml-3">
                          <p className="text-sm font-medium text-gray-900">Email us</p>
                          <p className="text-sm text-blue-600">support@donationhub.com</p>
                          <p className="text-xs text-gray-500 mt-1">We'll respond within 24 hours</p>
                        </div>
                      </div>
                      <div className="flex items-start">
                        <div className="flex-shrink-0 bg-green-100 p-2 rounded-full">
                          <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                          </svg>
                        </div>
                        <div className="ml-3">
                          <p className="text-sm font-medium text-gray-900">Call us</p>
                          <p className="text-sm text-green-600">+1 (555) 123-4567</p>
                          <p className="text-xs text-gray-500 mt-1">Mon-Fri, 9am-6pm IST</p>
                        </div>
                      </div>
                      <div className="flex items-start">
                        <div className="flex-shrink-0 bg-purple-100 p-2 rounded-full">
                          <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                          </svg>
                        </div>
                        <div className="ml-3">
                          <p className="text-sm font-medium text-gray-900">Live chat</p>
                          <p className="text-sm text-purple-600">Start a conversation</p>
                          <p className="text-xs text-gray-500 mt-1">Available 24/7</p>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Send us a message</h3>
                    {contactSuccess && (
                      <div className="mb-4 p-4 bg-green-50 border-2 border-green-400 rounded-lg shadow-sm">
                        <div className="flex items-center">
                          <svg className="w-5 h-5 text-green-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <p className="text-sm font-semibold text-green-800">{contactSuccess}</p>
                        </div>
                      </div>
                    )}
                    {contactError && (
                      <div className="mb-4 p-4 bg-red-50 border-2 border-red-400 rounded-lg shadow-sm">
                        <div className="flex items-center">
                          <svg className="w-5 h-5 text-red-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <p className="text-sm font-semibold text-red-800">{contactError}</p>
                        </div>
                      </div>
                    )}
                    <form 
                      className="space-y-4"
                      onSubmit={async (e) => {
                        e.preventDefault();
                        setContactError(null);
                        setContactSuccess(null);
                        setContactFieldErrors({});

                        // Validation
                        const errors: Record<string, string> = {};
                        
                        if (!contactData.name.trim()) {
                          errors.name = 'Name is required';
                        } else if (contactData.name.trim().length < 2) {
                          errors.name = 'Name must be at least 2 characters';
                        } else if (contactData.name.trim().length > 50) {
                          errors.name = 'Name must be less than 50 characters';
                        }

                        if (!contactData.email.trim()) {
                          errors.email = 'Email is required';
                        } else {
                          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                          if (!emailRegex.test(contactData.email.trim())) {
                            errors.email = 'Please enter a valid email address';
                          }
                        }

                        if (contactData.subject.trim().length > 200) {
                          errors.subject = 'Subject must be less than 200 characters';
                        }

                        if (!contactData.message.trim()) {
                          errors.message = 'Message is required';
                        } else if (contactData.message.trim().length < 10) {
                          errors.message = 'Message must be at least 10 characters';
                        } else if (contactData.message.trim().length > 2000) {
                          errors.message = 'Message must be less than 2000 characters';
                        }

                        if (Object.keys(errors).length > 0) {
                          setContactFieldErrors(errors);
                          return;
                        }

                        setContactLoading(true);

                        try {
                          const contactPayload = {
                            firebaseUid: user?.uid,
                            userType: 'ngo' as const,
                            name: contactData.name.trim(),
                            email: contactData.email.trim(),
                            queryType: contactData.subject.trim() || undefined,
                            message: contactData.message.trim()
                          };

                          await createContact(contactPayload);
                          setContactSuccess('Message sent successfully! We will get back to you soon.');
                          
                          // Reset form
                          setContactData({
                            name: '',
                            email: '',
                            subject: '',
                            message: ''
                          });

                          // Clear success message after 5 seconds
                          setTimeout(() => {
                            setContactSuccess(null);
                          }, 5000);
                        } catch (error: any) {
                          setContactError(error.response?.data?.error || 'Failed to send message. Please try again.');
                        } finally {
                          setContactLoading(false);
                        }
                      }}
                    >
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Name <span className="text-red-500">*</span></label>
                        <input
                          type="text"
                          required
                          value={contactData.name}
                          onChange={(e) => {
                            setContactData({ ...contactData, name: e.target.value });
                            if (contactFieldErrors.name) {
                              setContactFieldErrors({ ...contactFieldErrors, name: '' });
                            }
                          }}
                          className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${
                            contactFieldErrors.name ? 'border-red-500' : 'border-gray-300'
                          }`}
                          placeholder="Your name"
                          maxLength={50}
                        />
                        {contactFieldErrors.name && (
                          <p className="mt-1 text-sm text-red-600">{contactFieldErrors.name}</p>
                        )}
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Email <span className="text-red-500">*</span></label>
                        <input
                          type="email"
                          required
                          value={contactData.email}
                          onChange={(e) => {
                            setContactData({ ...contactData, email: e.target.value });
                            if (contactFieldErrors.email) {
                              setContactFieldErrors({ ...contactFieldErrors, email: '' });
                            }
                          }}
                          className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${
                            contactFieldErrors.email ? 'border-red-500' : 'border-gray-300'
                          }`}
                          placeholder="your@email.com"
                        />
                        {contactFieldErrors.email && (
                          <p className="mt-1 text-sm text-red-600">{contactFieldErrors.email}</p>
                        )}
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
                        <input
                          type="text"
                          value={contactData.subject}
                          onChange={(e) => {
                            setContactData({ ...contactData, subject: e.target.value });
                            if (contactFieldErrors.subject) {
                              setContactFieldErrors({ ...contactFieldErrors, subject: '' });
                            }
                          }}
                          className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${
                            contactFieldErrors.subject ? 'border-red-500' : 'border-gray-300'
                          }`}
                          placeholder="How can we help you?"
                          maxLength={200}
                        />
                        {contactFieldErrors.subject && (
                          <p className="mt-1 text-sm text-red-600">{contactFieldErrors.subject}</p>
                        )}
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Message <span className="text-red-500">*</span></label>
                        <textarea
                          rows={4}
                          required
                          value={contactData.message}
                          onChange={(e) => {
                            setContactData({ ...contactData, message: e.target.value });
                            if (contactFieldErrors.message) {
                              setContactFieldErrors({ ...contactFieldErrors, message: '' });
                            }
                          }}
                          className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${
                            contactFieldErrors.message ? 'border-red-500' : 'border-gray-300'
                          }`}
                          placeholder="Tell us more about your issue..."
                          maxLength={2000}
                        ></textarea>
                        <div className="mt-1 flex justify-between">
                          {contactFieldErrors.message ? (
                            <p className="text-sm text-red-600">{contactFieldErrors.message}</p>
                          ) : (
                            <span></span>
                          )}
                          <p className="text-xs text-gray-500">{contactData.message.length}/2000</p>
                        </div>
                      </div>
                      <div>
                        <button
                          type="submit"
                          disabled={contactLoading}
                          className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                        >
                          {contactLoading ? 'Sending...' : 'Send Message'}
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'profile' && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-medium text-gray-900">Organization Profile</h2>
              </div>
              <div className="p-6">
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Organization Name</label>
                    <input
                      type="text"
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-emerald-500 focus:border-emerald-500"
                      placeholder="Enter organization name"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Contact Email</label>
                    <input
                      type="email"
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-emerald-500 focus:border-emerald-500"
                      value={user?.email || ''}
                      readOnly
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Address</label>
                    <textarea
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-emerald-500 focus:border-emerald-500"
                      rows={3}
                      placeholder="Enter organization address"
                    ></textarea>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Phone Number</label>
                    <input
                      type="tel"
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-emerald-500 focus:border-emerald-500"
                      placeholder="Enter phone number"
                    />
                  </div>
                  <button className="w-full px-4 py-2 bg-emerald-600 text-white rounded-md hover:bg-emerald-700">
                    Save Changes
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}