import { useEffect, useState } from 'react';
import { signInWithGoogle, signOutUser, onAuthStateChanged, signInWithEmail } from './firebase';
import { getAuth, createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import type { User as FirebaseUser } from 'firebase/auth';
// Import donation service
import { fetchDonorProfileByUid } from './services/donationService';
import { getMyNgoProfile, type NgoProfile } from './services/ngoProfileService';

import AboutUs from './components/AboutUs';
import Footer from './components/Footer';
import Body from './components/Body';
import Notification from './components/Notification';
import AdminLogin from './components/AdminLogin';
import AdminDashboard from './components/AdminDashboard';
import { FormProvider } from './context/FormContext';
// Auth form type
type AuthMode = 'email' | 'phone';
type PhoneAuthStep = 'phone' | 'code';
type EmailAuthStep = 'details' | 'otp' | 'phone-otp';
// Form data interface
interface AuthFormData {
  email: string;
  password: string;
  name: string;
  userType: 'donor' | 'ngo';
  organizationName: string;
  phone: string;
}

type UserMeta = {
  userType?: 'donor' | 'ngo';
  organizationName?: string;
} | null;
function App() {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [userMeta, setUserMeta] = useState<UserMeta>(null);
  const [userMetaLoading, setUserMetaLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [authMode, setAuthMode] = useState<AuthMode>('email');
  const [formData, setFormData] = useState<AuthFormData>({
    email: '',
    password: '',
    name: '',
    userType: 'donor',
    organizationName: '',
    phone: ''
  });
  const [passwordErrors, setPasswordErrors] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [name, setName] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  // const [confirmationResult, setConfirmationResult] = useState<any>(null);
  const [phoneAuthStep, setPhoneAuthStep] = useState<PhoneAuthStep>('phone');
  const [phoneUserType, setPhoneUserType] = useState<'donor' | 'ngo'>('donor');
  const [phoneOrganizationName, setPhoneOrganizationName] = useState('');
  const [showLanding, setShowLanding] = useState(true);
  const [activeLink, setActiveLink] = useState('home');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [emailOtp, setEmailOtp] = useState('');
  const [phoneOtp, setPhoneOtp] = useState('');
  const [emailAuthStep, setEmailAuthStep] = useState<EmailAuthStep>('details');
  const [otpTimer, setOtpTimer] = useState(0);
  const [phoneOtpTimer, setPhoneOtpTimer] = useState(0);
  const [isResendingOtp, setIsResendingOtp] = useState(false);
  const [isResendingPhoneOtp, setIsResendingPhoneOtp] = useState(false);
  // Search functionality can be implemented here when needed
  // const [searchQuery, setSearchQuery] = useState('');
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [showAbout, setShowAbout] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [donorProfile, setDonorProfile] = useState<any>(null);
  const [ngoProfile, setNgoProfile] = useState<NgoProfile | null>(null);

  const isDonorUser = userMeta?.userType === 'donor';
  const isNgoUser = userMeta?.userType === 'ngo';

  // Debug logging for user type detection
  console.log('User type debugging:', {
    user: user?.email,
    userMeta,
    userMetaLoading,
    isDonorUser,
    isNgoUser,
    userType: userMeta?.userType,
    firebaseEmail: user?.email
  });

  // Enhanced user type detection with proper async/await and error handling
  useEffect(() => {
    if (!user) return;

    const detectUserType = async () => {
      console.log('Detecting user type for:', user.email);
      
      // First try to get user type from the database via our API
      try {
        const response = await fetch(`${import.meta.env.VITE_API_URL}/auth/user/${user.uid}`);
        if (response.ok) {
          const userData = await response.json();
          if (userData.data && userData.data.userType) {
            console.log('User type from database:', userData.data.userType);
            setUserMeta({
              userType: userData.data.userType,
              organizationName: userData.data.organizationName
            });
            return;
          }
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
      }

      // Then try to get from Firebase custom claims
      try {
        const idTokenResult = await user.getIdTokenResult(true); // Force token refresh
        const claims = idTokenResult.claims as any;
        
        if (claims.userType) {
          console.log('User type from claims:', claims.userType);
          setUserMeta({
            userType: claims.userType,
            organizationName: claims.organizationName || user.displayName || user.email?.split('@')[0]
          });
          return;
        }
      } catch (error) {
        console.error('Error getting user claims:', error);
      }

      // Fallback to email pattern matching if no claims found
      if (user.email) {
        const email = user.email.toLowerCase();
        const isNgoEmail = email.includes('ngo') || 
                         email.includes('organization') ||
                         email === 'gaurav.mittal_cs23@gla.ac.in';
        
        if (isNgoEmail) {
          console.log('Fallback: Detected NGO user from email pattern');
          setUserMeta({ 
            userType: 'ngo',
            organizationName: user.displayName || email.split('@')[0]
          });
          return;
        }
      }
      
      // Final fallback: default to donor
      console.log('Defaulting to donor user type');
      setUserMeta(prev => ({
        ...prev,
        userType: 'donor',
        organizationName: prev?.organizationName || user.displayName || user.email?.split('@')[0]
      }));
    };

    detectUserType().catch(error => {
      console.error('Error in detectUserType:', error);
      // Ensure we always have a userType, default to donor
      setUserMeta(prev => ({
        ...prev,
        userType: 'donor',
        organizationName: prev?.organizationName || user.displayName || user.email?.split('@')[0] || ''
      }));
    });
  }, [user]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged((currentUser: FirebaseUser | null) => {
      console.log('Auth state changed:', currentUser?.email || 'No user', 'UID:', currentUser?.uid || 'No UID');
      console.log('User object:', currentUser);
      setUser(currentUser);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (user) return;

    const action = localStorage.getItem('postAccountDeleteAction');
    if (action === 'login') {
      localStorage.removeItem('postAccountDeleteAction');
      setIsSignUp(false);
      setShowLanding(false);
      setAuthMode('email');
    }
  }, [user]);

  useEffect(() => {
    if (!user?.uid) {
      setUserMeta(null);
      setUserMetaLoading(false);
      setIsAdmin(false);
      return;
    }
    let cancelled = false;
    setUserMetaLoading(true);
    
    // Check if user is admin
    fetch(`${import.meta.env.VITE_API_URL}/auth/admin/check?email=${encodeURIComponent(user.email || '')}`)
      .then(async (res) => {
        if (res.ok) {
          const data = await res.json();
          if (data.success && data.isAdmin) {
            setIsAdmin(true);
          } else {
            setIsAdmin(false);
          }
        } else {
          setIsAdmin(false);
        }
      })
      .catch(() => {
        setIsAdmin(false);
      });
    
    // Fetch user meta from User model (not Profile model) to get userType
    fetch(`${import.meta.env.VITE_API_URL}/auth/user/${user.uid}`)
      .then(async (res) => {
        if (!res.ok) {
          const text = await res.text().catch(() => '');
          throw new Error(text || `Failed to load user data (${res.status})`);
        }
        return res.json();
      })
      .then((json) => {
        if (cancelled) return;
        const userData = json?.data ?? null;
        const normalizedUserType =
          typeof userData?.userType === 'string' ? (userData.userType.toLowerCase() as 'donor' | 'ngo') : undefined;
        console.log('User data from API:', userData);
        console.log('Normalized user type:', normalizedUserType);
        const userMetaData = userData && normalizedUserType
          ? {
              userType: normalizedUserType,
              organizationName: userData?.organizationName,
            }
          : null;
        console.log('Setting user meta:', userMetaData);
        setUserMeta(userMetaData);
      })
      .catch((error) => {
        if (cancelled) return;
        console.error('Error fetching user data:', error);
        setUserMeta(null);
      })
      .finally(() => {
        if (!cancelled) {
          setUserMetaLoading(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [user?.uid, user?.email]);

  // Load donor profile for profile picture
  useEffect(() => {
    const loadDonorProfile = async () => {
      if (!user?.uid || !isDonorUser) {
        setDonorProfile(null);
        return;
      }
      
      try {
        const res = await fetchDonorProfileByUid(user.uid);
        if (res.success && res.data) {
          setDonorProfile(res.data);
        } else {
          setDonorProfile(null);
        }
      } catch (error: any) {
        // Only log non-404 errors (404 is expected for new users)
        if (error.response?.status !== 404) {
          console.error('Failed to load donor profile:', error);
        }
        setDonorProfile(null);
      }
    };

    loadDonorProfile();
    
    // Listen for profile updates
    const handleProfileUpdate = () => {
      loadDonorProfile();
    };
    
    window.addEventListener('profileUpdated', handleProfileUpdate);
    return () => {
      window.removeEventListener('profileUpdated', handleProfileUpdate);
    };
  }, [user?.uid, isDonorUser]);

  // Load NGO profile for profile picture
  useEffect(() => {
    const loadNgoProfile = async () => {
      if (!user?.uid || !isNgoUser) {
        setNgoProfile(null);
        return;
      }
      
      try {
        const res = await getMyNgoProfile();
        if (res.success && res.data) {
          setNgoProfile(res.data);
        } else {
          setNgoProfile(null);
        }
      } catch (error: any) {
        console.error('Failed to load NGO profile:', error);
        setNgoProfile(null);
      }
    };

    loadNgoProfile();
    
    // Listen for profile updates
    const handleNgoProfileUpdate = () => {
      loadNgoProfile();
    };
    
    window.addEventListener('ngoProfileUpdated', handleNgoProfileUpdate);
    return () => {
      window.removeEventListener('ngoProfileUpdated', handleNgoProfileUpdate);
    };
  }, [user?.uid, isNgoUser]);

  // Handle initial page load and user type changes
  useEffect(() => {
    // Pages that should not be reset
    const protectedPages = ['donor-dashboard', 'ngo-dashboard', 'profile', 'admin-login', 'admin-dashboard'];
    const publicPages = ['home', 'impact', 'help', 'announcements'];
    const allProtectedPages = [...protectedPages, ...publicPages];
    
    // Don't reset activeLink if we're on any of these pages
    if (allProtectedPages.includes(activeLink)) return;
    
    // Only reset if activeLink is invalid or empty
    if (!activeLink || activeLink === '') {
      if (!user) {
        setActiveLink('home');
      }
      return;
    }
    
    // If user is not logged in and trying to access protected pages, redirect to home
    if (!user && protectedPages.includes(activeLink)) {
      setActiveLink('home');
      return;
    }
    
    // Don't redirect if user is admin (let them stay on admin-dashboard)
    if (isAdmin) return;
  }, [user, userMeta, activeLink, isAdmin]);
  
  // Handle browser back/forward navigation
  useEffect(() => {
    const handlePopState = () => {
      // Get the path from the URL
      const path = window.location.pathname.replace(/^\//, '') || 'home';
      
      // Allow navigation to home page even when logged in
      setActiveLink(path || 'home');
      
      // Optional: Uncomment if you want to prevent access to certain pages when logged in
      // if (user && ['login', 'signup', 'auth'].includes(path)) {
      //   window.history.replaceState({}, '', '/home');
      //   setActiveLink('home');
      // }
    };
    
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [user, userMeta?.userType]);

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

    // Clear password errors when password is being changed
    if (name === 'password') {
      setPasswordErrors([]);
    }
  };

  const validatePassword = (password: string) => {
    const errors = [];
    
    if (password.length < 8) {
      errors.push('Password must be at least 8 characters long');
    }
    
    if (!/[A-Z]/.test(password)) {
      errors.push('Password must contain at least one uppercase letter');
    }
    
    if (!/[0-9]/.test(password)) {
      errors.push('Password must contain at least one numeric digit');
    }
    
    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
      errors.push('Password must contain at least one special character');
    }
    
    return errors;
  };

  const handleSendOTP = async () => {
    setError(null);
    setIsSubmitting(true);
    
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/auth/send-otp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: formData.email }),
      });
      
      const data = await response.json();
      
      if (response.ok) {
        setEmailAuthStep('otp');
        setOtpTimer(600); // 10 minutes in seconds
        startOtpTimer();
      } else {
        setError(data.error || 'Failed to send OTP');
      }
    } catch (error: any) {
      setError(error.message || 'Failed to send OTP');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVerifyOTP = async () => {
    setError(null);
    setIsSubmitting(true);
    
    console.log('Frontend: Verifying OTP');
    console.log('Frontend: Email:', formData.email);
    console.log('Frontend: Raw OTP string:', JSON.stringify(emailOtp));
    console.log('Frontend: OTP length:', emailOtp.length);
    console.log('Frontend: OTP characters:', emailOtp.split(''));
    
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/auth/verify-otp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          email: formData.email, 
          otp: emailOtp 
        }),
      });
      
      const data = await response.json();
      console.log('Frontend: OTP verification response:', data, 'status:', response.status);
      
      if (response.ok) {
        // After email OTP verification, proceed to phone OTP
        if (formData.phone) {
          await handleSendPhoneOTP();
        } else {
          // If no phone number, proceed with registration
          await completeRegistration();
        }
      } else {
        setError(data.error || 'Invalid OTP');
      }
    } catch (error: any) {
      console.error('Frontend: OTP verification error:', error);
      setError(error.message || 'Failed to verify OTP');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSendPhoneOTP = async () => {
    setError(null);
    setIsSubmitting(true);
    
    try {
      const formattedPhone = formData.phone.startsWith('+') ? formData.phone : `+91${formData.phone}`;
      const response = await fetch(`${import.meta.env.VITE_API_URL}/auth/send-phone-otp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ phone: formattedPhone }),
      });
      
      const data = await response.json();
      
      if (response.ok) {
        setEmailAuthStep('phone-otp');
        setPhoneOtpTimer(600); // 10 minutes in seconds
        startPhoneOtpTimer();
      } else {
        setError(data.error || 'Failed to send phone OTP');
      }
    } catch (error: any) {
      setError(error.message || 'Failed to send phone OTP');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVerifyPhoneOTP = async () => {
    setError(null);
    setIsSubmitting(true);
    
    try {
      const formattedPhone = formData.phone.startsWith('+') ? formData.phone : `+91${formData.phone}`;
      const response = await fetch(`${import.meta.env.VITE_API_URL}/auth/verify-phone-otp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          phone: formattedPhone, 
          otp: phoneOtp 
        }),
      });
      
      const data = await response.json();
      
      if (response.ok) {
        // Proceed with registration after phone verification
        await completeRegistration();
      } else {
        setError(data.error || 'Invalid phone OTP');
      }
    } catch (error: any) {
      console.error('Frontend: Phone OTP verification error:', error);
      setError(error.message || 'Failed to verify phone OTP');
    } finally {
      setIsSubmitting(false);
    }
  };

  const startPhoneOtpTimer = () => {
    const timer = setInterval(() => {
      setPhoneOtpTimer((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleResendPhoneOTP = async () => {
    if (phoneOtpTimer > 0) return;
    
    setIsResendingPhoneOtp(true);
    await handleSendPhoneOTP();
    setIsResendingPhoneOtp(false);
  };

  const completeRegistration = async () => {
    try {
      // After successful OTP verification, just create Firebase user
      // MongoDB user already exists from the initial registration
      console.log('Creating Firebase user after OTP verification');
      console.log('Email:', formData.email);
      console.log('Password length:', formData.password.length);
      console.log('Name:', formData.name);
      console.log('UserType:', formData.userType);
      
      try {
        const auth = getAuth();
        console.log('Firebase auth instance:', !!auth);
        
        const userCredential = await createUserWithEmailAndPassword(auth, formData.email, formData.password);
        console.log('Firebase user created successfully:', userCredential.user.email, 'UID:', userCredential.user.uid);
        console.log('Firebase user object:', userCredential.user);
        
        // Update user profile with display name
        await updateProfile(userCredential.user, { displayName: formData.name });
        console.log('Firebase user profile updated with name:', formData.name);
        
        // Update MongoDB user with firebaseUid and ensure userType is set
        try {
          const updateResponse = await fetch(`${import.meta.env.VITE_API_URL}/auth/update-firebase-uid`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              email: formData.email,
              firebaseUid: userCredential.user.uid,
              userType: formData.userType // Ensure userType is included
            }),
          });
          
          const updateData = await updateResponse.json();
          
          if (updateResponse.ok) {
            console.log('MongoDB user updated with firebaseUid:', updateData.data);
            console.log('UserType preserved:', updateData.data.userType);
            
            // Immediately set userMeta with the correct userType
            setUserMeta({
              userType: formData.userType,
              organizationName: formData.userType === 'ngo' ? formData.organizationName : undefined
            });
          } else {
            console.error('Failed to update MongoDB user with firebaseUid:', updateData.error);
            
            // Fallback: Set userMeta based on form data if update fails
            setUserMeta({
              userType: formData.userType,
              organizationName: formData.userType === 'ngo' ? formData.organizationName : undefined
            });
          }
        } catch (updateError: any) {
          console.error('Error updating MongoDB user with firebaseUid:', updateError);
          // Don't fail registration if update fails, but log the error
        }
        
        setError('Registration successful! You are now logged in.');
        
        // Reset form and switch to login mode
        setIsSignUp(false);
        setFormData(prev => ({ ...prev, email: formData.email, password: '' }));
        setEmailAuthStep('details');
        setEmailOtp('');
        setPhoneOtp('');
        setOtpTimer(0);
        setPhoneOtpTimer(0);
      } catch (firebaseError: any) {
        console.error('Firebase registration error:', firebaseError);
        console.error('Error code:', firebaseError.code);
        console.error('Error message:', firebaseError.message);
        console.error('Full error object:', firebaseError);
        
        // Check for specific Firebase errors
        if (firebaseError.code === 'auth/email-already-in-use') {
          setError('Firebase account already exists. Please sign in with your credentials.');
        } else if (firebaseError.code === 'auth/weak-password') {
          setError('Password is too weak. Please choose a stronger password.');
        } else if (firebaseError.code === 'auth/invalid-email') {
          setError('Invalid email address.');
        } else {
          setError('Registration successful! Please sign in with your credentials.');
        }
        
        setIsSignUp(false);
        setFormData(prev => ({ ...prev, email: formData.email, password: '' }));
        setEmailAuthStep('details');
        setEmailOtp('');
        setPhoneOtp('');
        setOtpTimer(0);
        setPhoneOtpTimer(0);
      }
    } catch (error: any) {
      console.error('Registration completion error:', error);
      setError(error.message || 'Registration failed');
    }
  };

  const startOtpTimer = () => {
    const timer = setInterval(() => {
      setOtpTimer((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleResendOTP = async () => {
    if (otpTimer > 0) return;
    
    setIsResendingOtp(true);
    await handleSendOTP();
    setIsResendingOtp(false);
  };

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      if (isSignUp) {
        // Validate password for signup
        const passwordValidationErrors = validatePassword(formData.password);
        if (passwordValidationErrors.length > 0) {
          setPasswordErrors(passwordValidationErrors);
          setIsSubmitting(false);
          return;
        }

        // Register user in MongoDB first, then send OTP
        try {
          const response = await fetch(`${import.meta.env.VITE_API_URL}/auth/register`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              name: formData.name,
              email: formData.email,
              password: formData.password,
              userType: formData.userType,
              organizationName: formData.userType === 'ngo' ? formData.organizationName : undefined,
              phone: formData.phone ? (formData.phone.startsWith('+') ? formData.phone : `+91${formData.phone}`) : '',
              emailVerified: false // Will be verified after OTP
            }),
          });
          
          const data = await response.json();
          
          if (response.ok) {
            console.log('MongoDB registration successful, sending OTP');
            // MongoDB user created, now send OTP
            await handleSendOTP();
          } else {
            setError(data.error || 'Registration failed');
          }
        } catch (error: any) {
          console.error('MongoDB registration error:', error);
          setError(error.message || 'Registration failed');
        }
      } else {
        await signInWithEmail(formData.email, formData.password);
      }
    } catch (error: any) {
      console.error('Login error details:', error);
      console.error('Error code:', error.code);
      console.error('Error message:', error.message);
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
        if (!phoneNumber.trim() || phoneNumber.length !== 10) {
          setError('Please enter a valid 10-digit phone number');
          return;
        }
        setIsSubmitting(true);
        
        // Send OTP via Twilio
        const formattedPhoneNumber = phoneNumber.startsWith('+') ? phoneNumber : `+91${phoneNumber}`;
        const response = await fetch(`${import.meta.env.VITE_API_URL}/auth/send-phone-otp`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ phone: formattedPhoneNumber }),
        });
        
        const data = await response.json();
        
        if (response.ok) {
          setPhoneAuthStep('code');
          setPhoneOtpTimer(600); // 10 minutes
          startPhoneOtpTimer();
        } else {
          setError(data.error || 'Failed to send OTP. Please try again.');
        }
      } else {
        // Verify OTP
        if (!verificationCode.trim() || verificationCode.length !== 6) {
          setError('Please enter a valid 6-digit verification code');
          return;
        }
        setIsSubmitting(true);
        
        const formattedPhoneNumber = phoneNumber.startsWith('+') ? phoneNumber : `+91${phoneNumber}`;
        const verifyResponse = await fetch(`${import.meta.env.VITE_API_URL}/auth/verify-phone-otp`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ 
            phone: formattedPhoneNumber, 
            otp: verificationCode 
          }),
        });
        
        const verifyData = await verifyResponse.json();
        
        if (verifyResponse.ok) {
          // Phone verified, now register/login user
          // Check if user exists by phone number
          const checkUserResponse = await fetch(`${import.meta.env.VITE_API_URL}/auth/user-by-phone/${encodeURIComponent(formattedPhoneNumber)}`);
          
          if (checkUserResponse.ok) {
            // User exists - sign in
            // const userData = await checkUserResponse.json();
            setError('Phone verified! Please use email/password to sign in, or contact support.');
          } else {
            // New user - create account with phone number
            if (!phoneUserType) {
              setError('Please select your role (Donor or NGO)');
              return;
            }
            
            if (phoneUserType === 'ngo' && !phoneOrganizationName.trim()) {
              setError('Organization name is required for NGOs');
              return;
            }
            
            const registerResponse = await fetch(`${import.meta.env.VITE_API_URL}/auth/register-phone`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                name: name.trim(),
                phone: formattedPhoneNumber,
                userType: phoneUserType,
                organizationName: phoneUserType === 'ngo' ? phoneOrganizationName.trim() : undefined
              }),
            });
            
            const registerData = await registerResponse.json();
            
            if (registerResponse.ok) {
              // Registration successful - create Firebase user and sign in
              try {
                const auth = getAuth();
                const placeholderEmail = registerData.data.email || `phone_${formattedPhoneNumber.replace(/[^0-9]/g, '')}@phoneauth.local`;
                // Generate a random password for phone-only users
                const randomPassword = `Phone${Math.random().toString(36).slice(-12)}!@#`;
                
                // Create Firebase user
                const userCredential = await createUserWithEmailAndPassword(auth, placeholderEmail, randomPassword);
                const firebaseUser = userCredential.user;
                
                // Update Firebase profile with display name
                await updateProfile(firebaseUser, { displayName: name.trim() });
                
                // Update MongoDB user with firebaseUid and preserve userType
                const updateResponse = await fetch(`${import.meta.env.VITE_API_URL}/auth/update-firebase-uid`, {
                  method: 'PUT',
                  headers: {
                    'Content-Type': 'application/json',
                  },
                  body: JSON.stringify({
                    phone: formattedPhoneNumber,
                    firebaseUid: firebaseUser.uid,
                    userType: phoneUserType // Ensure userType is preserved
                  }),
                });
                
                if (updateResponse.ok) {
                  // Set userMeta for dashboard routing
                  setUserMeta({
                    userType: phoneUserType,
                    organizationName: phoneUserType === 'ngo' ? phoneOrganizationName.trim() : undefined
                  });
                  
                  // Redirect to appropriate dashboard
                  if (phoneUserType === 'donor') {
                    setActiveLink('donor-dashboard');
                  } else if (phoneUserType === 'ngo') {
                    setActiveLink('ngo-dashboard');
                  }
                  
                  // Reset form and close auth modal
                  setPhoneAuthStep('phone');
                  setVerificationCode('');
                  setPhoneOtpTimer(0);
                  setName('');
                  setPhoneNumber('');
                  setPhoneUserType('donor');
                  setPhoneOrganizationName('');
                  setShowLanding(true);
                  setAuthMode('email');
                  
                  // User will be automatically signed in via Firebase auth state change
                } else {
                  setError('Registration successful but failed to link Firebase account. Please contact support.');
                }
              } catch (firebaseError: any) {
                console.error('Firebase user creation error:', firebaseError);
                // User is registered in MongoDB, but Firebase creation failed
                setError('Account created! However, there was an issue with authentication. Please contact support or try signing in with email.');
              }
            } else {
              setError(registerData.error || 'Registration failed. Please try again.');
            }
          }
        } else {
          setError(verifyData.error || 'Invalid verification code');
        }
      }
    } catch (error: any) {
      setError(error.message || 'An error occurred. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResendPhoneAuthOTP = async () => {
    if (phoneOtpTimer > 0) return;
    
    setIsResendingPhoneOtp(true);
    setError(null);
    
    try {
      const formattedPhoneNumber = phoneNumber.startsWith('+') ? phoneNumber : `+91${phoneNumber}`;
      const response = await fetch(`${import.meta.env.VITE_API_URL}/auth/send-phone-otp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ phone: formattedPhoneNumber }),
      });
      
      const data = await response.json();
      
      if (response.ok) {
        setPhoneOtpTimer(600);
        startPhoneOtpTimer();
      } else {
        setError(data.error || 'Failed to resend OTP');
      }
    } catch (error: any) {
      setError(error.message || 'Failed to resend OTP');
    } finally {
      setIsResendingPhoneOtp(false);
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
    setEmailAuthStep('details');
    setEmailOtp('');
    setPhoneOtp('');
    setOtpTimer(0);
    setPhoneOtpTimer(0);
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

  // Render Admin Login page if activeLink is 'admin-login' (check before user auth)
  if (activeLink === 'admin-login') {
    return (
      <AdminLogin 
        onBack={() => {
          setActiveLink('home');
          setShowLanding(false);
        }}
        onLoginSuccess={() => {
          // After successful admin login, set activeLink to admin-dashboard
          // The user will be authenticated via Firebase, and we'll check if they're admin
          console.log('onLoginSuccess called, setting activeLink to admin-dashboard');
          setActiveLink('admin-dashboard');
          // Manually set isAdmin to true since we know login was successful
          setIsAdmin(true);
          console.log('isAdmin set to true, activeLink set to admin-dashboard');
        }}
      />
    );
  }

  // Render Admin Dashboard if user is admin and on admin-dashboard
  // Show dashboard if: (isAdmin OR activeLink is admin-dashboard) AND user exists
  // IMPORTANT: Check this BEFORE checking !user to prevent landing page redirect
  if (activeLink === 'admin-dashboard' || isAdmin) {
    console.log('activeLink is admin-dashboard or isAdmin is true, user:', user?.email, 'isAdmin:', isAdmin);
    if (user) {
      // If user is logged in, show dashboard
      console.log('Showing AdminDashboard');
      return (
        <AdminDashboard
          user={user}
          onBack={() => {
            setActiveLink('home');
            setIsAdmin(false);
          }}
        />
      );
    } else {
      // If user is not logged in yet, show loading (don't redirect to landing)
      console.log('Waiting for user to be set...');
      return (
        <div className="flex items-center justify-center min-h-screen bg-gray-50">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Authenticating... Please wait</p>
            <p className="text-sm text-gray-500 mt-2">If this takes too long, please refresh the page</p>
          </div>
        </div>
      );
    }
  }

  // Render auth form if user is not logged in (but NOT if we're waiting for admin auth)
  if (!user && activeLink !== 'admin-dashboard') {
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
                {!isSignUp && (
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
                )}
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
                            pattern="[6-9][0-9]{9}"
                          />
                        </div>
                        <p className="mt-1 text-xs text-gray-500">We'll send a verification code via SMS to this number</p>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          I am a...
                        </label>
                        <div className="grid grid-cols-2 gap-3">
                          <button
                            type="button"
                            onClick={() => setPhoneUserType('donor')}
                            className={`flex items-center justify-center px-4 py-2 border rounded-lg ${
                              phoneUserType === 'donor'
                                ? 'bg-blue-50 border-blue-500 text-blue-700'
                                : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
                            }`}
                          >
                            <span>Donor</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => setPhoneUserType('ngo')}
                            className={`flex items-center justify-center px-4 py-2 border rounded-lg ${
                              phoneUserType === 'ngo'
                                ? 'bg-blue-50 border-blue-500 text-blue-700'
                                : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
                            }`}
                          >
                            <span>NGO</span>
                          </button>
                        </div>
                      </div>

                      {phoneUserType === 'ngo' && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Organization Name <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="text"
                            value={phoneOrganizationName}
                            onChange={(e) => setPhoneOrganizationName(e.target.value)}
                            placeholder="Enter organization name"
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            required={phoneUserType === 'ngo'}
                          />
                        </div>
                      )}

                      <button
                        type="submit"
                        disabled={isSubmitting || phoneNumber.length < 10 || !name.trim() || (phoneUserType === 'ngo' && !phoneOrganizationName.trim())}
                        className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isSubmitting ? 'Sending OTP...' : 'Send Verification Code'}
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="text-center mb-4">
                        <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                          <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                          </svg>
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900">Verify Your Phone Number</h3>
                        <p className="text-gray-600 mt-2">
                          We've sent a 6-digit verification code to <strong>+91{phoneNumber}</strong>
                        </p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Verification Code</label>
                        <div className="flex justify-center space-x-2 mb-4">
                          {[0, 1, 2, 3, 4, 5].map((index) => (
                            <input
                              key={index}
                              type="text"
                              maxLength={1}
                              value={verificationCode[index] || ''}
                              onChange={(e) => {
                                const value = e.target.value.replace(/\D/g, '');
                                const newCode = verificationCode.split('');
                                newCode[index] = value;
                                const finalCode = newCode.join('');
                                setVerificationCode(finalCode);
                                
                                // Auto-focus next input
                                if (value && index < 5) {
                                  const parent = e.target.parentElement;
                                  if (parent) {
                                    const nextInput = parent.querySelectorAll('input')[index + 1];
                                    if (nextInput) (nextInput as HTMLInputElement).focus();
                                  }
                                }
                              }}
                              onKeyDown={(e) => {
                                // Handle backspace
                                if (e.key === 'Backspace' && !verificationCode[index] && index > 0) {
                                  const target = e.target as HTMLInputElement;
                                  const parent = target.parentElement;
                                  if (parent) {
                                    const prevInput = parent.querySelectorAll('input')[index - 1];
                                    if (prevInput) (prevInput as HTMLInputElement).focus();
                                  }
                                }
                              }}
                              className="w-12 h-12 text-center border border-gray-300 rounded-lg text-lg font-semibold focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            />
                          ))}
                        </div>
                        <p className="text-center text-sm text-gray-500">
                          Enter the 6-digit code from your SMS
                        </p>
                      </div>
                      <div className="flex items-center justify-center space-x-4 text-sm">
                        {phoneOtpTimer > 0 ? (
                          <span className="text-gray-500">
                            Resend code in <span className="font-medium">{formatTime(phoneOtpTimer)}</span>
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={handleResendPhoneAuthOTP}
                            disabled={isResendingPhoneOtp}
                            className="text-blue-600 hover:text-blue-700 font-medium disabled:opacity-50"
                          >
                            {isResendingPhoneOtp ? 'Resending...' : 'Resend Code'}
                          </button>
                        )}
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
                        onClick={() => {
                          setPhoneAuthStep('phone');
                          setVerificationCode('');
                          setPhoneOtpTimer(0);
                          // Don't reset name, phone, userType, or organizationName - allow user to change phone only
                        }}
                        className="w-full text-blue-600 hover:text-blue-800 text-sm font-medium"
                      >
                        Change Phone Number
                      </button>
                    </div>
                  )}
                </form>
              ) : (
                <form onSubmit={handleAuthSubmit} className="space-y-4">
                  {isSignUp && emailAuthStep === 'details' ? (
                    <>
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
                        <div className="relative">
                          <input
                            id="password"
                            name="password"
                            type={showPassword ? "text" : "password"}
                            autoComplete={isSignUp ? 'new-password' : 'current-password'}
                            value={formData.password}
                            onChange={handleInputChange}
                            className={`w-full px-4 py-2 pr-12 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 ${
                              passwordErrors.length > 0 ? 'border-red-500' : 'border-gray-300'
                            }`}
                            placeholder="••••••••"
                            required
                            minLength={8}
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 focus:outline-none"
                          >
                            {showPassword ? (
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                              </svg>
                            ) : (
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                              </svg>
                            )}
                          </button>
                        </div>
                        <div className="mt-2">
                          <p className="text-xs text-gray-500">
                            Password must contain: 8+ characters, 1 uppercase, 1 number, 1 special character
                          </p>
                          {passwordErrors.length > 0 && (
                            <div className="mt-1">
                              {passwordErrors.map((error, index) => (
                                <p key={index} className="text-xs text-red-600">{error}</p>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>

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

                      {formData.userType === 'ngo' && (
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

                      <div>
                        <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                          Phone Number <span className="text-red-500">*</span>
                        </label>
                        <div className="flex">
                          <span className="inline-flex items-center px-3 rounded-l-lg border border-r-0 border-gray-300 bg-gray-50 text-gray-500 text-sm">
                            +91
                          </span>
                          <input
                            id="phone"
                            name="phone"
                            type="tel"
                            value={formData.phone}
                            onChange={(e) => {
                              const value = e.target.value.replace(/\D/g, ''); // Remove non-numeric characters
                              setFormData(prev => ({ ...prev, phone: value }));
                            }}
                            className="flex-1 min-w-0 block w-full px-4 py-2 rounded-none rounded-r-lg border border-gray-300 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                            placeholder="Enter 10-digit phone number"
                            required
                            maxLength={10}
                            pattern="[6-9][0-9]{9}"
                          />
                        </div>
                        <p className="mt-1 text-xs text-gray-500">We'll send a verification code to this number</p>
                      </div>

                      <div className="pt-2">
                        <button
                          type="submit"
                          disabled={isSubmitting}
                          className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {isSubmitting ? 'Sending OTP...' : 'Create Account'}
                        </button>
                      </div>
                    </>
                  ) : isSignUp && emailAuthStep === 'otp' ? (
                    <div className="space-y-4">
                      <div className="text-center mb-6">
                        <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                          <svg className="w-8 h-8 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                          </svg>
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900">Verify Your Email</h3>
                        <p className="text-gray-600 mt-2">
                          We've sent a 6-digit verification code to <strong>{formData.email}</strong>
                        </p>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Verification Code
                        </label>
                        <div className="flex justify-center space-x-2 mb-4">
                          {[0, 1, 2, 3, 4, 5].map((index) => (
                            <input
                              key={index}
                              type="text"
                              maxLength={1}
                              value={emailOtp[index] || ''}
                              onChange={(e) => {
                                const value = e.target.value.replace(/\D/g, '');
                                const newOtp = emailOtp.split('');
                                newOtp[index] = value;
                                const finalOtp = newOtp.join('');
                                setEmailOtp(finalOtp);
                                
                                console.log(`Frontend: OTP input[${index}] = "${value}", current OTP: "${finalOtp}"`);
                                
                                // Auto-focus next input
                                if (value && index < 5) {
                                  const parent = e.target.parentElement;
                                  if (parent) {
                                    const nextInput = parent.querySelectorAll('input')[index + 1];
                                    if (nextInput) (nextInput as HTMLInputElement).focus();
                                  }
                                }
                              }}
                              onKeyDown={(e) => {
                                // Handle backspace
                                if (e.key === 'Backspace' && !emailOtp[index] && index > 0) {
                                  const target = e.target as HTMLInputElement;
                                  const parent = target.parentElement;
                                  if (parent) {
                                    const prevInput = parent.querySelectorAll('input')[index - 1];
                                    if (prevInput) (prevInput as HTMLInputElement).focus();
                                  }
                                }
                              }}
                              className="w-12 h-12 text-center border border-gray-300 rounded-lg text-lg font-semibold focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                            />
                          ))}
                        </div>
                        <p className="text-center text-sm text-gray-500">
                          Enter the 6-digit code from your email
                        </p>
                      </div>

                      <div className="flex items-center justify-center space-x-4 text-sm">
                        {otpTimer > 0 ? (
                          <span className="text-gray-500">
                            Resend code in <span className="font-medium">{formatTime(otpTimer)}</span>
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={handleResendOTP}
                            disabled={isResendingOtp}
                            className="text-emerald-600 hover:text-emerald-700 font-medium disabled:opacity-50"
                          >
                            {isResendingOtp ? 'Resending...' : 'Resend Code'}
                          </button>
                        )}
                      </div>

                      <div className="pt-4 space-y-3">
                        <button
                          type="button"
                          onClick={handleVerifyOTP}
                          disabled={isSubmitting || emailOtp.length !== 6}
                          className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {isSubmitting ? 'Verifying...' : formData.phone ? 'Verify & Continue' : 'Verify & Create Account'}
                        </button>
                        
                        <button
                          type="button"
                          onClick={() => {
                            setEmailAuthStep('details');
                            setEmailOtp('');
                            setOtpTimer(0);
                          }}
                          className="w-full text-gray-600 hover:text-gray-800 text-sm font-medium"
                        >
                          Back to Details
                        </button>
                      </div>
                    </div>
                  ) : isSignUp && emailAuthStep === 'phone-otp' ? (
                    <div className="space-y-4">
                      <div className="text-center mb-6">
                        <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                          <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                          </svg>
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900">Verify Your Phone Number</h3>
                        <p className="text-gray-600 mt-2">
                          We've sent a 6-digit verification code to <strong>+91{formData.phone}</strong>
                        </p>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Verification Code
                        </label>
                        <div className="flex justify-center space-x-2 mb-4">
                          {[0, 1, 2, 3, 4, 5].map((index) => (
                            <input
                              key={index}
                              type="text"
                              maxLength={1}
                              value={phoneOtp[index] || ''}
                              onChange={(e) => {
                                const value = e.target.value.replace(/\D/g, '');
                                const newOtp = phoneOtp.split('');
                                newOtp[index] = value;
                                const finalOtp = newOtp.join('');
                                setPhoneOtp(finalOtp);
                                
                                // Auto-focus next input
                                if (value && index < 5) {
                                  const parent = e.target.parentElement;
                                  if (parent) {
                                    const nextInput = parent.querySelectorAll('input')[index + 1];
                                    if (nextInput) (nextInput as HTMLInputElement).focus();
                                  }
                                }
                              }}
                              onKeyDown={(e) => {
                                // Handle backspace
                                if (e.key === 'Backspace' && !phoneOtp[index] && index > 0) {
                                  const target = e.target as HTMLInputElement;
                                  const parent = target.parentElement;
                                  if (parent) {
                                    const prevInput = parent.querySelectorAll('input')[index - 1];
                                    if (prevInput) (prevInput as HTMLInputElement).focus();
                                  }
                                }
                              }}
                              className="w-12 h-12 text-center border border-gray-300 rounded-lg text-lg font-semibold focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            />
                          ))}
                        </div>
                        <p className="text-center text-sm text-gray-500">
                          Enter the 6-digit code from your phone
                        </p>
                      </div>

                      <div className="flex items-center justify-center space-x-4 text-sm">
                        {phoneOtpTimer > 0 ? (
                          <span className="text-gray-500">
                            Resend code in <span className="font-medium">{formatTime(phoneOtpTimer)}</span>
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={handleResendPhoneOTP}
                            disabled={isResendingPhoneOtp}
                            className="text-blue-600 hover:text-blue-700 font-medium disabled:opacity-50"
                          >
                            {isResendingPhoneOtp ? 'Resending...' : 'Resend Code'}
                          </button>
                        )}
                      </div>

                      <div className="pt-4 space-y-3">
                        <button
                          type="button"
                          onClick={handleVerifyPhoneOTP}
                          disabled={isSubmitting || phoneOtp.length !== 6}
                          className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {isSubmitting ? 'Verifying...' : 'Verify & Complete Registration'}
                        </button>
                        
                        <button
                          type="button"
                          onClick={() => {
                            setEmailAuthStep('otp');
                            setPhoneOtp('');
                            setPhoneOtpTimer(0);
                          }}
                          className="w-full text-gray-600 hover:text-gray-800 text-sm font-medium"
                        >
                          Back to Email Verification
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
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
                        <div className="relative">
                          <input
                            id="password"
                            name="password"
                            type={showPassword ? "text" : "password"}
                            autoComplete="current-password"
                            value={formData.password}
                            onChange={handleInputChange}
                            className="w-full px-4 py-2 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                            placeholder="••••••••"
                            required
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 focus:outline-none"
                          >
                            {showPassword ? (
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                              </svg>
                            ) : (
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                              </svg>
                            )}
                          </button>
                        </div>
                      </div>

                      <div className="pt-2">
                        <button
                          type="submit"
                          disabled={isSubmitting}
                          className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {isSubmitting ? 'Signing In...' : 'Sign In'}
                        </button>
                      </div>
                    </>
                  )}
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

              {!isSignUp && (
                <div className="mt-4 text-center">
                  <button
                    type="button"
                    onClick={() => setActiveLink('admin-login')}
                    className="text-sm font-medium text-blue-600 hover:text-blue-700 focus:outline-none"
                  >
                    Login as Admin
                  </button>
                </div>
              )}

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
              {/* Left section - Logo */}
              <div className="flex items-center space-x-2">
                <span className="text-2xl font-bold text-emerald-600">ShareCare</span>
              </div>
              
              {/* Center section - Desktop Navigation */}
              <div className="hidden md:flex items-center justify-center flex-1">
                <div className="flex items-center space-x-1">
                  <button 
                    onClick={() => {
                      setShowAbout(false);
                      setActiveLink('home');
                      window.history.pushState({}, '', '/');
                    }}
                    className={`px-4 py-2 rounded-md text-sm font-medium ${activeLink === 'home' && !showAbout ? 'bg-emerald-50 text-emerald-700' : 'text-gray-600 hover:bg-gray-50'}`}
                  >
                    Home
                  </button>
                  <button 
                    onClick={() => {
                      setShowAbout(false);
                      setActiveLink('impact');
                      window.history.pushState({}, '', '/impact');
                    }}
                    className={`px-4 py-2 rounded-md text-sm font-medium ${activeLink === 'impact' ? 'bg-emerald-50 text-emerald-700' : 'text-gray-600 hover:bg-gray-50'}`}
                  >
                    Impact
                  </button>
                  <button 
                    onClick={() => {
                      setShowAbout(false);
                      setActiveLink('help');
                    }}
                    className={`px-4 py-2 rounded-md text-sm font-medium ${activeLink === 'help' && !showAbout ? 'bg-emerald-50 text-emerald-700' : 'text-gray-600 hover:bg-gray-50'}`}
                  >
                    Help & Support
                  </button>
                  <button 
                    onClick={() => {
                      setShowAbout(false);
                      setActiveLink('announcements');
                    }}
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

              {/* Right section - User Actions & Admin Button */}
              <div className="flex items-center space-x-4">
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
                            setShowAbout(false);
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
            </div>
          </nav>
        </header>
        <AboutUs onBack={() => setShowAbout(false)} authUser={user} userMeta={userMeta} />
      </div>
    );
  }

  // Main app content when user is logged in
  return (
    <FormProvider>
      <div className="min-h-screen bg-white">
        <header className="fixed top-0 w-full bg-white/95 backdrop-blur-sm border-b border-gray-100 z-50">
          <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center justify-between">
              {/* Left section - Logo */}
              <div className="flex items-center space-x-2">
                <span className="text-2xl font-bold text-emerald-600">ShareCare</span>
              </div>
            
            {/* Center section - Desktop Navigation */}
            <div className="hidden md:flex items-center justify-center flex-1">
              <div className="flex items-center space-x-1">
                <button 
                  onClick={() => {
                    setActiveLink('home');
                    window.history.pushState({}, '', '/');
                  }}
                  className={`px-4 py-2 rounded-md text-sm font-medium ${activeLink === 'home' && !showAbout ? 'bg-emerald-50 text-emerald-700' : 'text-gray-600 hover:bg-gray-50'}`}
                >
                  Home
                </button>
                <button 
                  onClick={() => {
                    setActiveLink('impact');
                    window.history.pushState({}, '', '/impact');
                  }}
                  className={`px-4 py-2 rounded-md text-sm font-medium ${activeLink === 'impact' ? 'bg-emerald-50 text-emerald-700' : 'text-gray-600 hover:bg-gray-50'}`}
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

            {/* Right section - User Actions & Admin Button */}
            <div className="flex items-center space-x-4">
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
                    {(() => {
                      // Priority: profile photo from MongoDB > Firebase photoURL > initial
                      // For NGO users: NGO logo > NGO name initial > Firebase photoURL > email initial
                      // For donor users: donor photo > Firebase photoURL > email initial
                      const photoUrl = isNgoUser 
                        ? ngoProfile?.basic?.logoUrl || user.photoURL
                        : donorProfile?.basic?.photoUrl || user.photoURL;
                      const displayName = isNgoUser
                        ? ngoProfile?.basic?.contactPersonName || user.displayName || user.email?.split('@')[0] || 'User'
                        : donorProfile?.basic?.name || user.displayName || user.email?.split('@')[0] || 'User';
                      const initial = displayName?.charAt(0)?.toUpperCase() || user.email?.charAt(0).toUpperCase();
                      
                      if (photoUrl) {
                        return (
                          <div className="relative w-8 h-8">
                            <img 
                              src={photoUrl} 
                              alt={displayName} 
                              className="w-8 h-8 rounded-full object-cover border border-emerald-100"
                              referrerPolicy="no-referrer"
                              onError={(e) => {
                                // Hide image and show fallback
                                const target = e.target as HTMLImageElement;
                                target.style.display = 'none';
                                const parent = target.parentElement;
                                const fallback = parent?.querySelector('.nav-avatar-fallback') as HTMLElement;
                                if (fallback) fallback.style.display = 'flex';
                              }}
                            />
                            <div 
                              className="nav-avatar-fallback w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 font-medium hidden"
                            >
                              {initial}
                            </div>
                          </div>
                        );
                      }
                      return (
                        <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 font-medium">
                          {initial}
                        </div>
                      );
                    })()}
                    <span className="text-sm font-medium text-gray-700">
                      {isNgoUser
                        ? ngoProfile?.basic?.contactPersonName || user.displayName || user.email?.split('@')[0]
                        : donorProfile?.basic?.name || user.displayName || user.email?.split('@')[0]}
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
                          
                          // Prevent navigation if userMeta is still loading
                          if (userMetaLoading) {
                            console.log('User meta still loading, please wait...');
                            return;
                          }
                          
                          console.log('Dashboard clicked - User type:', userMeta?.userType);
                          console.log('isDonorUser:', isDonorUser, 'isNgoUser:', isNgoUser);
                          console.log('userMeta:', userMeta);
                          
                          // Check user type and navigate to appropriate dashboard
                          let targetLink = 'home';
                          if (isNgoUser) {
                            targetLink = 'ngo-dashboard';
                          } else if (isDonorUser) {
                            targetLink = 'donor-dashboard';
                          } else if (user && !userMeta && !userMetaLoading) {
                            // If user exists but userMeta is not loaded and loading is complete, default to donor-dashboard
                            console.log('User exists but userMeta not loaded and loading complete, defaulting to donor-dashboard');
                            targetLink = 'donor-dashboard';
                          } else if (user && !userMeta && userMetaLoading) {
                            // Still loading userMeta, don't navigate yet
                            console.log('User exists but userMeta still loading, staying on home');
                            targetLink = 'home';
                          }
                          
                          console.log('Navigating to:', targetLink);
                          setActiveLink(targetLink);
                          setIsProfileOpen(false);
                        }}
                      >
                        Dashboard {userMetaLoading && (
                          <span className="ml-1 text-xs text-gray-500">(loading...)</span>
                        )}
                      </a>
                      <a
                        href="#"
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                        onClick={(e) => {
                          e.preventDefault();
                          setShowAbout(false);
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
            </div>
            
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
      {!(isAdmin && activeLink === 'admin-dashboard') && (
        <div className="min-h-[calc(100vh-64px)]">
          <Body 
            activeLink={activeLink}
            setActiveLink={setActiveLink}
            user={user}
            userMeta={userMeta}
          />
        </div>
      )}
      {!(activeLink === 'donor-dashboard' || activeLink === 'ngo-dashboard' || (isAdmin && activeLink === 'admin-dashboard')) && <Footer/>}
      </div>
    </FormProvider>
  );
}

export default App;
