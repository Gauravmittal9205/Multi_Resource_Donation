import React, { useEffect, useMemo, useRef, useState } from 'react';
import { auth } from '../firebase';
import {
  FiUser,
  FiMail,
  FiPhone,
  FiCalendar,
  FiShield,
  FiImage,
  FiEye,
  FiEyeOff,
  FiTrendingUp,
  FiClock,
  FiBarChart2,
  FiCheckCircle,
} from 'react-icons/fi';
import { EmailAuthProvider, reauthenticateWithCredential, signOut, updatePassword } from 'firebase/auth';
import type { User as FirebaseUser } from 'firebase/auth';
import { fetchDonorDashboard, fetchDonorProfileByUid, fetchMyDonations, fetchMyDonationsPaged } from '../services/donationService';
import type { DonationItem, DonationPayload } from '../services/donationService';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, LineChart, Line } from 'recharts';

interface ProfilePageProps {
  user: FirebaseUser;
}

const ProfilePage: React.FC<ProfilePageProps> = ({ user: propUser }) => {
  // Simple pincode -> city lookup (extend as needed)
  const PINCODE_CITY: Record<string, string> = {
    '560001': 'Bengaluru',
    '110001': 'New Delhi',
    '400001': 'Mumbai',
    '700001': 'Kolkata',
    '600001': 'Chennai',
    '380001': 'Ahmedabad',
    '411001': 'Pune',
    '122001': 'Gurugram',
    '201301': 'Noida',
    '282007':'Agra',
    '500001':'Hyderabad',
    '281003':'Mathura',
  };
  type DonorType = 'Individual' | 'Restaurant' | 'Event organizer' | 'Company / CSR';
  type DonationCategory = 'food' | 'clothes' | 'books';
  type ProfileErrors = Partial<Record<
    | 'basic.name'
    | 'basic.email'
    | 'basic.phone'
    | 'donorType'
    | 'organization.organizationName'
    | 'organization.businessType'
    | 'organization.address'
    | 'organization.licenseNumber'
    | 'location.pickupAddress'
    | 'location.pincode'
    | 'location.city'
    | 'location.state'
    | 'location.country'
    | 'preferences.donationCategories'
    | 'preferences.preferredPickupTime'
    | 'preferences.notificationPreference'
    | 'trust.verifiedStatus'
    | 'trust.donorRating'
    | 'notifications.emailNotifications'
    | 'notifications.pushNotifications'
    | 'notifications.smsNotifications'
    | 'systemSecurity.accountBlocked'
    | 'gallery'
  , string>>;

  const [isEditing, setIsEditing] = useState(false);
  const galleryInputRef = useRef<HTMLInputElement | null>(null);
  const profileImageInputRef = useRef<HTMLInputElement | null>(null);
  const [errors, setErrors] = useState<ProfileErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [changePasswordError, setChangePasswordError] = useState<string | null>(null);
  const [changePasswordSubmitting, setChangePasswordSubmitting] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmNewPassword, setShowConfirmNewPassword] = useState(false);
  const [geoLookupLoading, setGeoLookupLoading] = useState(false);
  const geoLookupTimerRef = useRef<number | null>(null);
  const geoLookupAbortRef = useRef<AbortController | null>(null);
  type GeoCandidate = { displayName: string; city: string; state: string; country: string };
  const [geoCandidates, setGeoCandidates] = useState<GeoCandidate[]>([]);
  const profileLoadedRef = useRef(false);

  // Use the passed user prop instead of auth state
  const [authUser, setAuthUser] = useState<FirebaseUser | null>(propUser ?? null);

  const [myDonations, setMyDonations] = useState<DonationItem[]>([]);
  const [myDonationsLoading, setMyDonationsLoading] = useState(false);

  const [donorDashboard, setDonorDashboard] = useState<any>(null);
  const [donorDashboardLoading, setDonorDashboardLoading] = useState(false);

  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState<string | null>(null);
  const [historyRows, setHistoryRows] = useState<DonationItem[]>([]);
  const [historyPage, setHistoryPage] = useState(1);
  const [historyLimit, setHistoryLimit] = useState(8);
  const [historyPages, setHistoryPages] = useState(1);
  const [historyTotal, setHistoryTotal] = useState(0);
  const [historyResourceType, setHistoryResourceType] = useState<DonationPayload['resourceType'] | ''>('');

  // Still keep the auth state listener for changes
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((u) => setAuthUser(u));
    return () => unsubscribe();
  }, [propUser]);

  useEffect(() => {
    const run = async () => {
      if (!authUser?.uid) return;
      try {
        setMyDonationsLoading(true);
        const res = await fetchMyDonations();
        setMyDonations(res.data || []);
      } catch (e) {
        setMyDonations([]);
      } finally {
        setMyDonationsLoading(false);
      }
    };

    run();
  }, [authUser?.uid]);

  useEffect(() => {
    const run = async () => {
      if (!authUser?.uid) return;
      try {
        setDonorDashboardLoading(true);
        const res = await fetchDonorDashboard();
        setDonorDashboard(res.data || null);
      } catch {
        setDonorDashboard(null);
      } finally {
        setDonorDashboardLoading(false);
      }
    };

    run();
  }, [authUser?.uid]);

  const loadHistory = async (next?: { page?: number; resourceType?: DonationPayload['resourceType'] | '' }) => {
    const nextPage = next?.page ?? historyPage;
    const nextType = next?.resourceType ?? historyResourceType;

    try {
      setHistoryLoading(true);
      setHistoryError(null);
      const res = await fetchMyDonationsPaged({
        page: nextPage,
        limit: historyLimit,
        resourceType: nextType || undefined,
      });

      setHistoryRows(res.data || []);
      setHistoryPages(Number(res.pages || 1));
      setHistoryTotal(Number(res.total || 0));
      setHistoryPage(Number(res.page || nextPage));
    } catch (e: any) {
      setHistoryRows([]);
      setHistoryPages(1);
      setHistoryTotal(0);
      setHistoryError(typeof e?.message === 'string' ? e.message : 'Failed to load donation history');
    } finally {
      setHistoryLoading(false);
    }
  };

  useEffect(() => {
    if (!authUser?.uid) return;
    loadHistory({ page: 1, resourceType: historyResourceType });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authUser?.uid, historyLimit]);

  useEffect(() => {
    const onDonationCreated = () => {
      if (!authUser?.uid) return;
      loadHistory({ page: 1, resourceType: historyResourceType });
      (async () => {
        try {
          const [dash, list] = await Promise.all([fetchDonorDashboard(), fetchMyDonations()]);
          setDonorDashboard(dash.data || null);
          setMyDonations(list.data || []);
        } catch {
          // ignore
        }
      })();
    };

    window.addEventListener('donationCreated', onDonationCreated);
    return () => window.removeEventListener('donationCreated', onDonationCreated);
  }, [authUser?.uid, historyResourceType, historyLimit]);

  const roleLabel = 'Donor';

  const formatAuthTime = (value?: string | null) => {
    if (!value) return '—';
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return value;
    return d.toLocaleString();
  };

  const validateEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
  const normalizePhone = (phone: string) => phone.replace(/[^\d+]/g, '');
  const validatePhone = (phone: string) => {
    const p = normalizePhone(phone);
    const digits = p.replace(/\D/g, '');
    return digits.length >= 10 && digits.length <= 15;
  };
  const validatePincode = (v: string) => {
    const d = v.replace(/\D/g, '');
    return d.length === 6; // basic 6-digit check
  };
  const validateProfile = () => {
    const next: ProfileErrors = {};

    if (!profile.basic.name || profile.basic.name.trim().length < 2) next['basic.name'] = 'Name is required (min 2 characters).';
    if (!profile.basic.email || !validateEmail(profile.basic.email)) next['basic.email'] = 'Enter a valid email address.';
    if (!profile.basic.phone || !validatePhone(profile.basic.phone)) next['basic.phone'] = 'Enter a valid phone number (10-15 digits).';

    if (!profile.donorType) next['donorType'] = 'Donor type is required.';

    if (!profile.location.pickupAddress || profile.location.pickupAddress.trim().length < 6) next['location.pickupAddress'] = 'Pickup address is required.';
    if (!validatePincode(profile.location.pincode)) next['location.pincode'] = 'Enter a valid 6-digit pincode.';
    if (!profile.location.city || profile.location.city.trim().length < 2) next['location.city'] = 'City is required.';

    if (!profile.preferences.donationCategories || profile.preferences.donationCategories.length === 0) {
      next['preferences.donationCategories'] = 'Select at least one donation category.';
    }

    if (Number.isFinite(profile.trust.donorRating) && (profile.trust.donorRating < 0 || profile.trust.donorRating > 5)) {
      next['trust.donorRating'] = 'Rating must be between 0 and 5.';
    }

    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const [profile, setProfile] = useState({
    basic: {
      name: authUser?.displayName || '—',
      email: authUser?.email || '—',
      phone: authUser?.phoneNumber || '',
      photoUrl: authUser?.photoURL || '',
      firebaseUid: authUser?.uid || '—',
      accountCreationDate: formatAuthTime(authUser?.metadata?.creationTime || null),
    },
    gallery: [] as string[],
    donorType: 'Individual' as DonorType,
    organization: {
      organizationName: '',
      businessType: '',
      address: '',
      licenseNumber: '',
    },
    location: {
      pickupAddress: '',
      pincode: '',
      city: '',
      state: '',
      country: '',
    },
    preferences: {
      donationCategories: ['food'] as DonationCategory[],
      preferredResourceTypes: [] as DonationPayload['resourceType'][],
      preferredAreas: [] as string[],
      emergencyDonations: false,
      preferredPickupTime: '',
      notificationPreference: 'push' as 'email' | 'push' | 'sms',
    },
    addressBook: [] as Array<{ label: string; addressLine: string; city: string; state: string; pincode: string; isDefault: boolean }>,
    trust: {
      verifiedStatus: false,
      donorRating: 0,
      trustBadges: [] as string[],
    },
    notifications: {
      emailNotifications: true,
      pushNotifications: true,
      smsNotifications: false,
    },
    systemSecurity: {
      lastLoginTime: formatAuthTime(authUser?.metadata?.lastSignInTime || null),
      accountBlocked: false,
    },
  });

  // Load profile data from MongoDB when component mounts
  useEffect(() => {
    const loadProfileData = async () => {
      if (!authUser?.uid) return;
      
      try {
        const res = await fetchDonorProfileByUid(authUser.uid);
        const savedProfile = res.success && res.data ? res.data as any : null; // Backend returns full profile object
        
        if (savedProfile) {
          setProfile((p) => ({
            ...p,
            basic: {
              ...p.basic,
              name: savedProfile.basic?.name || authUser.displayName || '—',
              email: savedProfile.basic?.email || authUser.email || '—',
              phone: savedProfile.basic?.phone || authUser.phoneNumber || '',
              photoUrl: savedProfile.basic?.photoUrl || p.basic.photoUrl || authUser.photoURL || '',
              firebaseUid: authUser.uid || '—',
              accountCreationDate: formatAuthTime(authUser.metadata?.creationTime || null),
            },
            gallery: savedProfile.gallery || p.gallery || [],
            donorType: (savedProfile.donorType as DonorType) || p.donorType,
            organization: {
              organizationName: savedProfile.organization?.organizationName || p.organization.organizationName,
              businessType: savedProfile.organization?.businessType || p.organization.businessType,
              address: savedProfile.organization?.address || p.organization.address,
              licenseNumber: savedProfile.organization?.licenseNumber || p.organization.licenseNumber,
            },
            location: {
              pickupAddress: savedProfile.location?.pickupAddress || p.location.pickupAddress,
              pincode: savedProfile.location?.pincode || p.location.pincode,
              city: savedProfile.location?.city || p.location.city,
              state: savedProfile.location?.state || p.location.state,
              country: savedProfile.location?.country || p.location.country,
            },
            preferences: {
              donationCategories: (savedProfile.preferences?.donationCategories as DonationCategory[]) || p.preferences.donationCategories,
              preferredResourceTypes: (savedProfile.preferences?.preferredResourceTypes as DonationPayload['resourceType'][]) || p.preferences.preferredResourceTypes,
              preferredAreas: (savedProfile.preferences?.preferredAreas as string[]) || p.preferences.preferredAreas,
              emergencyDonations: savedProfile.preferences?.emergencyDonations ?? p.preferences.emergencyDonations,
              preferredPickupTime: savedProfile.preferences?.preferredPickupTime || p.preferences.preferredPickupTime,
              notificationPreference: (savedProfile.preferences?.notificationPreference as 'email' | 'push' | 'sms') || p.preferences.notificationPreference,
            },
            addressBook: Array.isArray(savedProfile.addressBook) ? savedProfile.addressBook : p.addressBook,
            trust: {
              verifiedStatus: savedProfile.trust?.verifiedStatus ?? p.trust.verifiedStatus,
              donorRating: savedProfile.trust?.donorRating ?? p.trust.donorRating,
              trustBadges: savedProfile.trust?.trustBadges || p.trust.trustBadges,
            },
            notifications: {
              emailNotifications: savedProfile.notifications?.emailNotifications ?? p.notifications.emailNotifications,
              pushNotifications: savedProfile.notifications?.pushNotifications ?? p.notifications.pushNotifications,
              smsNotifications: savedProfile.notifications?.smsNotifications ?? p.notifications.smsNotifications,
            },
            systemSecurity: {
              lastLoginTime: formatAuthTime(authUser.metadata?.lastSignInTime || null),
              accountBlocked: savedProfile.systemSecurity?.accountBlocked ?? p.systemSecurity.accountBlocked,
            },
          }));
          profileLoadedRef.current = true;
        }
      } catch (error: any) {
        // Only log non-404 errors (404 is expected for new users)
        if (error.response?.status !== 404) {
          console.error('Failed to load profile data:', error);
        }
        // If profile doesn't exist, keep default values
      }
    };

    if (authUser?.uid) {
      loadProfileData();
    }
  }, [authUser?.uid]);

  useEffect(() => {
    if (!authUser?.email) return;
    // Don't overwrite if profile has been loaded from MongoDB
    if (profileLoadedRef.current) {
      // Only update systemSecurity.lastLoginTime and accountCreationDate
      setProfile((p) => ({
        ...p,
        basic: {
          ...p.basic,
          firebaseUid: authUser.uid || '—',
          accountCreationDate: formatAuthTime(authUser.metadata?.creationTime || null),
        },
        systemSecurity: {
          ...p.systemSecurity,
          lastLoginTime: formatAuthTime(authUser.metadata?.lastSignInTime || null),
        },
      }));
      return;
    }

    setProfile((p) => ({
      ...p,
      basic: {
        ...p.basic,
        name: p.basic.name === '—' ? (authUser.displayName || '—') : p.basic.name,
        email: p.basic.email === '—' ? (authUser.email || '—') : p.basic.email,
        phone: p.basic.phone || authUser.phoneNumber || '',
        photoUrl: p.basic.photoUrl || authUser.photoURL || '',
        firebaseUid: authUser.uid || '—',
        accountCreationDate: formatAuthTime(authUser.metadata?.creationTime || null),
      },
      systemSecurity: {
        ...p.systemSecurity,
        lastLoginTime: formatAuthTime(authUser.metadata?.lastSignInTime || null),
      },
    }));
  }, [authUser?.email, authUser?.displayName, authUser?.phoneNumber, authUser?.photoURL, authUser?.uid, authUser?.metadata?.creationTime, authUser?.metadata?.lastSignInTime]);

  useEffect(() => {
    if (!isEditing) return;

    const digits = (profile.location.pincode || '').replace(/\D/g, '');
    const qParts: string[] = [];
    if ((profile.location.pickupAddress || '').trim().length >= 3) qParts.push(profile.location.pickupAddress.trim());
    if ((profile.location.city || '').trim().length >= 2) qParts.push(profile.location.city.trim());
    if (digits.length === 6) qParts.push(digits);
    const q = qParts.join(', ');

    if (q.trim().length < 3) return;

    if (geoLookupTimerRef.current) {
      window.clearTimeout(geoLookupTimerRef.current);
      geoLookupTimerRef.current = null;
    }
    if (geoLookupAbortRef.current) {
      geoLookupAbortRef.current.abort();
      geoLookupAbortRef.current = null;
    }

    geoLookupTimerRef.current = window.setTimeout(async () => {
      const controller = new AbortController();
      geoLookupAbortRef.current = controller;
      setGeoLookupLoading(true);
      try {
        const resp = await fetch(`${import.meta.env.VITE_API_URL}/geo/nominatim?q=${encodeURIComponent(q)}&limit=5`, {
          signal: controller.signal,
        });
        const json = await resp.json();
        const rows = Array.isArray(json?.data) ? json.data : [];
        const candidates: GeoCandidate[] = rows
          .map((r: any) => {
            const addr = r?.address || {};
            const cityFrom = addr.city || addr.town || addr.village || addr.county || addr.suburb || '';
            const stateFrom = addr.state || addr.state_district || '';
            const countryFrom = addr.country || '';
            const displayName = typeof r?.display_name === 'string' ? r.display_name : '';
            return { displayName, city: cityFrom, state: stateFrom, country: countryFrom };
          })
          .filter((c: { city: any; state: any; country: any; displayName: any; }) => c.city || c.state || c.country || c.displayName);
        setGeoCandidates(candidates);
        const first = candidates[0] || null;

        setProfile((p) => {
          const nextLoc = { ...p.location } as any;
          if (first) {
            if (!nextLoc.city && first.city) nextLoc.city = first.city;
            if (!nextLoc.state && first.state) nextLoc.state = first.state;
            if (!nextLoc.country && first.country) nextLoc.country = first.country;
            if (!nextLoc.pickupAddress && first.displayName) nextLoc.pickupAddress = first.displayName;
          }
          return { ...p, location: nextLoc };
        });
      } catch (e: any) {
        if (e?.name !== 'AbortError') {
          // ignore
        }
      } finally {
        setGeoLookupLoading(false);
      }
    }, 600);

    return () => {
      if (geoLookupTimerRef.current) {
        window.clearTimeout(geoLookupTimerRef.current);
        geoLookupTimerRef.current = null;
      }
      if (geoLookupAbortRef.current) {
        geoLookupAbortRef.current.abort();
        geoLookupAbortRef.current = null;
      }
    };
  }, [isEditing, profile.location.pickupAddress, profile.location.pincode, profile.location.city]);

  const handleProfileImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !file.type.startsWith('image/')) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const imageUrl = event.target?.result as string;
      setProfile(p => ({
        ...p,
        basic: {
          ...p.basic,
          photoUrl: imageUrl
        }
      }));
    };
    reader.readAsDataURL(file);
  };

  const handleProfileImageClick = () => {
    if (isEditing && profileImageInputRef.current) {
      profileImageInputRef.current.click();
    }
  };

  const geoCountries = useMemo(() => {
    return Array.from(new Set(geoCandidates.map((c) => c.country).filter(Boolean)));
  }, [geoCandidates]);

  const geoStates = useMemo(() => {
    const country = profile.location.country;
    return Array.from(
      new Set(
        geoCandidates
          .filter((c) => (!country ? true : c.country === country))
          .map((c) => c.state)
          .filter(Boolean)
      )
    );
  }, [geoCandidates, profile.location.country]);

  const handleCountrySelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const country = e.target.value;
    setProfile((p) => {
      const nextLoc = { ...p.location, country };
      const pick = geoCandidates.find((c) => c.country === country);
      if (pick) {
        if (!nextLoc.state && pick.state) nextLoc.state = pick.state;
        if (!nextLoc.city && pick.city) nextLoc.city = pick.city;
        if (!nextLoc.pickupAddress && pick.displayName) nextLoc.pickupAddress = pick.displayName;
      }
      return { ...p, location: nextLoc };
    });
  };

  const handleStateSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const state = e.target.value;
    setProfile((p) => ({ ...p, location: { ...p.location, state } }));
  };

  const handleGalleryFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    const readers = files
      .filter((f) => f.type.startsWith('image/'))
      .map((f) => new Promise<string>((resolve) => {
        const r = new FileReader();
        r.onload = () => resolve(r.result as string);
        r.readAsDataURL(f);
      }));

    Promise.all(readers).then((items) => {
      setProfile((p) => ({ ...p, gallery: [...items, ...(p.gallery || [])] }));
      if (galleryInputRef.current) galleryInputRef.current.value = '';
    });
  };

  const handleRemoveGalleryItem = (index: number) => {
    setProfile((p) => ({
      ...p,
      gallery: (p.gallery || []).filter((_, i) => i !== index),
    }));
  };

  const handleBasicField = (key: keyof typeof profile.basic) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setProfile(p => ({ ...p, basic: { ...p.basic, [key]: e.target.value } }));
    setErrors(prev => {
      const copy = { ...prev };
      delete copy[`basic.${key}` as keyof ProfileErrors];
      return copy;
    });
  };

  const handleOrgField = (key: keyof typeof profile.organization) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setProfile(p => ({ ...p, organization: { ...p.organization, [key]: e.target.value } }));
  };

  const handleLocationField = (key: keyof typeof profile.location) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setProfile(p => {
      const nextLoc = { ...p.location, [key]: value } as typeof p.location;
      if (key === 'pincode') {
        const digits = value.replace(/\D/g, '');
        if (digits.length === 6 && PINCODE_CITY[digits]) {
          nextLoc.city = PINCODE_CITY[digits];
        }
      }
      return { ...p, location: nextLoc };
    });
    setErrors(prev => {
      const copy = { ...prev };
      delete copy[`location.${key}` as keyof ProfileErrors];
      return copy;
    });
  };

  const handleSave = async () => {
    setFormError(null);
    const ok = validateProfile();
    if (!ok) {
      setFormError('Please fix the highlighted fields before saving.');
      return;
    }
    const nextProfile = {
      ...profile,
      basic: {
        ...profile.basic,
        phone: normalizePhone(profile.basic.phone),
      },
    };
    try {
      const payload = { ...nextProfile, firebaseUid: nextProfile.basic.firebaseUid } as any;
      await fetch(`${import.meta.env.VITE_API_URL}/profile/upsert`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      // Dispatch event to notify other components to refresh profile data
      window.dispatchEvent(new CustomEvent('profileUpdated'));
    } catch (e) {}
    setProfile(() => nextProfile);
    setIsEditing(false);
    setErrors({});
  };

  const handleCancel = () => {
    setIsEditing(false);
    setErrors({});
    setFormError(null);
  };

  const metrics = useMemo(() => {
    const totalDonationsCount = myDonations.length;

    const sumByType = (type: DonationItem['resourceType']) =>
      myDonations
        .filter((d) => d.resourceType === type)
        .reduce((s, d) => s + Number(d.quantity || 0), 0);

    const foodQty = sumByType('Food');
    const mealsServed = Math.max(0, Math.round(foodQty * 2.5));
    const clothesDonated = Math.max(0, Math.round(sumByType('Clothes')));
    const booksDonated = Math.max(0, Math.round(sumByType('Books')));

    return { totalDonationsCount, mealsServed, clothesDonated, booksDonated };
  }, [myDonations]);

  const activity = useMemo(() => {
    if (myDonations.length === 0) return { lastDonationDate: null as string | null, isActive: null as boolean | null };

    const last = [...myDonations]
      .map((d) => (d.createdAt ? new Date(d.createdAt) : null))
      .filter(Boolean)
      .sort((a: any, b: any) => b.getTime() - a.getTime())[0] as Date | undefined;

    if (!last) return { lastDonationDate: null as string | null, isActive: null as boolean | null };

    const days = Math.floor((Date.now() - last.getTime()) / (1000 * 60 * 60 * 24));
    const isActive = days <= 30;
    return { lastDonationDate: last.toLocaleDateString(), isActive };
  }, [myDonations]);

    
  // Quick Actions handlers
  const handleChangePassword = () => {
    setChangePasswordError(null);
    setCurrentPassword('');
    setNewPassword('');
    setConfirmNewPassword('');
    setShowCurrentPassword(false);
    setShowNewPassword(false);
    setShowConfirmNewPassword(false);
    setShowChangePassword(true);
  };

  const handleUpdatePassword = async () => {
    setChangePasswordError(null);

    if (!auth.currentUser) {
      setChangePasswordError('You are not logged in. Please login again and retry.');
      return;
    }

    if (!currentPassword) {
      setChangePasswordError('Please enter your current password.');
      return;
    }

    if (!newPassword || newPassword.length < 6) {
      setChangePasswordError('New password must be at least 6 characters.');
      return;
    }

    if (newPassword !== confirmNewPassword) {
      setChangePasswordError('New password and confirm password do not match.');
      return;
    }

    const email = auth.currentUser.email;
    if (!email) {
      setChangePasswordError('Your account email is missing. Please login again and retry.');
      return;
    }

    try {
      setChangePasswordSubmitting(true);
      const cred = EmailAuthProvider.credential(email, currentPassword);
      await reauthenticateWithCredential(auth.currentUser, cred);
      await updatePassword(auth.currentUser, newPassword);
      setShowChangePassword(false);
      await signOut(auth);
    } catch (e: any) {
      const msg = typeof e?.message === 'string' ? e.message : 'Failed to update password.';
      setChangePasswordError(msg);
    } finally {
      setChangePasswordSubmitting(false);
    }
  };
  const handleDeleteAccount = async () => {
    if (!confirm('Are you sure you want to delete your account? This action cannot be undone.')) return;

    if (!auth.currentUser) {
      alert('You are not logged in. Please login again and retry.');
      return;
    }

    try {
      const idToken = await auth.currentUser.getIdToken();
      const res = await fetch(`${import.meta.env.VITE_API_URL}/auth/delete-me`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${idToken}`
        }
      });

      if (!res.ok) {
        const text = await res.text().catch(() => '');
        throw new Error(text || `Failed to delete account in backend (${res.status})`);
      }

      await signOut(auth);
      localStorage.setItem('postAccountDeleteAction', 'login');
      window.location.href = '/';
    } catch (e: any) {
      const msg = typeof e?.message === 'string' ? e.message : 'Failed to delete your account.';
      alert(msg);
    }
  };

  // (Gallery removed for donor-focused minimal layout)

  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50/60 via-white to-blue-50/60">
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-emerald-100/60 via-white to-blue-100/60" />
        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Profile</h1>
              <div className="mt-1 text-sm text-gray-600">Manage your donor details</div>
            </div>
            <div className="flex items-center gap-2">
              {!isEditing ? (
                <button
                  onClick={() => setIsEditing(true)}
                  className="inline-flex items-center justify-center px-4 h-10 rounded-full bg-white border border-gray-200 text-gray-800 hover:bg-gray-50"
                >
                  Edit
                </button>
              ) : (
                <>
                  <button onClick={handleSave} className="inline-flex items-center justify-center px-4 h-10 rounded-full bg-emerald-600 text-white hover:bg-emerald-700">Save</button>
                  <button onClick={handleCancel} className="inline-flex items-center justify-center px-4 h-10 rounded-full bg-white border border-gray-200 text-gray-800 hover:bg-gray-50">Cancel</button>
                </>
              )}
            </div>
          </div>
        </div>
      </section>

      <section className="py-6 sm:py-8">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Profile Header */}
          <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl p-6 mb-6 shadow-lg">
            <div className="flex flex-col md:flex-row items-center">
              <div className="relative group mb-4 md:mb-0 md:mr-6">
                <div 
                  className="w-24 h-24 md:w-28 md:h-28 rounded-full border-4 border-white/80 shadow-lg overflow-hidden transition-all duration-300 group-hover:shadow-xl group-hover:scale-105 cursor-pointer"
                  onClick={handleProfileImageClick}
                >
                  {profile.basic.photoUrl ? (
                    <img 
                      src={profile.basic.photoUrl} 
                      alt="profile" 
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9IiZxdW90O2N1cnJlbnRDb2xvciZxdW90OyIgc3Ryb2tlLXdpZHRoPSIyIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiIGNsYXNzPSJsdWNpZGUgbHVjaWRlLXVzZXIgcmVkLTEwMCB3LTEyIGgtMTIiPjxwYXRoIGQ9Ik0xOSAyMXYtMmE0IDQgMCAwIDAtNC00SDlhNCA0IDAgMCAwLTQgNHYyIi8+PGNpcmNsZSBjeD0iMTIiIGN5PSI3IiByPSI0Ii8+PC9zdmc+'
                      }}
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white">
                      <FiUser className="w-12 h-12" />
                    </div>
                  )}
                </div>
                <input
                  type="file"
                  ref={profileImageInputRef}
                  onChange={handleProfileImageChange}
                  accept="image/*"
                  className="hidden"
                />
                {isEditing && (
                  <div 
                    className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 bg-white text-blue-600 text-xs font-medium px-2 py-1 rounded-full shadow-md cursor-pointer hover:bg-blue-50 transition-colors"
                    onClick={handleProfileImageClick}
                  >
                    Change
                  </div>
                )}
              </div>
              <div className="text-center md:text-left">
                <h1 className="text-2xl md:text-3xl font-bold text-white mb-1">{profile.basic.name}</h1>
                <p className="text-blue-100 mb-2">{roleLabel}</p>
                <div className="flex flex-wrap justify-center md:justify-start gap-3 text-sm">
                  <span className="flex items-center text-blue-100 bg-white/20 px-3 py-1 rounded-full">
                    <FiMail className="mr-1" /> {profile.basic.email}
                  </span>
                  <span className="flex items-center text-blue-100 bg-white/20 px-3 py-1 rounded-full">
                    <FiCalendar className="mr-1" /> {profile.systemSecurity.lastLoginTime}
                  </span>
                  {profile.basic.phone && (
                    <span className="flex items-center text-blue-100 bg-white/20 px-3 py-1 rounded-full">
                      <FiPhone className="mr-1" /> {profile.basic.phone}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {formError && (
            <div className="mb-6 rounded-xl border-l-4 border-red-500 bg-red-50 p-4 shadow-sm">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-red-700">{formError}</p>
                </div>
              </div>
            </div>
          )}

          <div className="grid gap-6">
            {/* Basic Details Section */}
            <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm hover:shadow-md transition-shadow duration-200">
              <div className="flex items-center mb-6">
                <div className="p-2 bg-blue-50 rounded-lg text-blue-600 mr-3">
                  <FiUser className="w-5 h-5" />
                </div>
                <h2 className="text-xl font-semibold text-gray-800">Basic Information</h2>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Full Name <span className="text-red-600">*</span>
                  </label>
                  {isEditing ? (
                    <>
                      <input
                        value={profile.basic.name}
                        onChange={handleBasicField('name')}
                        className={`w-full px-4 py-2.5 rounded-lg border ${errors['basic.name'] ? 'border-red-300 focus:ring-2 focus:ring-red-200 focus:border-red-400' : 'border-gray-200 focus:ring-2 focus:ring-blue-200 focus:border-blue-400'} transition-all duration-200 outline-none`}
                        placeholder="Enter your full name"
                      />
                      {errors['basic.name'] && (
                        <p className="mt-1.5 text-sm text-red-600 flex items-center">
                          <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                          </svg>
                          {errors['basic.name']}
                        </p>
                      )}
                    </>
                  ) : (
                    <div className="text-gray-900">{profile.basic.name}</div>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email <span className="text-red-600">*</span>
                  </label>
                  {isEditing ? (
                    <>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <FiMail className="h-5 w-5 text-gray-400" />
                        </div>
                        <input
                          value={profile.basic.email}
                          onChange={handleBasicField('email')}
                          className={`w-full pl-10 pr-4 py-2.5 rounded-lg border ${errors['basic.email'] ? 'border-red-300 focus:ring-2 focus:ring-red-200 focus:border-red-400' : 'border-gray-200 focus:ring-2 focus:ring-blue-200 focus:border-blue-400'} transition-all duration-200 outline-none`}
                          placeholder="your.email@example.com"
                        />
                      </div>
                      {errors['basic.email'] && (
                        <p className="mt-1.5 text-sm text-red-600 flex items-center">
                          <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                          </svg>
                          {errors['basic.email']}
                        </p>
                      )}
                    </>
                  ) : (
                    <div className="text-gray-900">{profile.basic.email}</div>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Phone Number <span className="text-red-600">*</span>
                  </label>
                  {isEditing ? (
                    <>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <FiPhone className="h-5 w-5 text-gray-400" />
                        </div>
                        <input
                          value={profile.basic.phone}
                          onChange={handleBasicField('phone')}
                          className={`w-full pl-10 pr-4 py-2.5 rounded-lg border ${errors['basic.phone'] ? 'border-red-300 focus:ring-2 focus:ring-red-200 focus:border-red-400' : 'border-gray-200 focus:ring-2 focus:ring-blue-200 focus:border-blue-400'} transition-all duration-200 outline-none`}
                          placeholder="+91 98765 43210"
                        />
                      </div>
                      {errors['basic.phone'] && (
                        <p className="mt-1.5 text-sm text-red-600 flex items-center">
                          <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                          </svg>
                          {errors['basic.phone']}
                        </p>
                      )}
                    </>
                  ) : (
                    <div className="text-gray-900">{profile.basic.phone || '—'}</div>
                  )}
                </div>
                <div>
                  <div className="flex items-center text-sm text-gray-500 mb-1">
                    <FiShield className="w-4 h-4 mr-1.5 text-gray-400" />
                    <span>Account ID</span>
                  </div>
                  <div className="text-sm text-gray-700 bg-gray-50 px-3 py-2 rounded-lg font-mono break-all">
                    {profile.basic.firebaseUid}
                  </div>
                </div>
                <div className="sm:col-span-2">
                  <div className="flex items-center text-sm text-gray-500 mb-1">
                    <FiCalendar className="w-4 h-4 mr-1.5 text-gray-400" />
                    <span>Member Since</span>
                  </div>
                  <div className="text-gray-700">
                    {new Date(profile.basic.accountCreationDate).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-2xl bg-white/70 backdrop-blur border border-white/60 p-5 sm:p-6 shadow-sm">
              <div className="flex items-center justify-between gap-3 mb-4">
                <div className="text-lg font-semibold text-gray-900">Donor Overview</div>
                <div className="text-xs text-gray-500">Read-only</div>
              </div>

              {donorDashboardLoading ? (
                <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="rounded-xl border border-gray-100 bg-white p-4">
                      <div className="h-4 w-28 bg-gray-100 rounded animate-pulse" />
                      <div className="mt-3 h-7 w-16 bg-gray-100 rounded animate-pulse" />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="rounded-xl border border-gray-100 bg-white p-4">
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <FiTrendingUp className="h-4 w-4" />
                      Total Donations Made
                    </div>
                    <div className="mt-2 text-2xl font-bold text-gray-900">{Number(donorDashboard?.summary?.totalDonations ?? 0).toLocaleString()}</div>
                  </div>
                  <div className="rounded-xl border border-gray-100 bg-white p-4">
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <FiBarChart2 className="h-4 w-4" />
                      Total Resources Donated
                    </div>
                    <div className="mt-2 text-2xl font-bold text-gray-900">{Number(donorDashboard?.impact?.resourcesDonated ?? 0).toLocaleString()}</div>
                  </div>
                  <div className="rounded-xl border border-gray-100 bg-white p-4">
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <FiClock className="h-4 w-4" />
                      Last Donation Date
                    </div>
                    <div className="mt-2 text-sm font-semibold text-gray-900">
                      {donorDashboard?.lastDonationDate ? new Date(donorDashboard.lastDonationDate).toLocaleDateString('en-IN') : '—'}
                    </div>
                  </div>
                  <div className="rounded-xl border border-gray-100 bg-white p-4">
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <FiCheckCircle className="h-4 w-4" />
                      Active Donations
                    </div>
                    <div className="mt-2 text-2xl font-bold text-gray-900">{Number(donorDashboard?.activeDonations ?? 0).toLocaleString()}</div>
                  </div>
                </div>
              )}
            </div>

            <div className="rounded-2xl bg-white/70 backdrop-blur border border-white/60 p-5 sm:p-6 shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
                <div>
                  <div className="text-lg font-semibold text-gray-900">Donation History</div>
                  <div className="text-sm text-gray-600">Real records linked to your account</div>
                </div>
                <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
                  <select
                    value={String(historyLimit)}
                    onChange={(e) => {
                      const next = Number(e.target.value);
                      if (Number.isFinite(next) && next > 0) {
                        setHistoryLimit(next);
                        setHistoryPage(1);
                      }
                    }}
                    className="h-10 rounded-lg border border-gray-200 bg-white px-3 text-sm"
                  >
                    <option value="5">5 / page</option>
                    <option value="8">8 / page</option>
                    <option value="10">10 / page</option>
                    <option value="15">15 / page</option>
                  </select>
                  <select
                    value={historyResourceType}
                    onChange={(e) => {
                      const next = e.target.value as DonationPayload['resourceType'] | '';
                      setHistoryResourceType(next);
                      loadHistory({ page: 1, resourceType: next });
                    }}
                    className="h-10 rounded-lg border border-gray-200 bg-white px-3 text-sm"
                  >
                    <option value="">All resource types</option>
                    <option value="Food">Food</option>
                    <option value="Clothes">Clothes</option>
                    <option value="Books">Books</option>
                    <option value="Medical Supplies">Medical Supplies</option>
                    <option value="Other Essentials">Other Essentials</option>
                  </select>
                </div>
              </div>

              {historyError ? (
                <div className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-900">{historyError}</div>
              ) : historyLoading ? (
                <div className="space-y-3">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="rounded-xl border border-gray-100 bg-white p-4">
                      <div className="h-4 w-40 bg-gray-100 rounded animate-pulse" />
                      <div className="mt-3 h-4 w-64 bg-gray-100 rounded animate-pulse" />
                    </div>
                  ))}
                </div>
              ) : historyRows.length === 0 ? (
                <div className="rounded-xl border border-dashed border-gray-200 bg-white px-4 py-10 text-center">
                  <div className="text-sm font-semibold text-gray-900">No donations found</div>
                  <div className="mt-1 text-sm text-gray-600">Try changing the filter.</div>
                </div>
              ) : (
                <>
                  <div className="overflow-x-auto rounded-xl border border-gray-100 bg-white">
                    <table className="min-w-full text-sm">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-3 text-left font-semibold text-gray-700">Donation ID</th>
                          <th className="px-4 py-3 text-left font-semibold text-gray-700">Resource Type</th>
                          <th className="px-4 py-3 text-left font-semibold text-gray-700">Quantity / Amount</th>
                          <th className="px-4 py-3 text-left font-semibold text-gray-700">Donation Date</th>
                          <th className="px-4 py-3 text-left font-semibold text-gray-700">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {historyRows.map((d) => (
                          <tr key={d._id} className="hover:bg-gray-50">
                            <td className="px-4 py-3">
                              <div className="font-mono text-xs bg-gray-100 px-2 py-1 rounded inline-block">{String(d._id).slice(-10)}</div>
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-2">
                                <FiBarChart2 className="h-4 w-4 text-gray-400" />
                                <span className="font-medium text-gray-900">{d.resourceType}</span>
                              </div>
                            </td>
                            <td className="px-4 py-3 text-gray-900">{d.quantity} {d.unit}</td>
                            <td className="px-4 py-3 text-gray-700">{d.createdAt ? new Date(d.createdAt).toLocaleString('en-IN') : '—'}</td>
                            <td className="px-4 py-3">
                              <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${
                                d.status === 'completed'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : d.status === 'cancelled'
                                    ? 'bg-red-100 text-red-800'
                                    : 'bg-amber-100 text-amber-800'
                              }`}>
                                {d.status.charAt(0).toUpperCase() + d.status.slice(1)}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="mt-4 flex flex-col sm:flex-row items-center justify-between gap-3">
                    <div className="text-sm text-gray-600">
                      Page {historyPage} of {historyPages} ({historyTotal} total)
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        className="h-10 px-3 rounded-lg border border-gray-200 bg-white text-sm font-semibold text-gray-700 disabled:opacity-50"
                        disabled={historyPage <= 1 || historyLoading}
                        onClick={() => loadHistory({ page: Math.max(1, historyPage - 1) })}
                      >
                        Prev
                      </button>
                      <button
                        type="button"
                        className="h-10 px-3 rounded-lg border border-gray-200 bg-white text-sm font-semibold text-gray-700 disabled:opacity-50"
                        disabled={historyPage >= historyPages || historyLoading}
                        onClick={() => loadHistory({ page: Math.min(historyPages, historyPage + 1) })}
                      >
                        Next
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>

            <div className="rounded-2xl bg-white/70 backdrop-blur border border-white/60 p-5 sm:p-6 shadow-sm">
              <div className="text-lg font-semibold text-gray-900 mb-4">Real-time Donation Insights</div>

              {donorDashboardLoading ? (
                <div className="grid lg:grid-cols-2 gap-6">
                  <div className="rounded-xl border border-gray-100 bg-white p-4">
                    <div className="h-4 w-40 bg-gray-100 rounded animate-pulse" />
                    <div className="mt-4 h-56 bg-gray-100 rounded animate-pulse" />
                  </div>
                  <div className="rounded-xl border border-gray-100 bg-white p-4">
                    <div className="h-4 w-40 bg-gray-100 rounded animate-pulse" />
                    <div className="mt-4 h-56 bg-gray-100 rounded animate-pulse" />
                  </div>
                </div>
              ) : (
                <div className="grid lg:grid-cols-2 gap-6">
                  <div className="rounded-xl border border-gray-100 bg-white p-4">
                    <div className="text-sm font-semibold text-gray-900 mb-2">Donations by resource type</div>
                    {(donorDashboard?.donationsByType || []).length === 0 ? (
                      <div className="py-10 text-center text-sm text-gray-600">No donation data yet.</div>
                    ) : (
                      <div style={{ width: '100%', height: 260 }}>
                        <ResponsiveContainer>
                          <BarChart data={donorDashboard.donationsByType}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="resourceType" />
                            <YAxis allowDecimals={false} />
                            <Tooltip />
                            <Bar dataKey="count" fill="#10b981" />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    )}
                  </div>

                  <div className="rounded-xl border border-gray-100 bg-white p-4">
                    <div className="text-sm font-semibold text-gray-900 mb-2">Monthly donation trend</div>
                    {(donorDashboard?.activity || []).length === 0 ? (
                      <div className="py-10 text-center text-sm text-gray-600">No activity data yet.</div>
                    ) : (
                      <div style={{ width: '100%', height: 260 }}>
                        <ResponsiveContainer>
                          <LineChart data={donorDashboard.activity}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="label" />
                            <YAxis allowDecimals={false} />
                            <Tooltip />
                            <Line type="monotone" dataKey="count" stroke="#2563eb" strokeWidth={2} dot={false} />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="rounded-2xl bg-white/70 backdrop-blur border border-white/60 p-5 sm:p-6 shadow-sm">
              <div className="text-lg font-semibold text-gray-900 mb-4">Location Information</div>
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <div className="text-xs text-gray-500 mb-1">Pickup address <span className="text-red-600">*</span></div>
                  {isEditing ? (
                    <>
                      <input
                        value={profile.location.pickupAddress}
                        onChange={handleLocationField('pickupAddress')}
                        className={`w-full bg-white border rounded-lg px-3 py-2 ${errors['location.pickupAddress'] ? 'border-red-300 focus:ring-red-200 focus:border-red-400' : 'border-gray-200'}`}
                      />
                      {errors['location.pickupAddress'] && <div className="mt-1 text-xs text-red-600">{errors['location.pickupAddress']}</div>}
                    </>
                  ) : (
                    <div className="text-gray-900">{profile.location.pickupAddress || '—'}</div>
                  )}
                </div>
                <div>
                  <div className="text-xs text-gray-500 mb-1">Pincode <span className="text-red-600">*</span></div>
                  {isEditing ? (
                    <>
                      <input
                        value={profile.location.pincode}
                        onChange={handleLocationField('pincode')}
                        className={`w-full bg-white border rounded-lg px-3 py-2 ${errors['location.pincode'] ? 'border-red-300 focus:ring-red-200 focus:border-red-400' : 'border-gray-200'}`}
                        placeholder="e.g. 560001"
                      />
                      {errors['location.pincode'] && <div className="mt-1 text-xs text-red-600">{errors['location.pincode']}</div>}
                    </>
                  ) : (
                    <div className="text-gray-900">{profile.location.pincode || '—'}</div>
                  )}
                </div>
                <div>
                  <div className="text-xs text-gray-500 mb-1">City <span className="text-red-600">*</span></div>
                  {isEditing ? (
                    (() => {
                      const digits = (profile.location.pincode || '').replace(/\D/g, '');
                      const mapped = PINCODE_CITY[digits];
                      if (mapped) {
                        return (
                          <>
                            <input
                              value={profile.location.city || mapped}
                              readOnly
                              className={`w-full bg-gray-50 border rounded-lg px-3 py-2 ${errors['location.city'] ? 'border-red-300 focus:ring-red-200 focus:border-red-400' : 'border-gray-200'}`}
                            />
                            <div className="mt-1 text-xs text-gray-500">Auto-filled from pincode</div>
                            {errors['location.city'] && <div className="mt-1 text-xs text-red-600">{errors['location.city']}</div>}
                          </>
                        );
                      }
                      return (
                        <>
                          <input
                            value={profile.location.city}
                            onChange={handleLocationField('city')}
                            className={`w-full bg-white border rounded-lg px-3 py-2 ${errors['location.city'] ? 'border-red-300 focus:ring-red-200 focus:border-red-400' : 'border-gray-200'}`}
                            placeholder={geoLookupLoading ? 'Detecting…' : 'Enter city'}
                          />
                          {errors['location.city'] && <div className="mt-1 text-xs text-red-600">{errors['location.city']}</div>}
                        </>
                      );
                    })()
                  ) : (
                    <div className="text-gray-900">{profile.location.city || '—'}</div>
                  )}
                </div>
                <div>
                  <div className="text-xs text-gray-500 mb-1">State</div>
                  {isEditing ? (
                    geoStates.length > 0 ? (
                      <select
                        value={profile.location.state || ''}
                        onChange={handleStateSelect}
                        className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2"
                      >
                        <option value="">Select state</option>
                        {geoStates.map((s) => (
                          <option key={s} value={s}>{s}</option>
                        ))}
                      </select>
                    ) : (
                      <input
                        value={profile.location.state || ''}
                        onChange={handleLocationField('state')}
                        className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2"
                        placeholder={geoLookupLoading ? 'Detecting…' : 'Enter state'}
                      />
                    )
                  ) : (
                    <div className="text-gray-900">{profile.location.state || '—'}</div>
                  )}
                </div>
                <div>
                  <div className="text-xs text-gray-500 mb-1">Country</div>
                  {isEditing ? (
                    geoCountries.length > 0 ? (
                      <select
                        value={profile.location.country || ''}
                        onChange={handleCountrySelect}
                        className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2"
                      >
                        <option value="">Select country</option>
                        {geoCountries.map((c) => (
                          <option key={c} value={c}>{c}</option>
                        ))}
                      </select>
                    ) : (
                      <input
                        value={profile.location.country || ''}
                        onChange={handleLocationField('country')}
                        className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2"
                        placeholder={geoLookupLoading ? 'Detecting…' : 'Enter country'}
                      />
                    )
                  ) : (
                    <div className="text-gray-900">{profile.location.country || '—'}</div>
                  )}
                </div>
              </div>
            </div>

            {/* Profile Gallery Section */}
            <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm hover:shadow-md transition-shadow duration-200">
              <div className="flex items-center mb-6">
                <div className="p-2 bg-indigo-50 rounded-lg text-indigo-600 mr-3">
                  <FiImage className="w-5 h-5" />
                </div>
                <h2 className="text-xl font-semibold text-gray-800">Gallery</h2>
                {isEditing && (
                  <button
                    type="button"
                    onClick={() => galleryInputRef.current?.click()}
                    className="ml-auto inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-full shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors duration-200"
                  >
                    <svg className="-ml-1 mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    Add Images
                  </button>
                )}
              </div>

              <input
                ref={galleryInputRef}
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={handleGalleryFiles}
              />

              {(profile.gallery?.length || 0) === 0 ? (
                <div className="text-sm text-gray-600">No images uploaded yet.</div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                  {profile.gallery.map((img, i) => (
                    <div 
                      key={i} 
                      className="relative group rounded-xl overflow-hidden aspect-square bg-gray-50 border border-gray-100 hover:border-indigo-200 transition-all duration-200"
                    >
                      <img 
                        src={img} 
                        alt={`Gallery ${i + 1}`} 
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" 
                      />
                      {isEditing && (
                        <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRemoveGalleryItem(i);
                            }}
                            className="w-8 h-8 flex items-center justify-center bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                            title="Remove image"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

            </div>

            {/* Organization Details Section */}
            <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm hover:shadow-md transition-shadow duration-200">
              <div className="flex items-center mb-6">
                <div className="p-2 bg-orange-50 rounded-lg text-orange-600 mr-3">
                  <FiShield className="w-5 h-5" />
                </div>
                <h2 className="text-xl font-semibold text-gray-800">Organization Details</h2>
                <span className="ml-2 text-sm text-gray-500">(Optional)</span>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Organization Name
                  </label>
                  {isEditing ? (
                    <input
                      value={profile.organization.organizationName}
                      onChange={handleOrgField('organizationName')}
                      className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:ring-2 focus:ring-orange-200 focus:border-orange-400 transition-all duration-200 outline-none"
                      placeholder="Enter organization name"
                    />
                  ) : (
                    <div className="text-gray-900">{profile.organization.organizationName || '—'}</div>
                  )}
                </div>
                <div>
                  <div className="text-xs text-gray-500 mb-1">Business type</div>
                  {isEditing ? (
                    <input value={profile.organization.businessType} onChange={handleOrgField('businessType')} className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2" />
                  ) : (
                    <div className="text-gray-900">{profile.organization.businessType || '—'}</div>
                  )}
                </div>
                <div>
                  <div className="text-xs text-gray-500 mb-1">Address</div>
                  {isEditing ? (
                    <input value={profile.organization.address} onChange={handleOrgField('address')} className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2" />
                  ) : (
                    <div className="text-gray-900">{profile.organization.address || '—'}</div>
                  )}
                </div>
                <div>
                  <div className="text-xs text-gray-500 mb-1">License / registration number (e.g. FSSAI)</div>
                  {isEditing ? (
                    <input value={profile.organization.licenseNumber} onChange={handleOrgField('licenseNumber')} className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2" />
                  ) : (
                    <div className="text-gray-900">{profile.organization.licenseNumber || '—'}</div>
                  )}
                </div>
              </div>
            </div>

            <div className="rounded-2xl bg-white/70 backdrop-blur border border-white/60 p-5 sm:p-6 shadow-sm">
              <div className="text-lg font-semibold text-gray-900 mb-4">Impact Metrics (Auto-calculated)</div>
              {myDonationsLoading ? (
                <div className="py-10 text-center text-sm text-gray-600">Calculating impact metrics...</div>
              ) : myDonations.length === 0 ? (
                <div className="rounded-xl border border-dashed border-gray-200 bg-white px-4 py-10 text-center">
                  <div className="text-sm font-semibold text-gray-900">No donations yet</div>
                  <div className="mt-1 text-sm text-gray-600">Your impact graph will appear after your first donation.</div>
                </div>
              ) : (
                <div className="rounded-2xl bg-white border border-gray-100 p-4">
                  <div className="text-sm font-semibold text-gray-900">Impact Graph</div>

                  {(() => {
                    const totalDonations = metrics.totalDonationsCount || 0;
                    const otherItems = [
                      { label: 'Meals served', value: metrics.mealsServed, color: 'bg-emerald-600' },
                      { label: 'Clothes donated', value: metrics.clothesDonated, color: 'bg-indigo-600' },
                      { label: 'Books donated', value: metrics.booksDonated, color: 'bg-amber-500' },
                    ];

                    const max = Math.max(...otherItems.map((x) => Number(x.value || 0)), 1);

                    return (
                      <div className="mt-5 space-y-6">
                        {/* Circular graph for Total Donations - Top */}
                        <div className="flex justify-center">
                          <div className="flex flex-col items-center gap-2">
                            <div className="relative">
                              <svg className="w-32 h-32 transform -rotate-90">
                                <circle
                                  cx="64"
                                  cy="64"
                                  r="48"
                                  stroke="#e5e7eb"
                                  strokeWidth="16"
                                  fill="none"
                                />
                                <circle
                                  cx="64"
                                  cy="64"
                                  r="48"
                                  stroke="#2563eb"
                                  strokeWidth="16"
                                  fill="none"
                                  strokeDasharray={`${2 * Math.PI * 48}`}
                                  strokeDashoffset={`${2 * Math.PI * 48 * (1 - Math.min(totalDonations / 10, 1))}`}
                                  className="transition-all duration-500"
                                />
                              </svg>
                              <div className="absolute inset-0 flex items-center justify-center">
                                <div className="text-center">
                                  <div className="text-xl font-bold text-gray-900">{totalDonations}</div>
                                  <div className="text-[11px] text-gray-500">Total</div>
                                </div>
                              </div>
                            </div>
                            <div className="text-[11px] text-gray-600 font-medium text-center leading-tight line-clamp-2">
                              Total donations
                            </div>
                          </div>
                        </div>

                        {/* Bar charts for other metrics - Bottom */}
                        <div className="h-40 w-full flex items-end justify-between gap-3">
                          {otherItems.map((it) => {
                            const v = Number(it.value || 0);
                            const pct = Math.round((v / max) * 100);
                            const height = Math.max(18, (pct / 100) * 120);
                            return (
                              <div key={it.label} className="flex-1 flex flex-col items-center gap-2 min-w-0">
                                <div className="w-full flex items-end" style={{ height: '120px' }}>
                                  <div
                                    className={`w-full rounded-t-xl ${it.color} shadow-sm`}
                                    style={{ height: `${height}px` }}
                                    title={`${it.label}: ${v}`}
                                  />
                                </div>
                                <div className="text-[11px] text-gray-600 font-medium text-center leading-tight line-clamp-2">
                                  {it.label}
                                </div>
                                <div className="text-xs font-semibold text-gray-900">{v.toLocaleString()}</div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })()}
                </div>
              )}
            </div>


            <div className="rounded-2xl bg-white/70 backdrop-blur border border-white/60 p-5 sm:p-6 shadow-sm">
              <div className="text-lg font-semibold text-gray-900 mb-4">Activity Status</div>
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <div className="text-xs text-gray-500 mb-1">Last donation date</div>
                  <div className="text-gray-900">{activity.lastDonationDate ?? '—'}</div>
                </div>
                <div>
                  <div className="text-xs text-gray-500 mb-1">Active / inactive status</div>
                  {activity.isActive === null ? (
                    <div className="inline-flex px-3 py-1 rounded-full text-sm bg-gray-100 text-gray-700">—</div>
                  ) : (
                    <div className={`inline-flex px-3 py-1 rounded-full text-sm ${activity.isActive ? 'bg-emerald-100 text-emerald-800' : 'bg-gray-100 text-gray-700'}`}>
                      {activity.isActive ? 'Active' : 'Inactive'}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-6 sm:py-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid gap-4">
            <div className="rounded-2xl bg-white/70 backdrop-blur border border-white/60 p-5">
              <div className="text-center text-xl font-semibold text-gray-900 mb-4">Quick Actions</div>
              <div className="flex flex-wrap gap-3 justify-center">
                <button onClick={handleChangePassword} className="px-5 py-2 rounded-full bg-white border border-gray-200 text-gray-700 hover:bg-gray-50">Change Password</button>
                <button onClick={handleDeleteAccount} className="px-5 py-2 rounded-full bg-white border border-gray-200 text-red-600 hover:bg-gray-50">Delete Account</button>
              </div>
            </div>
          </div>
        </div>
      </section>
      {showChangePassword && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={() => setShowChangePassword(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-xl mx-4 p-6">
            <div className="flex items-start justify-between">
              <div>
                <div className="text-3xl">🔒</div>
                <h3 className="text-2xl font-bold text-purple-700 mt-1">Change Password</h3>
                <p className="text-gray-500 mt-1">Enter your current password and choose a new one</p>
              </div>
              <button className="text-gray-400 hover:text-gray-600" onClick={() => setShowChangePassword(false)}>×</button>
            </div>
            <div className="mt-6 space-y-4">
              {changePasswordError && (
                <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {changePasswordError}
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Current Password</label>
                <div className="relative">
                  <input
                    type={showCurrentPassword ? 'text' : 'password'}
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="Enter current password"
                    className="w-full pr-12 px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-200"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPassword((v) => !v)}
                    className="absolute inset-y-0 right-0 px-4 text-gray-500 hover:text-gray-700"
                    aria-label={showCurrentPassword ? 'Hide password' : 'Show password'}
                  >
                    {showCurrentPassword ? <FiEyeOff /> : <FiEye />}
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
                <div className="relative">
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter new password (min 6 characters)"
                    className="w-full pr-12 px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-200"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword((v) => !v)}
                    className="absolute inset-y-0 right-0 px-4 text-gray-500 hover:text-gray-700"
                    aria-label={showNewPassword ? 'Hide password' : 'Show password'}
                  >
                    {showNewPassword ? <FiEyeOff /> : <FiEye />}
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Confirm New Password</label>
                <div className="relative">
                  <input
                    type={showConfirmNewPassword ? 'text' : 'password'}
                    value={confirmNewPassword}
                    onChange={(e) => setConfirmNewPassword(e.target.value)}
                    placeholder="Confirm new password"
                    className="w-full pr-12 px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-200"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmNewPassword((v) => !v)}
                    className="absolute inset-y-0 right-0 px-4 text-gray-500 hover:text-gray-700"
                    aria-label={showConfirmNewPassword ? 'Hide password' : 'Show password'}
                  >
                    {showConfirmNewPassword ? <FiEyeOff /> : <FiEye />}
                  </button>
                </div>
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button onClick={() => setShowChangePassword(false)} className="px-4 py-2 rounded bg-gray-100 text-gray-700">Cancel</button>
              <button
                onClick={handleUpdatePassword}
                disabled={changePasswordSubmitting}
                className={`px-4 py-2 rounded text-white ${changePasswordSubmitting ? 'bg-purple-400' : 'bg-purple-600 hover:bg-purple-700'}`}
              >
                {changePasswordSubmitting ? 'Updating...' : 'Update Password'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfilePage;
 

