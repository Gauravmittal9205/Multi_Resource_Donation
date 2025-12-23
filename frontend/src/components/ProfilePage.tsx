import React, { useEffect, useMemo, useRef, useState } from 'react';
import { auth } from '../firebase';
import { FiUser, FiMail, FiPhone, FiCalendar, FiShield, FiImage, FiEye, FiEyeOff } from 'react-icons/fi';
import { EmailAuthProvider, reauthenticateWithCredential, signOut, updatePassword } from 'firebase/auth';
import type { User as FirebaseUser } from 'firebase/auth';
// Lightweight count-up hook
function useCountUp(target: number, duration = 1200) {
  const [value, setValue] = useState(0);
  const startRef = useRef<number | null>(null);
  useEffect(() => {
    let raf: number;
    const step = (ts: number) => {
      if (!startRef.current) startRef.current = ts;
      const progress = Math.min(1, (ts - startRef.current) / duration);
      setValue(Math.floor(progress * target));
      if (progress < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [target, duration]);
  return value;
}
const StatCard: React.FC<{ icon: React.ReactNode; label: string; value: number; bg: string }>
  = ({ icon, label, value, bg }) => {
  const v = useCountUp(value, 1400);
  return (
    <div className={`rounded-2xl ${bg} p-5 sm:p-6 shadow-sm hover:shadow-md transition-shadow`}> 
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-white/70 backdrop-blur flex items-center justify-center text-xl">
          {icon}
        </div>
        <div>
          <div className="text-2xl font-bold text-gray-900">{v.toLocaleString()}</div>
          <div className="text-gray-600 text-sm">{label}</div>
        </div>
      </div>
    </div>
  );
};

const ProfilePage: React.FC = () => {
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

  const [authUser, setAuthUser] = useState<FirebaseUser | null>(() => auth.currentUser ?? null);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((u) => setAuthUser(u));
    return () => unsubscribe();
  }, []);

  const storedUserType = typeof window !== 'undefined' ? (localStorage.getItem('userType') as 'donor' | 'ngo' | null) : null;
  const roleLabel = storedUserType === 'ngo' ? 'NGO' : storedUserType === 'donor' ? 'Donor' : 'User';

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
    },
    preferences: {
      donationCategories: ['food'] as DonationCategory[],
      preferredPickupTime: '',
      notificationPreference: 'push' as 'email' | 'push' | 'sms',
    },
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

  useEffect(() => {
    if (!authUser?.email) return;
    const emailKey = 'donor_profile_v2_email';
    const storedEmail = localStorage.getItem(emailKey);
    if (storedEmail && storedEmail !== authUser.email) {
      localStorage.removeItem('donor_profile_v2');
    }
    localStorage.setItem(emailKey, authUser.email);

    setProfile((p) => ({
      ...p,
      basic: {
        ...p.basic,
        name: authUser.displayName || '—',
        email: authUser.email || '—',
        phone: authUser.phoneNumber || '',
        photoUrl: authUser.photoURL || '',
        firebaseUid: authUser.uid || '—',
        accountCreationDate: formatAuthTime(authUser.metadata?.creationTime || null),
      },
      systemSecurity: {
        ...p.systemSecurity,
        lastLoginTime: formatAuthTime(authUser.metadata?.lastSignInTime || null),
      },
    }));

    try {
      const raw = localStorage.getItem('donor_profile_v2');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed === 'object') {
          setProfile((p) => ({
            ...p,
            ...parsed,
            basic: { ...p.basic, ...(parsed.basic || {}), email: authUser.email || p.basic.email },
            systemSecurity: { ...p.systemSecurity, ...(parsed.systemSecurity || {}), lastLoginTime: formatAuthTime(authUser.metadata?.lastSignInTime || null) },
          }));
        }
      }
    } catch {}
  }, [authUser?.email, authUser?.displayName, authUser?.phoneNumber, authUser?.photoURL, authUser?.uid, authUser?.metadata?.creationTime, authUser?.metadata?.lastSignInTime]);

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
      localStorage.setItem('donor_profile_v2', JSON.stringify(nextProfile));
    } catch {}
    try {
      const payload = { ...nextProfile, firebaseUid: nextProfile.basic.firebaseUid } as any;
      await fetch('http://localhost:5000/api/v1/profile/upsert', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
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
    return { totalDonationsCount: 0, mealsServed: 0, clothesDonated: 0, booksDonated: 0 };
  }, []);

  const activity = useMemo(() => {
    return { lastDonationDate: null as string | null, isActive: null as boolean | null };
  }, []);

  const trustBadges = useMemo(() => {
    const badges: string[] = [];
    if (metrics.totalDonationsCount > 0) badges.push('First Donation');
    if (metrics.mealsServed >= 100) badges.push('100 Meals Club');
    if (profile.trust.verifiedStatus) badges.push('Verified');
    return badges;
  }, [metrics.mealsServed, metrics.totalDonationsCount, profile.trust.verifiedStatus]);
  
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
  const handleDeleteAccount = () => {
    if (confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
      alert('Account deletion flow will proceed.');
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
                      const commonCities = Array.from(new Set(Object.values(PINCODE_CITY)));
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
                          <select
                            value={profile.location.city}
                            onChange={handleLocationField('city') as any}
                            className={`w-full bg-white border rounded-lg px-3 py-2 ${errors['location.city'] ? 'border-red-300 focus:ring-red-200 focus:border-red-400' : 'border-gray-200'}`}
                          >
                            <option value="">Select city</option>
                            {commonCities.map((c) => (
                              <option key={c} value={c}>{c}</option>
                            ))}
                          </select>
                          {errors['location.city'] && <div className="mt-1 text-xs text-red-600">{errors['location.city']}</div>}
                        </>
                      );
                    })()
                  ) : (
                    <div className="text-gray-900">{profile.location.city || '—'}</div>
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
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard icon={<span>📦</span>} label="Total donations count" value={metrics.totalDonationsCount} bg="bg-blue-50" />
                <StatCard icon={<span>🍽️</span>} label="Meals served" value={metrics.mealsServed} bg="bg-emerald-50" />
                <StatCard icon={<span>👕</span>} label="Clothes donated" value={metrics.clothesDonated} bg="bg-blue-50" />
                <StatCard icon={<span>📚</span>} label="Books donated" value={metrics.booksDonated} bg="bg-emerald-50" />
              </div>
            </div>

            <div className="rounded-2xl bg-white/70 backdrop-blur border border-white/60 p-5 sm:p-6 shadow-sm">
              <div className="text-lg font-semibold text-gray-900 mb-4">Trust & Verification</div>
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <div className="text-xs text-gray-500 mb-1">Verified status</div>
                  {isEditing ? (
                    <label className="inline-flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={profile.trust.verifiedStatus}
                        onChange={(e) => setProfile(p => ({ ...p, trust: { ...p.trust, verifiedStatus: e.target.checked } }))}
                      />
                      <span className="text-gray-900">{profile.trust.verifiedStatus ? 'Verified' : 'Not verified'}</span>
                    </label>
                  ) : (
                    <div className={`inline-flex px-3 py-1 rounded-full text-sm ${profile.trust.verifiedStatus ? 'bg-emerald-100 text-emerald-800' : 'bg-gray-100 text-gray-700'}`}>
                      {profile.trust.verifiedStatus ? 'Verified' : 'Not verified'}
                    </div>
                  )}
                </div>
                <div>
                  <div className="text-xs text-gray-500 mb-1">Donor rating</div>
                  {isEditing ? (
                    <input
                      type="number"
                      min={0}
                      max={5}
                      step={0.1}
                      value={profile.trust.donorRating}
                      onChange={(e) => {
                        setProfile(p => ({ ...p, trust: { ...p.trust, donorRating: Number(e.target.value) } }));
                        setErrors(prev => {
                          const copy = { ...prev };
                          delete copy['trust.donorRating'];
                          return copy;
                        });
                      }}
                      className={`w-full bg-white border rounded-lg px-3 py-2 ${errors['trust.donorRating'] ? 'border-red-300 focus:ring-red-200 focus:border-red-400' : 'border-gray-200'}`}
                    />
                  ) : (
                    <div className="text-gray-900">{profile.trust.donorRating ? profile.trust.donorRating.toFixed(1) : '—'}</div>
                  )}
                  {isEditing && errors['trust.donorRating'] && <div className="mt-1 text-xs text-red-600">{errors['trust.donorRating']}</div>}
                </div>
                <div className="sm:col-span-2">
                  <div className="text-xs text-gray-500 mb-2">Trust badges</div>
                  <div className="flex flex-wrap gap-2">
                    {(trustBadges.length ? trustBadges : ['—']).map((b, i) => (
                      <span key={`${b}-${i}`} className="px-3 py-1 rounded-full text-sm bg-emerald-50 text-emerald-800 border border-emerald-200">
                        {b}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
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
 

