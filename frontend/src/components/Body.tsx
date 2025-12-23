import React from 'react';
import type { User } from 'firebase/auth';
import DonorDashboard from './DonorDashboard';
import ProfilePage from './ProfilePage';
import Home from '../pages/Home';
import Announcements from '../pages/Announcements';
import HelpAndSupport from '../pages/HelpAndSupport';
import Impact from '../pages/Impact';

interface BodyProps {
  activeLink: string;
  user: User | null;
  setActiveLink: (link: string) => void;
}

export default function Body({ activeLink, user, setActiveLink }: BodyProps) {
  return (
    <main className="pt-16">
      {activeLink === 'donor-dashboard' ? (
        <DonorDashboard
          user={user}
          onBack={() => setActiveLink('home')}
        />
      ) : activeLink === 'profile' ? (
        <ProfilePage onNavigateToDashboard={() => setActiveLink('donor-dashboard')} />
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

