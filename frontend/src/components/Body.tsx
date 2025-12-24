import { useEffect } from 'react';
import type { User } from 'firebase/auth';
import DonorDashboard from './DonorDashboard';
import NgoDashboard from './NgoDashboard';
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
  const isDonor = userMeta?.userType === 'donor';
  const isNgo = userMeta?.userType === 'ngo';
  
  // Redirect to home if trying to access unauthorized pages
  useEffect(() => {
    if (activeLink === 'profile' && !user) {
      setActiveLink('home');
    }
  }, [activeLink, user, setActiveLink]);

  // Don't render anything if user is not authenticated
  if (!user) {
    return <div>Please log in to continue</div>;
  }

  return (
    <main className="pt-16">
      {activeLink === 'donor-dashboard' ? (
        <DonorDashboard
          user={user}
          onBack={() => setActiveLink('home')}
        />
      ) : activeLink === 'ngo-dashboard' ? (
        <NgoDashboard
          user={user}
          onBack={() => setActiveLink('home')}
        />
      ) : activeLink === 'profile' ? (
        isNgo ? (
          <NgoDashboard user={user} onBack={() => setActiveLink('home')} />
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

