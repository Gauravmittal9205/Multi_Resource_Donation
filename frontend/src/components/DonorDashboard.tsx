import { useEffect, useMemo, useRef, useState } from 'react';
import type { User as FirebaseUser } from 'firebase/auth';
import { createDonation, fetchDonorDashboard, fetchDonorProfileByUid, fetchMyDonations } from '../services/donationService';
import type { DonationItem } from '../services/donationService';
import {
  FiGrid,
  FiBox,
  FiHash,
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
} from 'react-icons/fi';

type DonorDashboardProps = {
  user: FirebaseUser | null;
  onBack: () => void;
};

type MenuKey = 'dashboard' | 'my-donations' | 'donate-now' | 'active-pickups' | 'donation-history';

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
      // Prevent any global key handlers from triggering while user is typing
      e.stopPropagation();
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
      e.stopPropagation();
    }}
    className="w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-sm text-gray-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-200 focus:border-emerald-300"
  >
    {children}
  </select>
);

function DonorDashboard({ user, onBack }: DonorDashboardProps) {
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

  const [dashboardLoading, setDashboardLoading] = useState(false);
  const [dashboardError, setDashboardError] = useState<string | null>(null);
  const [dashboardData, setDashboardData] = useState<
    | {
        summary: { totalDonations: number; activePickups: number; completedDonations: number };
        activity: { label: string; count: number }[];
        recentDonations: any[];
      }
    | null
  >(null);

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

  useEffect(() => {
    loadDashboard();
  }, []);

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
  ];

  const Sidebar = ({ variant }: { variant: 'desktop' | 'mobile' }) => {
    return (
      <aside
        className={
          variant === 'desktop'
            ? 'hidden lg:flex lg:flex-col w-72 shrink-0 bg-white border-r border-gray-100'
            : 'flex flex-col w-72 max-w-[85vw] bg-white h-full shadow-2xl'
        }
      >
        <div className="p-5">
          <div className="mb-1">
            <div className="text-xs font-semibold tracking-wide text-gray-500 mb-1">Welcome back,</div>
            <div className="font-medium text-gray-900 truncate">
              {user.displayName || user.email?.split('@')[0] || 'Donor'}
            </div>
          </div>
          <nav className="mt-6 space-y-2">
            {menu.map((item) => {
              const isActive = activeItem === item.key;
              const Icon = item.icon;
              const isPrimary = Boolean(item.primary);

              const base =
                'w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm transition-colors';
              const active = 'bg-emerald-50 text-emerald-800';
              const normal = 'text-gray-700 hover:bg-gray-50';
              // Use same active style as other menu items for consistency
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
                    : normal);

              return (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => {
                    setActiveItem(item.key);
                    setMobileSidebarOpen(false);
                  }}
                  className={cls}
                >
                  <Icon className={isPrimary && isActive ? 'h-5 w-5' : 'h-5 w-5'} />
                  <span className={isPrimary && isActive ? 'font-semibold' : isActive ? 'font-semibold' : 'font-medium'}>
                    {item.label}
                  </span>
                </button>
              );
            })}
          </nav>
        </div>
      </aside>
    );
  };

  const [myDonationsLoading, setMyDonationsLoading] = useState(false);
  const [myDonationsError, setMyDonationsError] = useState<string | null>(null);
  const [myDonations, setMyDonations] = useState<DonationItem[]>([]);

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

  const SummaryCard = ({
    title,
    icon: Icon,
    value,
  }: {
    title: string;
    icon: React.ComponentType<{ className?: string }>;
    value: React.ReactNode;
  }) => {
    return (
      <div className="group rounded-2xl bg-white border border-gray-100 shadow-sm hover:shadow-md transition-shadow p-5">
        <div className="flex items-start justify-between">
          <div>
            <div className="text-sm font-medium text-gray-600">{title}</div>
            <div className="mt-2 text-3xl font-semibold text-gray-900">{value}</div>
          </div>
          <div className="h-10 w-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center group-hover:scale-[1.03] transition-transform">
            <Icon className="h-5 w-5" />
          </div>
        </div>
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

    const [clothingType, setClothingType] = useState<'Men' | 'Women' | 'Kids' | ''>('');
    const [condition, setCondition] = useState<'New' | 'Gently Used' | ''>('');
    const [season, setSeason] = useState<'Summer' | 'Winter' | 'All-season' | ''>('');
    const [numberOfItems, setNumberOfItems] = useState('');

    const [bookType, setBookType] = useState<'Academic' | 'Story' | 'Competitive' | 'Other' | ''>('');
    const [educationLevel, setEducationLevel] = useState<'Primary' | 'Secondary' | 'College' | ''>('');
    const [language, setLanguage] = useState('');
    const [numberOfBooks, setNumberOfBooks] = useState('');

    const [medicalItemType, setMedicalItemType] = useState<'Medicines' | 'Masks' | 'Equipment' | ''>('');
    const [sealedPack, setSealedPack] = useState<'Yes' | 'No' | ''>('');
    const [medicalExpiryDate, setMedicalExpiryDate] = useState('');
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
          const profile = res?.data;
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
          isNonEmpty(clothingType) &&
          isNonEmpty(condition) &&
          isNonEmpty(season) &&
          isNonEmpty(numberOfItems)
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
        return (
          isNonEmpty(medicalItemType) &&
          isNonEmpty(sealedPack) &&
          isNonEmpty(medicalExpiryDate) &&
          isNonEmpty(medicalQuantity)
        );
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

      setClothingType('');
      setCondition('');
      setSeason('');
      setNumberOfItems('');

      setBookType('');
      setEducationLevel('');
      setLanguage('');
      setNumberOfBooks('');

      setMedicalItemType('');
      setSealedPack('');
      setMedicalExpiryDate('');
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
          details.clothingType = clothingType;
          details.condition = condition;
          details.season = season;
          details.numberOfItems = numberOfItems;
        } else if (resourceType === 'Books') {
          details.bookType = bookType;
          details.educationLevel = educationLevel;
          details.language = language;
          details.numberOfBooks = numberOfBooks;
        } else if (resourceType === 'Medical Supplies') {
          details.medicalItemType = medicalItemType;
          details.sealedPack = sealedPack;
          details.medicalExpiryDate = medicalExpiryDate;
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

    const SectionCard = ({
      title,
      subtitle,
      children,
    }: {
      title: string;
      subtitle?: string;
      children: React.ReactNode;
    }) => (
      <div className="rounded-2xl bg-white border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-5">
          <div className="text-base font-semibold text-gray-900">{title}</div>
          {subtitle ? <div className="mt-1 text-sm text-gray-600">{subtitle}</div> : null}
        </div>
        <div className="px-5 pb-5">{children}</div>
      </div>
    );

    const DynamicFields = () => {
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
              <FieldLabel>Clothing Type *</FieldLabel>
              <Select value={clothingType} onChange={(v) => setClothingType(v as any)}>
                <option value="">Select</option>
                <option value="Men">Men</option>
                <option value="Women">Women</option>
                <option value="Kids">Kids</option>
              </Select>
            </div>
            <div>
              <FieldLabel>Condition *</FieldLabel>
              <Select value={condition} onChange={(v) => setCondition(v as any)}>
                <option value="">Select</option>
                <option value="New">New</option>
                <option value="Gently Used">Gently Used</option>
              </Select>
            </div>
            <div>
              <FieldLabel>Season *</FieldLabel>
              <Select value={season} onChange={(v) => setSeason(v as any)}>
                <option value="">Select</option>
                <option value="Summer">Summer</option>
                <option value="Winter">Winter</option>
                <option value="All-season">All-season</option>
              </Select>
            </div>
            <div>
              <FieldLabel>Number of Items *</FieldLabel>
              <NumericInput value={numberOfItems} onChange={setNumberOfItems} placeholder="e.g. 6" />
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
              <FieldLabel>Item Type *</FieldLabel>
              <Select value={medicalItemType} onChange={(v) => setMedicalItemType(v as any)}>
                <option value="">Select</option>
                <option value="Medicines">Medicines</option>
                <option value="Masks">Masks</option>
                <option value="Equipment">Equipment</option>
              </Select>
            </div>
            <div>
              <FieldLabel>Sealed Pack? *</FieldLabel>
              <Select value={sealedPack} onChange={(v) => setSealedPack(v as any)}>
                <option value="">Select</option>
                <option value="Yes">Yes</option>
                <option value="No">No</option>
              </Select>
            </div>
            <div>
              <FieldLabel>Expiry Date *</FieldLabel>
              <TextInput value={medicalExpiryDate} onChange={setMedicalExpiryDate} type="date" />
            </div>
            <div>
              <FieldLabel>Quantity *</FieldLabel>
              <NumericInput value={medicalQuantity} onChange={setMedicalQuantity} placeholder="e.g. 20" />
            </div>
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
        <SectionCard
          title="Donate Now"
          subtitle="Provide clear details so NGOs can verify and prepare for pickup."
        >
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

            <div className="transition-all duration-300 ease-out" key={resourceType}>
              <DynamicFields />
            </div>

            <div className="rounded-2xl border border-gray-100 bg-white shadow-sm p-5">
              <div className="text-sm font-semibold text-gray-900">Pickup Address</div>
              <div className="mt-4 grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div className="lg:col-span-2">
                  <FieldLabel>Address Line *</FieldLabel>
                  <div className="relative">
                    <TextInput value={addressLine} onChange={setAddressLine} placeholder="House no., street, landmark" />

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
                  <TextInput value={city} onChange={setCity} placeholder="City" />
                </div>
                <div>
                  <FieldLabel>State *</FieldLabel>
                  <TextInput value={state} onChange={setState} placeholder="State" />
                </div>
                <div>
                  <FieldLabel>Pincode *</FieldLabel>
                  <NumericInput value={pincode} onChange={setPincode} placeholder="Pincode" />
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
                  e.stopPropagation();
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
        </SectionCard>
      </div>
    );
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-gradient-to-b from-gray-50 via-white to-emerald-50/30">
      <div className="flex min-h-[calc(100vh-4rem)]">
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

        <main className="flex-1 min-w-0 p-4 sm:p-6 lg:p-8">
          {activeItem === 'dashboard' && (
            <div className="space-y-6">
              {dashboardError ? (
                <div className="rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-900">
                  {dashboardError}
                </div>
              ) : null}
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                <SummaryCard
                  title="Total Donations"
                  icon={FiPackage}
                  value={dashboardLoading ? '--' : dashboardData?.summary?.totalDonations ?? 0}
                />
                <SummaryCard
                  title="Active Pickups"
                  icon={FiTruck}
                  value={dashboardLoading ? '--' : dashboardData?.summary?.activePickups ?? 0}
                />
                <SummaryCard
                  title="Completed Donations"
                  icon={FiCheckCircle}
                  value={dashboardLoading ? '--' : dashboardData?.summary?.completedDonations ?? 0}
                />
              </div>

              <section className="rounded-2xl bg-white border border-gray-100 shadow-sm p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-2">
                    <FiBarChart2 className="h-5 w-5 text-emerald-700" />
                    <h2 className="text-base font-semibold text-gray-900">Donation Activity</h2>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      disabled
                      className="px-3 py-1.5 text-xs font-medium rounded-full bg-gray-50 text-gray-400 border border-gray-100 cursor-not-allowed"
                    >
                      Monthly
                    </button>
                    <button
                      type="button"
                      disabled
                      className="px-3 py-1.5 text-xs font-medium rounded-full bg-gray-50 text-gray-400 border border-gray-100 cursor-not-allowed"
                    >
                      Yearly
                    </button>
                  </div>
                </div>

                <div className="mt-4 rounded-xl border border-dashed border-gray-200 bg-gradient-to-br from-gray-50 to-white p-5">
                  <div className="h-40 w-full rounded-lg bg-white/70 border border-gray-100 flex items-end gap-2 p-4 overflow-hidden">
                    {(dashboardData?.activity || Array.from({ length: 12 }).map(() => ({ label: '', count: 0 }))).map(
                      (a: any, i: number) => {
                        const max = Math.max(...(dashboardData?.activity || []).map((x: any) => x.count), 1);
                        const pct = Math.round((Number(a.count || 0) / max) * 100);
                        return (
                          <div
                            key={i}
                            className="w-3 rounded-md bg-emerald-200/60"
                            style={{ height: `${Math.max(10, pct)}%` }}
                            title={a.label ? `${a.label}: ${a.count}` : undefined}
                          />
                        );
                      }
                    )}
                  </div>
                  <div className="mt-4 text-sm text-gray-600">
                    {dashboardLoading
                      ? 'Loading...'
                      : (dashboardData?.summary?.totalDonations ?? 0) > 0
                        ? 'Last 12 months'
                        : 'No data available yet'}
                  </div>
                </div>
              </section>

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
                      </tr>
                    </thead>
                    <tbody className="text-gray-700">
                      {(() => {
                        const actives = (dashboardData?.recentDonations || []).filter((d: any) =>
                          ['pending', 'assigned', 'picked'].includes(String(d.status))
                        );

                        if (actives.length === 0) {
                          return (
                            <tr className="border-t border-gray-100">
                              <td className="py-4" colSpan={4}>
                                <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50 px-4 py-8 text-center">
                                  <div className="text-sm font-semibold text-gray-900">
                                    {dashboardLoading ? 'Loading...' : 'No active pickups right now.'}
                                  </div>
                                  <div className="mt-1 text-sm text-gray-600">
                                    Once an NGO starts processing your donation, it will show up here.
                                  </div>
                                </div>
                              </td>
                            </tr>
                          );
                        }

                        return actives.map((d: any) => (
                          <tr key={d._id} className="border-t border-gray-100">
                            <td className="py-3 pr-4">--</td>
                            <td className="py-3 pr-4">
                              {d.pickup?.pickupDate ? new Date(d.pickup.pickupDate).toLocaleDateString() : '--'} {d.pickup?.timeSlot ? `(${d.pickup.timeSlot})` : ''}
                            </td>
                            <td className="py-3 pr-4">--</td>
                            <td className="py-3 pr-4">
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                                <FiTag className="h-3.5 w-3.5" />
                                {d.status}
                              </span>
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

          {activeItem === 'my-donations' && (
            <div className="space-y-4">
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
                        <th className="py-3 pr-4 font-medium">Pickup Date</th>
                        <th className="py-3 pr-4 font-medium">Time Slot</th>
                        <th className="py-3 pr-4 font-medium">Status</th>
                      </tr>
                    </thead>
                    <tbody className="text-gray-700">
                      {myDonationsLoading ? (
                        <tr className="border-t border-gray-100">
                          <td className="py-4" colSpan={6}>
                            <div className="text-sm text-gray-600">Loading...</div>
                          </td>
                        </tr>
                      ) : myDonations.length === 0 ? (
                        <tr className="border-t border-gray-100">
                          <td className="py-4" colSpan={6}>
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
            </div>
          )}

          {activeItem !== 'dashboard' && activeItem !== 'donate-now' && activeItem !== 'my-donations' && (
            <div className="rounded-2xl bg-white border border-gray-100 shadow-sm p-6">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-center text-gray-700">
                  {activeItem === 'active-pickups' ? (
                    <FiUsers className="h-5 w-5" />
                  ) : (
                    <FiCalendar className="h-5 w-5" />
                  )}
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
    </div>
  );
}

export default DonorDashboard;
