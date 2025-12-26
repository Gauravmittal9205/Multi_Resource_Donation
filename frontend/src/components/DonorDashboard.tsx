import { useEffect, useMemo, useRef, useState } from 'react';
import type * as React from 'react';
import type { User as FirebaseUser } from 'firebase/auth';
import { signOutUser } from '../firebase';
import { createDonation, fetchDonorDashboard, fetchDonorProfileByUid, fetchMyDonations, fetchMyNotifications, markAllNotificationsRead, markNotificationRead, verifyDonationOtp } from '../services/donationService';
import type { DonationItem } from '../services/donationService';
import type { NotificationItem } from '../services/donationService';
import {
  FiGrid,
  FiBox,
  FiPlusCircle,
  FiTruck,
  FiClock,
  FiBarChart2,
  FiCheckCircle,
  FiPackage,
  FiCalendar,
  FiTag,
  FiUsers,
  FiX,
  FiMenu,
  FiCamera,
  FiChevronLeft,
  FiChevronRight,
  FiHelpCircle,
  FiBell,
  FiSettings,
  FiLogOut,
  FiMail,
  FiPhone,
  FiHeart,
  FiPieChart,
  FiArrowUpRight,
  FiArrowDownRight,
  FiMapPin,
  FiRefreshCw,
  FiEye,
  FiAlertCircle,
} from 'react-icons/fi';

type DonorDashboardProps = {
  user: FirebaseUser | null;
  onBack: () => void;
  userMeta?: {
    userType?: 'donor' | 'ngo';
    organizationName?: string;
  } | null;
};

type MenuKey = 'dashboard' | 'my-donations' | 'donate-now' | 'active-pickups' | 'donation-history' | 'impact' | 'help-support' | 'notifications' | 'settings';

type ResourceType = '' | 'Food' | 'Clothes' | 'Books' | 'Medical Supplies' | 'Other Essentials';

type TimeSlot = '' | 'Morning' | 'Afternoon' | 'Evening';

const FieldLabel = ({ children }: { children: React.ReactNode }) => (
  <div className="text-xs font-semibold tracking-wide text-gray-600 mb-1">{children}</div>
);

const TextInput = ({
  value,
  onChange,
  placeholder,
  type = 'text',
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
}) => (
  <input
    value={value}
    onChange={(e) => onChange(e.target.value)}
    onKeyDown={(e) => {
      // Let Enter bubble so the form-level handler can prevent accidental submit.
      if (e.key !== 'Enter') e.stopPropagation();
    }}
    placeholder={placeholder}
    type={type}
    className="w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-200 focus:border-emerald-300"
  />
);

const NumericInput = ({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) => (
  <input
    value={value}
    onChange={(e) => {
      const next = e.target.value;
      if (/^\d*$/.test(next)) onChange(next);
    }}
    onKeyDown={(e) => {
      // Let Enter bubble so the form-level handler can prevent accidental submit.
      if (e.key === 'Enter') return;
      if (e.key === 'e' || e.key === 'E' || e.key === '+' || e.key === '-') {
        e.preventDefault();
        e.stopPropagation();
      } else {
        e.stopPropagation();
      }
    }}
    placeholder={placeholder}
    inputMode="numeric"
    className="w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-200 focus:border-emerald-300"
  />
);

const Select = ({
  value,
  onChange,
  children,
}: {
  value: string;
  onChange: (v: string) => void;
  children: React.ReactNode;
}) => (
  <select
    value={value}
    onChange={(e) => onChange(e.target.value)}
    onKeyDown={(e) => {
      if (e.key !== 'Enter') e.stopPropagation();
    }}
    className="w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-sm text-gray-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-200 focus:border-emerald-300"
  >
    {children}
  </select>
);

function DonorDashboard({ user, onBack, userMeta }: DonorDashboardProps) {
  if (!user) {
    return (
      <div className="min-h-[calc(100vh-4rem)] bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-xl border border-gray-200 p-6 text-center">
          <div className="text-lg font-semibold text-gray-900">Not signed in</div>
          <div className="text-sm text-gray-600 mt-1">Please sign in to view your dashboard.</div>
          <button
            onClick={onBack}
            className="mt-4 px-4 py-2 text-sm font-medium text-emerald-700 bg-emerald-50 rounded-md hover:bg-emerald-100"
          >
            Back
          </button>
        </div>
      </div>
    );
  }

  const [activeItem, setActiveItem] = useState<MenuKey>('dashboard');
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [activityView, setActivityView] = useState<'monthly' | 'yearly'>('monthly');

  const handleLogout = async () => {
    try {
      await signOutUser();
      onBack();
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const [dashboardLoading, setDashboardLoading] = useState(false);
  const [dashboardError, setDashboardError] = useState<string | null>(null);
  const [dashboardData, setDashboardData] = useState<
    | {
        summary: { totalDonations: number; activePickups: number; completedDonations: number };
        impact?: { peopleHelped: number; ngosConnected: number; resourcesDonated: number; foodSavedKg?: number };
        activity: { label: string; count: number }[];
        recentDonations: any[];
      }
    | null
  >(null);

  const [donorProfile, setDonorProfile] = useState<any>(null);

  // Donation details modal state
  const [selectedDonation, setSelectedDonation] = useState<any>(null);
  const [showDonationDetails, setShowDonationDetails] = useState(false);

  const loadDashboard = async () => {
    try {
      setDashboardLoading(true);
      setDashboardError(null);
      const res = await fetchDonorDashboard();
      setDashboardData(res.data);
    } catch (e: any) {
      setDashboardError(e?.message || 'Failed to load dashboard');
    } finally {
      setDashboardLoading(false);
    }
  };

  const loadDonorProfile = async () => {
    if (!user?.uid) return;
    try {
      const res = await fetchDonorProfileByUid(user.uid);
      if (res.success && res.data) {
        setDonorProfile(res.data);
      } else {
        // Profile doesn't exist yet - this is fine, set to null
        setDonorProfile(null);
      }
    } catch (e: any) {
      // Only log non-404 errors (404 is expected for new users)
      if (e.response?.status !== 404) {
        console.error('Failed to load donor profile:', e);
      }
      setDonorProfile(null);
    }
  };

  useEffect(() => {
    loadDashboard();
    loadDonorProfile();
  }, []);

  const refreshProfile = () => {
    loadDonorProfile();
  };

  // Listen for profile updates from other components
  useEffect(() => {
    const handleProfileUpdate = () => {
      loadDonorProfile();
    };

    window.addEventListener('profileUpdated', handleProfileUpdate);
    return () => {
      window.removeEventListener('profileUpdated', handleProfileUpdate);
    };
  }, []);

  // Reload profile when switching to settings
  useEffect(() => {
    if (activeItem === 'settings') {
      loadDonorProfile();
    }
  }, [activeItem]);

  const userRef = useRef(user);
  useEffect(() => {
    userRef.current = user;
  }, [user]);

  const loadDashboardRef = useRef(loadDashboard);
  
  useEffect(() => {
    loadDashboardRef.current = loadDashboard;
  }, [loadDashboard]);

  const menu = [
    { key: 'dashboard' as const, label: 'Dashboard', icon: FiGrid },
    { key: 'my-donations' as const, label: 'My Donations', icon: FiBox },
    { key: 'donate-now' as const, label: 'Donate Now', icon: FiPlusCircle, primary: true },
    { key: 'active-pickups' as const, label: 'Active Pickups', icon: FiTruck },
    { key: 'donation-history' as const, label: 'Donation History', icon: FiClock },
    { key: 'help-support' as const, label: 'Help & Support', icon: FiHelpCircle },
    { key: 'notifications' as const, label: 'Notifications', icon: FiBell },
    { key: 'settings' as const, label: 'Settings', icon: FiSettings },
  ];

  const Sidebar = ({ variant }: { variant: 'desktop' | 'mobile' }) => {
    const profileName = donorProfile?.basic?.name || user.displayName || user.email?.split('@')[0] || 'Donor';
    const profileEmail = donorProfile?.basic?.email || user.email || '';
    const profilePhone = donorProfile?.basic?.phone || '';
    const profilePhotoUrl = donorProfile?.basic?.photoUrl || user.photoURL || '';

    const isCollapsed = variant === 'desktop' && isSidebarCollapsed;

    return (
      <aside
        className={
          variant === 'desktop'
            ? `hidden lg:flex lg:flex-col bg-white border-r border-gray-100 lg:sticky lg:top-0 lg:h-screen transition-all duration-300 relative ${
                isCollapsed ? 'w-16' : 'w-72'
              }`
            : 'flex flex-col w-72 max-w-[85vw] bg-white h-full shadow-2xl'
        }
      >
        {variant === 'desktop' && (
          <button
            onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
            className="absolute -right-3 top-8 z-10 h-6 w-6 rounded-full bg-white border border-gray-200 shadow-md flex items-center justify-center text-gray-600 hover:bg-gray-50 transition-colors"
            title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {isCollapsed ? (
              <FiChevronRight className="h-4 w-4" />
            ) : (
              <FiChevronLeft className="h-4 w-4" />
            )}
          </button>
        )}
        
        <div className="p-5 flex flex-col h-full">
          {!isCollapsed && (
            <div className="flex flex-col items-center text-center mb-6">
              <div className="relative w-20 h-20 mb-3">
                {profilePhotoUrl ? (
                  <img 
                    src={profilePhotoUrl} 
                    alt={profileName}
                    className="w-20 h-20 rounded-full object-cover shadow-lg border-2 border-emerald-100"
                    onError={(e) => {
                      // Hide image and show fallback
                      const target = e.target as HTMLImageElement;
                      target.style.display = 'none';
                      const parent = target.parentElement;
                      const fallback = parent?.querySelector('.avatar-fallback') as HTMLElement;
                      if (fallback) fallback.style.display = 'flex';
                    }}
                  />
                ) : null}
                <div 
                  className={`avatar-fallback w-20 h-20 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center text-white text-2xl font-bold shadow-lg ${profilePhotoUrl ? 'hidden' : 'flex'}`}
                >
                  {profileName.charAt(0).toUpperCase()}
                </div>
              </div>
              <div className="font-semibold text-gray-900 text-lg">{profileName}</div>
              <div className="text-sm text-gray-600 mt-1">{profileEmail}</div>
              <div className="text-sm text-gray-600 mt-1">{profilePhone || 'No phone number'}</div>
            </div>
          )}
          
          {isCollapsed && (
            <div className="flex flex-col items-center justify-center py-4">
              <div className="relative w-10 h-10">
                {profilePhotoUrl ? (
                  <img 
                    src={profilePhotoUrl} 
                    alt={profileName}
                    className="w-10 h-10 rounded-full object-cover shadow-lg border-2 border-emerald-100"
                    onError={(e) => {
                      // Hide image and show fallback
                      const target = e.target as HTMLImageElement;
                      target.style.display = 'none';
                      const parent = target.parentElement;
                      const fallback = parent?.querySelector('.avatar-fallback') as HTMLElement;
                      if (fallback) fallback.style.display = 'flex';
                    }}
                  />
                ) : null}
                <div 
                  className={`avatar-fallback w-10 h-10 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center text-white text-lg font-bold shadow-lg ${profilePhotoUrl ? 'hidden' : 'flex'}`}
                >
                  {profileName.charAt(0).toUpperCase()}
                </div>
              </div>
            </div>
          )}

          <nav className={`flex-1 overflow-y-auto scrollbar-hide ${isCollapsed ? 'flex flex-col items-center py-2' : 'space-y-2'}`}>
            {menu.map((item) => {
              const isActive = activeItem === item.key;
              const Icon = item.icon;
              const isPrimary = Boolean(item.primary);

              const base =
                'flex items-center rounded-xl text-sm transition-colors';
              const active = 'bg-emerald-50 text-emerald-800';
              const normal = 'text-gray-700 hover:bg-gray-50';
              const primary = active;
              const primaryInactive = normal;

              const cls =
                base +
                ' ' +
                (isPrimary
                  ? isActive
                    ? primary
                    : primaryInactive
                  : isActive
                    ? active
                    : normal) +
                ' ' +
                (isCollapsed ? 'justify-center w-10 h-10 my-1' : 'gap-3 px-3.5 py-2.5 w-full');

              return (
                <div key={item.key} className={isCollapsed ? 'w-full flex justify-center' : 'space-y-2'}>
                  <button
                    type="button"
                    onClick={() => {
                      setActiveItem(item.key);
                      setMobileSidebarOpen(false);
                    }}
                    className={cls}
                    title={isCollapsed ? item.label : ''}
                  >
                    <Icon className="h-5 w-5" />
                    {!isCollapsed && (
                      <span className={isPrimary && isActive ? 'font-semibold' : isActive ? 'font-semibold' : 'font-medium'}>
                        {item.label}
                      </span>
                    )}
                  </button>

                  {item.key === 'donate-now' && !isCollapsed ? (
                    <button
                      type="button"
                      onClick={() => {
                        setMobileSidebarOpen(false);
                        setActiveItem('impact');
                      }}
                      className={
                        'w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm transition-colors ' +
                        (activeItem === 'impact'
                          ? 'bg-emerald-50 text-emerald-800'
                          : 'text-gray-700 hover:bg-gray-50')
                      }
                    >
                      <FiUsers className="h-5 w-5" />
                      <span className="font-medium">Impact</span>
                    </button>
                  ) : null}
                </div>
              );
            })}
          </nav>

          {/* Logout Button */}
          <div className="mt-auto pt-4 border-t border-gray-100">
            <button
              onClick={handleLogout}
              className={`flex items-center rounded-xl text-sm transition-colors text-red-600 hover:bg-red-50 ${
                isCollapsed ? 'justify-center w-10 h-10 my-1' : 'gap-3 px-3.5 py-2.5 w-full'
              }`}
              title={isCollapsed ? 'Logout' : ''}
            >
              <FiLogOut className="h-5 w-5" />
              {!isCollapsed && <span className="font-medium">Logout</span>}
            </button>
          </div>
        </div>
      </aside>
    );
  };

  const [myDonationsLoading, setMyDonationsLoading] = useState(false);
  const [myDonationsError, setMyDonationsError] = useState<string | null>(null);
  const [myDonations, setMyDonations] = useState<DonationItem[]>([]);

  // FAQ state
  const [faqs, setFaqs] = useState<any[]>([]);
  const [faqsLoading, setFaqsLoading] = useState(false);
  const [faqsError, setFaqsError] = useState<string | null>(null);
  const [expandedFaq, setExpandedFaq] = useState<string | null>(null);

  // Support Request Form state
  const [showSupportForm, setShowSupportForm] = useState(false);
  const [supportFormData, setSupportFormData] = useState({
    name: '',
    email: '',
    phone: '',
    queryType: '',
    message: ''
  });
  const [supportFormLoading, setSupportFormLoading] = useState(false);
  const [supportFormError, setSupportFormError] = useState<string | null>(null);
  const [supportFormSuccess, setSupportFormSuccess] = useState(false);

  const [notificationsLoading, setNotificationsLoading] = useState(false);
  const [notificationsError, setNotificationsError] = useState<string | null>(null);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [notificationFilter, setNotificationFilter] = useState<'all' | 'donations' | 'pickups' | 'system'>('all');
  const [showReadNotifications, setShowReadNotifications] = useState(false);
  const [highlightDonationId, setHighlightDonationId] = useState<string | null>(null);

  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const tab = params.get('tab');
      const filter = params.get('filter');
      const donationId = params.get('donationId');

      if (tab === 'notifications') {
        setActiveItem('notifications');
      }

      if (filter === 'donations' || filter === 'pickups' || filter === 'system' || filter === 'all') {
        setNotificationFilter(filter);
      }

      if (donationId) {
        setHighlightDonationId(donationId);
      }
    } catch {
      // ignore
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadMyDonations = async () => {
    try {
      setMyDonationsLoading(true);
      setMyDonationsError(null);
      const res = await fetchMyDonations();
      setMyDonations(res.data || []);
    } catch (e: any) {
      setMyDonationsError(e?.response?.data?.message || e?.message || 'Failed to load donations');
      setMyDonations([]);
    } finally {
      setMyDonationsLoading(false);
    }
  };

  useEffect(() => {
    if (activeItem === 'my-donations') {
      loadMyDonations();
    }
  }, [activeItem]);

  const loadFaqs = async () => {
    try {
      setFaqsLoading(true);
      setFaqsError(null);
      // Try userType first, then fallback to role
      const res = await fetch('http://localhost:5000/api/v1/faqs?userType=donor&isActive=true');
      const data = await res.json();
      if (data.success) {
        let faqsData = data.data || [];
        // If no FAQs found with userType, try with role
        if (faqsData.length === 0) {
          const res2 = await fetch('http://localhost:5000/api/v1/faqs?role=donors&isActive=true');
          const data2 = await res2.json();
          if (data2.success) {
            faqsData = data2.data || [];
          }
        }
        setFaqs(faqsData);
      } else {
        setFaqsError('Failed to load FAQs');
      }
    } catch (e: any) {
      setFaqsError(e?.message || 'Failed to load FAQs');
    } finally {
      setFaqsLoading(false);
    }
  };

  useEffect(() => {
    if (activeItem === 'help-support') {
      loadFaqs();
    }
  }, [activeItem]);

  const loadNotifications = async (opts?: { filter?: 'all' | 'donations' | 'pickups' | 'system'; includeRead?: boolean }) => {
    try {
      setNotificationsLoading(true);
      setNotificationsError(null);
      const res = await fetchMyNotifications({
        category: (opts?.filter || notificationFilter) === 'all' ? 'all' : (opts?.filter || notificationFilter),
        includeRead: opts?.includeRead ?? showReadNotifications,
        limit: 100,
      });
      setNotifications(res.data || []);
    } catch (e: any) {
      setNotificationsError(e?.response?.data?.message || e?.message || 'Failed to load notifications');
      setNotifications([]);
    } finally {
      setNotificationsLoading(false);
    }
  };

  useEffect(() => {
    if (activeItem === 'notifications') {
      loadNotifications();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeItem]);

  useEffect(() => {
    if (activeItem === 'notifications') {
      loadNotifications();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [notificationFilter, showReadNotifications]);

  // Initialize support form with user data
  useEffect(() => {
    if (showSupportForm && user) {
      const profileName = donorProfile?.basic?.name || user.displayName || '';
      const profileEmail = donorProfile?.basic?.email || user.email || '';
      const profilePhone = donorProfile?.basic?.phone || '';
      
      setSupportFormData({
        name: profileName,
        email: profileEmail,
        phone: profilePhone,
        queryType: '',
        message: ''
      });
    }
  }, [showSupportForm, user, donorProfile]);

  const handleSupportFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSupportFormError(null);
    setSupportFormSuccess(false);

    if (!supportFormData.name || !supportFormData.email || !supportFormData.message) {
      setSupportFormError('Please fill in all required fields.');
      return;
    }

    setSupportFormLoading(true);
    try {
      const response = await fetch('http://localhost:5000/api/v1/contacts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          firebaseUid: user?.uid || '',
          userType: 'donor',
          name: supportFormData.name,
          email: supportFormData.email,
          phone: supportFormData.phone,
          queryType: supportFormData.queryType || 'General Inquiry',
          message: supportFormData.message,
        }),
      });

      const data = await response.json();
      if (data.success) {
        setSupportFormSuccess(true);
        setSupportFormData({
          name: '',
          email: '',
          phone: '',
          queryType: '',
          message: ''
        });
        setTimeout(() => {
          setShowSupportForm(false);
          setSupportFormSuccess(false);
        }, 2000);
      } else {
        setSupportFormError(data.error || 'Failed to submit support request');
      }
    } catch (error: any) {
      setSupportFormError(error?.message || 'Failed to submit support request');
    } finally {
      setSupportFormLoading(false);
    }
  };

  const SummaryCard = ({
    title,
    icon: Icon,
    value,
    subtitle,
    tone = 'emerald',
    trend,
  }: {
    title: string;
    icon: React.ComponentType<{ className?: string }>;
    value: React.ReactNode;
    subtitle?: string;
    tone?: 'emerald' | 'blue' | 'violet' | 'amber' | 'slate';
    trend?: { pct: number; direction: 'up' | 'down'; label?: string };
  }) => {
    const toneMap: Record<string, { bg: string; fg: string; ring: string }> = {
      emerald: { bg: 'bg-emerald-50', fg: 'text-emerald-700', ring: 'ring-emerald-100' },
      blue: { bg: 'bg-blue-50', fg: 'text-blue-700', ring: 'ring-blue-100' },
      violet: { bg: 'bg-violet-50', fg: 'text-violet-700', ring: 'ring-violet-100' },
      amber: { bg: 'bg-amber-50', fg: 'text-amber-700', ring: 'ring-amber-100' },
      slate: { bg: 'bg-slate-50', fg: 'text-slate-700', ring: 'ring-slate-100' },
    };
    const t = toneMap[tone];

    return (
      <div className="group rounded-2xl bg-white border border-gray-100 shadow-sm hover:shadow-md transition-shadow p-5">
        <div className="flex items-center justify-between gap-4">
          <div className="min-w-0">
            <div className="text-sm font-medium text-gray-600">{title}</div>
            <div className="mt-2 text-3xl font-semibold text-gray-900">{value}</div>
            {subtitle ? <div className="mt-1 text-xs text-gray-500">{subtitle}</div> : null}
          </div>
          <div className={`h-11 w-11 rounded-2xl ${t.bg} ${t.fg} ring-1 ${t.ring} flex items-center justify-center group-hover:scale-[1.03] transition-transform`}>
            <Icon className="h-5 w-5" />
          </div>
        </div>
        {trend ? (
          <div className="mt-4 flex items-center gap-2">
            <span
              className={
                'inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold border ' +
                (trend.direction === 'up'
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                  : 'bg-red-50 text-red-700 border-red-100')
              }
            >
              {trend.direction === 'up' ? <FiArrowUpRight className="h-3.5 w-3.5" /> : <FiArrowDownRight className="h-3.5 w-3.5" />}
              {trend.pct}%
            </span>
            <span className="text-xs text-gray-500">{trend.label || 'vs last period'}</span>
          </div>
        ) : null}
      </div>
    );
  };

  const DonateNowForm = () => {
    const [resourceType, setResourceType] = useState<ResourceType>('');
    const [quantity, setQuantity] = useState('');
    const [unit, setUnit] = useState<'kg' | 'items' | 'packets' | 'boxes'>('items');

    const [addressLine, setAddressLine] = useState('');
    const [city, setCity] = useState('');
    const [state, setState] = useState('');
    const [pincode, setPincode] = useState('');


    const [addressResults, setAddressResults] = useState<any[]>([]);
    const [addressLookupLoading, setAddressLookupLoading] = useState(false);
    const [addressLookupError, setAddressLookupError] = useState<string | null>(null);

    const [pickupDate, setPickupDate] = useState('');
    const [timeSlot, setTimeSlot] = useState<TimeSlot>('');
    const [notes, setNotes] = useState('');

    const [images, setImages] = useState<File[]>([]);
    const [imageError, setImageError] = useState<string | null>(null);
    const [isDragging, setIsDragging] = useState(false);

    const [submitLoading, setSubmitLoading] = useState(false);
    const [submitError, setSubmitError] = useState<string | null>(null);
    const [submitSuccess, setSubmitSuccess] = useState<string | null>(null);

    const [foodType, setFoodType] = useState<'Veg' | 'Non-Veg' | ''>('');
    const [foodCategory, setFoodCategory] = useState<'Cooked' | 'Packed' | 'Raw' | ''>('');
    const [approxWeight, setApproxWeight] = useState('');
    const [preparedHoursAgo, setPreparedHoursAgo] = useState('');
    const [expiryTime, setExpiryTime] = useState('');

    const [clothingTargetAgeGroup, setClothingTargetAgeGroup] = useState<
      'Infant (0–2)' | 'Kids (3–12)' | 'Teen (13–18)' | 'Adult' | 'Senior Citizen' | ''
    >('');
    const [clothingGenderUsage, setClothingGenderUsage] = useState<'Men' | 'Women' | 'Unisex' | ''>('');
    const [clothingCategories, setClothingCategories] = useState<string[]>([]);
    const [clothingSeason, setClothingSeason] = useState<'Summer' | 'Winter' | 'All-Season' | ''>('');
    const [clothingCondition, setClothingCondition] = useState<'New' | 'Gently Used' | ''>('');
    const [clothingNumberOfItems, setClothingNumberOfItems] = useState('');
    const [clothingWashedPacked, setClothingWashedPacked] = useState(false);

    const [bookType, setBookType] = useState<'Academic' | 'Story' | 'Competitive' | 'Other' | ''>('');
    const [educationLevel, setEducationLevel] = useState<'Primary' | 'Secondary' | 'College' | ''>('');
    const [language, setLanguage] = useState('');
    const [numberOfBooks, setNumberOfBooks] = useState('');

    const [medicalCategory, setMedicalCategory] = useState<
      'Medicines' | 'Masks / Gloves' | 'First Aid Kits' | 'Medical Equipment' | 'Hygiene Products' | ''
    >('');
    const [medicineType, setMedicineType] = useState<'Tablets' | 'Syrups' | 'Ointments' | ''>('');
    const [medicineName, setMedicineName] = useState('');
    const [medicineBrand, setMedicineBrand] = useState('');
    const [medicineDosage, setMedicineDosage] = useState('');
    const [medicineBatchNumber, setMedicineBatchNumber] = useState('');
    const [prescriptionRequired, setPrescriptionRequired] = useState<'Yes' | 'No' | ''>('');
    const [medicalExpiryDate, setMedicalExpiryDate] = useState('');
    const [sealedUnused, setSealedUnused] = useState<'Yes' | 'No' | ''>('');
    const [storageCondition, setStorageCondition] = useState<'Normal' | 'Refrigerated' | ''>('');
    const [medicalQuantity, setMedicalQuantity] = useState('');

    const [essentialItemName, setEssentialItemName] = useState('');
    const [essentialCategory, setEssentialCategory] = useState('');
    const [essentialQuantity, setEssentialQuantity] = useState('');
    const [essentialDescription, setEssentialDescription] = useState('');

    const isNonEmpty = (v: string) => v.trim().length > 0;

    
    useEffect(() => {
      let cancelled = false;

      const loadProfile = async () => {
        try {
          const uid = userRef.current?.uid;
          if (!uid) return;

          const res = await fetchDonorProfileByUid(uid);
          const profile = res?.success && res?.data ? res.data : null;
          if (!profile || cancelled) return;

          const pickupAddress = String(profile.location?.pickupAddress || '').trim();
          const profileCity = String(profile.location?.city || '').trim();
          const profileState = String(profile.location?.state || '').trim();
          const profilePincode = String(profile.location?.pincode || '').trim();

          if (!isNonEmpty(addressLine) && pickupAddress) setAddressLine(pickupAddress);
          if (!isNonEmpty(city) && profileCity) setCity(profileCity);
          if (!isNonEmpty(state) && profileState) setState(profileState);
          if (!isNonEmpty(pincode) && profilePincode) setPincode(profilePincode);

          const preferred = String(profile.preferences?.preferredPickupTime || '').trim().toLowerCase();
          const preferredSlot =
            preferred === 'morning' || preferred.includes('morning')
              ? 'Morning'
              : preferred === 'afternoon' || preferred.includes('afternoon')
                ? 'Afternoon'
                : preferred === 'evening' || preferred.includes('evening')
                  ? 'Evening'
                  : '';

          if (!isNonEmpty(timeSlot) && preferredSlot) setTimeSlot(preferredSlot as TimeSlot);
        } catch {
          // ignore profile autofill errors
        }
      };

      loadProfile();
      return () => {
        cancelled = true;
      };
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const previews = useMemo(() => {
      return images.map((f) => ({ file: f, url: URL.createObjectURL(f) }));
    }, [images]);

    useEffect(() => {
      return () => {
        previews.forEach((p) => URL.revokeObjectURL(p.url));
      };
    }, [previews]);

    const requiredCommonComplete =
      Boolean(resourceType) &&
      images.length > 0 &&
      isNonEmpty(quantity) &&
      isNonEmpty(addressLine) &&
      isNonEmpty(city) &&
      isNonEmpty(state) &&
      isNonEmpty(pincode) &&
      isNonEmpty(pickupDate) &&
      isNonEmpty(timeSlot);

    const requiredDynamicComplete = (() => {
      if (!resourceType) return false;

      if (resourceType === 'Food') {
        return (
          isNonEmpty(foodType) &&
          isNonEmpty(foodCategory) &&
          isNonEmpty(approxWeight) &&
          isNonEmpty(preparedHoursAgo) &&
          isNonEmpty(expiryTime)
        );
      }

      if (resourceType === 'Clothes') {
        return (
          isNonEmpty(clothingTargetAgeGroup) &&
          clothingCategories.length > 0 &&
          isNonEmpty(clothingCondition) &&
          isNonEmpty(clothingNumberOfItems) &&
          clothingWashedPacked
        );
      }

      if (resourceType === 'Books') {
        return (
          isNonEmpty(bookType) &&
          isNonEmpty(educationLevel) &&
          isNonEmpty(language) &&
          isNonEmpty(numberOfBooks)
        );
      }

      if (resourceType === 'Medical Supplies') {
        if (!isNonEmpty(medicalCategory)) return false;
        if (!isNonEmpty(medicalQuantity)) return false;

        if (medicalCategory === 'Medicines') {
          return (
            isNonEmpty(medicineName) &&
            isNonEmpty(medicineType) &&
            isNonEmpty(prescriptionRequired) &&
            isNonEmpty(medicalExpiryDate) &&
            sealedUnused === 'Yes'
          );
        }

        return true;
      }

      return isNonEmpty(essentialItemName) && isNonEmpty(essentialCategory) && isNonEmpty(essentialQuantity) && isNonEmpty(essentialDescription);
    })();

    const canSubmit = requiredCommonComplete && requiredDynamicComplete;

    const appendFiles = (files: File[]) => {
      const filtered = files.filter((f) => {
        const t = (f.type || '').toLowerCase();
        return t === 'image/jpeg' || t === 'image/jpg' || t === 'image/png';
      });

      if (filtered.length === 0) return;
      setImages((prev) => [...prev, ...filtered]);
      setImageError(null);
    };

    const onFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(e.target.files || []);
      appendFiles(files);
      e.target.value = '';
    };

    const onDrop = (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      setIsDragging(false);
      const files = Array.from(e.dataTransfer.files || []);
      appendFiles(files);
    };

    const fileToDataUrl = (file: File): Promise<string> => {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result || ''));
        reader.onerror = () => reject(new Error('Failed to read image'));
        reader.readAsDataURL(file);
      });
    };

    const resetForm = () => {
      setResourceType('');
      setQuantity('');
      setUnit('items');

      setAddressLine('');
      setCity('');
      setState('');
      setPincode('');

      setPickupDate('');
      setTimeSlot('');
      setNotes('');

      setImages([]);
      setImageError(null);
      setIsDragging(false);

      setFoodType('');
      setFoodCategory('');
      setApproxWeight('');
      setPreparedHoursAgo('');
      setExpiryTime('');

      setClothingTargetAgeGroup('');
      setClothingGenderUsage('');
      setClothingCategories([]);
      setClothingSeason('');
      setClothingCondition('');
      setClothingNumberOfItems('');
      setClothingWashedPacked(false);

      setBookType('');
      setEducationLevel('');
      setLanguage('');
      setNumberOfBooks('');

      setMedicalCategory('');
      setMedicineType('');
      setMedicineName('');
      setMedicineBrand('');
      setMedicineDosage('');
      setMedicineBatchNumber('');
      setPrescriptionRequired('');
      setMedicalExpiryDate('');
      setSealedUnused('');
      setStorageCondition('');
      setMedicalQuantity('');

      setEssentialItemName('');
      setEssentialCategory('');
      setEssentialQuantity('');
      setEssentialDescription('');
    };

    const onSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      if (images.length === 0) {
        setImageError('Please upload a clear image of the resource');
        return;
      }

      if (resourceType === 'Medical Supplies' && medicalCategory === 'Medicines' && sealedUnused === 'No') {
        setSubmitError('Only sealed & unused medicines are allowed.');
        return;
      }

      setImageError(null);
      setSubmitError(null);
      setSubmitSuccess(null);
      setSubmitLoading(true);

      try {
        const details: Record<string, unknown> = {};

        if (resourceType === 'Food') {
          details.foodType = foodType;
          details.foodCategory = foodCategory;
          details.approxWeight = approxWeight;
          details.preparedHoursAgo = preparedHoursAgo;
          details.expiryTime = expiryTime;
        } else if (resourceType === 'Clothes') {
          details.targetAgeGroup = clothingTargetAgeGroup;
          details.genderUsage = clothingGenderUsage;
          details.clothingCategories = clothingCategories;
          details.season = clothingSeason;
          details.condition = clothingCondition;
          details.numberOfItems = clothingNumberOfItems;
          details.washedPacked = clothingWashedPacked;
        } else if (resourceType === 'Books') {
          details.bookType = bookType;
          details.educationLevel = educationLevel;
          details.language = language;
          details.numberOfBooks = numberOfBooks;
        } else if (resourceType === 'Medical Supplies') {
          details.medicalCategory = medicalCategory;
          if (medicalCategory === 'Medicines') {
            details.medicineType = medicineType;
            details.medicineName = medicineName;
            details.medicineBrand = medicineBrand;
            details.medicineDosage = medicineDosage;
            details.medicineBatchNumber = medicineBatchNumber;
            details.prescriptionRequired = prescriptionRequired;
            details.medicalExpiryDate = medicalExpiryDate;
            details.sealedUnused = sealedUnused;
            details.storageCondition = storageCondition;
          }
          details.medicalQuantity = medicalQuantity;
        } else if (resourceType === 'Other Essentials') {
          details.essentialItemName = essentialItemName;
          details.essentialCategory = essentialCategory;
          details.essentialQuantity = essentialQuantity;
          details.essentialDescription = essentialDescription;
        }

        const imageDataUrls = await Promise.all(images.map((f) => fileToDataUrl(f)));

        await createDonation({
          resourceType: resourceType as any,
          quantity: Number(quantity),
          unit,
          address: { addressLine, city, state, pincode },
          pickup: { pickupDate, timeSlot: timeSlot as any },
          notes,
          images: imageDataUrls,
          details
        });

        resetForm();
        setSubmitSuccess('Thank you! Your donation has been submitted successfully.');
        await loadDashboardRef.current();
        await loadMyDonations();
        // Redirect to dashboard after successful submission
        setActiveItem('dashboard');
      } catch (err: any) {
        setSubmitError(err?.response?.data?.message || err?.message || 'Failed to submit donation');
      } finally {
        setSubmitLoading(false);
      }
    };

    useEffect(() => {
      const q = addressLine.trim();
      if (q.length < 3) {
        setAddressResults([]);
        setAddressLookupError(null);
        setAddressLookupLoading(false);
        return;
      }

      const controller = new AbortController();
      const t = window.setTimeout(async () => {
        try {
          setAddressLookupLoading(true);
          setAddressLookupError(null);

          const url = `http://localhost:5000/api/v1/geo/nominatim?q=${encodeURIComponent(q)}&limit=6`;
          const res = await fetch(url, { signal: controller.signal });
          if (!res.ok) throw new Error('Address lookup failed');

          const json = await res.json();
          const data = json?.data;
          setAddressResults(Array.isArray(data) ? data.slice(0, 6) : []);
        } catch (e: any) {
          if (e?.name === 'AbortError') return;
          setAddressLookupError(e?.message || 'Address lookup failed');
          setAddressResults([]);
        } finally {
          setAddressLookupLoading(false);
        }
      }, 450);

      return () => {
        controller.abort();
        window.clearTimeout(t);
      };
    }, [addressLine]);

    const renderDynamicFields = () => {
      if (!resourceType) {
        return (
          <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50 p-6 text-center">
            <div className="text-sm font-semibold text-gray-900">Select a resource type to continue</div>
            <div className="mt-1 text-sm text-gray-600">We’ll show the right fields based on what you’re donating.</div>
          </div>
        );
      }

      if (resourceType === 'Food') {
        return (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div>
              <FieldLabel>Food Type *</FieldLabel>
              <Select value={foodType} onChange={(v) => setFoodType(v as any)}>
                <option value="">Select</option>
                <option value="Veg">Veg</option>
                <option value="Non-Veg">Non-Veg</option>
              </Select>
            </div>
            <div>
              <FieldLabel>Food Category *</FieldLabel>
              <Select value={foodCategory} onChange={(v) => setFoodCategory(v as any)}>
                <option value="">Select</option>
                <option value="Cooked">Cooked</option>
                <option value="Packed">Packed</option>
                <option value="Raw">Raw</option>
              </Select>
            </div>
            <div>
              <FieldLabel>Approx Weight (kg) *</FieldLabel>
              <NumericInput value={approxWeight} onChange={setApproxWeight} placeholder="e.g. 2" />
            </div>
            <div>
              <FieldLabel>Prepared Time (Hours ago) *</FieldLabel>
              <NumericInput value={preparedHoursAgo} onChange={setPreparedHoursAgo} placeholder="e.g. 3" />
            </div>
            <div className="lg:col-span-2">
              <FieldLabel>Expiry Time (if packed) *</FieldLabel>
              <TextInput value={expiryTime} onChange={setExpiryTime} placeholder="e.g. 24 hours" />
            </div>
          </div>
        );
      }

      if (resourceType === 'Clothes') {
        return (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div>
              <FieldLabel>Target Age Group *</FieldLabel>
              <Select value={clothingTargetAgeGroup} onChange={(v) => setClothingTargetAgeGroup(v as any)}>
                <option value="">Select</option>
                <option value="Infant (0–2)">Infant (0–2)</option>
                <option value="Kids (3–12)">Kids (3–12)</option>
                <option value="Teen (13–18)">Teen (13–18)</option>
                <option value="Adult">Adult</option>
                <option value="Senior Citizen">Senior Citizen</option>
              </Select>
            </div>
            <div>
              <FieldLabel>Gender / Usage</FieldLabel>
              <Select value={clothingGenderUsage} onChange={(v) => setClothingGenderUsage(v as any)}>
                <option value="">Select</option>
                <option value="Men">Men</option>
                <option value="Women">Women</option>
                <option value="Unisex">Unisex</option>
              </Select>
            </div>
            <div>
              <FieldLabel>Condition *</FieldLabel>
              <Select value={clothingCondition} onChange={(v) => setClothingCondition(v as any)}>
                <option value="">Select</option>
                <option value="New">New</option>
                <option value="Gently Used">Gently Used</option>
              </Select>
            </div>
            <div className="lg:col-span-2">
              <FieldLabel>Clothing Category *</FieldLabel>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {[
                  'Shirts / T-Shirts',
                  'Pants / Jeans',
                  'Jackets/Sweaters',
                  'Traditional Wear',
                ].map((c) => {
                  const checked = clothingCategories.includes(c);
                  return (
                    <label key={c} className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-800">
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={(e) => {
                          const next = e.target.checked;
                          setClothingCategories((prev) => (next ? [...prev, c] : prev.filter((x) => x !== c)));
                        }}
                        className="h-4 w-4"
                      />
                      <span>{c}</span>
                    </label>
                  );
                })}
              </div>
            </div>
            <div>
              <FieldLabel>Season</FieldLabel>
              <Select value={clothingSeason} onChange={(v) => setClothingSeason(v as any)}>
                <option value="">Select</option>
                <option value="Summer">Summer</option>
                <option value="Winter">Winter</option>
                <option value="All-Season">All-Season</option>
              </Select>
            </div>
            <div>
              <FieldLabel>Number of Items *</FieldLabel>
              <NumericInput value={clothingNumberOfItems} onChange={setClothingNumberOfItems} placeholder="e.g. 6" />
            </div>
            <div className="lg:col-span-2">
              <FieldLabel>Packing Status *</FieldLabel>
              <label className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-800">
                <input
                  type="checkbox"
                  checked={clothingWashedPacked}
                  onChange={(e) => setClothingWashedPacked(e.target.checked)}
                  className="h-4 w-4"
                />
                <span>Washed & Packed</span>
              </label>
            </div>
          </div>
        );
      }

      if (resourceType === 'Books') {
        return (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div>
              <FieldLabel>Book Type *</FieldLabel>
              <Select value={bookType} onChange={(v) => setBookType(v as any)}>
                <option value="">Select</option>
                <option value="Academic">Academic</option>
                <option value="Story">Story</option>
                <option value="Competitive">Competitive</option>
                <option value="Other">Other</option>
              </Select>
            </div>
            <div>
              <FieldLabel>Education Level *</FieldLabel>
              <Select value={educationLevel} onChange={(v) => setEducationLevel(v as any)}>
                <option value="">Select</option>
                <option value="Primary">Primary</option>
                <option value="Secondary">Secondary</option>
                <option value="College">College</option>
              </Select>
            </div>
            <div>
              <FieldLabel>Language *</FieldLabel>
              <TextInput value={language} onChange={setLanguage} placeholder="e.g. English" />
            </div>
            <div>
              <FieldLabel>Number of Books *</FieldLabel>
              <NumericInput value={numberOfBooks} onChange={setNumberOfBooks} placeholder="e.g. 10" />
            </div>
          </div>
        );
      }

      if (resourceType === 'Medical Supplies') {
        return (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div>
              <FieldLabel>Medical Category *</FieldLabel>
              <Select value={medicalCategory} onChange={(v) => setMedicalCategory(v as any)}>
                <option value="">Select</option>
                <option value="Medicines">Medicines</option>
                <option value="Masks / Gloves">Masks / Gloves</option>
                <option value="First Aid Kits">First Aid Kits</option>
                <option value="Medical Equipment">Medical Equipment</option>
                <option value="Hygiene Products">Hygiene Products</option>
              </Select>
            </div>
            <div>
              <FieldLabel>Quantity *</FieldLabel>
              <NumericInput value={medicalQuantity} onChange={setMedicalQuantity} placeholder="e.g. 20" />
            </div>

            {medicalCategory === 'Medicines' ? (
              <>
                <div className="lg:col-span-2">
                  <FieldLabel>Medicine Name *</FieldLabel>
                  <TextInput value={medicineName} onChange={setMedicineName} placeholder="e.g. Paracetamol" />
                </div>
                <div>
                  <FieldLabel>Brand (Optional)</FieldLabel>
                  <TextInput value={medicineBrand} onChange={setMedicineBrand} placeholder="e.g. Crocin" />
                </div>
                <div>
                  <FieldLabel>Dosage / Strength (Optional)</FieldLabel>
                  <TextInput value={medicineDosage} onChange={setMedicineDosage} placeholder="e.g. 500mg" />
                </div>
                <div>
                  <FieldLabel>Medicine Type</FieldLabel>
                  <Select value={medicineType} onChange={(v) => setMedicineType(v as any)}>
                    <option value="">Select</option>
                    <option value="Tablets">Tablets</option>
                    <option value="Syrups">Syrups</option>
                    <option value="Ointments">Ointments</option>
                  </Select>
                </div>
                <div>
                  <FieldLabel>Prescription Required?</FieldLabel>
                  <Select value={prescriptionRequired} onChange={(v) => setPrescriptionRequired(v as any)}>
                    <option value="">Select</option>
                    <option value="Yes">Yes</option>
                    <option value="No">No</option>
                  </Select>
                </div>
                <div>
                  <FieldLabel>Batch No. (Optional)</FieldLabel>
                  <TextInput value={medicineBatchNumber} onChange={setMedicineBatchNumber} placeholder="Batch number" />
                </div>
                <div>
                  <FieldLabel>Expiry Date *</FieldLabel>
                  <TextInput value={medicalExpiryDate} onChange={setMedicalExpiryDate} type="date" />
                </div>
                <div>
                  <FieldLabel>Sealed & Unused *</FieldLabel>
                  <Select value={sealedUnused} onChange={(v) => setSealedUnused(v as any)}>
                    <option value="">Select</option>
                    <option value="Yes">Yes (Allowed)</option>
                    <option value="No">No</option>
                  </Select>
                </div>
                <div className="lg:col-span-2">
                  <FieldLabel>Storage Condition</FieldLabel>
                  <Select value={storageCondition} onChange={(v) => setStorageCondition(v as any)}>
                    <option value="">Select</option>
                    <option value="Normal">Normal</option>
                    <option value="Refrigerated">Refrigerated</option>
                  </Select>

                  {sealedUnused === 'No' ? (
                    <div className="mt-2 rounded-xl border border-red-100 bg-red-50 px-3 py-2 text-sm text-red-900">
                      Unsealed/used medicines are not allowed.
                    </div>
                  ) : null}
                </div>
              </>
            ) : null}
          </div>
        );
      }

      return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div>
            <FieldLabel>Item Name *</FieldLabel>
            <TextInput value={essentialItemName} onChange={setEssentialItemName} placeholder="e.g. Toiletry kit" />
          </div>
          <div>
            <FieldLabel>Category *</FieldLabel>
            <TextInput value={essentialCategory} onChange={setEssentialCategory} placeholder="e.g. Hygiene" />
          </div>
          <div>
            <FieldLabel>Quantity *</FieldLabel>
            <NumericInput value={essentialQuantity} onChange={setEssentialQuantity} placeholder="e.g. 5" />
          </div>
          <div className="lg:col-span-2">
            <FieldLabel>Short Description *</FieldLabel>
            <TextInput value={essentialDescription} onChange={setEssentialDescription} placeholder="Optional details" />
          </div>
        </div>
      );
    };

    return (
      <div className="space-y-6">
        <div className="rounded-2xl bg-white border border-gray-100 shadow-sm overflow-hidden">
          <div className="p-5">
            <div className="text-base font-semibold text-gray-900">Donate Now</div>
            <div className="mt-1 text-sm text-gray-600">Provide clear details so NGOs can verify and prepare for pickup.</div>
          </div>
          <div className="px-5 pb-5">
          {submitSuccess ? (
            <div className="mb-4 rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
              {submitSuccess}
            </div>
          ) : null}
          {submitError ? (
            <div className="mb-4 rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-900">
              {submitError}
            </div>
          ) : null}
          <form
            onSubmit={onSubmit}
            onKeyDown={(e) => {
              // Prevent accidental submit (which can cause scroll-to-top) while typing.
              if (e.key === 'Enter') {
                const t = e.target as HTMLElement | null;
                const tag = (t?.tagName || '').toLowerCase();
                if (tag !== 'textarea') {
                  e.preventDefault();
                }
              }
            }}
            className="space-y-5"
          >
            <div className="rounded-2xl border border-emerald-100 bg-gradient-to-br from-emerald-50/60 to-white p-4">
              <div className="text-sm font-semibold text-gray-900">Donation Details</div>
              <div className="mt-1 text-sm text-gray-600">All fields are required except Additional Notes.</div>
            </div>

            <div>
              <FieldLabel>Upload image of the resource *</FieldLabel>
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDragging(true);
                }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={onDrop}
                className={
                  'rounded-2xl border-2 border-dashed p-5 transition-colors shadow-sm ' +
                  (isDragging
                    ? 'border-emerald-300 bg-emerald-50/60'
                    : imageError
                      ? 'border-red-300 bg-red-50/40'
                      : 'border-gray-200 bg-gray-50')
                }
              >
                <div className="flex items-start gap-4">
                  <div className="h-11 w-11 rounded-2xl bg-white border border-gray-100 shadow-sm flex items-center justify-center text-emerald-700">
                    <FiCamera className="h-5 w-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-semibold text-gray-900">Upload image of the resource *</div>
                    <div className="mt-1 text-sm text-gray-600">Clear images help NGOs verify and prepare for pickup</div>
                    <div className="mt-3 flex flex-wrap gap-2 items-center">
                      <label className="inline-flex items-center justify-center px-4 py-2 rounded-xl bg-white border border-gray-200 text-sm font-medium text-gray-900 hover:bg-gray-50 cursor-pointer">
                        Click to upload
                        <input
                          type="file"
                          accept="image/png,image/jpeg"
                          multiple
                          className="hidden"
                          onChange={onFileInputChange}
                        />
                      </label>
                      <div className="text-xs text-gray-500">or drag & drop (jpg, png)</div>
                    </div>
                    {imageError ? <div className="mt-3 text-sm text-red-600">{imageError}</div> : null}
                  </div>
                </div>

                {previews.length > 0 ? (
                  <div className="mt-5 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                    {previews.map((p) => (
                      <div key={p.url} className="relative rounded-xl overflow-hidden border border-gray-200 bg-white">
                        <img src={p.url} alt={p.file.name} className="h-24 w-full object-cover" />
                        <button
                          type="button"
                          aria-label="Remove image"
                          className="absolute top-2 right-2 h-8 w-8 rounded-full bg-white/90 border border-gray-200 shadow-sm flex items-center justify-center text-gray-700 hover:bg-white"
                          onClick={() => {
                            setImages((prev) => prev.filter((f) => f !== p.file));
                          }}
                        >
                          <FiX className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : null}
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div>
                <FieldLabel>Resource Type *</FieldLabel>
                <Select
                  value={resourceType}
                  onChange={(v) => {
                    setResourceType(v as ResourceType);
                  }}
                >
                  <option value="">Select</option>
                  <option value="Food">Food</option>
                  <option value="Clothes">Clothes</option>
                  <option value="Books">Books</option>
                  <option value="Medical Supplies">Medical Supplies</option>
                  <option value="Other Essentials">Other Essentials</option>
                </Select>
              </div>

              <div>
                <FieldLabel>Quantity *</FieldLabel>
                <div className="grid grid-cols-2 gap-3">
                  <NumericInput value={quantity} onChange={setQuantity} placeholder="e.g. 5" />
                  <Select value={unit} onChange={(v) => setUnit(v as any)}>
                    <option value="kg">kg</option>
                    <option value="items">items</option>
                    <option value="packets">packets</option>
                    <option value="boxes">boxes</option>
                  </Select>
                </div>
              </div>
            </div>

            <div className="transition-all duration-300 ease-out">
              {renderDynamicFields()}
            </div>

            <div className="rounded-2xl border border-gray-100 bg-white shadow-sm p-5">
              <div className="text-sm font-semibold text-gray-900">Pickup Address</div>
              <div className="mt-4 grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div className="lg:col-span-2">
                  <FieldLabel>Address Line *</FieldLabel>
                  <div className="relative">
                    <input
                      value={addressLine}
                      onChange={(e) => setAddressLine(e.target.value)}
                      placeholder="House no., street, landmark"
                      className="w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-200 focus:border-emerald-300"
                    />

                    {addressLookupError ? (
                      <div className="mt-2 text-xs text-red-600">{addressLookupError}</div>
                    ) : null}

                    {addressLookupLoading && addressLine.trim().length >= 3 ? (
                      <div className="mt-2 text-xs text-gray-500">Searching address...</div>
                    ) : null}

                    {addressResults.length > 0 ? (
                      <div className="absolute z-20 mt-2 w-full rounded-xl border border-gray-200 bg-white shadow-lg overflow-hidden">
                        {addressResults.map((r: any) => (
                          <button
                            key={String(r.place_id)}
                            type="button"
                            className="w-full text-left px-3.5 py-2.5 text-sm text-gray-800 hover:bg-gray-50"
                            onClick={() => {
                              setAddressLine(r.display_name || addressLine);

                              const a = r.address || {};
                              const nextCity =
                                a.city ||
                                a.town ||
                                a.village ||
                                a.city_district ||
                                a.state_district ||
                                a.county ||
                                a.suburb ||
                                '';
                              const nextState = a.state || a.region || a.state_district || '';
                              const nextPin = a.postcode || '';

                              if (nextCity) setCity(String(nextCity));
                              if (nextState) setState(String(nextState));
                              if (nextPin) setPincode(String(nextPin));

                              setAddressResults([]);
                            }}
                          >
                            {r.display_name}
                          </button>
                        ))}
                      </div>
                    ) : null}
                  </div>
                </div>
                <div>
                  <FieldLabel>City *</FieldLabel>
                  <input
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="City"
                    className="w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-200 focus:border-emerald-300"
                  />
                </div>
                <div>
                  <FieldLabel>State *</FieldLabel>
                  <input
                    value={state}
                    onChange={(e) => setState(e.target.value)}
                    placeholder="State"
                    className="w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-200 focus:border-emerald-300"
                  />
                </div>
                <div>
                  <FieldLabel>Pincode *</FieldLabel>
                  <input
                    value={pincode}
                    onChange={(e) => {
                      const next = e.target.value;
                      if (/^\d*$/.test(next)) setPincode(next);
                    }}
                    placeholder="Pincode"
                    inputMode="numeric"
                    className="w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-200 focus:border-emerald-300"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div>
                <FieldLabel>Preferred Pickup Date *</FieldLabel>
                <TextInput value={pickupDate} onChange={setPickupDate} type="date" />
              </div>
              <div>
                <FieldLabel>Preferred Time Slot *</FieldLabel>
                <Select value={timeSlot} onChange={(v) => setTimeSlot(v as TimeSlot)}>
                  <option value="">Select</option>
                  <option value="Morning">Morning</option>
                  <option value="Afternoon">Afternoon</option>
                  <option value="Evening">Evening</option>
                </Select>
              </div>
            </div>

            <div>
              <FieldLabel>Additional Notes (Optional)</FieldLabel>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key !== 'Enter') e.stopPropagation();
                }}
                placeholder="Anything NGOs should know before pickup"
                className="w-full min-h-[110px] rounded-2xl border border-gray-200 bg-white px-3.5 py-3 text-sm text-gray-900 placeholder:text-gray-400 shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-200 focus:border-emerald-300"
              />
            </div>

            <button
              type="submit"
              disabled={!canSubmit}
              className={
                'w-full rounded-2xl px-4 py-3 text-sm font-semibold transition-colors ' +
                (canSubmit
                  ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                  : 'bg-gray-100 text-gray-400 cursor-not-allowed')
              }
              onClick={() => {
                if (images.length === 0) setImageError('Please upload a clear image of the resource');
              }}
            >
              {submitLoading ? 'Submitting...' : 'Donate Resource'}
            </button>
          </form>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="h-screen bg-gradient-to-b from-gray-50 via-white to-emerald-50/30">
      <div className="flex h-screen">
        <Sidebar variant="desktop" />

        {mobileSidebarOpen && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <button
              type="button"
              aria-label="Close sidebar"
              className="absolute inset-0 bg-black/40"
              onClick={() => setMobileSidebarOpen(false)}
            />
            <div className="absolute left-0 top-0 bottom-0">
              <div className="relative h-full">
                <div className="absolute right-3 top-3">
                  <button
                    type="button"
                    className="h-10 w-10 rounded-xl bg-white border border-gray-100 shadow-sm flex items-center justify-center text-gray-700"
                    onClick={() => setMobileSidebarOpen(false)}
                  >
                    <FiX className="h-5 w-5" />
                  </button>
                </div>
                <Sidebar variant="mobile" />
              </div>
            </div>
          </div>
        )}

        <button
          type="button"
          aria-label="Open sidebar"
          className="lg:hidden fixed z-40 left-4 bottom-4 h-12 w-12 rounded-2xl bg-white shadow-lg border border-gray-100 flex items-center justify-center text-gray-800"
          onClick={() => setMobileSidebarOpen(true)}
        >
          <FiMenu className="h-5 w-5" />
        </button>

        <main className="flex-1 min-w-0 p-4 sm:p-6 lg:p-8 overflow-y-auto">
          {activeItem === 'dashboard' && (
            <div className="space-y-6">
              {dashboardError ? (
                <div className="rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-900">
                  {dashboardError}
                </div>
              ) : null}
              
              {/* Time-based Greeting */}
              {(() => {
                const hour = new Date().getHours();
                const greeting = hour < 12 ? 'Good Morning' : hour < 16 ? 'Good Afternoon' : 'Good Evening';
                const profileName = donorProfile?.basic?.name || user.displayName || user.email?.split('@')[0] || 'Donor';
                return (
                  <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                    <div>
                      <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
                        {greeting}, {profileName}!
                      </h1>
                      <p className="text-sm text-gray-600 mt-1">Here's your donation overview</p>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={loadDashboard}
                        className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-white border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50"
                      >
                        <FiRefreshCw className="h-4 w-4" />
                        Refresh
                      </button>
                      <button
                        type="button"
                        onClick={() => setActiveItem('donate-now')}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-700"
                      >
                        <FiPlusCircle className="h-4 w-4" />
                        Donate Again
                      </button>
                    </div>
                  </div>
                );
              })()}
              
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
                {(() => {
                  const totalDonations = dashboardData?.summary?.totalDonations ?? 0;
                  const activePickups = dashboardData?.summary?.activePickups ?? 0;
                  const completedDonations = dashboardData?.summary?.completedDonations ?? 0;
                  const recent = dashboardData?.recentDonations || [];
                  const ngosSupported = new Set(
                    recent
                      .map((d: any) => d?.assignedNGO?.ngoFirebaseUid || d?.assignedNGO?.ngoName)
                      .filter(Boolean)
                  ).size;
                  const livesImpacted = dashboardData?.impact?.peopleHelped ?? Math.round(totalDonations * 3);

                  const activity = dashboardData?.activity || [];
                  const last = Number(activity.length ? activity[activity.length - 1]?.count || 0 : 0);
                  const prev = Number(activity.length > 1 ? activity[activity.length - 2]?.count || 0 : 0);
                  const trendPct = prev > 0 ? Math.round(((last - prev) / prev) * 100) : last > 0 ? 100 : 0;
                  const trendDirection: 'up' | 'down' = last >= prev ? 'up' : 'down';

                  return (
                    <>
                      <SummaryCard
                        title="Total Donations Made"
                        icon={FiPackage}
                        value={dashboardLoading ? '--' : totalDonations}
                        subtitle="Till date"
                        tone="emerald"
                        trend={dashboardLoading ? undefined : { pct: trendPct, direction: trendDirection, label: 'vs last month' }}
                      />
                      <SummaryCard
                        title="Active Pickups"
                        icon={FiTruck}
                        value={dashboardLoading ? '--' : activePickups}
                        subtitle="In progress"
                        tone="amber"
                      />
                      <SummaryCard
                        title="Completed Donations"
                        icon={FiCheckCircle}
                        value={dashboardLoading ? '--' : completedDonations}
                        subtitle="Successfully delivered"
                        tone="blue"
                      />
                      <SummaryCard
                        title="NGOs Supported"
                        icon={FiUsers}
                        value={dashboardLoading ? '--' : ngosSupported}
                        subtitle="Unique partners"
                        tone="violet"
                      />
                      <SummaryCard
                        title="Estimated Lives Impacted"
                        icon={FiHeart}
                        value={dashboardLoading ? '--' : livesImpacted}
                        subtitle="Families helped"
                        tone="slate"
                      />
                    </>
                  );
                })()}
              </div>

              <section className="rounded-2xl bg-white border border-gray-100 shadow-sm p-5">
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div className="flex items-center gap-2">
                    <FiBarChart2 className="h-5 w-5 text-emerald-700" />
                    <h2 className="text-base font-semibold text-gray-900">Donation Activity</h2>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setActivityView('monthly')}
                      className={
                        'px-3 py-1.5 text-xs font-medium rounded-full border ' +
                        (activityView === 'monthly'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100')
                      }
                    >
                      Monthly
                    </button>
                    <button
                      type="button"
                      onClick={() => setActivityView('yearly')}
                      className={
                        'px-3 py-1.5 text-xs font-medium rounded-full border ' +
                        (activityView === 'yearly'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100')
                      }
                    >
                      Yearly
                    </button>
                  </div>
                </div>

                <div className="mt-4 rounded-xl border border-gray-200 bg-white p-5">
                  <div className="h-64 w-full p-4">
                    {(() => {
                      const monthlyFallback = Array.from({ length: 12 }).map((_, i) => {
                        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
                        const currentMonth = new Date().getMonth();
                        const monthIndex = (currentMonth - 11 + i + 12) % 12;
                        return { label: months[monthIndex], count: 0 };
                      });

                      const totalDonations = dashboardData?.summary?.totalDonations ?? 0;
                      const series: Array<{ label: string; count: number }> =
                        activityView === 'monthly'
                          ? (dashboardData?.activity || monthlyFallback)
                          : [
                              { label: String(new Date().getFullYear() - 2), count: 0 },
                              { label: String(new Date().getFullYear() - 1), count: Math.max(0, Math.floor(totalDonations * 0.35)) },
                              { label: String(new Date().getFullYear()), count: totalDonations },
                            ];

                      const max = Math.max(...series.map((x) => Number(x.count || 0)), 1);

                      const w = 1000;
                      const h = 200;
                      const padX = 30;
                      const padY = 16;
                      const n = Math.max(1, series.length);
                      const step = n === 1 ? 0 : (w - padX * 2) / (n - 1);

                      const points = series.map((a, i) => {
                        const x = padX + i * step;
                        const y = h - padY - (Number(a.count || 0) / max) * (h - padY * 2);
                        return { x, y, label: a.label, count: Number(a.count || 0) };
                      });

                      const d = points
                        .map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`)
                        .join(' ');

                      return (
                        <div className="h-full w-full">
                          <div className="h-[200px] w-full">
                            <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-full">
                              <path d={`M ${padX} ${h - padY} L ${w - padX} ${h - padY}`} stroke="#e5e7eb" strokeWidth="2" fill="none" />
                              <path d={d} stroke="#10b981" strokeWidth="3" fill="none" strokeLinejoin="round" strokeLinecap="round" />
                              {points.map((p, idx) => (
                                <g key={idx}>
                                  <title>{`${p.label}: ${p.count}`}</title>
                                  <circle cx={p.x} cy={p.y} r={6} fill="#ffffff" stroke="#10b981" strokeWidth="3" />
                                </g>
                              ))}
                            </svg>
                          </div>

                          <div className="mt-3 flex items-center justify-between text-xs text-gray-600">
                            {series.map((s, idx) => (
                              <span key={idx} className="font-medium">{s.label}</span>
                            ))}
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                  <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between">
                    <div className="text-sm text-gray-600">
                      {dashboardLoading
                        ? 'Loading...'
                        : (dashboardData?.summary?.totalDonations ?? 0) > 0
                          ? activityView === 'monthly'
                            ? 'Last 12 months'
                            : 'Yearly snapshot'
                          : 'No data available yet'}
                    </div>
                    <div className="text-xs text-gray-500">
                      Y-axis: Number of Donations
                    </div>
                  </div>
                </div>
              </section>

              <div className="grid gap-4 lg:grid-cols-2">
                <section className="rounded-2xl bg-white border border-gray-100 shadow-sm p-5">
                  <div className="flex items-center gap-2">
                    <FiPieChart className="h-5 w-5 text-emerald-700" />
                    <div>
                      <div className="text-base font-semibold text-gray-900">Resource Distribution</div>
                      <div className="text-sm text-gray-600">Based on recent donations</div>
                    </div>
                  </div>

                  <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
                    {(() => {
                      const recent = dashboardData?.recentDonations || [];
                      const counts = {
                        Food: 0,
                        Clothes: 0,
                        'Medical Supplies': 0,
                        'Other Essentials': 0,
                      } as Record<string, number>;

                      for (const d of recent) {
                        const rt = String(d?.resourceType || '').trim();
                        if (rt in counts) counts[rt] += 1;
                        else if (rt) counts['Other Essentials'] += 1;
                      }

                      const data = [
                        { label: 'Food', value: counts.Food, color: '#10b981' },
                        { label: 'Clothes', value: counts.Clothes, color: '#3b82f6' },
                        { label: 'Medical Supplies', value: counts['Medical Supplies'], color: '#f59e0b' },
                        { label: 'Other Essentials', value: counts['Other Essentials'], color: '#8b5cf6' },
                      ];

                      const total = data.reduce((s, x) => s + x.value, 0);
                      const radius = 38;
                      const circumference = 2 * Math.PI * radius;
                      let dashOffset = 0;

                      return (
                        <>
                          <div className="flex items-center justify-center">
                            <div className="relative w-44 h-44">
                              <svg viewBox="0 0 100 100" className="w-full h-full">
                                <g transform="rotate(-90 50 50)">
                                  <circle cx="50" cy="50" r={radius} fill="transparent" stroke="#e5e7eb" strokeWidth="14" />
                                  {(() => {
                                    if (total <= 0) return null;

                                    return data
                                      .filter((x) => x.value > 0)
                                      .map((seg, idx) => {
                                        const fraction = seg.value / total;
                                        const dash = Math.max(0.0001, fraction * circumference);
                                        const gap = Math.max(0, circumference - dash);
                                        const el = (
                                          <circle
                                            key={idx}
                                            cx="50"
                                            cy="50"
                                            r={radius}
                                            fill="transparent"
                                            stroke={seg.color}
                                            strokeWidth="14"
                                            strokeDasharray={`${dash} ${gap}`}
                                            strokeDashoffset={-dashOffset}
                                            strokeLinecap="round"
                                            className="hover:opacity-90 transition-opacity"
                                          />
                                        );
                                        dashOffset += dash;
                                        return (
                                          <g key={idx}>
                                            <title>{`${seg.label}: ${seg.value}`}</title>
                                            {el}
                                          </g>
                                        );
                                      });
                                  })()}
                                </g>
                              </svg>
                              <div className="absolute inset-0 flex items-center justify-center">
                                <div className="text-center">
                                  <div className="text-2xl font-bold text-gray-900">{total}</div>
                                  <div className="text-xs text-gray-600">Total</div>
                                </div>
                              </div>
                            </div>
                          </div>

                          <div className="space-y-2">
                            {data.map((row) => (
                              <div key={row.label} className="flex items-center gap-2">
                                <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: row.color }} />
                                <div className="text-sm text-gray-700 flex-1">{row.label}</div>
                                <div className="text-sm font-semibold text-gray-900">{row.value}</div>
                              </div>
                            ))}
                            {total === 0 && !dashboardLoading ? (
                              <div className="text-sm text-gray-500">No donations yet. Donate to see analytics.</div>
                            ) : null}
                          </div>
                        </>
                      );
                    })()}
                  </div>
                </section>

                <section className="rounded-2xl bg-white border border-gray-100 shadow-sm p-5">
                  <div className="flex items-center gap-2">
                    <FiTruck className="h-5 w-5 text-emerald-700" />
                    <div>
                      <div className="text-base font-semibold text-gray-900">Pickup Performance</div>
                      <div className="text-sm text-gray-600">Scheduled vs completed vs cancelled</div>
                    </div>
                  </div>

                  <div className="mt-5 space-y-4">
                    {(() => {
                      const recent = dashboardData?.recentDonations || [];
                      const scheduled = recent.filter((d: any) => ['pending', 'assigned'].includes(String(d?.status))).length;
                      const completed = recent.filter((d: any) => ['completed'].includes(String(d?.status))).length;
                      const cancelled = recent.filter((d: any) => ['cancelled', 'rejected'].includes(String(d?.status))).length;
                      const max = Math.max(scheduled, completed, cancelled, 1);

                      const rows = [
                        { label: 'Scheduled', value: scheduled, color: 'bg-amber-500' },
                        { label: 'Completed', value: completed, color: 'bg-emerald-600' },
                        { label: 'Cancelled', value: cancelled, color: 'bg-red-500' },
                      ];

                      return rows.map((r) => {
                        const pct = Math.round((r.value / max) * 100);
                        return (
                          <div key={r.label}>
                            <div className="flex items-center justify-between text-sm">
                              <div className="text-gray-700 font-medium">{r.label}</div>
                              <div className="text-gray-900 font-semibold">{r.value}</div>
                            </div>
                            <div className="mt-2 h-2.5 rounded-full bg-gray-100 overflow-hidden">
                              <div className={`h-full ${r.color}`} style={{ width: `${pct}%` }} />
                            </div>
                          </div>
                        );
                      });
                    })()}
                  </div>
                </section>
              </div>

              <section className="rounded-2xl bg-white border border-gray-100 shadow-sm p-5">
                <div className="flex items-center gap-2">
                  <FiHeart className="h-5 w-5 text-emerald-700" />
                  <div>
                    <div className="text-base font-semibold text-gray-900">Impact Insights</div>
                    <div className="text-sm text-gray-600">Estimated outcomes from your donations</div>
                  </div>
                </div>

                {(() => {
                  const recent = dashboardData?.recentDonations || [];

                  const foodSavedKg = Number(dashboardData?.impact?.foodSavedKg ?? 0);
                  const mealsServed = foodSavedKg > 0 ? Math.round(foodSavedKg * 2.5) : 0;

                  const clothesDistributed = recent.filter((d: any) => String(d?.resourceType) === 'Clothes').length;
                  const medicinesDelivered = recent.filter((d: any) => String(d?.resourceType) === 'Medical Supplies').length;
                  const booksDonated = recent.filter((d: any) => String(d?.resourceType) === 'Books').length;

                  const wasteReduced = Math.round(foodSavedKg * 10) / 10;

                  const items = [
                    { label: 'Meals Served', value: mealsServed, tone: 'bg-emerald-50 border-emerald-100' },
                    { label: 'Clothes Distributed', value: clothesDistributed, tone: 'bg-blue-50 border-blue-100' },
                    { label: 'Medicines Delivered', value: medicinesDelivered, tone: 'bg-violet-50 border-violet-100' },
                    { label: 'Books Donated', value: booksDonated, tone: 'bg-amber-50 border-amber-100' },
                    { label: 'Food Waste Reduced (kg)', value: wasteReduced, tone: 'bg-orange-50 border-orange-100' },
                  ];

                  return (
                    <>
                      <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
                        {items.map((it) => (
                          <div key={it.label} className={`rounded-2xl border p-4 ${it.tone}`}>
                            <div className="text-xs font-semibold tracking-wide text-gray-700">{it.label}</div>
                            <div className="mt-2 text-2xl font-semibold text-gray-900">{dashboardLoading ? '--' : it.value}</div>
                          </div>
                        ))}
                      </div>

                      <div className="mt-5 rounded-2xl border border-gray-200 bg-white p-5">
                        <div className="flex items-center justify-between">
                          <div className="text-sm font-semibold text-gray-900">Impact Histogram</div>
                          <div className="text-xs text-gray-500">Relative scale</div>
                        </div>

                        <div className="mt-4 h-56 w-full flex items-end justify-between gap-3">
                          {(() => {
                            const values = items.map((x) => Number(x.value || 0));
                            const max = Math.max(...values, 1);
                            const colors = ['bg-emerald-600', 'bg-blue-600', 'bg-violet-600', 'bg-amber-500', 'bg-gray-600'];
                            return items.map((it, idx) => {
                              const v = Number(it.value || 0);
                              const pct = Math.round((v / max) * 100);
                              const height = Math.max(14, (pct / 100) * 180);
                              return (
                                <div key={it.label} className="flex-1 flex flex-col items-center gap-2 min-w-0">
                                  <div className="w-full flex items-end" style={{ height: '180px' }}>
                                    <div
                                      className={`w-full rounded-t-xl ${colors[idx]} shadow-sm`}
                                      style={{ height: `${height}px` }}
                                      title={`${it.label}: ${v}`}
                                    />
                                  </div>
                                  <div className="text-[11px] text-gray-600 font-medium text-center leading-tight line-clamp-2">
                                    {it.label}
                                  </div>
                                  <div className="text-xs font-semibold text-gray-900">{dashboardLoading ? '--' : v}</div>
                                </div>
                              );
                            });
                          })()}
                        </div>
                      </div>
                    </>
                  );
                })()}
              </section>

              <div className="grid gap-4 lg:grid-cols-3">
                <section className="lg:col-span-2 rounded-2xl bg-white border border-gray-100 shadow-sm p-5">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-2">
                      <FiClock className="h-5 w-5 text-emerald-700" />
                      <div>
                        <div className="text-base font-semibold text-gray-900">Recent Activity</div>
                        <div className="text-sm text-gray-600">Your donation journey on ShareCare</div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-5 space-y-3">
                    {(() => {
                      const recent = dashboardData?.recentDonations || [];
                      const events: Array<{ at: number; title: string; meta: string; type: 'created' | 'assigned' | 'picked' | 'completed' }> = [];

                      for (const d of recent) {
                        const rt = String(d?.resourceType || 'Donation');
                        const ngoName = d?.assignedNGO?.ngoName ? String(d.assignedNGO.ngoName) : '';
                        const createdAt = d?.createdAt ? new Date(d.createdAt).getTime() : 0;
                        const updatedAt = d?.updatedAt ? new Date(d.updatedAt).getTime() : createdAt;
                        const pickupAt = d?.pickup?.pickupDate ? new Date(d.pickup.pickupDate).getTime() : 0;

                        if (createdAt) {
                          events.push({
                            at: createdAt,
                            type: 'created',
                            title: `${rt} donation created`,
                            meta: new Date(createdAt).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }),
                          });
                        }

                        if (String(d?.status) === 'assigned') {
                          const t = d?.assignedNGO?.assignedAt ? new Date(d.assignedNGO.assignedAt).getTime() : updatedAt;
                          events.push({
                            at: t,
                            type: 'assigned',
                            title: `Pickup assigned${ngoName ? ` to ${ngoName}` : ''}`,
                            meta:
                              (pickupAt
                                ? `Pickup: ${new Date(pickupAt).toLocaleDateString()}${d?.pickup?.timeSlot ? ` (${d.pickup.timeSlot})` : ''}`
                                : new Date(t).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })),
                          });
                        }

                        if (String(d?.status) === 'picked') {
                          const t = updatedAt;
                          events.push({
                            at: t,
                            type: 'picked',
                            title: `Donation picked up${ngoName ? ` by ${ngoName}` : ''}`,
                            meta: new Date(t).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }),
                          });
                        }

                        if (String(d?.status) === 'completed') {
                          const t = updatedAt;
                          events.push({
                            at: t,
                            type: 'completed',
                            title: `Donation delivered${ngoName ? ` via ${ngoName}` : ''}`,
                            meta: new Date(t).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }),
                          });
                        }
                      }

                      const sorted = events.sort((a, b) => b.at - a.at).slice(0, 7);

                      if (!sorted.length) {
                        return (
                          <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50 px-4 py-8 text-center">
                            <div className="text-sm font-semibold text-gray-900">No activity yet</div>
                            <div className="mt-1 text-sm text-gray-600">Once you donate, updates will appear here.</div>
                          </div>
                        );
                      }

                      const tone = (t: string) =>
                        t === 'completed'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                          : t === 'picked'
                            ? 'bg-blue-50 text-blue-700 border-blue-100'
                            : t === 'assigned'
                              ? 'bg-amber-50 text-amber-700 border-amber-100'
                              : 'bg-gray-50 text-gray-700 border-gray-100';

                      const icon = (t: string) =>
                        t === 'created'
                          ? <FiPlusCircle className="h-4 w-4" />
                          : t === 'assigned'
                            ? <FiTruck className="h-4 w-4" />
                            : t === 'picked'
                              ? <FiTag className="h-4 w-4" />
                              : <FiCheckCircle className="h-4 w-4" />;

                      return sorted.map((e, idx) => (
                        <div key={idx} className="flex items-start gap-3">
                          <div className={`mt-0.5 h-8 w-8 rounded-xl border flex items-center justify-center ${tone(e.type)}`}>
                            {icon(e.type)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium text-gray-900">{e.title}</div>
                            <div className="text-xs text-gray-500 mt-0.5">{e.meta}</div>
                          </div>
                        </div>
                      ));
                    })()}
                  </div>
                </section>

                <section className="rounded-2xl bg-white border border-gray-100 shadow-sm p-5">
                  <div className="text-base font-semibold text-gray-900">Quick Actions</div>
                  <div className="text-sm text-gray-600 mt-1">Shortcuts to keep donating</div>

                  <div className="mt-4 space-y-3">
                    <button
                      type="button"
                      onClick={() => setActiveItem('donate-now')}
                      className="w-full flex items-center justify-between gap-3 px-4 py-3 rounded-2xl bg-emerald-50 text-emerald-800 border border-emerald-100 hover:bg-emerald-100"
                    >
                      <span className="flex items-center gap-3">
                        <FiPlusCircle className="h-5 w-5" />
                        <span className="text-sm font-semibold">Donate Again</span>
                      </span>
                      <FiArrowUpRight className="h-4 w-4" />
                    </button>

                    <button
                      type="button"
                      onClick={() => setActiveItem('donation-history')}
                      className="w-full flex items-center justify-between gap-3 px-4 py-3 rounded-2xl bg-white text-gray-800 border border-gray-200 hover:bg-gray-50"
                    >
                      <span className="flex items-center gap-3">
                        <FiClock className="h-5 w-5 text-gray-700" />
                        <span className="text-sm font-semibold">View Donation History</span>
                      </span>
                      <FiArrowUpRight className="h-4 w-4 text-gray-600" />
                    </button>

                    <button
                      type="button"
                      onClick={() => setActiveItem('impact')}
                      className="w-full flex items-center justify-between gap-3 px-4 py-3 rounded-2xl bg-white text-gray-800 border border-gray-200 hover:bg-gray-50"
                    >
                      <span className="flex items-center gap-3">
                        <FiMapPin className="h-5 w-5 text-gray-700" />
                        <span className="text-sm font-semibold">Find Nearby NGO Needs</span>
                      </span>
                      <FiArrowUpRight className="h-4 w-4 text-gray-600" />
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setActiveItem('help-support');
                        setShowSupportForm(true);
                      }}
                      className="w-full flex items-center justify-between gap-3 px-4 py-3 rounded-2xl bg-white text-gray-800 border border-gray-200 hover:bg-gray-50"
                    >
                      <span className="flex items-center gap-3">
                        <FiMail className="h-5 w-5 text-gray-700" />
                        <span className="text-sm font-semibold">Contact Support</span>
                      </span>
                      <FiArrowUpRight className="h-4 w-4 text-gray-600" />
                    </button>
                  </div>
                </section>
              </div>

              <section className="rounded-2xl bg-white border border-gray-100 shadow-sm overflow-hidden">
                <div className="p-5 flex items-center justify-between">
                  <div className="text-base font-semibold text-gray-900">Recent Donations</div>
                </div>

                <div className="px-5 pb-5 overflow-x-auto">
                  <table className="min-w-[720px] w-full text-sm">
                    <thead className="text-left text-gray-500">
                      <tr>
                        <th className="py-3 pr-4 font-medium">Donation ID</th>
                        <th className="py-3 pr-4 font-medium">Resource Type</th>
                        <th className="py-3 pr-4 font-medium">Quantity</th>
                        <th className="py-3 pr-4 font-medium">Pickup Date</th>
                        <th className="py-3 pr-4 font-medium">Status</th>
                      </tr>
                    </thead>
                    <tbody className="text-gray-700">
                      {(dashboardData?.recentDonations || []).length === 0 ? (
                        <tr className="border-t border-gray-100">
                          <td className="py-4" colSpan={5}>
                            <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50 px-4 py-8 text-center">
                              <div className="text-sm font-semibold text-gray-900">
                                {dashboardLoading ? 'Loading...' : 'You haven’t made any donations yet.'}
                              </div>
                              <div className="mt-1 text-sm text-gray-600">
                                Your recent donations will appear here once you donate.
                              </div>
                            </div>
                          </td>
                        </tr>
                      ) : (
                        (dashboardData?.recentDonations || []).map((d: any) => (
                          <tr key={d._id} className="border-t border-gray-100">
                            <td className="py-3 pr-4 font-mono text-xs">{String(d._id).slice(-8)}</td>
                            <td className="py-3 pr-4">{d.resourceType}</td>
                            <td className="py-3 pr-4">
                              {d.quantity} {d.unit}
                            </td>
                            <td className="py-3 pr-4">
                              {d.pickup?.pickupDate ? new Date(d.pickup.pickupDate).toLocaleDateString() : '--'}
                            </td>
                            <td className="py-3 pr-4">
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                                <FiTag className="h-3.5 w-3.5" />
                                {d.status}
                              </span>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </section>

              <section className="rounded-2xl bg-white border border-gray-100 shadow-sm overflow-hidden">
                <div className="p-5 flex items-center justify-between">
                  <div className="text-base font-semibold text-gray-900">Active Pickups</div>
                </div>
                <div className="px-5 pb-5 overflow-x-auto">
                  <table className="min-w-[720px] w-full text-sm">
                    <thead className="text-left text-gray-500">
                      <tr>
                        <th className="py-3 pr-4 font-medium">NGO Name</th>
                        <th className="py-3 pr-4 font-medium">Pickup Slot</th>
                        <th className="py-3 pr-4 font-medium">Volunteer Assigned</th>
                        <th className="py-3 pr-4 font-medium">Status</th>
                        <th className="py-3 pr-4 font-medium">Action</th>
                      </tr>
                    </thead>
                    <tbody className="text-gray-700">
                      {(() => {
                        const actives = (dashboardData?.recentDonations || []).filter((d: any) =>
                          ['assigned'].includes(String(d.status))
                        );

                        if (actives.length === 0) {
                          return (
                            <tr className="border-t border-gray-100">
                              <td className="py-4" colSpan={5}>
                                <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50 px-4 py-8 text-center">
                                  <div className="text-sm font-semibold text-gray-900">
                                    {dashboardLoading ? 'Loading...' : 'No active pickups — you’re all caught up.'}
                                  </div>
                                  <div className="mt-1 text-sm text-gray-600">
                                    Once an NGO starts processing your donation, it will show up here.
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() => setActiveItem('donate-now')}
                                    className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-700"
                                  >
                                    <FiPlusCircle className="h-4 w-4" />
                                    Donate Again
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        }

                        return actives.map((d: any) => (
                          <tr key={d._id} className="border-t border-gray-100">
                            <td className="py-3 pr-4">
                              {d.assignedNGO?.ngoName || '--'}
                            </td>
                            <td className="py-3 pr-4">
                              {d.pickup?.pickupDate ? new Date(d.pickup.pickupDate).toLocaleDateString() : '--'} {d.pickup?.timeSlot ? `(${d.pickup.timeSlot})` : ''}
                            </td>
                            <td className="py-3 pr-4">
                              {/* Volunteer assigned field - placeholder for now */}
                              {d.status === 'assigned' ? 'Pending' : '--'}
                            </td>
                            <td className="py-3 pr-4">
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                                <FiTag className="h-3.5 w-3.5" />
                                {d.status}
                              </span>
                            </td>
                            <td className="py-3 pr-4">
                              <button
                                type="button"
                                className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-gray-50 border border-gray-200 text-xs font-semibold text-gray-700 hover:bg-gray-100"
                              >
                                Track Pickup
                                <FiMapPin className="h-4 w-4" />
                              </button>
                            </td>
                          </tr>
                        ));
                      })()}
                    </tbody>
                  </table>
                </div>
              </section>
            </div>
          )}

          {activeItem === 'donate-now' && <DonateNowForm />}

          {activeItem === 'impact' && (
            <div className="space-y-6">
              <section className="rounded-2xl bg-white border border-gray-100 shadow-sm p-5">
                <div className="flex items-center gap-2 mb-4">
                  <FiUsers className="h-5 w-5 text-emerald-700" />
                  <h2 className="text-base font-semibold text-gray-900">Impact Summary</h2>
                </div>

                <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
                  <div className="rounded-2xl border border-gray-100 bg-white p-4">
                    <div className="text-xs font-semibold tracking-wide text-gray-600">People Helped</div>
                    <div className="mt-2 text-2xl font-semibold text-gray-900">
                      {dashboardLoading ? '--' : dashboardData?.impact?.peopleHelped ?? 0}
                    </div>
                  </div>
                  <div className="rounded-2xl border border-gray-100 bg-white p-4">
                    <div className="text-xs font-semibold tracking-wide text-gray-600">NGOs Connected</div>
                    <div className="mt-2 text-2xl font-semibold text-gray-900">
                      {dashboardLoading ? '--' : dashboardData?.impact?.ngosConnected ?? 0}
                    </div>
                  </div>
                  <div className="rounded-2xl border border-gray-100 bg-white p-4">
                    <div className="text-xs font-semibold tracking-wide text-gray-600">Resources Donated</div>
                    <div className="mt-2 text-2xl font-semibold text-gray-900">
                      {dashboardLoading ? '--' : dashboardData?.impact?.resourcesDonated ?? 0}
                    </div>
                  </div>
                  <div className="rounded-2xl border border-gray-100 bg-white p-4">
                    <div className="text-xs font-semibold tracking-wide text-gray-600">Food Saved (kg)</div>
                    <div className="mt-2 text-2xl font-semibold text-gray-900">
                      {dashboardLoading ? '--' : Math.round((dashboardData?.impact?.foodSavedKg ?? 0) * 10) / 10}
                    </div>
                  </div>
                </div>
              </section>

              {/* Impact Stories with Images */}
              <section className="rounded-2xl bg-white border border-gray-100 shadow-sm p-5">
                <div className="flex items-center gap-2 mb-4">
                  <FiHeart className="h-5 w-5 text-emerald-700" />
                  <h2 className="text-base font-semibold text-gray-900">Impact Stories</h2>
                </div>

                <div className="grid gap-4 grid-cols-1 md:grid-cols-3">
                  <div className="relative rounded-xl overflow-hidden group cursor-pointer">
                    <img 
                      src="/src/assets/poor1.jpg" 
                      alt="Helping communities" 
                      className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <div className="absolute bottom-3 left-3 right-3">
                        <p className="text-white text-sm font-medium">Your donations bring hope to families in need</p>
                      </div>
                    </div>
                  </div>
                  <div className="relative rounded-xl overflow-hidden group cursor-pointer">
                    <img 
                      src="/src/assets/poor2.jpg" 
                      alt="Community support" 
                      className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <div className="absolute bottom-3 left-3 right-3">
                        <p className="text-white text-sm font-medium">Together we build stronger communities</p>
                      </div>
                    </div>
                  </div>
                  <div className="relative rounded-xl overflow-hidden group cursor-pointer">
                    <img 
                      src="/src/assets/poor3.jpg" 
                      alt="Making a difference" 
                      className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <div className="absolute bottom-3 left-3 right-3">
                        <p className="text-white text-sm font-medium">Every donation creates lasting change</p>
                      </div>
                    </div>
                  </div>
                </div>
              </section>

              {/* Impact Charts */}
              <section className="rounded-2xl bg-white border border-gray-100 shadow-sm p-5">
                <div className="flex items-center gap-2 mb-4">
                  <FiBarChart2 className="h-5 w-5 text-emerald-700" />
                  <h2 className="text-base font-semibold text-gray-900">Impact Over Time</h2>
                </div>

                <div className="mt-4 rounded-xl border border-gray-200 bg-white p-5">
                  <div className="h-64 w-full flex items-end justify-between gap-2 p-4">
                    {(dashboardData?.activity || Array.from({ length: 6 }).map((_, i) => {
                      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
                      return { label: months[i], count: 0 };
                    })).slice(-6).map((a: any, i: number) => {
                      const max = Math.max(...(dashboardData?.activity || []).map((x: any) => x.count), 1);
                      const pct = Math.round((Number(a.count || 0) / max) * 100);
                      const height = Math.max(20, (pct / 100) * 200);
                      return (
                        <div key={i} className="flex-1 flex flex-col items-center gap-2">
                          <div className="relative w-full flex items-end justify-center" style={{ height: '200px' }}>
                            <div
                              className="w-full rounded-t-md bg-gradient-to-t from-blue-500 to-blue-400 hover:from-blue-600 hover:to-blue-500 transition-all cursor-pointer shadow-sm"
                              style={{ height: `${height}px`, minHeight: a.count > 0 ? '20px' : '0px' }}
                              title={a.label ? `${a.label}: ${a.count} donation${a.count !== 1 ? 's' : ''}` : undefined}
                            />
                          </div>
                          <div className="text-xs text-gray-600 font-medium mt-2">{a.label || ''}</div>
                          {a.count > 0 && (
                            <div className="text-xs font-semibold text-blue-700">{a.count}</div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                  <div className="mt-4 pt-4 border-t border-gray-100 text-sm text-gray-600">
                    Last 6 months donation activity
                  </div>
                </div>
              </section>

              {/* Resource Type Distribution */}
              <section className="rounded-2xl bg-white border border-gray-100 shadow-sm p-5">
                <div className="flex items-center gap-2 mb-4">
                  <FiPackage className="h-5 w-5 text-emerald-700" />
                  <h2 className="text-base font-semibold text-gray-900">Resource Type Distribution</h2>
                </div>

                <div className="mt-4">
                  {(() => {
                    const resourceTypes = ['Food', 'Clothes', 'Books', 'Medical Supplies', 'Other Essentials'];
                    const donations = dashboardData?.recentDonations || [];
                    const typeCounts = resourceTypes.map(type => ({
                      type,
                      count: donations.filter((d: any) => d.resourceType === type).length
                    }));
                    const maxCount = Math.max(...typeCounts.map(t => t.count), 1);

                    return (
                      <div className="space-y-3">
                        {typeCounts.map((item, i) => {
                          const pct = (item.count / maxCount) * 100;
                          return (
                            <div key={i} className="flex items-center gap-3">
                              <div className="w-24 text-sm text-gray-700 font-medium">{item.type}</div>
                              <div className="flex-1 h-8 bg-gray-100 rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-gradient-to-r from-emerald-400 to-emerald-600 rounded-full flex items-center justify-end pr-2 transition-all"
                                  style={{ width: `${pct}%` }}
                                >
                                  {item.count > 0 && (
                                    <span className="text-xs font-semibold text-white">{item.count}</span>
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    );
                  })()}
                </div>
              </section>
            </div>
          )}

          {activeItem === 'my-donations' && (() => {
            // Calculate summary metrics
            const totalDonations = myDonations.length;
            const totalQuantity = myDonations.reduce((sum, d) => sum + (d.quantity || 0), 0);
            const activePickups = myDonations.filter((d: any) => ['assigned', 'picked'].includes(d.status)).length;
            const ngosSupported = new Set(myDonations.filter((d: any) => d.assignedNGO?.ngoFirebaseUid).map((d: any) => d.assignedNGO.ngoFirebaseUid)).size;

            // Build timeline events from donations
            const buildTimelineEvents = () => {
              const events: Array<{
                date: Date;
                type: string;
                description: string;
                donationId: string;
                icon: React.ReactNode;
              }> = [];

              myDonations.forEach((d: any) => {
                // Donation created
                if (d.createdAt) {
                  events.push({
                    date: new Date(d.createdAt),
                    type: 'created',
                    description: `Donation created: ${d.resourceType} (${d.quantity} ${d.unit})`,
                    donationId: d._id,
                    icon: <FiPlusCircle className="h-4 w-4" />
                  });
                }

                // Pickup scheduled
                if (d.pickup?.pickupDate) {
                  events.push({
                    date: new Date(d.pickup.pickupDate),
                    type: 'scheduled',
                    description: `Pickup scheduled: ${d.pickup.timeSlot || 'TBD'}`,
                    donationId: d._id,
                    icon: <FiCalendar className="h-4 w-4" />
                  });
                }

                // NGO assigned
                if (d.assignedNGO?.assignedAt) {
                  events.push({
                    date: new Date(d.assignedNGO.assignedAt),
                    type: 'assigned',
                    description: `Assigned to ${d.assignedNGO.ngoName || 'NGO'}`,
                    donationId: d._id,
                    icon: <FiUsers className="h-4 w-4" />
                  });
                }

                // Picked up
                if (d.status === 'picked' && d.updatedAt) {
                  events.push({
                    date: new Date(d.updatedAt),
                    type: 'picked',
                    description: 'Donation picked up',
                    donationId: d._id,
                    icon: <FiTruck className="h-4 w-4" />
                  });
                }

                // Completed/Delivered
                if (d.status === 'completed' && d.updatedAt) {
                  events.push({
                    date: new Date(d.updatedAt),
                    type: 'completed',
                    description: 'Donation completed and delivered',
                    donationId: d._id,
                    icon: <FiCheckCircle className="h-4 w-4" />
                  });
                }
              });

              // Sort by date (newest first)
              return events.sort((a, b) => b.date.getTime() - a.date.getTime()).slice(0, 10);
            };

            const timelineEvents = buildTimelineEvents();

            return (
              <div className="space-y-6">
                {myDonationsError ? (
                  <div className="rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-900">
                    {myDonationsError}
                  </div>
                ) : null}

                <section className="rounded-2xl bg-white border border-gray-100 shadow-sm overflow-hidden">
                  <div className="p-5 flex items-center justify-between">
                    <div className="text-base font-semibold text-gray-900">My Donations</div>
                    <button
                      type="button"
                      onClick={loadMyDonations}
                      className="px-3 py-2 text-xs font-semibold rounded-xl bg-gray-50 border border-gray-100 text-gray-700 hover:bg-gray-100"
                    >
                      Refresh
                    </button>
                  </div>

                  <div className="px-5 pb-5 overflow-x-auto">
                    <table className="min-w-[820px] w-full text-sm">
                      <thead className="text-left text-gray-500">
                        <tr>
                          <th className="py-3 pr-4 font-medium">Donation ID</th>
                          <th className="py-3 pr-4 font-medium">Resource Type</th>
                          <th className="py-3 pr-4 font-medium">Quantity</th>
                          <th className="py-3 pr-4 font-medium">Created At</th>
                          <th className="py-3 pr-4 font-medium">Pickup Date</th>
                          <th className="py-3 pr-4 font-medium">Time Slot</th>
                          <th className="py-3 pr-4 font-medium">Status</th>
                        </tr>
                      </thead>
                      <tbody className="text-gray-700">
                        {myDonationsLoading ? (
                          <tr className="border-t border-gray-100">
                            <td className="py-4" colSpan={7}>
                              <div className="text-sm text-gray-600">Loading...</div>
                            </td>
                          </tr>
                        ) : myDonations.length === 0 ? (
                          <tr className="border-t border-gray-100">
                            <td className="py-4" colSpan={7}>
                              <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50 px-4 py-8 text-center">
                                <div className="text-sm font-semibold text-gray-900">No donations found</div>
                                <div className="mt-1 text-sm text-gray-600">Donate something and it will appear here.</div>
                              </div>
                            </td>
                          </tr>
                        ) : (
                          myDonations.map((d) => (
                            <tr key={d._id} className="border-t border-gray-100">
                              <td className="py-3 pr-4 font-mono text-xs">{String(d._id).slice(-8)}</td>
                              <td className="py-3 pr-4">{d.resourceType}</td>
                              <td className="py-3 pr-4">
                                {d.quantity} {d.unit}
                              </td>
                              <td className="py-3 pr-4 text-xs text-gray-600">
                                {d.createdAt ? new Date(d.createdAt).toLocaleString('en-IN', {
                                  day: '2-digit',
                                  month: 'short',
                                  year: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit'
                                }) : '--'}
                              </td>
                              <td className="py-3 pr-4">
                                {d.pickup?.pickupDate ? new Date(d.pickup.pickupDate).toLocaleDateString() : '--'}
                              </td>
                              <td className="py-3 pr-4">{d.pickup?.timeSlot || '--'}</td>
                              <td className="py-3 pr-4">
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                                  <FiTag className="h-3.5 w-3.5" />
                                  {d.status}
                                </span>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </section>

                {/* Donation Summary Pie Chart */}
                {myDonations.length > 0 && (
                  <section className="rounded-2xl bg-white border border-gray-100 shadow-sm p-5">
                    <h3 className="text-sm font-semibold text-gray-700 mb-4">Donation Summary</h3>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      {/* Pie Chart */}
                      <div className="flex flex-col items-center">
                        <div className="relative w-64 h-64">
                          <svg viewBox="0 0 100 100" className="transform -rotate-90 w-full h-full">
                            {(() => {
                              const data = [
                                { label: 'Total Donations', value: totalDonations, color: '#10b981' },
                                { label: 'Items Donated', value: totalQuantity, color: '#3b82f6' },
                                { label: 'Active Pickups', value: activePickups, color: '#f59e0b' },
                                { label: 'NGOs Supported', value: ngosSupported, color: '#8b5cf6' }
                              ];
                              
                              const total = data.reduce((sum, item) => sum + item.value, 0);
                              let currentAngle = 0;
                              
                              return data.map((item, index) => {
                                if (item.value === 0) return null;
                                
                                const percentage = (item.value / total) * 100;
                                const angle = (percentage / 100) * 360;
                                const startAngle = currentAngle;
                                const endAngle = currentAngle + angle;
                                
                                const x1 = 50 + 40 * Math.cos((startAngle * Math.PI) / 180);
                                const y1 = 50 + 40 * Math.sin((startAngle * Math.PI) / 180);
                                const x2 = 50 + 40 * Math.cos((endAngle * Math.PI) / 180);
                                const y2 = 50 + 40 * Math.sin((endAngle * Math.PI) / 180);
                                
                                const largeArcFlag = angle > 180 ? 1 : 0;
                                
                                const pathData = [
                                  `M 50 50`,
                                  `L ${x1} ${y1}`,
                                  `A 40 40 0 ${largeArcFlag} 1 ${x2} ${y2}`,
                                  'Z'
                                ].join(' ');
                                
                                currentAngle = endAngle;
                                
                                return (
                                  <g key={index}>
                                    <title>{`${item.label}: ${item.value}`}</title>
                                    <path
                                      d={pathData}
                                      fill={item.color}
                                      className="hover:opacity-80 transition-opacity cursor-pointer"
                                    />
                                  </g>
                                );
                              });
                            })()}
                          </svg>
                          
                          {/* Center circle for donut effect */}
                          <div className="absolute inset-0 flex items-center justify-center">
                            <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center">
                              <div className="text-center">
                                <div className="text-2xl font-bold text-gray-900">{totalDonations}</div>
                                <div className="text-xs text-gray-600">Total</div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      {/* Legend */}
                      <div className="space-y-3">
                        <div className="flex items-center gap-3">
                          <div className="w-4 h-4 rounded-full bg-emerald-500"></div>
                          <div className="flex-1">
                            <div className="text-sm font-medium text-gray-900">Total Donations</div>
                            <div className="text-xs text-gray-600">{totalDonations} donations</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="w-4 h-4 rounded-full bg-blue-500"></div>
                          <div className="flex-1">
                            <div className="text-sm font-medium text-gray-900">Items Donated</div>
                            <div className="text-xs text-gray-600">{totalQuantity.toLocaleString()} items</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="w-4 h-4 rounded-full bg-amber-500"></div>
                          <div className="flex-1">
                            <div className="text-sm font-medium text-gray-900">Active Pickups</div>
                            <div className="text-xs text-gray-600">{activePickups} pickups</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="w-4 h-4 rounded-full bg-violet-500"></div>
                          <div className="flex-1">
                            <div className="text-sm font-medium text-gray-900">NGOs Supported</div>
                            <div className="text-xs text-gray-600">{ngosSupported} NGOs</div>
                          </div>
                        </div>
                        
                        {/* Summary Stats */}
                        <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                          <div className="text-xs font-medium text-gray-700 mb-2">Quick Stats</div>
                          <div className="grid grid-cols-2 gap-2 text-xs">
                            <div>
                              <span className="text-gray-600">Avg Items/Donation:</span>
                              <span className="ml-1 font-medium text-gray-900">
                                {totalDonations > 0 ? Math.round(totalQuantity / totalDonations) : 0}
                              </span>
                            </div>
                            <div>
                              <span className="text-gray-600">Pickup Rate:</span>
                              <span className="ml-1 font-medium text-gray-900">
                                {totalDonations > 0 ? Math.round((activePickups / totalDonations) * 100) : 0}%
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </section>
                )}

                {/* Recent Activity Timeline */}
                {timelineEvents.length > 0 && (
                  <section className="rounded-2xl bg-white border border-gray-100 shadow-sm p-5">
                    <h3 className="text-sm font-semibold text-gray-700 mb-4">Recent Activity Timeline</h3>
                    <div className="relative">
                      {/* Timeline line */}
                      <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200" />
                      
                      <div className="space-y-4">
                        {timelineEvents.map((event, index) => {
                          const getEventColor = () => {
                            switch (event.type) {
                              case 'created': return 'text-blue-600 bg-blue-50 border-blue-200';
                              case 'scheduled': return 'text-purple-600 bg-purple-50 border-purple-200';
                              case 'assigned': return 'text-orange-600 bg-orange-50 border-orange-200';
                              case 'picked': return 'text-indigo-600 bg-indigo-50 border-indigo-200';
                              case 'completed': return 'text-emerald-600 bg-emerald-50 border-emerald-200';
                              default: return 'text-gray-600 bg-gray-50 border-gray-200';
                            }
                          };

                          return (
                            <div key={`${event.donationId}-${index}`} className="relative flex items-start gap-4 pl-2">
                              {/* Timeline dot */}
                              <div className={`relative z-10 flex-shrink-0 w-8 h-8 rounded-full border-2 ${getEventColor()} flex items-center justify-center`}>
                                {event.icon}
                              </div>
                              
                              {/* Event content */}
                              <div className="flex-1 min-w-0 pt-1">
                                <div className="text-sm text-gray-900 font-medium">{event.description}</div>
                                <div className="text-xs text-gray-500 mt-1">
                                  {event.date.toLocaleString('en-IN', {
                                    day: '2-digit',
                                    month: 'short',
                                    year: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit'
                                  })}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </section>
                )}
              </div>
            );
          })()}

          {activeItem === 'help-support' && (
            <div className="space-y-6">
              {/* Page Header */}
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-700">
                  <FiHelpCircle className="h-5 w-5" />
                </div>
                <div>
                  <h1 className="text-2xl font-semibold text-gray-900">Help & Support</h1>
                  <p className="text-sm text-gray-600 mt-1">Get assistance and find answers</p>
                </div>
              </div>

              {/* FAQ Section */}
              <section className="rounded-2xl bg-white border border-gray-100 shadow-sm p-6">
                <div className="mb-4">
                  <h2 className="text-lg font-semibold text-gray-900 mb-2">Frequently Asked Questions</h2>
                  <p className="text-sm text-gray-600">Find answers to common questions about donations, pickups, and more.</p>
                </div>

                {faqsLoading ? (
                  <div className="py-8 text-center text-sm text-gray-600">Loading FAQs...</div>
                ) : faqsError ? (
                  <div className="py-8 text-center">
                    <div className="text-sm text-red-600 mb-2">{faqsError}</div>
                    <button
                      onClick={loadFaqs}
                      className="text-sm text-emerald-600 hover:text-emerald-700"
                    >
                      Try again
                    </button>
                  </div>
                ) : faqs.length === 0 ? (
                  <div className="py-8 text-center text-sm text-gray-600">
                    No FAQs available at the moment.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {(() => {
                      // Group FAQs by category
                      const categories = ['Donation Process', 'Pickup & Delivery', 'Account & Profile', 'Safety & Guidelines', 'General'];
                      const groupedFaqs = categories.map(cat => ({
                        category: cat,
                        faqs: faqs.filter((f: any) => (f.category || 'General') === cat)
                      })).filter(group => group.faqs.length > 0);

                      return groupedFaqs.map((group) => (
                        <div key={group.category} className="mb-6">
                          <h3 className="text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wide">
                            {group.category}
                          </h3>
                          <div className="space-y-2">
                            {group.faqs.map((faq: any) => {
                              const isExpanded = expandedFaq === faq._id;
                              return (
                                <div
                                  key={faq._id}
                                  className="border border-gray-200 rounded-lg overflow-hidden"
                                >
                                  <button
                                    onClick={() => setExpandedFaq(isExpanded ? null : faq._id)}
                                    className="w-full px-4 py-3 text-left flex items-center justify-between hover:bg-gray-50 transition-colors"
                                  >
                                    <span className="text-sm font-medium text-gray-900 pr-4">
                                      {faq.question}
                                    </span>
                                    <svg
                                      className={`h-5 w-5 text-gray-500 flex-shrink-0 transition-transform ${
                                        isExpanded ? 'transform rotate-180' : ''
                                      }`}
                                      fill="none"
                                      viewBox="0 0 24 24"
                                      stroke="currentColor"
                                    >
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                    </svg>
                                  </button>
                                  {isExpanded && (
                                    <div className="px-4 py-3 bg-gray-50 border-t border-gray-200">
                                      <p className="text-sm text-gray-700 whitespace-pre-line leading-relaxed">
                                        {faq.answer}
                                      </p>
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      ));
                    })()}
                  </div>
                )}
              </section>

              {/* Contact Support Section */}
              <section className="rounded-2xl bg-white border border-gray-100 shadow-sm p-6">
                <div className="mb-4">
                  <h2 className="text-lg font-semibold text-gray-900 mb-2">Contact Support</h2>
                  <p className="text-sm text-gray-600">Reach out to our support team for personalized assistance.</p>
                </div>

                <div className="space-y-4">
                  <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg border border-gray-100">
                    <FiMail className="h-5 w-5 text-gray-600 mt-0.5 flex-shrink-0" />
                    <div className="flex-1">
                      <div className="text-sm font-medium text-gray-900 mb-1">Support Email</div>
                      <a
                        href="mailto:admin@sharecare.org"
                        className="text-sm text-emerald-600 hover:text-emerald-700"
                      >
                        admin@sharecare.org
                      </a>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg border border-gray-100">
                    <FiPhone className="h-5 w-5 text-gray-600 mt-0.5 flex-shrink-0" />
                    <div className="flex-1">
                      <div className="text-sm font-medium text-gray-900 mb-1">Admin Contact</div>
                      <a
                        href="tel:+919876543210"
                        className="text-sm text-emerald-600 hover:text-emerald-700"
                      >
                        +91 98765 43210
                      </a>
                    </div>
                  </div>

                  <button
                    onClick={() => setShowSupportForm(true)}
                    className="w-full sm:w-auto px-4 py-2.5 text-sm font-medium text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 transition-colors flex items-center justify-center gap-2"
                  >
                    <FiMail className="h-4 w-4" />
                    Raise a Support Request
                  </button>
                </div>
              </section>

              {/* User Guide Section */}
              <section className="rounded-2xl bg-white border border-gray-100 shadow-sm p-6">
                <div className="mb-4">
                  <h2 className="text-lg font-semibold text-gray-900 mb-2">User Guide</h2>
                  <p className="text-sm text-gray-600">Learn how to use all features of the donation platform.</p>
                </div>

                <div className="space-y-6">
                  {/* How to Donate */}
                  <div>
                    <h3 className="text-base font-semibold text-gray-900 mb-3 flex items-center gap-2">
                      <FiPlusCircle className="h-5 w-5 text-emerald-600" />
                      How to Donate
                    </h3>
                    <div className="pl-7 space-y-2">
                      <div className="flex items-start gap-3">
                        <span className="flex-shrink-0 w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 text-xs font-semibold flex items-center justify-center mt-0.5">
                          1
                        </span>
                        <p className="text-sm text-gray-700">Click on "Donate Now" in the sidebar menu</p>
                      </div>
                      <div className="flex items-start gap-3">
                        <span className="flex-shrink-0 w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 text-xs font-semibold flex items-center justify-center mt-0.5">
                          2
                        </span>
                        <p className="text-sm text-gray-700">Select the resource type (Food, Clothes, Books, Medical Supplies, or Other Essentials)</p>
                      </div>
                      <div className="flex items-start gap-3">
                        <span className="flex-shrink-0 w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 text-xs font-semibold flex items-center justify-center mt-0.5">
                          3
                        </span>
                        <p className="text-sm text-gray-700">Fill in the required details including quantity, address, and pickup preferences</p>
                      </div>
                      <div className="flex items-start gap-3">
                        <span className="flex-shrink-0 w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 text-xs font-semibold flex items-center justify-center mt-0.5">
                          4
                        </span>
                        <p className="text-sm text-gray-700">Upload clear images of the items you're donating</p>
                      </div>
                      <div className="flex items-start gap-3">
                        <span className="flex-shrink-0 w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 text-xs font-semibold flex items-center justify-center mt-0.5">
                          5
                        </span>
                        <p className="text-sm text-gray-700">Submit your donation request</p>
                      </div>
                    </div>
                  </div>

                  {/* How Pickup Works */}
                  <div>
                    <h3 className="text-base font-semibold text-gray-900 mb-3 flex items-center gap-2">
                      <FiTruck className="h-5 w-5 text-emerald-600" />
                      How Pickup Works
                    </h3>
                    <div className="pl-7 space-y-2">
                      <div className="flex items-start gap-3">
                        <span className="flex-shrink-0 w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 text-xs font-semibold flex items-center justify-center mt-0.5">
                          1
                        </span>
                        <p className="text-sm text-gray-700">After submission, your donation is reviewed by our team</p>
                      </div>
                      <div className="flex items-start gap-3">
                        <span className="flex-shrink-0 w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 text-xs font-semibold flex items-center justify-center mt-0.5">
                          2
                        </span>
                        <p className="text-sm text-gray-700">An NGO is assigned to your donation based on their needs and location</p>
                      </div>
                      <div className="flex items-start gap-3">
                        <span className="flex-shrink-0 w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 text-xs font-semibold flex items-center justify-center mt-0.5">
                          3
                        </span>
                        <p className="text-sm text-gray-700">You'll be notified when the pickup is scheduled</p>
                      </div>
                      <div className="flex items-start gap-3">
                        <span className="flex-shrink-0 w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 text-xs font-semibold flex items-center justify-center mt-0.5">
                          4
                        </span>
                        <p className="text-sm text-gray-700">A volunteer will arrive at your specified address during the chosen time slot</p>
                      </div>
                      <div className="flex items-start gap-3">
                        <span className="flex-shrink-0 w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 text-xs font-semibold flex items-center justify-center mt-0.5">
                          5
                        </span>
                        <p className="text-sm text-gray-700">Once picked up, the donation status updates to "Picked" and then "Completed" after delivery</p>
                      </div>
                    </div>
                  </div>

                  {/* How to Track Donations */}
                  <div>
                    <h3 className="text-base font-semibold text-gray-900 mb-3 flex items-center gap-2">
                      <FiPackage className="h-5 w-5 text-emerald-600" />
                      How to Track Donations
                    </h3>
                    <div className="pl-7 space-y-2">
                      <div className="flex items-start gap-3">
                        <span className="flex-shrink-0 w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 text-xs font-semibold flex items-center justify-center mt-0.5">
                          1
                        </span>
                        <p className="text-sm text-gray-700">Go to "My Donations" to see all your donation requests</p>
                      </div>
                      <div className="flex items-start gap-3">
                        <span className="flex-shrink-0 w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 text-xs font-semibold flex items-center justify-center mt-0.5">
                          2
                        </span>
                        <p className="text-sm text-gray-700">Check the status column to see current state: Pending, Assigned, Picked, or Completed</p>
                      </div>
                      <div className="flex items-start gap-3">
                        <span className="flex-shrink-0 w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 text-xs font-semibold flex items-center justify-center mt-0.5">
                          3
                        </span>
                        <p className="text-sm text-gray-700">View the "Recent Activity Timeline" below the table for detailed event history</p>
                      </div>
                    </div>
                  </div>

                  {/* How to View Donation History */}
                  <div>
                    <h3 className="text-base font-semibold text-gray-900 mb-3 flex items-center gap-2">
                      <FiClock className="h-5 w-5 text-emerald-600" />
                      How to View Donation History
                    </h3>
                    <div className="pl-7 space-y-2">
                      <div className="flex items-start gap-3">
                        <span className="flex-shrink-0 w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 text-xs font-semibold flex items-center justify-center mt-0.5">
                          1
                        </span>
                        <p className="text-sm text-gray-700">Navigate to "Donation History" in the sidebar</p>
                      </div>
                      <div className="flex items-start gap-3">
                        <span className="flex-shrink-0 w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 text-xs font-semibold flex items-center justify-center mt-0.5">
                          2
                        </span>
                        <p className="text-sm text-gray-700">View all completed donations with details including NGO name and completion date</p>
                      </div>
                      <div className="flex items-start gap-3">
                        <span className="flex-shrink-0 w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 text-xs font-semibold flex items-center justify-center mt-0.5">
                          3
                        </span>
                        <p className="text-sm text-gray-700">Use the summary cards to see your total impact at a glance</p>
                      </div>
                    </div>
                  </div>
                </div>
              </section>
            </div>
          )}

          {activeItem === 'notifications' && (
            <div className="space-y-6">
              {/* Header */}
              <div className="rounded-2xl bg-gradient-to-r from-emerald-50 to-blue-50 border border-emerald-100 shadow-sm p-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-xl bg-emerald-600 border border-emerald-200 flex items-center justify-center text-white shadow-lg">
                      <FiBell className="h-6 w-6" />
                    </div>
                    <div>
                      <div className="text-xl font-bold text-gray-900">Stay Connected</div>
                      <div className="text-sm text-gray-600 mt-1">Track your impact and never miss an update</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={async () => {
                        try {
                          await markAllNotificationsRead();
                          await loadNotifications();
                        } catch {}
                      }}
                      className="px-4 py-2 text-sm font-semibold rounded-xl bg-white border border-emerald-200 text-emerald-700 hover:bg-emerald-50 shadow-sm transition-all"
                    >
                      Mark all read
                    </button>
                    <button
                      type="button"
                      onClick={() => loadNotifications()}
                      className="px-4 py-2 text-sm font-semibold rounded-xl bg-white border border-emerald-200 text-emerald-700 hover:bg-emerald-50 shadow-sm transition-all"
                    >
                      Refresh
                    </button>
                  </div>
                </div>

                {/* Filter Tabs */}
                <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
                  <div className="flex flex-wrap gap-2">
                    {(
                      [
                        { key: 'all', label: 'All Notifications', icon: FiGrid },
                        { key: 'donations', label: 'Donations', icon: FiPackage },
                        { key: 'pickups', label: 'Pickups', icon: FiTruck },
                        { key: 'system', label: 'System', icon: FiSettings },
                      ] as const
                    ).map((f) => {
                      const Icon = f.icon;
                      return (
                        <button
                          key={f.key}
                          type="button"
                          onClick={() => setNotificationFilter(f.key)}
                          className={
                            'flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-xl border transition-all ' +
                            (notificationFilter === f.key
                              ? 'bg-emerald-600 text-white border-emerald-600 shadow-md'
                              : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50')
                          }
                        >
                          <Icon className="h-4 w-4" />
                          {f.label}
                        </button>
                      );
                    })}
                  </div>

                  <label className="inline-flex items-center gap-2 text-sm text-gray-600 bg-white px-3 py-1.5 rounded-lg border border-gray-200">
                    <input
                      type="checkbox"
                      checked={showReadNotifications}
                      onChange={(e) => setShowReadNotifications(e.target.checked)}
                      className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                    />
                    Show read notifications
                  </label>
                </div>
              </div>

              {/* Notifications List */}
              {notificationsError ? (
                <div className="rounded-2xl border border-red-100 bg-red-50 px-6 py-4 text-sm text-red-900">
                  <div className="flex items-center gap-2">
                    <FiX className="h-4 w-4" />
                    {notificationsError}
                  </div>
                </div>
              ) : notificationsLoading ? (
                <div className="rounded-2xl bg-white border border-gray-100 shadow-sm p-8">
                  <div className="flex flex-col items-center justify-center text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-emerald-600 mb-4"></div>
                    <div className="text-sm font-medium text-gray-900">Loading notifications...</div>
                    <div className="text-sm text-gray-600 mt-1">Please wait while we fetch your updates</div>
                  </div>
                </div>
              ) : notifications.length === 0 ? (
                <div className="rounded-2xl bg-white border border-gray-100 shadow-sm p-12">
                  <div className="flex flex-col items-center justify-center text-center max-w-md mx-auto">
                    {/* Empty State Illustration */}
                    <div className="w-24 h-24 rounded-full bg-gradient-to-br from-emerald-100 to-blue-100 flex items-center justify-center mb-6">
                      <FiBell className="h-12 w-12 text-emerald-600" />
                    </div>
                    
                    <div className="text-xl font-bold text-gray-900 mb-3">All caught up!</div>
                    <div className="text-sm text-gray-600 mb-6 leading-relaxed">
                      You're all caught up with your notifications. New updates about your donations, pickups, and impact will appear here.
                    </div>
                    
                    <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                      <button
                        type="button"
                        onClick={() => setActiveItem('donate-now')}
                        className="px-6 py-3 bg-emerald-600 text-white font-semibold rounded-xl hover:bg-emerald-700 transition-colors shadow-lg flex items-center justify-center gap-2"
                      >
                        <FiPlusCircle className="h-5 w-5" />
                        Make a Donation
                      </button>
                      <button
                        type="button"
                        onClick={() => setActiveItem('impact')}
                        className="px-6 py-3 bg-white border border-gray-200 text-gray-700 font-semibold rounded-xl hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
                      >
                        <FiHeart className="h-5 w-5" />
                        View Impact
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center justify-between px-2">
                    <div className="text-sm font-semibold text-gray-700">
                      {notifications.filter(n => !n.read).length > 0 && (
                        <span className="inline-flex items-center gap-2">
                          <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                          </span>
                          {notifications.filter(n => !n.read).length} unread
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-gray-500">
                      {notifications.length} notification{notifications.length !== 1 ? 's' : ''}
                    </div>
                  </div>
                  {/* Notification Cards */}
                  <div className="space-y-3">
                    {notifications.map((n) => {
                      const created = n.createdAt ? new Date(n.createdAt) : null;
                      const time = created ? created.toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '';
                      const isUnread = !n.read;
                      const isDonationMatch = Boolean(
                        highlightDonationId &&
                          n.donationId &&
                          String(n.donationId) === String(highlightDonationId)
                      );
                      
                      // Get icon and colors based on category
                      const getCategoryInfo = () => {
                        switch (n.category) {
                          case 'donations':
                            return {
                              icon: FiPackage,
                              bg: 'bg-emerald-50',
                              fg: 'text-emerald-700',
                              border: 'border-emerald-200',
                              label: 'Donation Update'
                            };
                          case 'pickups':
                            return {
                              icon: FiTruck,
                              bg: 'bg-amber-50',
                              fg: 'text-amber-700',
                              border: 'border-amber-200',
                              label: 'Pickup Update'
                            };
                          case 'ngo_requests':
                            return {
                              icon: FiUsers,
                              bg: 'bg-blue-50',
                              fg: 'text-blue-700',
                              border: 'border-blue-200',
                              label: 'NGO Request'
                            };
                          case 'impact':
                            return {
                              icon: FiHeart,
                              bg: 'bg-pink-50',
                              fg: 'text-pink-700',
                              border: 'border-pink-200',
                              label: 'Impact Update'
                            };
                          default:
                            return {
                              icon: FiSettings,
                              bg: 'bg-gray-50',
                              fg: 'text-gray-700',
                              border: 'border-gray-200',
                              label: 'System Update'
                            };
                        }
                      };
                      
                      const categoryInfo = getCategoryInfo();
                      const Icon = categoryInfo.icon;

                      return (
                        <div
                          key={n._id}
                          className={`group rounded-2xl border shadow-sm hover:shadow-md transition-all ${
                            isDonationMatch
                              ? 'bg-white border-amber-300 ring-2 ring-amber-200'
                              : isUnread 
                                ? 'bg-white border-emerald-200 bg-gradient-to-r from-emerald-50/50 to-transparent' 
                                : 'bg-white border-gray-100'
                          }`}
                        >
                          <button
                            type="button"
                            onClick={async () => {
                              if (!n.read) {
                                try {
                                  await markNotificationRead(n._id);
                                  await loadNotifications();
                                } catch {}
                              }
                            }}
                            className="w-full p-5 text-left"
                          >
                            <div className="flex items-start gap-4">
                              {/* Icon */}
                              <div className={`h-12 w-12 rounded-xl ${categoryInfo.bg} ${categoryInfo.border} border flex items-center justify-center flex-shrink-0`}>
                                <Icon className={`h-6 w-6 ${categoryInfo.fg}`} />
                              </div>
                              
                              {/* Content */}
                              <div className="min-w-0 flex-1">
                                <div className="flex items-start justify-between gap-3">
                                  <div className="min-w-0">
                                    {/* Category and Status */}
                                    <div className="flex items-center gap-2 mb-2">
                                      <span className={`inline-flex items-center px-2.5 py-1 rounded-lg border text-xs font-semibold ${categoryInfo.bg} ${categoryInfo.fg} ${categoryInfo.border}`}>
                                        {categoryInfo.label}
                                      </span>
                                      {isUnread && (
                                        <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700">
                                          <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
                                          New
                                        </span>
                                      )}
                                    </div>
                                    
                                    {/* Title */}
                                    <div className="text-base font-semibold text-gray-900 mb-1">{n.title}</div>
                                    
                                    {/* Message */}
                                    <div className="text-sm text-gray-600 leading-relaxed">{n.message}</div>

                                    {n.donationId && (
                                      <div className="mt-2 text-xs text-gray-500 font-medium">
                                        Donation ID: {String(n.donationId).substring(0, 8).toUpperCase()}
                                      </div>
                                    )}
                                    
                                    {/* CTA Buttons for specific notifications */}
                                    {n.category === 'ngo_requests' && (
                                      <div className="mt-3 flex gap-2">
                                        <button
                                          type="button"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            setActiveItem('donate-now');
                                          }}
                                          className="px-3 py-1.5 bg-emerald-600 text-white text-xs font-semibold rounded-lg hover:bg-emerald-700 transition-colors"
                                        >
                                          Donate Now
                                        </button>
                                        <button
                                          type="button"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            // View details logic
                                          }}
                                          className="px-3 py-1.5 bg-white border border-gray-200 text-gray-700 text-xs font-semibold rounded-lg hover:bg-gray-50 transition-colors"
                                        >
                                          View Details
                                        </button>
                                      </div>
                                    )}
                                  </div>
                                  
                                  {/* Timestamp */}
                                  <div className="text-xs text-gray-500 whitespace-nowrap flex-shrink-0">
                                    {time}
                                  </div>
                                </div>
                              </div>
                            </div>
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {activeItem === 'settings' && (
            <div className="rounded-2xl bg-white border border-gray-100 shadow-sm p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="h-10 w-10 rounded-xl bg-purple-50 border border-purple-100 flex items-center justify-center text-purple-700">
                  <FiSettings className="h-5 w-5" />
                </div>
                <div>
                  <div className="text-base font-semibold text-gray-900">Settings</div>
                  <div className="text-sm text-gray-600">Manage your account preferences</div>
                </div>
              </div>

              {(() => {
                const emailEnabled = Boolean(donorProfile?.notifications?.emailNotifications ?? true);
                const pushEnabled = Boolean(donorProfile?.notifications?.pushNotifications ?? true);
                const smsEnabled = Boolean(donorProfile?.notifications?.smsNotifications ?? false);

                const pickupAddress = String(donorProfile?.location?.pickupAddress || '').trim();
                const city = String(donorProfile?.location?.city || '').trim();
                const state = String(donorProfile?.location?.state || '').trim();
                const pincode = String(donorProfile?.location?.pincode || '').trim();

                const preferredPickupTime = String(donorProfile?.preferences?.preferredPickupTime || '').trim();
                const nearbyNgoRadiusKm = Number(donorProfile?.preferences?.nearbyNgoRadiusKm ?? 10);

                const saveProfilePatch = async (patch: any) => {
                  try {
                    const payload = {
                      ...(donorProfile || {}),
                      firebaseUid: user.uid,
                      basic: {
                        ...(donorProfile?.basic || {}),
                        firebaseUid: user.uid,
                        name: donorProfile?.basic?.name || user.displayName || user.email?.split('@')[0],
                        email: donorProfile?.basic?.email || user.email,
                        phone: donorProfile?.basic?.phone || user.phoneNumber || '',
                      },
                      ...patch,
                    };
                    await fetch('http://localhost:5000/api/v1/profile/upsert', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify(payload),
                    });
                    window.dispatchEvent(new CustomEvent('profileUpdated'));
                    refreshProfile();
                  } catch {
                    // ignore
                  }
                };

                const ToggleRow = ({
                  title,
                  subtitle,
                  checked,
                  onToggle,
                }: {
                  title: string;
                  subtitle: string;
                  checked: boolean;
                  onToggle: (next: boolean) => void;
                }) => (
                  <div className="flex items-center justify-between gap-4 py-3">
                    <div>
                      <div className="text-sm font-semibold text-gray-900">{title}</div>
                      <div className="text-sm text-gray-600">{subtitle}</div>
                    </div>
                    <button
                      type="button"
                      onClick={() => onToggle(!checked)}
                      className={
                        'relative inline-flex h-6 w-11 items-center rounded-full transition-colors ' +
                        (checked ? 'bg-emerald-600' : 'bg-gray-200')
                      }
                      aria-pressed={checked}
                    >
                      <span
                        className={
                          'inline-block h-5 w-5 transform rounded-full bg-white transition-transform ' +
                          (checked ? 'translate-x-5' : 'translate-x-1')
                        }
                      />
                    </button>
                  </div>
                );

                return (
                  <div className="space-y-4">
                    <div
                      className="rounded-2xl border border-gray-100 bg-white shadow-sm p-5 cursor-pointer hover:bg-gray-50 transition-colors"
                      onClick={refreshProfile}
                    >
                      <div className="text-sm font-semibold text-gray-900">Profile</div>
                      <div className="mt-1 text-sm text-gray-600">Refresh and sync your latest profile data.</div>
                      <div className="mt-2 text-xs text-emerald-700 font-semibold">Click to refresh</div>
                    </div>

                    <div className="rounded-2xl border border-gray-100 bg-white shadow-sm p-5">
                      <div className="text-sm font-semibold text-gray-900">Account Information</div>
                      <div className="mt-1 text-sm text-gray-600">Your account details and role.</div>
                      
                      <div className="mt-4 space-y-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="text-sm font-medium text-gray-700">Account Type</div>
                            <div className="text-xs text-gray-500 mt-1">Your role on the platform</div>
                          </div>
                          <div className={`px-3 py-1.5 rounded-full text-xs font-semibold ${
                            userMeta?.userType === 'ngo' 
                              ? 'bg-purple-100 text-purple-800 border border-purple-200'
                              : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                          }`}>
                            {userMeta?.userType === 'ngo' ? 'NGO' : 'Donor'}
                          </div>
                        </div>
                        
                        {userMeta?.organizationName && (
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="text-sm font-medium text-gray-700">Organization</div>
                              <div className="text-xs text-gray-500 mt-1">Registered organization name</div>
                            </div>
                            <div className="text-sm text-gray-900 font-medium">
                              {userMeta.organizationName}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="rounded-2xl border border-gray-100 bg-white shadow-sm p-5">
                      <div className="text-sm font-semibold text-gray-900">Notification Preferences</div>
                      <div className="mt-1 text-sm text-gray-600">Choose how you want to receive updates.</div>
                      <div className="mt-4 divide-y divide-gray-100">
                        <ToggleRow
                          title="Email notifications"
                          subtitle="Donation confirmations and status updates"
                          checked={emailEnabled}
                          onToggle={(next) => saveProfilePatch({ notifications: { ...(donorProfile?.notifications || {}), emailNotifications: next } })}
                        />
                        <ToggleRow
                          title="Push notifications"
                          subtitle="Real-time pickup and system alerts"
                          checked={pushEnabled}
                          onToggle={(next) => saveProfilePatch({ notifications: { ...(donorProfile?.notifications || {}), pushNotifications: next } })}
                        />
                        <ToggleRow
                          title="SMS notifications"
                          subtitle="Critical pickup updates"
                          checked={smsEnabled}
                          onToggle={(next) => saveProfilePatch({ notifications: { ...(donorProfile?.notifications || {}), smsNotifications: next } })}
                        />
                      </div>
                    </div>

                    <div className="rounded-2xl border border-gray-100 bg-white shadow-sm p-5">
                      <div className="text-sm font-semibold text-gray-900">Location Preferences</div>
                      <div className="mt-1 text-sm text-gray-600">Pickup address and nearby NGO discovery.</div>

                      <div className="mt-4 grid grid-cols-1 lg:grid-cols-2 gap-4">
                        <div className="lg:col-span-2">
                          <FieldLabel>Pickup Address</FieldLabel>
                          <input
                            defaultValue={pickupAddress}
                            onBlur={(e) => {
                              const next = e.target.value;
                              if (next !== pickupAddress) saveProfilePatch({ location: { ...(donorProfile?.location || {}), pickupAddress: next } });
                            }}
                            className="w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-sm text-gray-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-200 focus:border-emerald-300"
                            placeholder="House no., street, landmark"
                          />
                        </div>
                        <div>
                          <FieldLabel>City</FieldLabel>
                          <input
                            defaultValue={city}
                            onBlur={(e) => {
                              const next = e.target.value;
                              if (next !== city) saveProfilePatch({ location: { ...(donorProfile?.location || {}), city: next } });
                            }}
                            className="w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-sm text-gray-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-200 focus:border-emerald-300"
                            placeholder="City"
                          />
                        </div>
                        <div>
                          <FieldLabel>State</FieldLabel>
                          <input
                            defaultValue={state}
                            onBlur={(e) => {
                              const next = e.target.value;
                              if (next !== state) saveProfilePatch({ location: { ...(donorProfile?.location || {}), state: next } });
                            }}
                            className="w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-sm text-gray-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-200 focus:border-emerald-300"
                            placeholder="State"
                          />
                        </div>
                        <div>
                          <FieldLabel>Pincode</FieldLabel>
                          <input
                            defaultValue={pincode}
                            onBlur={(e) => {
                              const next = e.target.value;
                              if (next !== pincode) saveProfilePatch({ location: { ...(donorProfile?.location || {}), pincode: next } });
                            }}
                            inputMode="numeric"
                            className="w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-sm text-gray-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-200 focus:border-emerald-300"
                            placeholder="Pincode"
                          />
                        </div>
                        <div>
                          <FieldLabel>Preferred Pickup Time</FieldLabel>
                          <select
                            defaultValue={preferredPickupTime}
                            onBlur={(e) => {
                              const next = e.target.value;
                              if (next !== preferredPickupTime) saveProfilePatch({ preferences: { ...(donorProfile?.preferences || {}), preferredPickupTime: next } });
                            }}
                            className="w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-sm text-gray-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-200 focus:border-emerald-300"
                          >
                            <option value="">No preference</option>
                            <option value="Morning">Morning</option>
                            <option value="Afternoon">Afternoon</option>
                            <option value="Evening">Evening</option>
                          </select>
                        </div>
                        <div>
                          <FieldLabel>Nearby NGO Radius (km)</FieldLabel>
                          <input
                            defaultValue={String(nearbyNgoRadiusKm)}
                            onBlur={(e) => {
                              const next = Number(e.target.value);
                              if (Number.isFinite(next) && next !== nearbyNgoRadiusKm) {
                                saveProfilePatch({ preferences: { ...(donorProfile?.preferences || {}), nearbyNgoRadiusKm: next } });
                              }
                            }}
                            inputMode="numeric"
                            className="w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-sm text-gray-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-200 focus:border-emerald-300"
                            placeholder="10"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="rounded-2xl border border-gray-100 bg-white shadow-sm p-5">
                      <div className="text-sm font-semibold text-gray-900">Privacy & Security</div>
                      <div className="mt-1 text-sm text-gray-600">Account actions and security controls.</div>

                      <div className="mt-4 grid gap-3 sm:grid-cols-2">
                        <button
                          type="button"
                          onClick={handleLogout}
                          className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 rounded-2xl bg-gray-50 border border-gray-200 text-sm font-semibold text-gray-800 hover:bg-gray-100"
                        >
                          <FiLogOut className="h-4 w-4" />
                          Logout
                        </button>
                        <button
                          type="button"
                          onClick={async () => {
                            const ok = confirm('Delete your account permanently? This cannot be undone.');
                            if (!ok) return;
                            try {
                              const token = await user.getIdToken();
                              await fetch('http://localhost:5000/api/v1/auth/delete-me', {
                                method: 'DELETE',
                                headers: { Authorization: `Bearer ${token}` },
                              });
                            } catch {}
                            try {
                              await signOutUser();
                            } catch {}
                            onBack();
                          }}
                          className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 rounded-2xl bg-red-50 border border-red-100 text-sm font-semibold text-red-700 hover:bg-red-100"
                        >
                          Delete account
                        </button>
                      </div>
                      <div className="mt-3 text-xs text-gray-500">
                        Password changes can be done from your Profile page (Change Password).
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>
          )}

          {activeItem === 'donation-history' && (
            <div className="space-y-6">
              {/* Header */}
              <div className="rounded-2xl bg-gradient-to-r from-blue-50 to-emerald-50 border border-blue-100 shadow-sm p-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-xl bg-blue-600 border border-blue-200 flex items-center justify-center text-white shadow-lg">
                      <FiClock className="h-6 w-6" />
                    </div>
                    <div>
                      <div className="text-xl font-bold text-gray-900">Donation History</div>
                      <div className="text-sm text-gray-600 mt-1">Complete transparency of all your donations</div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={loadMyDonations}
                    className="px-4 py-2 text-sm font-semibold rounded-xl bg-white border border-blue-200 text-blue-700 hover:bg-blue-50 shadow-sm transition-all"
                  >
                    Refresh
                  </button>
                </div>
              </div>

              {myDonationsError ? (
                <div className="rounded-2xl border border-red-100 bg-red-50 px-6 py-4 text-sm text-red-900">
                  <div className="flex items-center gap-2">
                    <FiX className="h-4 w-4" />
                    {myDonationsError}
                  </div>
                </div>
              ) : myDonationsLoading ? (
                <div className="rounded-2xl bg-white border border-gray-100 shadow-sm p-8">
                  <div className="flex flex-col items-center justify-center text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-600 mb-4"></div>
                    <div className="text-sm font-medium text-gray-900">Loading donation history...</div>
                    <div className="text-sm text-gray-600 mt-1">Please wait while we fetch your records</div>
                  </div>
                </div>
              ) : myDonations.length === 0 ? (
                <div className="rounded-2xl bg-white border border-gray-100 shadow-sm p-12">
                  <div className="flex flex-col items-center justify-center text-center max-w-md mx-auto">
                    <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-100 to-emerald-100 flex items-center justify-center mb-6">
                      <FiClock className="h-12 w-12 text-blue-600" />
                    </div>
                    <div className="text-xl font-bold text-gray-900 mb-3">No donations yet</div>
                    <div className="text-sm text-gray-600 mb-6 leading-relaxed">
                      You haven't made any donations yet. Start making a difference today!
                    </div>
                    <button
                      type="button"
                      onClick={() => setActiveItem('donate-now')}
                      className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition-colors shadow-lg flex items-center justify-center gap-2"
                    >
                      <FiPlusCircle className="h-5 w-5" />
                      Make Your First Donation
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  {/* Main Donation History Table */}
                  <div className="rounded-2xl bg-white border border-gray-100 shadow-sm overflow-hidden">
                    <div className="p-5 border-b border-gray-100">
                      <div className="flex items-center justify-between">
                        <div>
                          <h2 className="text-lg font-semibold text-gray-900">All Donations</h2>
                          <p className="text-sm text-gray-600 mt-1">Complete history of your donation activities</p>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                          <span>{myDonations.length} total donations</span>
                        </div>
                      </div>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead className="bg-gray-50 border-b border-gray-100">
                          <tr>
                            <th className="px-5 py-3 text-left font-medium text-gray-700">Donation ID</th>
                            <th className="px-5 py-3 text-left font-medium text-gray-700">Resource Type</th>
                            <th className="px-5 py-3 text-left font-medium text-gray-700">Quantity</th>
                            <th className="px-5 py-3 text-left font-medium text-gray-700">Donated On</th>
                            <th className="px-5 py-3 text-left font-medium text-gray-700">NGO Name</th>
                            <th className="px-5 py-3 text-left font-medium text-gray-700">Status</th>
                            <th className="px-5 py-3 text-left font-medium text-gray-700">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {myDonations.map((d: any) => (
                            <tr key={d._id} className="hover:bg-gray-50 transition-colors">
                              <td className="px-5 py-4">
                                <div className="font-mono text-xs bg-gray-100 px-2 py-1 rounded">
                                  #{String(d._id).slice(-8)}
                                </div>
                              </td>
                              <td className="px-5 py-4">
                                <div className="flex items-center gap-2">
                                  {(() => {
                                    const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
                                      'Food': FiPackage,
                                      'Clothes': FiTag,
                                      'Books': FiTag,
                                      'Medical Supplies': FiTag,
                                      'Other Essentials': FiTag
                                    };
                                    const Icon = iconMap[d.resourceType] || FiTag;
                                    return <Icon className="h-4 w-4 text-gray-500" />;
                                  })()}
                                  <span className="font-medium">{d.resourceType}</span>
                                </div>
                              </td>
                              <td className="px-5 py-4">
                                <div className="font-medium">{d.quantity} {d.unit}</div>
                              </td>
                              <td className="px-5 py-4">
                                <div className="text-sm text-gray-600">
                                  {d.createdAt ? new Date(d.createdAt).toLocaleString('en-IN', {
                                    day: '2-digit',
                                    month: 'short',
                                    year: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit'
                                  }) : '--'}
                                </div>
                              </td>
                              <td className="px-5 py-4">
                                <div className="text-sm font-medium">{d.assignedNGO?.ngoName || 'Not assigned'}</div>
                              </td>
                              <td className="px-5 py-4">
                                <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${
                                  d.status === 'completed' 
                                    ? 'bg-emerald-100 text-emerald-800' 
                                    : d.status === 'cancelled'
                                      ? 'bg-red-100 text-red-800'
                                      : 'bg-amber-100 text-amber-800'
                                }`}>
                                  {d.status === 'completed' ? <FiCheckCircle className="h-3.5 w-3.5" /> : d.status === 'cancelled' ? <FiX className="h-3.5 w-3.5" /> : <FiClock className="h-3.5 w-3.5" />}
                                  {d.status.charAt(0).toUpperCase() + d.status.slice(1)}
                                </span>
                              </td>
                              <td className="px-5 py-4">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setSelectedDonation(d);
                                    setShowDonationDetails(true);
                                  }}
                                  className="text-blue-600 hover:text-blue-800 text-sm font-medium flex items-center gap-1"
                                >
                                  <FiEye className="h-4 w-4" />
                                  View Details
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Cancelled Donations Section */}
                  {(() => {
                    const cancelledDonations = myDonations.filter((d: any) => d.status === 'cancelled');
                    if (cancelledDonations.length === 0) return null;
                    
                    return (
                      <div className="rounded-2xl bg-white border border-gray-100 shadow-sm overflow-hidden">
                        <div className="p-5 border-b border-red-100 bg-red-50">
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-xl bg-red-100 border border-red-200 flex items-center justify-center">
                              <FiX className="h-5 w-5 text-red-600" />
                            </div>
                            <div>
                              <h2 className="text-lg font-semibold text-gray-900">Cancelled Donations</h2>
                              <p className="text-sm text-gray-600 mt-1">Review cancellation details and reasons</p>
                            </div>
                          </div>
                        </div>

                        <div className="p-5 space-y-4">
                          {cancelledDonations.map((d: any) => (
                            <div key={d._id} className="border border-red-100 rounded-xl bg-red-50/30 p-4">
                              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-3">
                                <div>
                                  <div className="text-xs text-gray-500 mb-1">Donation ID</div>
                                  <div className="font-mono text-sm bg-white px-2 py-1 rounded border border-red-100">
                                    #{String(d._id).slice(-8)}
                                  </div>
                                </div>
                                <div>
                                  <div className="text-xs text-gray-500 mb-1">Resource Type</div>
                                  <div className="font-medium">{d.resourceType}</div>
                                </div>
                                <div>
                                  <div className="text-xs text-gray-500 mb-1">Cancelled By</div>
                                  <div className="font-medium">{d.cancelledBy || 'System'}</div>
                                </div>
                                <div>
                                  <div className="text-xs text-gray-500 mb-1">Cancelled Date</div>
                                  <div className="text-sm">
                                    {d.updatedAt ? new Date(d.updatedAt).toLocaleString('en-IN', {
                                      day: '2-digit',
                                      month: 'short',
                                      year: 'numeric',
                                      hour: '2-digit',
                                      minute: '2-digit'
                                    }) : '--'}
                                  </div>
                                </div>
                                <div>
                                  <div className="text-xs text-gray-500 mb-1">Quantity</div>
                                  <div className="font-medium">{d.quantity} {d.unit}</div>
                                </div>
                              </div>
                              
                              {/* Cancellation Reason Alert */}
                              <div className="bg-white border border-red-200 rounded-lg p-3">
                                <div className="flex items-start gap-2">
                                  <FiAlertCircle className="h-4 w-4 text-red-600 mt-0.5 flex-shrink-0" />
                                  <div>
                                    <div className="text-sm font-semibold text-red-900 mb-1">Cancellation Reason</div>
                                    <div className="text-sm text-gray-700">
                                      {d.cancellationReason || 'No specific reason provided'}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })()}</>
              )}

              {/* Profile Gallery Section */}
              <div className="rounded-2xl bg-white border border-gray-100 shadow-sm overflow-hidden">
                <div className="p-5 border-b border-gray-100">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-purple-50 border border-purple-100 flex items-center justify-center">
                      <FiCamera className="h-5 w-5 text-purple-600" />
                    </div>
                    <div>
                      <h2 className="text-lg font-semibold text-gray-900">Donation Gallery</h2>
                      <p className="text-sm text-gray-600 mt-1">Your personal collection of Donation memories</p>
                    </div>
                  </div>
                </div>

                <div className="p-5">
                  {donorProfile?.gallery && donorProfile.gallery.length > 0 ? (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                      {donorProfile.gallery.map((image: any, index: number) => (
                        <div key={index} className="relative group cursor-pointer">
                          <img
                            src={image.url || image}
                            alt={`Gallery image ${index + 1}`}
                            className="w-full h-40 object-cover rounded-lg border border-gray-200 group-hover:border-purple-300 transition-colors"
                            onClick={() => {
                              // Open image in lightbox (you can implement this later)
                            }}
                          />
                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 rounded-lg transition-colors flex items-center justify-center">
                            <FiEye className="h-6 w-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                          </div>
                          {image.uploadDate && (
                            <div className="absolute bottom-2 left-2 bg-black/60 text-white text-xs px-2 py-1 rounded">
                              {new Date(image.uploadDate).toLocaleDateString('en-IN')}
                            </div>
                          )}
                          {image.caption && (
                            <div className="absolute bottom-2 right-2 bg-purple-600 text-white text-xs px-2 py-1 rounded max-w-[80px] truncate">
                              {image.caption}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <FiCamera className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">No gallery images yet</h3>
                      <p className="text-sm text-gray-600 mb-6">Start building your gallery by adding images to your profile</p>
                      <button
                        type="button"
                        onClick={() => setActiveItem('settings')}
                        className="px-6 py-3 bg-purple-600 text-white font-semibold rounded-xl hover:bg-purple-700 transition-colors shadow-lg flex items-center justify-center gap-2 mx-auto"
                      >
                        <FiPlusCircle className="h-5 w-5" />
                        Add Images to Gallery
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Donation Details Modal */}
              {showDonationDetails && selectedDonation && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
                  <div className="bg-white rounded-2xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
                    {/* Modal Header */}
                    <div className="p-6 border-b border-gray-100 bg-gradient-to-r from-blue-50 to-emerald-50">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-center gap-4">
                          <div className="h-12 w-12 rounded-xl bg-blue-600 border border-blue-200 flex items-center justify-center text-white shadow-lg">
                            <FiPackage className="h-6 w-6" />
                          </div>
                          <div>
                            <h2 className="text-xl font-bold text-gray-900">Donation Details</h2>
                            <p className="text-sm text-gray-600 mt-1">
                              {selectedDonation.resourceType} - #{String(selectedDonation._id).slice(-8)}
                            </p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setShowDonationDetails(false);
                            setSelectedDonation(null);
                          }}
                          className="p-2 rounded-lg bg-white border border-gray-200 text-gray-500 hover:bg-gray-50 transition-colors"
                        >
                          <FiX className="h-5 w-5" />
                        </button>
                      </div>
                    </div>

                    {/* Modal Content */}
                    <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
                      {/* Donation Information */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                        <div className="space-y-4">
                          <h3 className="text-lg font-semibold text-gray-900">Donation Information</h3>
                          
                          <div className="space-y-3">
                            <div className="flex justify-between py-2 border-b border-gray-100">
                              <span className="text-sm text-gray-600">Resource Type</span>
                              <span className="text-sm font-medium text-gray-900">{selectedDonation.resourceType}</span>
                            </div>
                            <div className="flex justify-between py-2 border-b border-gray-100">
                              <span className="text-sm text-gray-600">Quantity</span>
                              <span className="text-sm font-medium text-gray-900">{selectedDonation.quantity} {selectedDonation.unit}</span>
                            </div>
                            <div className="flex justify-between py-2 border-b border-gray-100">
                              <span className="text-sm text-gray-600">Status</span>
                              <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${
                                selectedDonation.status === 'completed' 
                                  ? 'bg-emerald-100 text-emerald-800' 
                                  : selectedDonation.status === 'cancelled'
                                    ? 'bg-red-100 text-red-800'
                                    : 'bg-amber-100 text-amber-800'
                              }`}>
                                {selectedDonation.status === 'completed' ? <FiCheckCircle className="h-3.5 w-3.5" /> : selectedDonation.status === 'cancelled' ? <FiX className="h-3.5 w-3.5" /> : <FiClock className="h-3.5 w-3.5" />}
                                {selectedDonation.status.charAt(0).toUpperCase() + selectedDonation.status.slice(1)}
                              </span>
                            </div>
                            <div className="flex justify-between py-2 border-b border-gray-100">
                              <span className="text-sm text-gray-600">Donated On</span>
                              <span className="text-sm font-medium text-gray-900">
                                {selectedDonation.createdAt ? new Date(selectedDonation.createdAt).toLocaleString('en-IN', {
                                  day: '2-digit',
                                  month: 'short',
                                  year: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit'
                                }) : '--'}
                              </span>
                            </div>
                            <div className="flex justify-between py-2 border-b border-gray-100">
                              <span className="text-sm text-gray-600">NGO</span>
                              <span className="text-sm font-medium text-gray-900">{selectedDonation.assignedNGO?.ngoName || 'Not assigned'}</span>
                            </div>
                          </div>
                        </div>

                        {/* Timeline */}
                        <div className="space-y-4">
                          <h3 className="text-lg font-semibold text-gray-900">Donation Timeline</h3>
                          <div className="space-y-3">
                            <div className="flex items-start gap-3">
                              <div className="h-8 w-8 rounded-full bg-emerald-100 border-2 border-emerald-200 flex items-center justify-center flex-shrink-0">
                                <FiPackage className="h-4 w-4 text-emerald-600" />
                              </div>
                              <div>
                                <div className="text-sm font-medium text-gray-900">Created</div>
                                <div className="text-xs text-gray-600">
                                  {selectedDonation.createdAt ? new Date(selectedDonation.createdAt).toLocaleString('en-IN') : '--'}
                                </div>
                              </div>
                            </div>
                            
                            {selectedDonation.status !== 'pending' && (
                              <div className="flex items-start gap-3">
                                <div className="h-8 w-8 rounded-full bg-blue-100 border-2 border-blue-200 flex items-center justify-center flex-shrink-0">
                                  <FiCheckCircle className="h-4 w-4 text-blue-600" />
                                </div>
                                <div>
                                  <div className="text-sm font-medium text-gray-900">Approved</div>
                                  <div className="text-xs text-gray-600">Donation was approved and processed</div>
                                </div>
                              </div>
                            )}
                            
                            {selectedDonation.status === 'completed' && (
                              <div className="flex items-start gap-3">
                                <div className="h-8 w-8 rounded-full bg-emerald-100 border-2 border-emerald-200 flex items-center justify-center flex-shrink-0">
                                  <FiCheckCircle className="h-4 w-4 text-emerald-600" />
                                </div>
                                <div>
                                  <div className="text-sm font-medium text-gray-900">Completed</div>
                                  <div className="text-xs text-gray-600">
                                    {selectedDonation.updatedAt ? new Date(selectedDonation.updatedAt).toLocaleString('en-IN') : '--'}
                                  </div>
                                </div>
                              </div>
                            )}
                            
                            {selectedDonation.status === 'cancelled' && (
                              <div className="flex items-start gap-3">
                                <div className="h-8 w-8 rounded-full bg-red-100 border-2 border-red-200 flex items-center justify-center flex-shrink-0">
                                  <FiX className="h-4 w-4 text-red-600" />
                                </div>
                                <div>
                                  <div className="text-sm font-medium text-gray-900">Cancelled</div>
                                  <div className="text-xs text-gray-600">
                                    {selectedDonation.updatedAt ? new Date(selectedDonation.updatedAt).toLocaleString('en-IN') : '--'}
                                  </div>
                                  {selectedDonation.cancellationReason && (
                                    <div className="text-xs text-red-600 mt-1">Reason: {selectedDonation.cancellationReason}</div>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeItem === 'active-pickups' && (
            <ActivePickupsTab />
          )}

          {activeItem !== 'dashboard' && activeItem !== 'donate-now' && activeItem !== 'my-donations' && activeItem !== 'impact' && activeItem !== 'help-support' && activeItem !== 'notifications' && activeItem !== 'settings' && activeItem !== 'donation-history' && activeItem !== 'active-pickups' && (
            <div className="rounded-2xl bg-white border border-gray-100 shadow-sm p-6">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-center text-gray-700">
                  <FiCalendar className="h-5 w-5" />
                </div>
                <div>
                  <div className="text-base font-semibold text-gray-900">
                    {menu.find((m) => m.key === activeItem)?.label}
                  </div>
                  <div className="text-sm text-gray-600">No data available yet</div>
                </div>
              </div>

              <div className="mt-6 rounded-xl border border-dashed border-gray-200 bg-gray-50 p-8 text-center">
                <div className="text-sm font-semibold text-gray-900">Coming soon</div>
                <div className="mt-1 text-sm text-gray-600">This section will be available once donation features are connected.</div>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Support Request Form Modal */}
      {showSupportForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Raise a Support Request</h2>
                <p className="text-sm text-gray-600 mt-1">Fill in the form below and our team will get back to you</p>
              </div>
              <button
                onClick={() => {
                  setShowSupportForm(false);
                  setSupportFormError(null);
                  setSupportFormSuccess(false);
                }}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <FiX className="h-6 w-6" />
              </button>
            </div>

            <form onSubmit={handleSupportFormSubmit} className="p-6 space-y-4">
              {supportFormSuccess && (
                <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
                  Your support request has been submitted successfully! We'll get back to you soon.
                </div>
              )}

              {supportFormError && (
                <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
                  {supportFormError}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Name <span className="text-red-600">*</span>
                  </label>
                  <input
                    type="text"
                    value={supportFormData.name}
                    onChange={(e) => setSupportFormData({ ...supportFormData, name: e.target.value })}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                    placeholder="Your full name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Email <span className="text-red-600">*</span>
                  </label>
                  <input
                    type="email"
                    value={supportFormData.email}
                    onChange={(e) => setSupportFormData({ ...supportFormData, email: e.target.value })}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                    placeholder="your.email@example.com"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    value={supportFormData.phone}
                    onChange={(e) => setSupportFormData({ ...supportFormData, phone: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                    placeholder="+91 98765 43210"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Query Type
                  </label>
                  <select
                    value={supportFormData.queryType}
                    onChange={(e) => setSupportFormData({ ...supportFormData, queryType: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  >
                    <option value="">Select query type</option>
                    <option value="Donation Issue">Donation Issue</option>
                    <option value="Pickup Problem">Pickup Problem</option>
                    <option value="Account Issue">Account Issue</option>
                    <option value="Technical Support">Technical Support</option>
                    <option value="General Inquiry">General Inquiry</option>
                    <option value="Feedback">Feedback</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Message <span className="text-red-600">*</span>
                </label>
                <textarea
                  value={supportFormData.message}
                  onChange={(e) => setSupportFormData({ ...supportFormData, message: e.target.value })}
                  required
                  rows={6}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent resize-none"
                  placeholder="Please describe your issue or question in detail..."
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => {
                    setShowSupportForm(false);
                    setSupportFormError(null);
                    setSupportFormSuccess(false);
                  }}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                  disabled={supportFormLoading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={supportFormLoading}
                  className="px-4 py-2 text-sm font-medium text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {supportFormLoading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    <>
                      <FiMail className="h-4 w-4" />
                      Submit Request
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// Active Pickups Tab Component
function ActivePickupsTab() {
  const [allActivePickups, setAllActivePickups] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [verifyingOtpDonationId, setVerifyingOtpDonationId] = useState<string | null>(null);
  const [filters, setFilters] = useState({
    status: '',
    search: ''
  });

  useEffect(() => {
    fetchActivePickups();
    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchActivePickups, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchActivePickups = async () => {
    try {
      setLoading(true);
      // Fetch all active statuses: assigned, volunteer_assigned, picked
      const response = await fetchMyDonations();
      
      if (response.success) {
        // Filter for active pickups (assigned, volunteer_assigned, picked)
        const activeStatuses = ['assigned', 'volunteer_assigned', 'picked', 'completed'];
        const active = response.data.filter((d: any) => 
          activeStatuses.includes(String(d.status))
        );

        setAllActivePickups(active);
      }
    } catch (error) {
      console.error('Error fetching active pickups:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleOtpVerified = async (donationId: string) => {
    try {
      setVerifyingOtpDonationId(donationId);
      const response = await verifyDonationOtp(donationId);
      if (response.success) {
        await fetchActivePickups();
      }
    } catch (error) {
      console.error('Error verifying OTP:', error);
    } finally {
      setVerifyingOtpDonationId(null);
    }
  };

  const formatDate = (dateString: string | Date) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'assigned':
        return 'bg-blue-100 text-blue-800';
      case 'volunteer_assigned':
        return 'bg-purple-100 text-purple-800';
      case 'picked':
        return 'bg-yellow-100 text-yellow-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getTrackingSteps = (status: string) => {
    const steps = [
      { 
        id: 1, 
        name: 'Assigned', 
        status: status === 'assigned' || status === 'volunteer_assigned' || status === 'picked' || status === 'completed' ? 'completed' : 'pending' 
      },
      { 
        id: 2, 
        name: 'Volunteer Assigned', 
        status: status === 'assigned' ? 'pending' : 
                status === 'volunteer_assigned' || status === 'picked' || status === 'completed' ? 'completed' : 
                'pending'
      },
      { 
        id: 3, 
        name: 'OTP Verified', 
        status: status === 'picked' ? 'current' : 
                status === 'completed' ? 'completed' : 
                'pending' 
      },
      { 
        id: 4, 
        name: 'Delivered', 
        status: status === 'completed' ? 'completed' : 'pending' 
      }
    ];
    return steps;
  };

  const getNextStep = (status: string) => {
    switch (status) {
      case 'assigned':
        return 'Volunteer Assignment';
      case 'volunteer_assigned':
        return 'Pickup';
      case 'picked':
        return 'Delivery';
      default:
        return 'Processing';
    }
  };

  // Calculate filter stats from all active pickups (not filtered)
  const stats = {
    totalAssigned: allActivePickups.filter((d: any) => d.status === 'assigned').length,
    volunteerAssigned: allActivePickups.filter((d: any) => d.status === 'volunteer_assigned').length,
    picked: allActivePickups.filter((d: any) => d.status === 'picked').length,
    total: allActivePickups.length
  };

  // Apply filters to get displayed pickups
  const filteredPickups = allActivePickups.filter((donation: any) => {
    // Apply status filter
    if (filters.status && String(donation.status) !== filters.status) {
      return false;
    }
    
    // Apply search filter
    if (filters.search) {
      const search = filters.search.toLowerCase();
      return (
        donation.resourceType?.toLowerCase().includes(search) ||
        donation.assignedNGO?.ngoName?.toLowerCase().includes(search) ||
        donation.address?.city?.toLowerCase().includes(search) ||
        donation._id?.toLowerCase().includes(search)
      );
    }
    
    return true;
  });

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Active Pickups</h2>
          <p className="text-gray-600">Track your donation pickups in real-time</p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-500"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Active Pickups</h2>
          <p className="text-gray-600">Track your donation pickups and see their progress</p>
        </div>
        <button
          onClick={fetchActivePickups}
          className="flex items-center space-x-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
        >
          <FiRefreshCw className="w-4 h-4" />
          <span>Refresh</span>
        </button>
      </div>

      {/* Filter Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow p-4 border-l-4 border-blue-500">
          <div className="text-sm font-medium text-gray-600">Total Assigned</div>
          <div className="text-2xl font-bold text-gray-900 mt-1">{stats.totalAssigned}</div>
          <div className="text-xs text-gray-500 mt-1">Donations assigned to NGOs</div>
        </div>
        <div className="bg-white rounded-lg shadow p-4 border-l-4 border-purple-500">
          <div className="text-sm font-medium text-gray-600">Volunteer Assigned</div>
          <div className="text-2xl font-bold text-gray-900 mt-1">{stats.volunteerAssigned}</div>
          <div className="text-xs text-gray-500 mt-1">With volunteers assigned</div>
        </div>
        <div className="bg-white rounded-lg shadow p-4 border-l-4 border-yellow-500">
          <div className="text-sm font-medium text-gray-600">Picked Up</div>
          <div className="text-2xl font-bold text-gray-900 mt-1">{stats.picked}</div>
          <div className="text-xs text-gray-500 mt-1">Currently in transit</div>
        </div>
        <div className="bg-white rounded-lg shadow p-4 border-l-4 border-emerald-500">
          <div className="text-sm font-medium text-gray-600">Total Active</div>
          <div className="text-2xl font-bold text-gray-900 mt-1">{stats.total}</div>
          <div className="text-xs text-gray-500 mt-1">All active pickups</div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Status Filter</label>
            <select
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="">All Status</option>
              <option value="assigned">Assigned</option>
              <option value="volunteer_assigned">Volunteer Assigned</option>
              <option value="picked">Verified</option>
              <option value="completed">Completed</option>
            </select>
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
            <input
              type="text"
              placeholder="Search by resource type, NGO name, city, or donation ID..."
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
        </div>
      </div>

      {filteredPickups.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-center py-12">
            <FiTruck className="w-16 h-16 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {allActivePickups.length === 0 ? 'No Active Pickups' : 'No Matching Pickups'}
            </h3>
            <p className="text-gray-500">
              {allActivePickups.length === 0 
                ? 'You currently have no active pickups. Your donations will appear here once they are assigned to an NGO.'
                : 'Try adjusting your filters to see more results.'}
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredPickups.map((donation: any) => {
            const trackingSteps = getTrackingSteps(donation.status);
            const nextStep = getNextStep(donation.status);

            return (
              <div
                key={donation._id}
                className="bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden hover:shadow-xl transition-shadow"
              >
                {/* Header */}
                <div className="bg-gradient-to-r from-emerald-50 to-green-50 px-6 py-4 border-b border-gray-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 bg-emerald-100 rounded-lg flex items-center justify-center">
                        <FiPackage className="w-6 h-6 text-emerald-600" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">
                          Donation #{donation._id.substring(0, 8).toUpperCase()}
                        </h3>
                        <p className="text-sm text-gray-500">Created: {formatDate(donation.createdAt)}</p>
                      </div>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(donation.status)}`}>
                      {donation.status.charAt(0).toUpperCase() + donation.status.slice(1).replace('_', ' ')}
                    </span>
                  </div>
                </div>

                <div className="p-6">
                  {/* Tracking Timeline */}
                  <div className="mb-6">
                    <h4 className="text-sm font-semibold text-gray-700 mb-4 flex items-center">
                      <FiBarChart2 className="w-4 h-4 mr-2" />
                      Tracking Progress
                    </h4>
                    <div className="flex items-center space-x-4">
                      {trackingSteps.map((step, index) => (
                        <div key={step.id} className="flex items-center flex-1">
                          <div className="flex flex-col items-center flex-1">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 ${
                              step.status === 'completed' ? 'bg-green-500 border-green-500 text-white' :
                              step.status === 'current' ? 'bg-emerald-500 border-emerald-500 text-white' :
                              'bg-gray-100 border-gray-300 text-gray-400'
                            }`}>
                              {step.status === 'completed' ? (
                                <FiCheckCircle className="w-5 h-5" />
                              ) : (
                                <span className="text-sm font-medium">{step.id}</span>
                              )}
                            </div>
                            <p className={`text-xs mt-2 text-center ${
                              step.status === 'completed' || step.status === 'current' 
                                ? 'text-gray-900 font-medium' 
                                : 'text-gray-500'
                            }`}>
                              {step.name}
                            </p>
                            {step.id === 3 && step.status === 'current' && (
                              <button
                                type="button"
                                onClick={() => handleOtpVerified(donation._id)}
                                disabled={verifyingOtpDonationId === donation._id}
                                className="mt-3 px-3 py-1.5 bg-emerald-600 text-white text-xs rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                {verifyingOtpDonationId === donation._id ? 'Verifying...' : 'OTP Verified'}
                              </button>
                            )}
                          </div>
                          {index < trackingSteps.length - 1 && (
                            <div className={`flex-1 h-0.5 ${
                              step.status === 'completed' ? 'bg-green-500' : 'bg-gray-300'
                            }`} />
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Donation Details */}
                    <div className="space-y-4">
                      <div className="bg-gray-50 rounded-lg p-4">
                        <h4 className="text-sm font-semibold text-gray-900 mb-3 flex items-center">
                          <FiPackage className="w-4 h-4 mr-2 text-gray-600" />
                          Donation Details
                        </h4>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <p className="text-xs font-medium text-gray-500">Resource Type</p>
                            <p className="text-sm text-gray-900 font-medium">{donation.resourceType}</p>
                          </div>
                          <div>
                            <p className="text-xs font-medium text-gray-500">Quantity</p>
                            <p className="text-sm text-gray-900 font-medium">
                              {donation.quantity} {donation.unit}
                            </p>
                          </div>
                          <div className="col-span-2">
                            <p className="text-xs font-medium text-gray-500">Next Step</p>
                            <p className="text-sm text-emerald-600 font-semibold">{nextStep}</p>
                          </div>
                        </div>
                      </div>

                      {/* Pickup Address */}
                      <div className="bg-green-50 rounded-lg p-4">
                        <h4 className="text-sm font-semibold text-gray-900 mb-3 flex items-center">
                          <FiMapPin className="w-4 h-4 mr-2 text-green-600" />
                          Pickup Address
                        </h4>
                        <div className="space-y-1 text-sm text-gray-700">
                          <p>{donation.address?.addressLine || 'N/A'}</p>
                          <p>{donation.address?.city || 'N/A'}, {donation.address?.state || 'N/A'}</p>
                          <p>Pincode: {donation.address?.pincode || 'N/A'}</p>
                          {donation.pickup?.pickupDate && (
                            <p className="mt-2">
                              <FiCalendar className="w-4 h-4 inline mr-1" />
                              Pickup Date: {formatDate(donation.pickup.pickupDate)}
                            </p>
                          )}
                          {donation.pickup?.timeSlot && (
                            <p>Time Slot: {donation.pickup.timeSlot}</p>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* NGO Assignment & Volunteer Details */}
                    <div className="space-y-4">
                      <div className="bg-purple-50 rounded-lg p-4">
                        <h4 className="text-sm font-semibold text-gray-900 mb-3 flex items-center">
                          <FiUsers className="w-4 h-4 mr-2 text-purple-600" />
                          Assigned NGO
                        </h4>
                        <div className="space-y-2">
                          <div>
                            <p className="text-xs font-medium text-gray-500">NGO Name</p>
                            <p className="text-sm text-gray-900 font-medium">
                              {donation.assignedNGO?.ngoName || 'N/A'}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs font-medium text-gray-500">Assigned At</p>
                            <p className="text-sm text-gray-700">
                              {donation.assignedNGO?.assignedAt
                                ? formatDate(donation.assignedNGO.assignedAt)
                                : 'N/A'}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Volunteer Information */}
                      {donation.assignedVolunteer && (
                        <div className="bg-blue-50 rounded-lg p-4">
                          <h4 className="text-sm font-semibold text-gray-900 mb-3 flex items-center">
                            <FiUsers className="w-4 h-4 mr-2 text-blue-600" />
                            Assigned Volunteer
                          </h4>
                          <div className="space-y-2">
                            <div>
                              <p className="text-xs font-medium text-gray-500">Volunteer Name</p>
                              <p className="text-sm text-gray-900 font-medium">
                                {donation.assignedVolunteer.volunteerName || 'N/A'}
                              </p>
                            </div>
                            {donation.assignedVolunteer.volunteerPhone && (
                              <div>
                                <p className="text-xs font-medium text-gray-500">Phone</p>
                                <p className="text-sm text-gray-700">
                                  {donation.assignedVolunteer.volunteerPhone}
                                </p>
                              </div>
                            )}
                            {donation.assignedVolunteer.assignedAt && (
                              <div>
                                <p className="text-xs font-medium text-gray-500">Assigned At</p>
                                <p className="text-sm text-gray-700">
                                  {formatDate(donation.assignedVolunteer.assignedAt)}
                                </p>
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {!donation.assignedVolunteer && donation.status === 'assigned' && (
                        <div className="bg-yellow-50 rounded-lg p-4 border border-yellow-200">
                          <div className="flex items-center">
                            <FiAlertCircle className="w-4 h-4 text-yellow-600 mr-2" />
                            <p className="text-sm text-yellow-800">
                              Waiting for volunteer assignment
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default DonorDashboard;
