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
  signInWithPopup
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
const googleProvider = new GoogleAuthProvider();

// Sign up with email and password
export const signUpWithEmail = async (email: string, password: string, displayName: string, userType: UserType, organizationName?: string) => {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const { user } = userCredential;
    
    // Update user profile with display name
    await updateProfile(user, { displayName });
    
    // Here you would typically store additional user data in Firestore
    // For example: userType and organizationName
    // await setDoc(doc(db, 'users', user.uid), {
    //   userType,
    //   organizationName: userType === 'ngo' ? organizationName : null,
    //   email: user.email,
    //   displayName,
    // });
    
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
  try {
    const provider = new GoogleAuthProvider();
    const result = await signInWithPopup(auth, provider);
    // You can add additional user data handling here if needed
    return result.user;
  } catch (error) {
    console.error('Error signing in with Google:', error);
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
