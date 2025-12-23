import { useEffect, useState } from 'react';
import { signInWithGoogle, signOutUser, onAuthStateChanged, signInWithEmail, signUpWithEmail, setUpRecaptcha, sendVerificationCode, verifyPhoneNumber } from './firebase';
import type { User as FirebaseUser } from 'firebase/auth';

import AboutUs from './components/AboutUs';
import Footer from './components/Footer';
import Body from './components/Body';
import Notification from './components/Notification';
// Auth form type
type AuthMode = 'email' | 'phone';
type PhoneAuthStep = 'phone' | 'code';
// Form data interface
interface AuthFormData {
  email: string;
  password: string;
  name: string;
  userType: 'donor' | 'ngo';
  organizationName: string;
}
function App() {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSignUp, setIsSignUp] = useState(false);
  const [authMode, setAuthMode] = useState<AuthMode>('email');
  const [formData, setFormData] = useState<AuthFormData>({
    email: '',
    password: '',
    name: '',
    userType: 'donor',
    organizationName: ''
  });
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [name, setName] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [confirmationResult, setConfirmationResult] = useState<any>(null);
  const [phoneAuthStep, setPhoneAuthStep] = useState<PhoneAuthStep>('phone');
  const [showLanding, setShowLanding] = useState(true);
  const [activeLink, setActiveLink] = useState('home');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  // Search functionality can be implemented here when needed
  // const [searchQuery, setSearchQuery] = useState('');
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [showAbout, setShowAbout] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged((currentUser: FirebaseUser | null) => {
      setUser(currentUser);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // Close profile dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.profile-menu-container')) {
        setIsProfileOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      if (isSignUp) {
        await signUpWithEmail(
          formData.email, 
          formData.password, 
          formData.name, 
          formData.userType,
          formData.userType === 'ngo' ? formData.organizationName : undefined
        );
      } else {
        await signInWithEmail(formData.email, formData.password);
      }
    } catch (error: any) {
      setError(error.message || 'An error occurred. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePhoneAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    try {
      if (phoneAuthStep === 'phone') {
        if (!name.trim()) {
          setError('Please enter your name');
          return;
        }
        setIsSubmitting(true);
        const recaptchaVerifier = setUpRecaptcha('recaptcha-container');
        const formattedPhoneNumber = phoneNumber.startsWith('+') ? phoneNumber : `+91${phoneNumber}`;
        const confirmation = await sendVerificationCode(formattedPhoneNumber, recaptchaVerifier);
        setConfirmationResult(confirmation);
        setPhoneAuthStep('code');
      } else {
        setIsSubmitting(true);
        await verifyPhoneNumber(confirmationResult.verificationId, verificationCode, name);
        // User is now signed in
      }
    } catch (error: any) {
      setError(error.message || 'An error occurred. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePhoneNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, ''); // Remove non-numeric characters
    setPhoneNumber(value);
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setName(e.target.value);
  };

  const handleGoogleSignIn = async () => {
    try {
      setError(null);
      await signInWithGoogle();
    } catch (error: any) {
      setError(error.message || 'Failed to sign in with Google.');
    }
  };

  const handleSignOut = async () => {
    try {
      await signOutUser();
    } catch (error) {
      setError('Error signing out. Please try again.');
    }
  };

  const toggleAuthMode = () => {
    setIsSignUp(prev => !prev);
  };

  // Handle sign in button click (for the header)
  const handleSignIn = () => {
    setAuthMode('email');
    setShowLanding(false);
  };


  // Handle back button click
  const handleGoBack = () => {
    if (isSignUp) {
      // Toggle back to sign in
      setIsSignUp(false);
    } else if (!showLanding) {
      // If on login page, go back to landing
      setShowLanding(true);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }
  // Render auth form if user is not logged in
  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-blue-50 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
            <div className="p-8">
              <button 
                onClick={handleGoBack}
                className="text-sm font-medium text-emerald-600 hover:text-emerald-700 mb-6 transition-colors flex items-center"
              >
                ← {isSignUp ? 'Back to Sign In' : 'Back to Home'}
              </button>
              <div className="text-center mb-8">
                <div className="flex justify-center mb-4">
                  
                </div>
                <h1 className="text-2xl font-bold text-gray-900">
                  {isSignUp ? 'Create an account' : 'Welcome back!'}
                </h1>
                <p className="text-gray-500 mt-2">
                  {authMode === 'phone' 
                    ? 'Sign in with your phone number'
                    : isSignUp 
                      ? 'Join us to make a difference'
                      : 'Sign in to continue to ShareCare'}
                </p>
              </div>

              <div className="flex space-x-4 mb-6 border-b">
                <button
                  type="button"
                  onClick={() => setAuthMode('email')}
                  className={`flex-1 py-2 font-medium text-sm ${
                    authMode === 'email' 
                      ? 'text-emerald-600 border-b-2 border-emerald-600' 
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Email
                </button>
                <button
                  type="button"
                  onClick={() => setAuthMode('phone')}
                  className={`flex-1 py-2 font-medium text-sm ${
                    authMode === 'phone' 
                      ? 'text-emerald-600 border-b-2 border-emerald-600' 
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Phone
                </button>
              </div>

              {error && (
                <div className="mb-6 p-3 bg-red-50 text-red-600 rounded-lg text-sm">
                  <span>⚠️ {error}</span>
                </div>
              )}

              {authMode === 'phone' ? (
                <form onSubmit={handlePhoneAuth}>
                  {phoneAuthStep === 'phone' ? (
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                        <input
                          type="text"
                          value={name}
                          onChange={handleNameChange}
                          placeholder="Enter your full name"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                        <div className="flex">
                          <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-300 bg-gray-50 text-gray-500 text-sm">
                            +91
                          </span>
                          <input
                            type="tel"
                            value={phoneNumber}
                            onChange={handlePhoneNumberChange}
                            placeholder="Enter phone number"
                            className="flex-1 min-w-0 block w-full px-3 py-2 rounded-none rounded-r-md border border-gray-300 focus:ring-blue-500 focus:border-blue-500"
                            required
                            maxLength={10}
                          />
                        </div>
                        <p className="mt-1 text-xs text-gray-500">We'll send a verification code to this number</p>
                      </div>
                      <button
                        type="submit"
                        disabled={isSubmitting || phoneNumber.length < 10 || !name.trim()}
                        className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isSubmitting ? 'Sending...' : 'Send Verification Code'}
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Verification Code</label>
                        <input
                          type="text"
                          value={verificationCode}
                          onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, ''))}
                          placeholder="Enter 6-digit code"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          required
                          maxLength={6}
                        />
                        <p className="mt-1 text-xs text-gray-500">Enter the 6-digit code sent to +91{phoneNumber}</p>
                      </div>
                      <button
                        type="submit"
                        disabled={isSubmitting || verificationCode.length !== 6}
                        className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isSubmitting ? 'Verifying...' : 'Verify Code'}
                      </button>
                      <button
                        type="button"
                        onClick={() => setPhoneAuthStep('phone')}
                        className="w-full text-blue-600 hover:text-blue-800 text-sm font-medium"
                      >
                        Change Phone Number
                      </button>
                    </div>
                  )}
                  <div id="recaptcha-container" className="invisible"></div>
                </form>
              ) : (
                <form onSubmit={handleAuthSubmit} className="space-y-4">
                  {isSignUp && (
                    <div>
                      <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                        Full Name
                      </label>
                      <input
                        type="text"
                        id="name"
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                        placeholder="John Doe"
                        required
                      />
                    </div>
                  )}

                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                      Email address
                    </label>
                    <input
                      id="email"
                      name="email"
                      type="email"
                      autoComplete="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                      placeholder="you@example.com"
                      required
                    />
                  </div>

                  <div>
                    <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                      Password
                    </label>
                    <input
                      id="password"
                      name="password"
                      type="password"
                      autoComplete={isSignUp ? 'new-password' : 'current-password'}
                      value={formData.password}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                      placeholder="••••••••"
                      required
                      minLength={6}
                    />
                  </div>

                  {isSignUp && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        I am a...
                      </label>
                      <div className="grid grid-cols-2 gap-3">
                        <button
                          type="button"
                          onClick={() => setFormData(prev => ({ ...prev, userType: 'donor' }))}
                          className={`flex items-center justify-center px-4 py-2 border rounded-lg ${
                            formData.userType === 'donor'
                              ? 'bg-emerald-50 border-emerald-500 text-emerald-700'
                              : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
                          }`}
                        >
                          <span>Donor</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setFormData(prev => ({ ...prev, userType: 'ngo' }))}
                          className={`flex items-center justify-center px-4 py-2 border rounded-lg ${
                            formData.userType === 'ngo'
                              ? 'bg-emerald-50 border-emerald-500 text-emerald-700'
                              : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
                          }`}
                        >
                          <span>NGO</span>
                        </button>
                      </div>
                    </div>
                  )}

                  {isSignUp && formData.userType === 'ngo' && (
                    <div>
                      <label htmlFor="organizationName" className="block text-sm font-medium text-gray-700 mb-1">
                        Organization Name
                      </label>
                      <input
                        id="organizationName"
                        name="organizationName"
                        type="text"
                        value={formData.organizationName}
                        onChange={handleInputChange}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                        placeholder="Organization Name"
                        required
                      />
                    </div>
                  )}

                  <div className="pt-2">
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isSubmitting 
                        ? (isSignUp ? 'Creating Account...' : 'Signing In...')
                        : (isSignUp ? 'Create Account' : 'Sign In')}
                    </button>
                  </div>
                </form>
              )}

              <div className="mt-6">
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-300"></div>
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-2 bg-white text-gray-500">Or continue with</span>
                  </div>
                </div>

                <div className="mt-6 grid grid-cols-1 gap-3">
                  <button
                    type="button"
                    onClick={handleGoogleSignIn}
                    disabled={isSubmitting}
                    className="w-full inline-flex justify-center py-2.5 px-4 border border-gray-300 rounded-lg shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 disabled:opacity-70"
                  >
                    <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24" aria-hidden="true">
                      <g transform="matrix(1, 0, 0, 1, 27.009001, -39.238998)">
                        <path
                          fill="#4285F4"
                          d="M -3.264 51.509 C -3.264 50.719 -3.334 49.969 -3.454 49.239 L -14.754 49.239 L -14.754 53.749 L -8.28426 53.749 C -8.52426 55.229 -9.21651 56.479 -10.0808 57.329 L -10.1048 57.549 L -4.101 62.059 L -3.864 62.084 C -1.564 59.834 0.166 56.599 0.166 52.774 C 0.166 52.104 0.0950001 51.449 -0.024 50.819 L -3.264 51.509 Z"
                        />
                        <path
                          fill="#34A853"
                          d="M -14.754 63.239 C -11.514 63.239 -8.80451 62.159 -6.71376 60.319 L -10.8165 56.809 C -11.9385 57.759 -13.4465 58.309 -15.0045 58.309 C -17.9245 58.309 -20.4645 56.619 -21.4145 53.964 L -25.5213 54.489 L -25.5638 54.689 C -23.714 58.539 -20.124 61.239 -15.0045 61.239 C -9.3345 61.239 -4.464 57.499 -2.724 52.529 L -14.754 52.529 L -14.754 63.239 Z"
                        />
                        <path
                          fill="#FBBC05"
                          d="M -21.4147 53.964 C -21.7747 52.969 -21.9847 51.889 -21.9847 50.779 C -21.9847 49.669 -21.7747 48.589 -21.4047 47.594 L -21.3847 47.354 L -25.1912 42.949 L -25.5217 42.839 C -26.6017 44.749 -27.1547 46.934 -27.1547 49.229 C -27.1547 51.524 -26.6017 53.709 -25.5217 55.619 L -21.4147 53.964 Z"
                        />
                        <path
                          fill="#EA4335"
                          d="M -15.0045 40.239 C -13.2765 40.229 -11.5795 40.729 -10.1345 41.669 L -6.70376 38.359 C -8.82476 36.429 -11.7845 35.239 -15.0045 35.239 C -20.1245 35.239 -23.7145 37.939 -25.5645 41.789 L -21.4045 44.219 C -20.4645 41.569 -17.9245 39.879 -15.0045 39.879 Z"
                        />
                      </g>
                    </svg>
                    {isSignUp ? 'Sign up with Google' : 'Sign in with Google'}
                  </button>
                </div>
              </div>

              <div className="mt-6 text-center text-sm">
                <p className="text-gray-600">
                  {authMode === 'email' && (
                    <>
                      {isSignUp ? 'Already have an account? ' : "Don't have an account? "}
                      <button
                        type="button"
                        onClick={toggleAuthMode}
                        className="font-medium text-emerald-600 hover:text-emerald-500 focus:outline-none"
                      >
                        {isSignUp ? 'Sign in' : 'Sign up'}
                      </button>
                    </>
                  )}
                </p>
              </div>
            </div>
            
            <div className="bg-gray-50 px-8 py-4 border-t border-gray-200">
              <p className="text-xs text-gray-500 text-center">
                By continuing, you agree to our Terms of Service and Privacy Policy
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Render About Us page if showAbout is true
  if (showAbout) {
    return (
      <div className="min-h-screen bg-white">
        <header className="fixed top-0 w-full bg-white/95 backdrop-blur-sm border-b border-gray-100 z-50">
          <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-8">
                <div className="flex items-center space-x-2">
                  <span className="text-2xl font-bold text-emerald-600">ShareCare</span>
                </div>
                
                {/* Desktop Navigation */}
                <div className="hidden md:flex items-center space-x-1">
                  <button 
                    onClick={() => { setShowAbout(false); setActiveLink('home'); }}
                    className={`px-4 py-2 rounded-md text-sm font-medium ${activeLink === 'home' && !showAbout ? 'bg-emerald-50 text-emerald-700' : 'text-gray-600 hover:bg-gray-50'}`}
                  >
                    Home
                  </button>
                  <button 
                    onClick={() => { setShowAbout(false); setActiveLink('donate'); }}
                    className={`px-4 py-2 rounded-md text-sm font-medium ${activeLink === 'donate' && !showAbout ? 'bg-emerald-50 text-emerald-700' : 'text-gray-600 hover:bg-gray-50'}`}
                  >
                    Impact
                  </button>
                  <button 
                    onClick={() => { setShowAbout(false); setActiveLink('help'); }}
                    className={`px-4 py-2 rounded-md text-sm font-medium ${activeLink === 'help' && !showAbout ? 'bg-emerald-50 text-emerald-700' : 'text-gray-600 hover:bg-gray-50'}`}
                  >
                  Help & Support
                  </button>
                  <button 
                    onClick={() => { setShowAbout(false); setActiveLink('announcements'); }}
                    className={`px-4 py-2 rounded-md text-sm font-medium ${activeLink === 'announcements' && !showAbout ? 'bg-emerald-50 text-emerald-700' : 'text-gray-600 hover:bg-gray-50'}`}
                  >
                  Announcements
                  </button>
<button 
  onClick={() => setShowAbout(true)}
  className={`px-4 py-2 rounded-md text-sm font-medium ${
    showAbout ? 'bg-emerald-50 text-emerald-700' : 'text-gray-600 hover:bg-gray-50 hover:text-emerald-600'
  }`}
>
  About Us
</button>
                </div>
              </div>

              {/* Mobile menu button */}
              <div className="md:hidden">
                <button
                  onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                  className="inline-flex items-center justify-center p-2 rounded-md text-gray-700 hover:text-emerald-600 hover:bg-gray-100 focus:outline-none"
                >
                  <span className="sr-only">Open main menu</span>
                  {isMobileMenuOpen ? 'Close' : 'Menu'}
                </button>
              </div>

              {/* User Actions */}
              {user ? (
                <div className="hidden md:flex items-center space-x-4">
                  <button className="relative px-3 py-2 text-sm font-medium text-emerald-600 hover:text-emerald-700">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                    </svg>
                    <span className="absolute top-1 right-0 w-2 h-2 bg-red-500 rounded-full"></span>
                  </button>
                  
                  <div className="relative profile-menu-container">
                    <button
                      onClick={() => setIsProfileOpen(!isProfileOpen)}
                      className="flex items-center space-x-2 focus:outline-none"
                    >
                      {user.photoURL ? (
                        <img 
                          src={user.photoURL} 
                          alt={user.displayName || 'User'} 
                          className="w-8 h-8 rounded-full"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 font-medium">
                          {user.displayName?.charAt(0) || user.email?.charAt(0).toUpperCase()}
                        </div>
                      )}
                      <span className="text-sm font-medium text-gray-700">
                        {user.displayName || user.email?.split('@')[0]}
                      </span>
                      <svg
                        className={`w-4 h-4 text-gray-500 transition-transform ${isProfileOpen ? 'transform rotate-180' : ''}`}
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>

                    {/* Dropdown Menu */}
                    {isProfileOpen && (
                      <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50 border border-gray-100">
                        <a
                          href="#"
                          className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                          onClick={(e) => {
                            e.preventDefault();
                            setShowAbout(false);
                            setActiveLink('donor-dashboard');
                            setIsProfileOpen(false);
                          }}
                        >
                          Dashboard
                        </a>
                        <a
                          href="#"
                          className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                          onClick={(e) => {
                            e.preventDefault();
                            // Handle profile click
                            setIsProfileOpen(false);
                          }}
                        >
                          Profile
                        </a>
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            handleSignOut();
                            setIsProfileOpen(false);
                          }}
                          className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                        >
                          Sign Out
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="hidden md:flex items-center space-x-4">
                  <button 
                    onClick={handleSignIn}
                    className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-emerald-600"
                  >
                    Sign In
                  </button>
                  <button 
                    onClick={() => { setIsSignUp(true); setShowLanding(false); }}
                    className="px-4 py-2 text-sm font-medium text-white bg-emerald-600 rounded-md hover:bg-emerald-700"
                  >
                    Sign Up
                  </button>
                </div>
              )}
            </div>

            {/* Mobile menu */}
            {isMobileMenuOpen && (
              <div className="md:hidden mt-2 pb-3 space-y-1">
                <button 
                  onClick={() => { setShowAbout(false); setActiveLink('home'); setIsMobileMenuOpen(false); }}
                  className="block w-full text-left px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:bg-gray-50 hover:text-emerald-600 rounded-md"
                >
                  Home
                </button>
                <button 
                  onClick={() => { setShowAbout(false); setActiveLink('donate'); setIsMobileMenuOpen(false); }}
                  className="block w-full text-left px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:bg-gray-50 hover:text-emerald-600 rounded-md"
                >
                  Impact
                </button>
                <button 
                  onClick={() => { setShowAbout(false); setActiveLink('requests'); setIsMobileMenuOpen(false); }}
                  className="block w-full text-left px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:bg-gray-50 hover:text-emerald-600 rounded-md"
                >
                 Help & Support
                </button>
                <button 
                  className="block w-full text-left px-3 py-2 rounded-md text-base font-medium bg-emerald-50 text-emerald-700 rounded-md"
                >
                  Announcements
                </button>
                <button 
                  className="block w-full text-left px-3 py-2 rounded-md text-base font-medium bg-emerald-50 text-emerald-700 rounded-md"
                >
                  About Us
                </button>
                
                {!user && (
                  <div className="pt-4 border-t border-gray-200 mt-2">
                    <button 
                      onClick={() => { handleSignIn(); setIsMobileMenuOpen(false); }}
                      className="w-full text-left px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:bg-gray-50 hover:text-emerald-600 rounded-md"
                    >
                      Sign In
                    </button>
                    <button 
                      onClick={() => { setIsSignUp(true); setShowLanding(false); setIsMobileMenuOpen(false); }}
                      className="mt-1 w-full text-left px-3 py-2 rounded-md text-base font-medium text-emerald-600 bg-emerald-50 hover:bg-emerald-100"
                    >
                      Sign Up
                    </button>
                  </div>
                )}
              </div>
            )}
          </nav>
        </header>
        <AboutUs onBack={() => setShowAbout(false)} />
      </div>
    );
  }

  // Main app content when user is logged in
  return (
    <div className="min-h-screen bg-white">
      <header className="fixed top-0 w-full bg-white/95 backdrop-blur-sm border-b border-gray-100 z-50">
        <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-8">
              <div className="flex items-center space-x-2">
                <span className="text-2xl font-bold text-emerald-600">ShareCare</span>
              </div>
              
              {/* Desktop Navigation */}
              <div className="hidden md:flex items-center space-x-1">
                <button 
                  onClick={() => setActiveLink('home')}
                  className={`px-4 py-2 rounded-md text-sm font-medium ${activeLink === 'home' && !showAbout ? 'bg-emerald-50 text-emerald-700' : 'text-gray-600 hover:bg-gray-50'}`}
                >
                  Home
                </button>
                <button 
                  onClick={() => setActiveLink('impact')}
                  className={`px-4 py-2 rounded-md text-sm font-medium ${activeLink === 'impact' && !showAbout ? 'bg-emerald-50 text-emerald-700' : 'text-gray-600 hover:bg-gray-50'}`}
                >
                  Impact
                </button>
                <button 
                  onClick={() => setActiveLink('help')}
                  className={`px-4 py-2 rounded-md text-sm font-medium ${activeLink === 'help' && !showAbout ? 'bg-emerald-50 text-emerald-700' : 'text-gray-600 hover:bg-gray-50'}`}
                >
                  Help & Support
                </button>
                <button 
                  onClick={() => setActiveLink('announcements')}
                  className={`px-4 py-2 rounded-md text-sm font-medium ${activeLink === 'announcements' && !showAbout ? 'bg-emerald-50 text-emerald-700' : 'text-gray-600 hover:bg-gray-50'}`}
                >
                  Announcements
                </button>
<button 
  onClick={() => setShowAbout(true)}
  className={`px-4 py-2 rounded-md text-sm font-medium ${
    showAbout ? 'bg-emerald-50 text-emerald-700' : 'text-gray-600 hover:bg-gray-50 hover:text-emerald-600'
  }`}
>
  About Us
</button>
              </div>
            </div> 

            {/* Mobile menu button */}
            <div className="md:hidden">
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="inline-flex items-center justify-center p-2 rounded-md text-gray-700 hover:text-emerald-600 hover:bg-gray-100 focus:outline-none"
              >
                <span className="sr-only">Open main menu</span>
                {isMobileMenuOpen ? 'Close' : 'Menu'}
              </button>
            </div>

            {/* User Actions */}
            {user ? (
              <div className="hidden md:flex items-center space-x-4">
                <Notification />
                
                <div className="relative profile-menu-container">
                  <button
                    onClick={() => setIsProfileOpen(!isProfileOpen)}
                    className="flex items-center space-x-2 focus:outline-none"
                  >
                    {user.photoURL ? (
                      <img 
                        src={user.photoURL} 
                        alt={user.displayName || 'User'} 
                        className="w-8 h-8 rounded-full"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 font-medium">
                        {user.displayName?.charAt(0) || user.email?.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <span className="text-sm font-medium text-gray-700">
                      {user.displayName || user.email?.split('@')[0]}
                    </span>
                    <svg 
                      className={`w-4 h-4 text-gray-500 transition-transform ${isProfileOpen ? 'transform rotate-180' : ''}`} 
                      fill="none" 
                      viewBox="0 0 24 24" 
                      stroke="currentColor"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>

                  {/* Dropdown Menu */}
                  {isProfileOpen && (
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50 border border-gray-100">
                      <a
                        href="#"
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                        onClick={(e) => {
                          e.preventDefault();
                          setActiveLink('donor-dashboard');
                          setIsProfileOpen(false);
                        }}
                      >
                        Dashboard
                      </a>
                      <a
                        href="#"
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                        onClick={(e) => {
                          e.preventDefault();
                          setActiveLink('profile');
                          setIsProfileOpen(false);
                        }}
                      >
                        Profile
                      </a>
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          handleSignOut();
                          setIsProfileOpen(false);
                        }}
                        className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                      >
                        Sign Out
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="hidden md:flex items-center space-x-4">
                <button 
                  onClick={handleSignIn}
                  className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-emerald-600"
                >
                  Log In
                </button>
                <button 
                  onClick={() => {
                    setIsSignUp(true);
                    setShowLanding(false);
                  }}
                  className="px-4 py-2 text-sm font-medium text-white bg-emerald-600 rounded-md hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500"
                >
                  Sign Up
                </button>
              </div>
            )}
            
            {/* Mobile Menu */}
            {isMobileMenuOpen && (
              <div className="md:hidden absolute top-16 left-0 right-0 bg-white border-t border-gray-200 shadow-lg py-2">
                <div className="px-4 pt-2 pb-3 space-y-1">
                  <button 
                    onClick={() => {
                      setActiveLink('home');
                      setIsMobileMenuOpen(false);
                    }}
                    className={`block w-full text-left px-3 py-2 rounded-md text-base font-medium ${activeLink === 'requests' ? 'bg-emerald-50 text-emerald-700' : 'text-gray-700 hover:bg-gray-50'}`}
                  >
                    View Requests
                  </button>
<button 
  onClick={() => setShowAbout(true)}
  className={`px-4 py-2 rounded-md text-sm font-medium ${
    showAbout ? 'bg-emerald-50 text-emerald-700' : 'text-gray-600 hover:bg-gray-50 hover:text-emerald-600'
  }`}
>
  About Us
</button>
                  
                  {!user && (
                    <div className="pt-4 border-t border-gray-200">
                      <button 
                        onClick={() => {
                          setIsSignUp(false);
                          setIsMobileMenuOpen(false);
                        }}
                        className="block w-full text-left px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:bg-gray-50"
                      >
                        Log In
                      </button>
                      <button 
                        onClick={() => {
                          setIsSignUp(true);
                          setIsMobileMenuOpen(false);
                        }}
                        className="mt-1 block w-full text-left px-3 py-2 rounded-md text-base font-medium text-emerald-700 bg-emerald-50 hover:bg-emerald-100"
                      >
                        Sign Up
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </nav>
      </header>
      <Body 
  activeLink={activeLink}
  setActiveLink={setActiveLink}
  user={user}
/>
      <Footer/>
    </div>
  );
}

export default App;
