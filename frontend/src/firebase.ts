// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import type { User as FirebaseUser } from 'firebase/auth';
import { getDatabase, ref, onValue, off, DataSnapshot, type Unsubscribe } from 'firebase/database';
import { 
  getAuth, 
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  onAuthStateChanged as firebaseOnAuthStateChanged,
  signOut as firebaseSignOut,
  updateProfile,
  GoogleAuthProvider,
  signInWithPopup,
  RecaptchaVerifier,
  signInWithPhoneNumber,
  PhoneAuthProvider,
  signInWithCredential
} from 'firebase/auth';

// User type
export type UserType = 'donor' | 'ngo';

export interface AppUser extends FirebaseUser {
  userType?: UserType;
  organizationName?: string;
}

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCrgTTsBD19cS8Nnvqr9b1HzEKKru_VV-s",
  authDomain: "multiresourcedonation.firebaseapp.com",
  projectId: "multiresourcedonation",
  storageBucket: "multiresourcedonation.firebasestorage.app",
  messagingSenderId: "526456814990",
  appId: "1:526456814990:web:0e23be6415661b56e738df",
  measurementId: "G-K7D4N5L3Y5"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const database = getDatabase(app);

// Sign up with email and password
export const signUpWithEmail = async (email: string, password: string, displayName: string, userType: UserType, organizationName?: string) => {
  try {
    // 1. Create user in Firebase Authentication
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const { user } = userCredential;
    
    // 2. Get Firebase ID token
    const idToken = await user.getIdToken();
    
    // 3. Prepare user data for MongoDB
    const userData = {
      name: displayName,
      email: user.email,
      userType,
      organizationName: userType === 'ngo' ? organizationName : undefined,
      phone: '',
      firebaseUid: user.uid
    };

    // 4. Save user data to your backend
    const response = await fetch(`${import.meta.env.VITE_API_URL}/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${idToken}`
      },
      body: JSON.stringify(userData),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to register user in backend');
    }

    // 5. Update user profile with display name
    await updateProfile(user, { displayName });
    
    // 6. Sign out the user after successful registration
    await firebaseSignOut(auth);
    
    return { user, userType, requiresLogin: true };
  } catch (error: any) {
    console.error("Error signing up:", error);
    throw error;
  }
};

// Sign in with email and password
export const signInWithEmail = async (email: string, password: string, skipProfileCreation: boolean = false) => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const { user } = userCredential;
    
    // Skip profile creation for admin users or if explicitly requested
    if (!skipProfileCreation) {
      try {
        // Check if user is admin first
        const adminCheck = await fetch(`${import.meta.env.VITE_API_URL}/auth/admin/check?email=${encodeURIComponent(email)}`);
        const adminData = await adminCheck.json();
        
        // If user is admin, don't create a User profile
        if (adminData.success && adminData.isAdmin) {
          console.log('Admin user detected, skipping User profile creation');
          return { user };
        }
        
        // Try to fetch user profile by firebaseUid first
        let response = await fetch(`${import.meta.env.VITE_API_URL}/auth/user/${user.uid}`);
        
        // If not found by firebaseUid, check by email (in case user was created before firebaseUid was set)
        if (!response.ok) {
          const emailResponse = await fetch(`${import.meta.env.VITE_API_URL}/auth/user-by-email/${encodeURIComponent(email)}`);
          if (emailResponse.ok) {
            // User exists by email but doesn't have firebaseUid - update it
            const emailData = await emailResponse.json();
            console.log('Found user by email, updating with firebaseUid:', emailData.data);
            
            const updateResponse = await fetch(`${import.meta.env.VITE_API_URL}/auth/update-firebase-uid`, {
              method: 'PUT',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                email: email,
                firebaseUid: user.uid
              }),
            });
            
            if (updateResponse.ok) {
              console.log('Successfully updated user with firebaseUid');
              return { user };
            }
          } else {
            // User doesn't exist at all - create a default donor profile
            const idToken = await user.getIdToken();
            await fetch(`${import.meta.env.VITE_API_URL}/auth/register`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${idToken}`
              },
              body: JSON.stringify({
                name: user.displayName || email.split('@')[0],
                email: user.email,
                userType: 'donor', // Default to donor
                phone: user.phoneNumber || '',
                firebaseUid: user.uid
              }),
            });
          }
        }
      } catch (profileError) {
        console.warn('Profile auto-creation failed (non-critical):', profileError);
      }
    }
    
    return { user };
  } catch (error: any) {
    console.error("Error signing in:", error);
    throw error;
  }
};

// Sign in with Google
export const signInWithGoogle = async () => {
  const provider = new GoogleAuthProvider();
  try {
    const result = await signInWithPopup(auth, provider);
    const user = result.user;
    const email = user.email;

    try {
      // Try to fetch user profile by firebaseUid first
      let response = await fetch(`${import.meta.env.VITE_API_URL}/auth/user/${user.uid}`);
      
      // If not found by firebaseUid, check by email (in case user was created before firebaseUid was set)
      if (!response.ok && email) {
        const emailResponse = await fetch(`${import.meta.env.VITE_API_URL}/auth/user-by-email/${encodeURIComponent(email)}`);
        if (emailResponse.ok) {
          // User exists by email but doesn't have firebaseUid - update it
          const emailData = await emailResponse.json();
          console.log('Found user by email, updating with firebaseUid:', emailData.data);
          
          const updateResponse = await fetch(`${import.meta.env.VITE_API_URL}/auth/update-firebase-uid`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              email: email,
              firebaseUid: user.uid
            }),
          });
          
          if (updateResponse.ok) {
            console.log('Successfully updated user with firebaseUid');
            return user;
          }
        } else {
          // User doesn't exist at all - create a default donor profile
          const idToken = await user.getIdToken();
          await fetch(`${import.meta.env.VITE_API_URL}/auth/register`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${idToken}`
            },
            body: JSON.stringify({
              name: user.displayName || (user.email ? user.email.split('@')[0] : 'User'),
              email: user.email,
              userType: 'donor',
              phone: user.phoneNumber || '',
              firebaseUid: user.uid
            }),
          });
        }
      }
    } catch (profileError) {
      console.warn('Profile auto-creation failed (non-critical):', profileError);
    }

    return user;
  } catch (error) {
    console.error('Error signing in with Google:', error);
    throw error;
  }
};

// Initialize reCAPTCHA verifier
let appVerifier: any = null;

export const setUpRecaptcha = (elementId: string) => {
  if (!appVerifier) {
    appVerifier = new RecaptchaVerifier(auth, elementId, {
      size: 'invisible',
    });
  }
  return appVerifier;
};

// Send verification code to phone number
export const sendVerificationCode = async (phoneNumber: string, recaptchaVerifier: any) => {
  try {
    const confirmationResult = await signInWithPhoneNumber(auth, phoneNumber, recaptchaVerifier);
    return confirmationResult;
  } catch (error) {
    console.error('Error sending verification code:', error);
    throw error;
  }
};

// Verify the code sent to the user's phone
export const verifyPhoneNumber = async (verificationId: string, code: string, displayName?: string) => {
  try {
    const credential = PhoneAuthProvider.credential(verificationId, code);
    const userCredential = await signInWithCredential(auth, credential);
    
    // Update user's display name if provided
    if (displayName && userCredential.user) {
      await updateProfile(userCredential.user, {
        displayName: displayName
      });
    }
    
    return userCredential.user;
  } catch (error) {
    console.error('Error verifying code:', error);
    throw error;
  }
};

// Sign out function
export const signOutUser = async () => {
  try {
    await firebaseSignOut(auth);
  } catch (error) {
    console.error("Error signing out:", error);
    throw error;
  }
};

// Auth state observer
export const onAuthStateChanged = (
  callback: (user: FirebaseUser | null) => void
) => {
  return firebaseOnAuthStateChanged(auth, callback);
};

// Subscribe to real-time updates for pending NGO requests
export const subscribeToPendingNgoRequests = (callback: (count: number) => void): Unsubscribe => {
  const pendingNgosRef = ref(database, 'counters/pendingNgos');
  const handleValue = (snapshot: DataSnapshot) => {
    const count = snapshot.val() || 0;
    callback(count);
  };
  onValue(pendingNgosRef, handleValue);
  return () => off(pendingNgosRef, 'value', handleValue);
};

export const subscribeToStuckDonations = (callback: (count: number) => void): Unsubscribe => {
  const stuckDonationsRef = ref(database, 'counters/stuckDonations');
  const handleValue = (snapshot: DataSnapshot) => {
    const count = snapshot.val() || 0;
    callback(count);
  };
  onValue(stuckDonationsRef, handleValue);
  return () => off(stuckDonationsRef, 'value', handleValue);
};

export const subscribeToPendingReports = (callback: (count: number) => void): Unsubscribe => {
  const pendingReportsRef = ref(database, 'counters/pendingReports');
  const handleValue = (snapshot: DataSnapshot) => {
    const count = snapshot.val() || 0;
    callback(count);
  };
  onValue(pendingReportsRef, handleValue);
  return () => off(pendingReportsRef, 'value', handleValue);
};

export { auth, database };
export type { FirebaseUser };
