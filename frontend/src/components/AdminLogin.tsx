import { useState } from 'react';
import { signInWithEmail, onAuthStateChanged } from '../firebase';
import type { User as FirebaseUser } from 'firebase/auth';

interface AdminLoginProps {
  onBack: () => void;
  onLoginSuccess: () => void;
}

const AdminLogin = ({ onBack, onLoginSuccess }: AdminLoginProps) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [waitingForAuth, setWaitingForAuth] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      // Step 1: Verify admin credentials in MongoDB via backend API
      const response = await fetch(`${import.meta.env.VITE_API_URL}/auth/admin/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || data.message || 'Invalid admin credentials');
      }

      // Step 2: If MongoDB authentication succeeds, authenticate with Firebase
      try {
        // Skip profile creation for admin users
        const result = await signInWithEmail(email, password, true);
        console.log('Firebase authentication successful:', result);
        
        // Step 3: Wait for auth state to update
        setWaitingForAuth(true);
        
        // Set up a listener to wait for user state
        const unsubscribe = onAuthStateChanged((currentUser: FirebaseUser | null) => {
          if (currentUser && currentUser.email === email) {
            console.log('Admin user authenticated, calling onLoginSuccess');
            setWaitingForAuth(false);
            unsubscribe();
            onLoginSuccess();
          }
        });
        
        // Fallback: if auth state doesn't update in 5 seconds, proceed anyway
        setTimeout(() => {
          if (waitingForAuth) {
            console.log('Timeout waiting for auth state, proceeding anyway');
            setWaitingForAuth(false);
            unsubscribe();
            onLoginSuccess();
          }
        }, 5000);
      } catch (firebaseError: any) {
        console.error('Firebase authentication error:', firebaseError);
        setWaitingForAuth(false);
        
        // Check if error is because user doesn't exist
        if (firebaseError.code === 'auth/user-not-found' || firebaseError.code === 'auth/invalid-credential' || firebaseError.code === 'auth/wrong-password') {
          // Backend should have created the Firebase user, try again after a delay
          console.log('User not found in Firebase, waiting for backend to create user...');
          setTimeout(async () => {
            try {
              await signInWithEmail(email, password, true);
              setWaitingForAuth(true);
              const unsubscribe = onAuthStateChanged((currentUser: FirebaseUser | null) => {
                if (currentUser && currentUser.email === email) {
                  console.log('Admin user authenticated after retry');
                  setWaitingForAuth(false);
                  unsubscribe();
                  onLoginSuccess();
                }
              });
              setTimeout(() => {
                if (waitingForAuth) {
                  setWaitingForAuth(false);
                  unsubscribe();
                  onLoginSuccess();
                }
              }, 5000);
            } catch (retryError: any) {
              console.error('Firebase retry failed:', retryError);
              setWaitingForAuth(false);
              onLoginSuccess();
            }
          }, 2000);
        } else {
          // Other Firebase errors - still allow login since MongoDB verified
          console.warn('Firebase authentication warning, but MongoDB verified:', firebaseError);
          onLoginSuccess();
        }
      }
    } catch (err: any) {
      console.error('Admin login error:', err);
      setError(err.message || 'Login failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          <div className="p-8">
            {/* Back Button */}
            <button 
              onClick={onBack}
              className="text-sm font-medium text-blue-600 hover:text-blue-700 mb-6 transition-colors flex items-center"
            >
              ← Back to Home
            </button>

            {/* Header */}
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <h1 className="text-2xl font-bold text-gray-900">Admin Login</h1>
              <p className="text-gray-500 mt-2">Access admin dashboard</p>
            </div>

            {/* Error Message */}
            {error && (
              <div className="mb-6 p-3 bg-red-50 text-red-600 rounded-lg text-sm">
                <span>⚠️ {error}</span>
              </div>
            )}

            {/* Login Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                  Email Address
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="admin@sharecare.com"
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
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-4 py-2 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter admin password"
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

              <button
                type="submit"
                disabled={isLoading || waitingForAuth}
                className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading || waitingForAuth ? 'Signing In...' : 'Sign In'}
              </button>
            </form>

          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;
