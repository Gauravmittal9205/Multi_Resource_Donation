import { useEffect } from 'react';
import type { User } from 'firebase/auth';
import DonorDashboard from './DonorDashboard';
import NgoDashboard from './NgoDashboard';
import NgoRegistration from './NgoRegistration';
import NgoProfilePage from './NgoProfilePage';
import ProfilePage from './ProfilePage';
import Home from '../pages/Home';
import Announcements from '../pages/Announcements';
import HelpAndSupport from '../pages/HelpAndSupport';
import Impact from '../pages/Impact';

type UserMeta = {
  userType?: 'donor' | 'ngo';
  organizationName?: string;
};

interface BodyProps {
  activeLink: string;
  user: User | null;
  setActiveLink: (link: string) => void;
  userMeta: UserMeta | null;
}

export default function Body({ activeLink, user, setActiveLink, userMeta }: BodyProps) {
  // Check user type
  const isNgo = userMeta?.userType === 'ngo';
  
  // Public pages that don't require authentication
  const publicPages = ['home', 'impact', 'help', 'announcements'];
  const isPublicPage = publicPages.includes(activeLink);
  
  // Redirect to home if trying to access unauthorized pages
  useEffect(() => {
    if (activeLink === 'profile' && !user) {
      setActiveLink('home');
    }
    // Redirect dashboard pages to home if not logged in
    if ((activeLink === 'donor-dashboard' || activeLink === 'ngo-dashboard') && !user) {
      setActiveLink('home');
    }
  }, [activeLink, user, setActiveLink]);

  // For public pages, render even without user
  if (isPublicPage) {
    return (
      <main className="pt-16">
        {activeLink === 'announcements' ? (
          <Announcements />
        ) : activeLink === 'help' ? (
          <HelpAndSupport />
        ) : activeLink === 'impact' ? (
          <Impact />
        ) : (
          <Home />
        )}
      </main>
    );
  }
  
  // If no matching route found, default to home
  if (!activeLink || activeLink === '') {
    return (
      <main className="pt-16">
        <Home />
      </main>
    );
  }

  // For protected pages, require authentication
  if (!user) {
    return (
      <main className="pt-16">
        <div className="flex items-center justify-center min-h-[calc(100vh-16rem)]">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Authentication Required</h2>
            <p className="text-gray-600 mb-4">Please log in to access this page</p>
            <button
              onClick={() => setActiveLink('home')}
              className="px-6 py-2 bg-emerald-600 text-white rounded-md hover:bg-emerald-700 transition-colors"
            >
              Go to Home
            </button>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="pt-16">
      {activeLink === 'home' ? (
        <Home />
      ) : activeLink === 'donor-dashboard' ? (
        <DonorDashboard
          user={user}
          onBack={() => setActiveLink('home')}
        />
      ) : activeLink === 'ngo-dashboard' ? (
        <NgoDashboard
          user={user}
          onBack={() => setActiveLink('home')}
        />
      ) : activeLink === 'registration' ? (
        isNgo ? (
          <NgoRegistration 
            onBack={() => setActiveLink('ngo-dashboard')}
            onSuccess={() => setActiveLink('ngo-dashboard')}
          />
        ) : (
          <div className="flex items-center justify-center min-h-[calc(100vh-16rem)]">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-800 mb-2">Access Denied</h2>
              <p className="text-gray-600 mb-4">This page is only accessible to NGO users.</p>
              <button
                onClick={() => setActiveLink('home')}
                className="px-6 py-2 bg-emerald-600 text-white rounded-md hover:bg-emerald-700 transition-colors"
              >
                Go to Home
              </button>
            </div>
          </div>
        )
      ) : activeLink === 'profile' ? (
        isNgo ? (
          <NgoProfilePage user={user} />
        ) : (
          <ProfilePage user={user} />
        )
      ) : activeLink === 'announcements' ? (
        <Announcements />
      ) : activeLink === 'help' ? (
        <HelpAndSupport />
      ) : activeLink === 'impact' ? (
        <Impact />
      ) : (
        <Home />
      )}
    </main>
  );
}

