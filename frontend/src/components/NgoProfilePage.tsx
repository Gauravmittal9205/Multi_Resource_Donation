import { useEffect, useMemo, useRef, useState } from 'react';
import type { User as FirebaseUser } from 'firebase/auth';
import {
  FiUser,
  FiMail,
  FiPhone,
  FiGlobe,
  FiEdit3,
  FiSave,
  FiX,
  FiShield,
  FiTrendingUp,
  FiBarChart2,
  FiPieChart,
  FiCheckCircle,
  FiEye,
  FiDownload,
  FiShare2,
  FiCamera,
  FiZoomIn,
  FiRotateCw,
  FiCalendar,
  FiUsers,
  FiAward
} from 'react-icons/fi';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, LineChart, Line, PieChart, Pie, Cell } from 'recharts';
import { getMyRegistration } from '../services/ngoRegistrationService';
import { getNgoDashboard, getMyRequests } from '../services/ngoRequestService';
import { fetchNgoAssignedDonations } from '../services/donationService';
import type { DonationItem } from '../services/donationService';
import { getMyNgoProfile, upsertMyNgoProfile, type NgoProfile } from '../services/ngoProfileService';

const COLORS = ['#10b981', '#2563eb', '#f59e0b', '#ef4444', '#a855f7', '#14b8a6', '#64748b'];

const safeStringArray = (raw: unknown): string[] => (Array.isArray(raw) ? raw.map((s) => String(s).trim()).filter(Boolean) : []);

export default function NgoProfilePage({ user }: { user: FirebaseUser }) {
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const [regLoading, setRegLoading] = useState(true);
  const [registration, setRegistration] = useState<any | null>(null);

  const [ngoProfile, setNgoProfile] = useState<NgoProfile | null>(null);

  const [dashboardLoading, setDashboardLoading] = useState(true);
  const [ngoDashboard, setNgoDashboard] = useState<any | null>(null);

  const [assignedLoading, setAssignedLoading] = useState(true);
  const [assignedDonations, setAssignedDonations] = useState<DonationItem[]>([]);

  const [needsLoading, setNeedsLoading] = useState(true);
  const [myRequests, setMyRequests] = useState<any[]>([]);

  const logoFileRef = useRef<HTMLInputElement | null>(null);
  const coverFileRef = useRef<HTMLInputElement | null>(null);
  const [selectedDocument, setSelectedDocument] = useState<{ name: string; url: string; type: string } | null>(null);
  const [documentZoom, setDocumentZoom] = useState(1);
  const [documentRotation, setDocumentRotation] = useState(0);
  const [] = useState(false);
  const [coverImageUrl, setCoverImageUrl] = useState('https://images.unsplash.com/photo-1559027615-cd4628902d4a?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1920&q=80');

  const mergedProfile = useMemo<NgoProfile>(() => {
    const base: NgoProfile = {
      firebaseUid: user.uid,
      basic: {
        logoUrl: '',
        tagline: '',
        aboutHtml: '',
        contactPersonName: '',
        phone: user.phoneNumber || '',
        email: user.email || '',
        website: '',
        socialLinks: {
          facebook: '',
          instagram: '',
          linkedin: '',
          twitter: '',
          youtube: ''
        }
      },
      operationalAreas: [],
      mission: {
        missionStatement: '',
        visionStatement: '',
        focusAreas: [],
        beneficiaryTypes: [],
        foundedYear: null
      },
      acceptance: {
        resources: {}
      },
      logistics: {
        pickupAvailable: true,
        pickupAreas: [],
        preferredPickupTime: '',
        dropLocation: '',
        emergencyAcceptance: false
      },
      monetary: {
        bankName: '',
        accountName: '',
        accountNumber: '',
        ifsc: '',
        upiId: '',
        minimumDonationAmount: null,
        purposeAllocation: ''
      }
    };

    if (!ngoProfile) return base;

    return {
      ...base,
      ...ngoProfile,
      firebaseUid: user.uid,
      basic: {
        ...base.basic,
        ...(ngoProfile.basic || {})
      },
      mission: {
        ...base.mission,
        ...(ngoProfile.mission || {})
      },
      logistics: {
        ...base.logistics,
        ...(ngoProfile.logistics || {})
      },
      monetary: {
        ...base.monetary,
        ...(ngoProfile.monetary || {})
      },
      operationalAreas: safeStringArray(ngoProfile.operationalAreas),
      acceptance: {
        resources: (ngoProfile.acceptance?.resources as any) || {}
      }
    };
  }, [ngoProfile, user.email, user.phoneNumber, user.uid]);

  const donorsCount = useMemo(() => {
    const set = new Set<string>();
    for (const d of assignedDonations) {
      if (d.donorFirebaseUid) set.add(String(d.donorFirebaseUid));
    }
    return set.size;
  }, [assignedDonations]);

  const donationsByType = useMemo(() => {
    const map = new Map<string, number>();
    for (const d of assignedDonations) {
      const k = String(d.resourceType || '').trim();
      if (!k) continue;
      map.set(k, (map.get(k) || 0) + 1);
    }
    return Array.from(map.entries()).map(([resourceType, count]) => ({ resourceType, count }));
  }, [assignedDonations]);

  const donationsDistribution = useMemo(() => {
    return donationsByType.map((x) => ({ name: x.resourceType, value: x.count }));
  }, [donationsByType]);

  const needsProgress = useMemo(() => {
    const totalsByRequest = new Map<string, number>();
    for (const d of assignedDonations) {
      const reqId = (d as any)?.assignedNGO?.assignedRequestId;
      if (!reqId) continue;
      totalsByRequest.set(String(reqId), (totalsByRequest.get(String(reqId)) || 0) + Number(d.quantity || 0));
    }

    return (myRequests || []).map((r) => {
      const requiredQty = Number(r.quantity || 0);
      const receivedQty = totalsByRequest.get(String(r._id)) || 0;
      const pct = requiredQty > 0 ? Math.min(100, Math.round((receivedQty / requiredQty) * 100)) : 0;
      return {
        ...r,
        requiredQty,
        receivedQty,
        pct
      };
    });
  }, [assignedDonations, myRequests]);

  const loadAll = async () => {
    try {
      setSaveError(null);
      setRegLoading(true);
      setDashboardLoading(true);
      setAssignedLoading(true);
      setNeedsLoading(true);

      const [reg, prof, dash, assigned, requests] = await Promise.all([
        getMyRegistration().catch(() => null),
        getMyNgoProfile().catch(() => ({ success: true, data: null } as any)),
        getNgoDashboard().catch(() => ({ success: true, data: null } as any)),
        fetchNgoAssignedDonations().catch(() => ({ success: true, data: [] as DonationItem[] } as any)),
        getMyRequests().catch(() => ({ success: true, data: [] as any[] } as any)),
      ]);

      setRegistration((reg as any)?.data ?? (reg as any)?.data?.data ?? (reg as any)?.data ?? (reg as any)?.data ?? (reg as any)?.data);
      setNgoProfile((prof as any)?.data ?? null);
      setNgoDashboard((dash as any)?.data ?? null);
      setAssignedDonations(((assigned as any)?.data ?? []) as DonationItem[]);
      setMyRequests(((requests as any)?.data ?? []) as any[]);
    } finally {
      setRegLoading(false);
      setDashboardLoading(false);
      setAssignedLoading(false);
      setNeedsLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
    const onDonation = () => {
      loadAll();
    };
    window.addEventListener('donationCreated', onDonation as any);
    const interval = window.setInterval(() => loadAll(), 30000);
    return () => {
      window.removeEventListener('donationCreated', onDonation as any);
      window.clearInterval(interval);
    };
  }, [user.uid]);

  const handleLogoPick = () => {
    if (!isEditing) return;
    logoFileRef.current?.click();
  };

  const handleCoverPick = () => {
    if (!isEditing) return;
    coverFileRef.current?.click();
  };

  const handleLogoFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = String(reader.result || '');
      setNgoProfile((p) => {
        const cur = p || ({} as NgoProfile);
        return {
          ...cur,
          firebaseUid: user.uid,
          basic: {
            ...(cur as any).basic,
            logoUrl: dataUrl
          }
        } as NgoProfile;
      });
    };
    reader.readAsDataURL(file);
  };

  const handleCoverFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = String(reader.result || '');
      setCoverImageUrl(dataUrl);
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setSaveError(null);
      const payload: Partial<NgoProfile> = {
        basic: mergedProfile.basic,
        operationalAreas: mergedProfile.operationalAreas,
        mission: mergedProfile.mission,
        acceptance: mergedProfile.acceptance,
        logistics: mergedProfile.logistics,
        monetary: mergedProfile.monetary,
      };
      const res = await upsertMyNgoProfile(payload);
      setNgoProfile(res.data);
      setIsEditing(false);
      
      // Dispatch event to update navigation avatar
      window.dispatchEvent(new CustomEvent('ngoProfileUpdated'));
    } catch (e: any) {
      setSaveError(typeof e?.message === 'string' ? e.message : 'Failed to save profile');
    } finally {
      setSaving(false);
    }
  };

  const calculateProfileCompletion = () => {
    let completed = 0;
    let total = 8;
    
    if (mergedProfile.basic.logoUrl) completed++;
    if (mergedProfile.basic.tagline) completed++;
    if (mergedProfile.basic.website) completed++;
    if (mergedProfile.basic.contactPersonName) completed++;
    if (mergedProfile.operationalAreas.length > 0) completed++;
    if (mergedProfile.basic.aboutHtml) completed++;
    if (mergedProfile.mission.missionStatement) completed++;
    if (mergedProfile.mission.visionStatement) completed++;
    
    return Math.round((completed / total) * 100);
  };

  const handleDocumentView = (name: string, url: string, type: string) => {
    setSelectedDocument({ name, url, type });
    setDocumentZoom(1);
    setDocumentRotation(0);
  };

  const handleZoomIn = () => setDocumentZoom(prev => Math.min(prev + 0.25, 3));
  const handleZoomOut = () => setDocumentZoom(prev => Math.max(prev - 0.25, 0.5));
  const handleRotate = () => setDocumentRotation(prev => (prev + 90) % 360);
  const handleDownload = () => {
    if (selectedDocument) {
      const link = document.createElement('a');
      link.href = selectedDocument.url;
      link.download = selectedDocument.name;
      link.click();
    }
  };

  const handleShareProfile = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${locked.ngoName} - NGO Profile`,
          text: `Check out ${locked.ngoName} on ShareCare`,
          url: window.location.href,
        });
      } catch (err) {
        console.log('Share cancelled');
      }
    } else {
      navigator.clipboard.writeText(window.location.href);
      alert('Profile link copied to clipboard!');
    }
  };

  const locked = {
    ngoName: registration?.ngoName || '—',
    organizationType: registration?.organizationType || '—',
    registrationNumber: registration?.registrationNumber || '—',
    registeredAddress: registration?.addressProof ? 'Available (via document)' : '—',
    status: registration?.status || '—',
    docs: {
      ngoCertificate: registration?.ngoCertificate || '',
      addressProof: registration?.addressProof || '',
      aadhaarCard: registration?.aadhaarCard || '',
      alternateIdFile: registration?.alternateIdFile || '',
    }
  };



  const barData = useMemo(() => {
    const raw = ngoDashboard?.analytics?.donationsByType;
    if (Array.isArray(raw) && raw.length) {
      return raw.map((x: any) => ({ resourceType: String(x.type || ''), count: Number(x.count || 0) }));
    }
    return donationsByType;
  }, [donationsByType, ngoDashboard?.analytics?.donationsByType]);

  const lineData = useMemo(() => {
    const raw = ngoDashboard?.analytics?.donationsOverTime;
    return Array.isArray(raw) ? raw.map((x: any) => ({ label: String(x.label || ''), count: Number(x.count || 0) })) : [];
  }, [ngoDashboard?.analytics?.donationsOverTime]);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* LinkedIn-style Hero Header */}
      <div className="relative">
        {/* Cover Image Banner */}
        <div className="relative h-96 bg-gradient-to-r from-blue-600 to-emerald-600 overflow-hidden">
          <div className="absolute inset-0 bg-black/20">
            <img 
              src={coverImageUrl} 
              alt="NGO Cover" 
              className="w-full h-full object-cover opacity-60"
            />
          </div>
          {isEditing && (
            <button 
              onClick={handleCoverPick}
              className="absolute bottom-4 right-4 p-3 bg-white/95 backdrop-blur rounded-lg hover:bg-white transition-all duration-200 shadow-lg hover:shadow-xl group"
              title="Change Cover Image"
            >
              <FiCamera className="w-6 h-6 text-gray-700 group-hover:text-blue-600 transition-colors" />
            </button>
          )}
          <input ref={coverFileRef} type="file" accept="image/*" className="hidden" onChange={handleCoverFile} />
        </div>

        {/* Profile Logo overlapping banner */}
        <div className="absolute -bottom-16 left-8">
          <div className="relative group">
            <div className="w-40 h-40 rounded-full border-4 border-white shadow-xl overflow-hidden bg-white">
              {mergedProfile.basic.logoUrl && mergedProfile.basic.logoUrl !== '' ? (
                <img src={mergedProfile.basic.logoUrl} alt="NGO Logo" className="w-full h-full object-cover" onError={(e) => {
                  console.log('Logo load error:', mergedProfile.basic.logoUrl);
                  e.currentTarget.style.display = 'none';
                }} />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gray-100">
                  <FiUser className="w-12 h-12 text-gray-400" />
                </div>
              )}
            </div>
            {isEditing && (
              <button 
                onClick={handleLogoPick}
                className="absolute inset-0 w-40 h-40 rounded-full bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <FiCamera className="w-8 h-8 text-white" />
              </button>
            )}
          </div>
          <input ref={logoFileRef} type="file" accept="image/*" className="hidden" onChange={handleLogoFile} />
        </div>

        {/* Action Buttons */}
        <div className="absolute top-4 right-4 flex items-center gap-2">
          <button
            onClick={handleShareProfile}
            className="flex items-center justify-center w-10 h-10 bg-white/90 backdrop-blur rounded-lg hover:bg-white transition-colors shadow-sm"
            title="Share"
          >
            <FiShare2 className="w-4 h-4" />
          </button>
          {!isEditing ? (
            <button
              onClick={() => setIsEditing(true)}
              className="flex items-center justify-center w-10 h-10 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
            >
              <FiEdit3 className="w-5 h-5" />
            </button>
          ) : (
            <>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center justify-center w-10 h-10 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-60 transition-colors shadow-sm"
            >
              <FiSave className="w-5 h-5" />
            </button>
            <button
              onClick={() => setIsEditing(false)}
              disabled={saving}
              className="flex items-center justify-center w-10 h-10 bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:opacity-60 transition-colors shadow-sm"
            >
              <FiX className="w-5 h-5" />
            </button>
          </>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-12">
        {/* NGO Primary Info */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-3xl font-bold text-gray-900">{locked.ngoName}</h1>
                {String(locked.status) === 'approved' && (
                  <div className="flex items-center gap-1 px-2 py-1 bg-emerald-50 text-emerald-700 rounded-full text-sm font-medium">
                    <FiCheckCircle className="w-4 h-4" />
                    Verified
                  </div>
                )}
              </div>
              
              <div className="flex flex-wrap items-center gap-3 text-sm text-gray-600 mb-4">
                <span className="px-3 py-1 bg-gray-100 rounded-full font-medium">{locked.organizationType}</span>
                <span className="flex items-center gap-1">
                  <FiAward className="w-4 h-4" />
                  Reg: {locked.registrationNumber}
                </span>
                <span className={`px-3 py-1 rounded-full font-medium ${
                  String(locked.status) === 'approved' 
                    ? 'bg-emerald-100 text-emerald-800' 
                    : 'bg-amber-100 text-amber-800'
                }`}>
                  {String(locked.status || 'pending').charAt(0).toUpperCase() + String(locked.status || 'pending').slice(1)}
                </span>
              </div>

              {isEditing ? (
                <input
                  value={mergedProfile.basic.tagline}
                  onChange={(e) => setNgoProfile((p) => ({
                    ...(p || ({} as any)),
                    basic: { ...((p as any)?.basic || {}), tagline: e.target.value }
                  }) as any)}
                  className="text-lg text-gray-700 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 w-full max-w-2xl"
                  placeholder="Add a tagline to describe your NGO"
                  maxLength={120}
                />
              ) : (
                <p className="text-lg text-gray-700">{mergedProfile.basic.tagline || 'Add a tagline to describe your NGO'}</p>
              )}
            </div>

            {/* Profile Completion & Quick Actions */}
            <div className="flex flex-col items-center gap-4">
              <div className="relative">
                <svg className="w-20 h-20 transform -rotate-90">
                  <circle cx="40" cy="40" r="36" stroke="#e5e7eb" strokeWidth="8" fill="none" />
                  <circle 
                    cx="40" cy="40" r="36" 
                    stroke="#10b981" 
                    strokeWidth="8" 
                    fill="none"
                    strokeDasharray={`${2 * Math.PI * 36}`}
                    strokeDashoffset={`${2 * Math.PI * 36 * (1 - calculateProfileCompletion() / 100)}`}
                    className="transition-all duration-500"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-lg font-bold text-gray-900">{calculateProfileCompletion()}%</span>
                </div>
              </div>
              <span className="text-sm text-gray-600">Profile Complete</span>
            </div>
          </div>
        </div>

        {/* Quick Meta Info Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-600">Total Donors</span>
              <FiUsers className="w-5 h-5 text-blue-600" />
            </div>
            <div className="text-3xl font-bold text-gray-900">{donorsCount.toLocaleString()}</div>
            <p className="text-sm text-gray-500 mt-1">People supporting your cause</p>
          </div>
          
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-600">Total Donations</span>
              <FiTrendingUp className="w-5 h-5 text-emerald-600" />
            </div>
            <div className="text-3xl font-bold text-gray-900">
              {Number(ngoDashboard?.summary?.totalDonations ?? assignedDonations.length).toLocaleString()}
            </div>
            <p className="text-sm text-gray-500 mt-1">Resources received</p>
          </div>
          
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-600">Year Formed</span>
              <FiCalendar className="w-5 h-5 text-purple-600" />
            </div>
            <div className="text-3xl font-bold text-gray-900">{mergedProfile.mission.foundedYear || '—'}</div>
            <p className="text-sm text-gray-500 mt-1">Organization established</p>
          </div>
        </div>

        {/* Contact Information & About Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Contact Information</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Website</label>
                <div className="relative">
                  <FiGlobe className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    disabled={!isEditing}
                    value={mergedProfile.basic.website}
                    onChange={(e) => setNgoProfile((p) => ({
                      ...(p || ({} as any)),
                      basic: { ...((p as any)?.basic || {}), website: e.target.value }
                    }) as any)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-lg pl-9 pr-3 py-2 disabled:bg-gray-100"
                    placeholder="https://..."
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Contact Person</label>
                <input
                  disabled={!isEditing}
                  value={mergedProfile.basic.contactPersonName}
                  onChange={(e) => setNgoProfile((p) => ({
                    ...(p || ({} as any)),
                    basic: { ...((p as any)?.basic || {}), contactPersonName: e.target.value }
                  }) as any)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 disabled:bg-gray-100"
                  placeholder="Name"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                <div className="relative">
                  <FiPhone className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    disabled={!isEditing}
                    value={mergedProfile.basic.phone}
                    onChange={(e) => setNgoProfile((p) => ({
                      ...(p || ({} as any)),
                      basic: { ...((p as any)?.basic || {}), phone: e.target.value }
                    }) as any)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-lg pl-9 pr-3 py-2 disabled:bg-gray-100"
                    placeholder="Phone"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <div className="relative">
                  <FiMail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    disabled={!isEditing}
                    value={mergedProfile.basic.email}
                    onChange={(e) => setNgoProfile((p) => ({
                      ...(p || ({} as any)),
                      basic: { ...((p as any)?.basic || {}), email: e.target.value }
                    }) as any)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-lg pl-9 pr-3 py-2 disabled:bg-gray-100"
                    placeholder="Email"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Operational Areas</label>
                <input
                  disabled={!isEditing}
                  value={mergedProfile.operationalAreas.join(', ')}
                  onChange={(e) => {
                    const items = e.target.value.split(',').map((s) => s.trim()).filter(Boolean);
                    setNgoProfile((p) => ({ ...(p || ({} as any)), operationalAreas: items }) as any);
                  }}
                  className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 disabled:bg-gray-100"
                  placeholder="City/State separated by commas"
                />
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">About NGO</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">About Us</label>
                <textarea
                  disabled={!isEditing}
                  value={mergedProfile.basic.aboutHtml}
                  onChange={(e) => setNgoProfile((p) => ({
                    ...(p || ({} as any)),
                    basic: { ...((p as any)?.basic || {}), aboutHtml: e.target.value }
                  }) as any)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 min-h-[120px] disabled:bg-gray-100"
                  placeholder="Write about your NGO, mission, vision, and activities."
                />
                <div className="mt-4">
                  <img 
                    src="/src/assets/poor1.jpg" 
                    alt="Helping Poor People" 
                    className="w-full h-48 object-cover rounded-lg border border-gray-200"
                    onError={(e) => {
                      e.currentTarget.src = "https://images.unsplash.com/photo-1559027615-cd4628902d4a?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=800&q=80";
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Analytics Dashboard */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Real-time Analytics</h2>
          {(dashboardLoading || assignedLoading) ? (
            <div className="grid lg:grid-cols-2 gap-6">
              {Array.from({ length: 2 }).map((_, i) => (
                <div key={i} className="border border-gray-200 rounded-lg p-4">
                  <div className="h-4 w-32 bg-gray-100 rounded animate-pulse" />
                  <div className="mt-4 h-56 bg-gray-100 rounded animate-pulse" />
                </div>
              ))}
            </div>
          ) : (
            <div className="grid lg:grid-cols-2 gap-6">
              <div className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center gap-2 text-sm font-semibold text-gray-900 mb-4">
                  <FiBarChart2 /> Resource-wise donations
                </div>
                {barData.length === 0 ? (
                  <div className="py-10 text-center text-sm text-gray-600">No donation data yet.</div>
                ) : (
                  <div style={{ width: '100%', height: 260 }}>
                    <ResponsiveContainer>
                      <BarChart data={barData}>
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

              <div className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center gap-2 text-sm font-semibold text-gray-900 mb-4">
                  <FiPieChart /> Monthly donation distribution
                </div>
                {lineData.length === 0 ? (
                  <div className="py-10 text-center text-sm text-gray-600">No activity data yet.</div>
                ) : (
                  <div style={{ width: '100%', height: 260 }}>
                    <ResponsiveContainer>
                      <PieChart>
                        <Tooltip />
                        <Pie data={lineData} dataKey="count" nameKey="label" outerRadius={80}>
                          {lineData.map((_, idx) => (
                            <Cell key={idx} fill={COLORS[idx % COLORS.length]} />
                          ))}
                        </Pie>
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </div>

              <div className="border border-gray-200 rounded-lg p-4 lg:col-span-2">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2 text-sm font-semibold text-gray-900">
                    <FiTrendingUp /> Donation distribution trend
                  </div>
                  <div className="text-sm text-gray-600">
                    Total donors: <span className="font-semibold text-gray-900">{donorsCount}</span>
                  </div>
                </div>
                {donationsDistribution.length === 0 ? (
                  <div className="py-10 text-center text-sm text-gray-600">No donation data yet.</div>
                ) : (
                  <div style={{ width: '100%', height: 280 }}>
                    <ResponsiveContainer>
                      <LineChart data={donationsDistribution}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis allowDecimals={false} />
                        <Tooltip />
                        <Line 
                          type="monotone" 
                          dataKey="value" 
                          stroke="#2563eb" 
                          strokeWidth={2} 
                          dot={{ fill: '#2563eb', strokeWidth: 2, r: 4 }} 
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Documents Section */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Documents & Verification</h2>
          
          {regLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="border border-gray-200 rounded-lg p-4">
                  <div className="h-4 w-32 bg-gray-100 rounded animate-pulse" />
                  <div className="mt-2 h-3 w-24 bg-gray-100 rounded animate-pulse" />
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-gray-900">Registration Certificate</span>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    String(locked.status) === 'approved' 
                      ? 'bg-emerald-100 text-emerald-700' 
                      : 'bg-amber-100 text-amber-800'
                  }`}>
                    {String(locked.status) === 'approved' ? 'Verified' : 'Pending'}
                  </span>
                </div>
                {locked.docs.ngoCertificate && (
                  <button
                    onClick={() => handleDocumentView('Registration Certificate', locked.docs.ngoCertificate, 'certificate')}
                    className="flex items-center gap-2 text-blue-600 hover:text-blue-700 text-sm mt-2"
                  >
                    <FiEye className="w-4 h-4" />
                    View Document
                  </button>
                )}
              </div>
              
              <div className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-gray-900">Address Proof</span>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    String(locked.status) === 'approved' 
                      ? 'bg-emerald-100 text-emerald-700' 
                      : 'bg-amber-100 text-amber-800'
                  }`}>
                    {String(locked.status) === 'approved' ? 'Verified' : 'Pending'}
                  </span>
                </div>
                {locked.docs.addressProof && (
                  <button
                    onClick={() => handleDocumentView('Address Proof', locked.docs.addressProof, 'address')}
                    className="flex items-center gap-2 text-blue-600 hover:text-blue-700 text-sm mt-2"
                  >
                    <FiEye className="w-4 h-4" />
                    View Document
                  </button>
                )}
              </div>
              
              <div className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-gray-900">Identity Proof</span>
                  <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                    Read-only
                  </span>
                </div>
                {(locked.docs.aadhaarCard || locked.docs.alternateIdFile) && (
                  <button
                    onClick={() => handleDocumentView(
                      'Identity Proof', 
                      locked.docs.aadhaarCard || locked.docs.alternateIdFile, 
                      'identity'
                    )}
                    className="flex items-center gap-2 text-blue-600 hover:text-blue-700 text-sm mt-2"
                  >
                    <FiEye className="w-4 h-4" />
                    View Document
                  </button>
                )}
              </div>
              
              <div className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-gray-900">PAN / 12A / 80G / FCRA</span>
                  <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                    Not collected
                  </span>
                </div>
                <p className="text-sm text-gray-500">Not available from current registration flow</p>
              </div>
            </div>
          )}
        </div>

        {/* Error Display */}
        {saveError && (
          <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-900">
            {saveError}
          </div>
        )}
        {/* Live Needs & Campaigns */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Live Needs & Campaigns</h2>
          
          {needsLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="border border-gray-200 rounded-lg p-4">
                  <div className="h-4 w-44 bg-gray-100 rounded animate-pulse" />
                  <div className="mt-3 h-3 w-full bg-gray-100 rounded animate-pulse" />
                </div>
              ))}
            </div>
          ) : needsProgress.length === 0 ? (
            <div className="border border-dashed border-gray-300 rounded-lg p-10 text-center">
              <div className="text-sm font-semibold text-gray-900">No active needs</div>
              <div className="mt-1 text-sm text-gray-600">Create needs from your NGO dashboard requests section.</div>
            </div>
          ) : (
            <div className="space-y-3">
              {needsProgress.map((r: any) => (
                <div key={String(r._id)} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                    <div>
                      <div className="text-sm font-semibold text-gray-900">{String(r.requestTitle || 'Need')}</div>
                      <div className="mt-0.5 text-xs text-gray-600">
                        Priority: {String(r.urgencyLevel || '—')} • Status: {String(r.status || '—')}
                      </div>
                    </div>
                    <div className="text-sm text-gray-700">
                      <span className="font-semibold">{Number(r.receivedQty || 0)}</span> / {Number(r.requiredQty || 0)}
                    </div>
                  </div>
                  <div className="mt-3 h-2 rounded-full bg-gray-100 overflow-hidden">
                    <div 
                      className="h-full bg-emerald-600 transition-all duration-300" 
                      style={{ width: `${Number(r.pct || 0)}%` }} 
                    />
                  </div>
                  <div className="mt-2 text-xs text-gray-500">{Number(r.pct || 0)}% fulfilled</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Document Viewer Modal */}
      {selectedDocument && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
          <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">{selectedDocument.name}</h3>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleZoomIn}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  title="Zoom In"
                >
                  <FiZoomIn className="w-5 h-5" />
                </button>
                <button
                  onClick={handleZoomOut}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  title="Zoom Out"
                >
                  <FiZoomIn className="w-5 h-5 transform scale-75" />
                </button>
                <button
                  onClick={handleRotate}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  title="Rotate"
                >
                  <FiRotateCw className="w-5 h-5" />
                </button>
                <button
                  onClick={handleDownload}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  title="Download"
                >
                  <FiDownload className="w-5 h-5" />
                </button>
                <button
                  onClick={() => setSelectedDocument(null)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  title="Close"
                >
                  <FiX className="w-5 h-5" />
                </button>
              </div>
            </div>
            
            {/* Document Content */}
            <div className="p-4 overflow-auto" style={{ maxHeight: 'calc(90vh - 80px)' }}>
              <div className="flex items-center justify-center min-h-[400px]">
                <div 
                  className="relative"
                  style={{
                    transform: `scale(${documentZoom}) rotate(${documentRotation}deg)`,
                    transition: 'transform 0.3s ease'
                  }}
                >
                  {selectedDocument.type.includes('pdf') || selectedDocument.url.includes('pdf') ? (
                    <iframe
                      src={selectedDocument.url}
                      className="border border-gray-300 rounded-lg"
                      style={{ width: '600px', height: '800px' }}
                      title="PDF Document"
                    />
                  ) : (
                    <img
                      src={selectedDocument.url}
                      alt={selectedDocument.name}
                      className="max-w-full h-auto border border-gray-300 rounded-lg shadow-lg"
                      style={{ maxHeight: '800px' }}
                    />
                  )}
                  {String(locked.status) === 'approved' && (
                    <div className="absolute top-4 right-4 bg-emerald-600 text-white px-3 py-1 rounded-full text-sm font-medium flex items-center gap-1">
                      <FiShield className="w-4 h-4" />
                      Verified
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
