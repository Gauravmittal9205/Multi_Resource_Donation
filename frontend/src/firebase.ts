// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import type { User as FirebaseUser } from 'firebase/auth';
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
    const response = await fetch('http://localhost:5000/api/v1/auth/register', {
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
    
    return { user, userType };
  } catch (error: any) {
    console.error("Error signing up:", error);
    throw error;
  }
};

// Sign in with email and password
export const signInWithEmail = async (email: string, password: string) => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    // Here you would typically fetch additional user data from Firestore
    // const userDoc = await getDoc(doc(db, 'users', userCredential.user.uid));
    // const userData = userDoc.data();
    
    return { 
      user: userCredential.user,
      // userType: userData?.userType
    };
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
    return result.user;
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

export { auth };
export type { FirebaseUser };
