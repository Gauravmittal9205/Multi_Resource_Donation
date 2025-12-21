import { Heart, Mail, Lock, LogIn, UserPlus, User, LogOut, Package, Users, MapPin, Shield, CheckCircle, Clock, TrendingUp, Camera, Frown, Loader2, ArrowLeft } from 'lucide-react';
import { useEffect, useState } from 'react';
import { signInWithGoogle, signOutUser, onAuthStateChanged, signInWithEmail, signUpWithEmail } from './firebase';
import type { User as FirebaseUser } from 'firebase/auth';

// Auth form type
type AuthMode = 'login' | 'signup';

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
  const [authMode, setAuthMode] = useState<AuthMode>('login');
  const [formData, setFormData] = useState<AuthFormData>({
    email: '',
    password: '',
    name: '',
    userType: 'donor',
    organizationName: ''
  });
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showLanding, setShowLanding] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged((currentUser: FirebaseUser | null) => {
      setUser(currentUser);
      setLoading(false);
    });
    return () => unsubscribe();
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
      if (authMode === 'login') {
        await signInWithEmail(formData.email, formData.password);
      } else {
        await signUpWithEmail(
          formData.email, 
          formData.password, 
          formData.name, 
          formData.userType,
          formData.userType === 'ngo' ? formData.organizationName : undefined
        );
      }
    } catch (error: any) {
      setError(error.message || 'An error occurred. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
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
    setAuthMode(prev => prev === 'login' ? 'signup' : 'login');
    setError(null);
  };

  // Handle sign in button click (for the header)
  const handleSignIn = () => {
    setAuthMode('login');
    setShowLanding(false);
  };

  // Handle back button click
  const handleGoBack = () => {
    if (authMode === 'signup') {
      // Go back to login from signup
      setAuthMode('login');
    } else if (!showLanding) {
      // If on login page, go back to landing
      setShowLanding(true);
    }
  };

  // Handle sign up click from landing page
  const handleSignUpClick = () => {
    setAuthMode('signup');
    setShowLanding(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-600"></div>
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
                className="flex items-center text-gray-500 hover:text-gray-700 mb-6 transition-colors group"
              >
                <ArrowLeft className="w-5 h-5 mr-1 group-hover:-translate-x-1 transition-transform" />
                <span className="text-sm font-medium">
                  {authMode === 'signup' ? 'Back to Login' : 'Back to Home'}
                </span>
              </button>
              <div className="text-center mb-8">
                <div className="flex justify-center mb-4">
                  <div className="p-3 bg-emerald-100 rounded-xl">
                    <Heart className="w-8 h-8 text-emerald-600" />
                  </div>
                </div>
                <h1 className="text-2xl font-bold text-gray-900">
                  {authMode === 'login' ? 'Welcome back!' : 'Create an account'}
                </h1>
                <p className="text-gray-500 mt-2">
                  {authMode === 'login' 
                    ? 'Sign in to continue to ShareCare' 
                    : 'Join us to make a difference'}
                </p>
              </div>

              {error && (
                <div className="mb-6 p-3 bg-red-50 text-red-600 rounded-lg text-sm flex items-start">
                  <Frown className="w-4 h-4 mt-0.5 mr-2 flex-shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <form onSubmit={handleAuthSubmit} className="space-y-4">
                {authMode === 'signup' && (
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                      Full Name
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <User className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        id="name"
                        name="name"
                        type="text"
                        required
                        value={formData.name}
                        onChange={handleInputChange}
                        className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                        placeholder="John Doe"
                      />
                    </div>
                  </div>
                )}

                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                    Email address
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Mail className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      id="email"
                      name="email"
                      type="email"
                      autoComplete="email"
                      required
                      value={formData.email}
                      onChange={handleInputChange}
                      className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                      placeholder="you@example.com"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                    Password
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Lock className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      id="password"
                      name="password"
                      type="password"
                      autoComplete={authMode === 'login' ? 'current-password' : 'new-password'}
                      required
                      minLength={6}
                      value={formData.password}
                      onChange={handleInputChange}
                      className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                      placeholder="••••••••"
                    />
                  </div>
                </div>

                {authMode === 'signup' && (
                  <>
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
                          <User className="w-4 h-4 mr-2" />
                          Donor
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
                          <Users className="w-4 h-4 mr-2" />
                          NGO
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
                          required={formData.userType === 'ngo'}
                          value={formData.organizationName}
                          onChange={handleInputChange}
                          className="block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                          placeholder="Organization Name"
                        />
                      </div>
                    )}
                  </>
                )}

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 disabled:opacity-70 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="animate-spin -ml-1 mr-2 h-4 w-4" />
                        {authMode === 'login' ? 'Signing in...' : 'Creating account...'}
                      </>
                    ) : (
                      <>
                        {authMode === 'login' ? (
                          <>
                            <LogIn className="w-4 h-4 mr-2" />
                            Sign in
                          </>
                        ) : (
                          <>
                            <UserPlus className="w-4 h-4 mr-2" />
                            Create account
                          </>
                        )}
                      </>
                    )}
                  </button>
                </div>
              </form>

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
                    {authMode === 'login' ? 'Sign in with Google' : 'Sign up with Google'}
                  </button>
                </div>
              </div>

              <div className="mt-6 text-center text-sm">
                <p className="text-gray-600">
                  {authMode === 'login' ? "Don't have an account?" : 'Already have an account?'}{' '}
                  <button
                    type="button"
                    onClick={toggleAuthMode}
                    className="font-medium text-emerald-600 hover:text-emerald-500 focus:outline-none"
                  >
                    {authMode === 'login' ? 'Sign up' : 'Sign in'}
                  </button>
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

  // Main app content when user is logged in
  return (
    <div className="min-h-screen bg-white">
      <header className="fixed top-0 w-full bg-white/95 backdrop-blur-sm border-b border-gray-100 z-50">
        <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Heart className="w-8 h-8 text-emerald-600" />
            <span className="text-xl font-bold text-gray-900">ShareCare</span>
          </div>
          {user ? (
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                {user.photoURL ? (
                  <img 
                    src={user.photoURL} 
                    alt={user.displayName || 'User'} 
                    className="w-8 h-8 rounded-full"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center">
                    <User className="w-5 h-5 text-emerald-700" />
                  </div>
                )}
                <span className="text-sm font-medium text-gray-700">
                  {user.displayName || user.email?.split('@')[0]}
                </span>
              </div>
              <button 
                onClick={handleSignOut}
                className="px-4 py-2 flex items-center space-x-2 text-sm text-gray-600 hover:text-gray-900 transition-colors"
              >
                <LogOut className="w-4 h-4" />
                <span>Sign Out</span>
              </button>
            </div>
          ) : (
            <button 
              onClick={handleSignIn}
              className="px-6 py-2 bg-emerald-600 text-white rounded-full hover:bg-emerald-700 transition-colors font-medium flex items-center space-x-2"
            >
              <img 
                src="https://www.google.com/favicon.ico" 
                alt="Google" 
                className="w-4 h-4" 
              />
              <span>Sign In with Google</span>
            </button>
          )}
        </nav>
      </header>

      <main className="pt-16">
        <section className="relative bg-gradient-to-br from-emerald-50 via-white to-orange-50 py-20 sm:py-28">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-4xl mx-auto">
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 leading-tight mb-6">
                Turn Surplus into <span className="text-emerald-600">Support</span>
              </h1>
              <p className="text-lg sm:text-xl text-gray-600 mb-10 leading-relaxed">
                Donate food, clothes, books, and essentials to nearby NGOs in real time.
                Connect directly with volunteers who can turn your donations into meaningful impact.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                <button className="w-full sm:w-auto px-8 py-4 bg-emerald-600 text-white rounded-full hover:bg-emerald-700 transition-all hover:scale-105 font-semibold text-lg shadow-lg">
                  Donate Now
                </button>
                <button className="w-full sm:w-auto px-8 py-4 bg-white text-emerald-600 border-2 border-emerald-600 rounded-full hover:bg-emerald-50 transition-all font-semibold text-lg">
                  Become a Volunteer
                </button>
              </div>
            </div>
          </div>
        </section>

        <section className="py-16 sm:py-24 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl mx-auto text-center">
              <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-6">
                The Problem We're Solving
              </h2>
              <p className="text-lg text-gray-600 leading-relaxed mb-8">
                Every day, thousands of tons of usable food, clothing, and books go to waste.
                Not because they're unwanted, but because there's <span className="font-semibold text-gray-900">no easy way to connect</span> those
                who have surplus with those in need.
              </p>
              <div className="grid sm:grid-cols-3 gap-6 mt-12">
                <div className="p-6 bg-orange-50 rounded-2xl">
                  <div className="text-4xl font-bold text-orange-600 mb-2">30%</div>
                  <p className="text-gray-700">Food wasted annually</p>
                </div>
                <div className="p-6 bg-orange-50 rounded-2xl">
                  <div className="text-4xl font-bold text-orange-600 mb-2">85M</div>
                  <p className="text-gray-700">Tons of textiles discarded</p>
                </div>
                <div className="p-6 bg-orange-50 rounded-2xl">
                  <div className="text-4xl font-bold text-orange-600 mb-2">2.2M</div>
                  <p className="text-gray-700">Children lack books</p>
                </div>
              </div>
              <p className="text-xl text-gray-900 font-semibold mt-12">
                We bridge this gap with technology, transparency, and trust.
              </p>
            </div>
          </div>
        </section>

        <section className="py-16 sm:py-24 bg-gradient-to-br from-emerald-50 to-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
                How It Works
              </h2>
              <p className="text-lg text-gray-600">Simple, fast, and transparent</p>
            </div>

            <div className="grid md:grid-cols-3 gap-8 lg:gap-12">
              <div className="text-center">
                <div className="w-20 h-20 bg-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
                  <Package className="w-10 h-10 text-white" />
                </div>
                <div className="inline-block px-4 py-1 bg-emerald-100 text-emerald-700 rounded-full text-sm font-semibold mb-4">
                  Step 1
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">Post Your Donation</h3>
                <p className="text-gray-600 leading-relaxed">
                  Select the category—food, clothes, books, or essentials. Add photos,
                  quantity, and your location. It takes less than 2 minutes.
                </p>
              </div>

              <div className="text-center">
                <div className="w-20 h-20 bg-orange-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
                  <MapPin className="w-10 h-10 text-white" />
                </div>
                <div className="inline-block px-4 py-1 bg-orange-100 text-orange-700 rounded-full text-sm font-semibold mb-4">
                  Step 2
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">Instant Notification</h3>
                <p className="text-gray-600 leading-relaxed">
                  Nearby verified volunteers and NGOs are notified immediately.
                  They can accept and coordinate pickup with you directly.
                </p>
              </div>

              <div className="text-center">
                <div className="w-20 h-20 bg-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
                  <Users className="w-10 h-10 text-white" />
                </div>
                <div className="inline-block px-4 py-1 bg-emerald-100 text-emerald-700 rounded-full text-sm font-semibold mb-4">
                  Step 3
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">Pickup & Distribution</h3>
                <p className="text-gray-600 leading-relaxed">
                  Volunteers collect your donation using OTP verification.
                  Items are distributed to those in need, and you get impact updates.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="py-16 sm:py-24 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
                Key Features
              </h2>
              <p className="text-lg text-gray-600">Built for trust, speed, and impact</p>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
              <div className="p-6 border border-gray-200 rounded-2xl hover:border-emerald-300 hover:shadow-lg transition-all">
                <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center mb-4">
                  <Package className="w-6 h-6 text-emerald-600" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">Category-Based Donations</h3>
                <p className="text-gray-600">
                  Organize by food, clothing, books, or essentials for efficient matching
                </p>
              </div>

              <div className="p-6 border border-gray-200 rounded-2xl hover:border-emerald-300 hover:shadow-lg transition-all">
                <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center mb-4">
                  <Clock className="w-6 h-6 text-orange-600" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">Real-Time Notifications</h3>
                <p className="text-gray-600">
                  Instant alerts to nearby volunteers when you post a donation
                </p>
              </div>

              <div className="p-6 border border-gray-200 rounded-2xl hover:border-emerald-300 hover:shadow-lg transition-all">
                <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center mb-4">
                  <MapPin className="w-6 h-6 text-emerald-600" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">Location-Based Pickup</h3>
                <p className="text-gray-600">
                  Smart matching with volunteers closest to your location
                </p>
              </div>

              <div className="p-6 border border-gray-200 rounded-2xl hover:border-emerald-300 hover:shadow-lg transition-all">
                <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center mb-4">
                  <Lock className="w-6 h-6 text-orange-600" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">OTP Verification</h3>
                <p className="text-gray-600">
                  Secure pickup confirmation system for donor peace of mind
                </p>
              </div>

              <div className="p-6 border border-gray-200 rounded-2xl hover:border-emerald-300 hover:shadow-lg transition-all">
                <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center mb-4">
                  <Camera className="w-6 h-6 text-emerald-600" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">Image Proof</h3>
                <p className="text-gray-600">
                  Photo documentation at every step for full transparency
                </p>
              </div>

              <div className="p-6 border border-gray-200 rounded-2xl hover:border-emerald-300 hover:shadow-lg transition-all">
                <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center mb-4">
                  <TrendingUp className="w-6 h-6 text-orange-600" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">Impact Tracking</h3>
                <p className="text-gray-600">
                  See the real-world difference your donations make over time
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="py-16 sm:py-24 bg-gradient-to-br from-emerald-600 to-emerald-700 text-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl sm:text-4xl font-bold mb-4">
                Our Growing Impact
              </h2>
              <p className="text-lg text-emerald-100">Every donation makes a real difference</p>
            </div>

            <div className="grid sm:grid-cols-3 gap-8 lg:gap-12">
              <div className="text-center">
                <div className="text-5xl sm:text-6xl font-bold mb-3">127,543</div>
                <p className="text-xl text-emerald-100 font-medium">Meals Saved</p>
                <p className="text-emerald-200 mt-2">Feeding families in need</p>
              </div>
              <div className="text-center">
                <div className="text-5xl sm:text-6xl font-bold mb-3">89,201</div>
                <p className="text-xl text-emerald-100 font-medium">Clothes Distributed</p>
                <p className="text-emerald-200 mt-2">Keeping people warm</p>
              </div>
              <div className="text-center">
                <div className="text-5xl sm:text-6xl font-bold mb-3">34,892</div>
                <p className="text-xl text-emerald-100 font-medium">Books Donated</p>
                <p className="text-emerald-200 mt-2">Empowering through education</p>
              </div>
            </div>

            <div className="mt-16 text-center">
              <p className="text-2xl font-semibold mb-2">Join thousands making a difference</p>
              <p className="text-emerald-100">Together, we're building a more compassionate community</p>
            </div>
          </div>
        </section>

        <section className="py-16 sm:py-24 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
                Trust & Safety First
              </h2>
              <p className="text-lg text-gray-600">Your donations are in safe hands</p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              <div className="text-center p-8 bg-gray-50 rounded-2xl">
                <div className="w-16 h-16 bg-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Shield className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">Verified NGOs</h3>
                <p className="text-gray-600 leading-relaxed">
                  Every organization and volunteer undergoes a thorough verification process
                  before joining our network.
                </p>
              </div>

              <div className="text-center p-8 bg-gray-50 rounded-2xl">
                <div className="w-16 h-16 bg-orange-500 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Camera className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">Photo Verification</h3>
                <p className="text-gray-600 leading-relaxed">
                  Image documentation and OTP verification at pickup ensures complete
                  transparency and accountability.
                </p>
              </div>

              <div className="text-center p-8 bg-gray-50 rounded-2xl">
                <div className="w-16 h-16 bg-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6">
                  <CheckCircle className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">Admin Monitoring</h3>
                <p className="text-gray-600 leading-relaxed">
                  Our team actively monitors all transactions and maintains quality
                  standards across the platform.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="py-20 sm:py-28 bg-gradient-to-br from-orange-50 via-white to-emerald-50">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-6">
              Ready to Make an Impact?
            </h2>
            <p className="text-lg sm:text-xl text-gray-600 mb-10 leading-relaxed">
              Join our community of donors and volunteers creating positive change.
              Your surplus can be someone else's support.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <button className="w-full sm:w-auto px-8 py-4 bg-emerald-600 text-white rounded-full hover:bg-emerald-700 transition-all hover:scale-105 font-semibold text-lg shadow-lg">
                Start Donating
              </button>
              <button className="w-full sm:w-auto px-8 py-4 bg-orange-500 text-white rounded-full hover:bg-orange-600 transition-all hover:scale-105 font-semibold text-lg shadow-lg">
                Join as Volunteer
              </button>
            </div>
          </div>
        </section>
      </main>

      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <Heart className="w-6 h-6 text-emerald-400" />
                <span className="text-lg font-bold">ShareCare</span>
              </div>
              <p className="text-gray-400 text-sm">
                Connecting donors with communities in need through technology and trust.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Platform</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">How It Works</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Donate</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Volunteer</a></li>
                <li><a href="#" className="hover:text-white transition-colors">NGO Partnership</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Resources</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">About Us</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Impact Stories</a></li>
                <li><a href="#" className="hover:text-white transition-colors">FAQ</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Contact</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Legal</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Terms of Service</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Community Guidelines</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 pt-8 text-center text-sm text-gray-400">
            <p>© 2024 ShareCare. All rights reserved. Built with purpose.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
