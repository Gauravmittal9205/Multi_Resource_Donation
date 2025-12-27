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
  FiFileText,
  FiTrendingUp,
  FiBarChart2,
  FiPieChart,
  FiRefreshCw,
  FiCheckCircle,
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
    } catch (e: any) {
      setSaveError(typeof e?.message === 'string' ? e.message : 'Failed to save profile');
    } finally {
      setSaving(false);
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

  const registeredSinceYear = useMemo(() => {
    const createdAt = registration?.createdAt ? new Date(registration.createdAt) : null;
    return createdAt ? createdAt.getFullYear() : null;
  }, [registration?.createdAt]);

  const yearsActive = useMemo(() => {
    const nowYear = new Date().getFullYear();
    const baseYear = mergedProfile.mission.foundedYear || registeredSinceYear;
    if (!baseYear) return null;
    return Math.max(0, nowYear - baseYear);
  }, [mergedProfile.mission.foundedYear, registeredSinceYear]);

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
    <div className="min-h-screen bg-gradient-to-b from-emerald-50/60 via-white to-blue-50/60">
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-emerald-100/60 via-white to-blue-100/60" />
        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">NGO Profile</h1>
              <div className="mt-1 text-sm text-gray-600">Verified registration + editable profile</div>
            </div>
            <div className="flex items-center gap-2">
              {!isEditing ? (
                <button
                  type="button"
                  onClick={() => setIsEditing(true)}
                  className="inline-flex items-center gap-2 justify-center px-4 h-10 rounded-full bg-white border border-gray-200 text-gray-800 hover:bg-gray-50"
                >
                  <FiEdit3 />
                  Edit
                </button>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={handleSave}
                    disabled={saving}
                    className="inline-flex items-center gap-2 justify-center px-4 h-10 rounded-full bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-60"
                  >
                    <FiSave />
                    {saving ? 'Saving…' : 'Save'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsEditing(false)}
                    disabled={saving}
                    className="inline-flex items-center gap-2 justify-center px-4 h-10 rounded-full bg-white border border-gray-200 text-gray-800 hover:bg-gray-50 disabled:opacity-60"
                  >
                    <FiX />
                    Cancel
                  </button>
                </>
              )}
              <button
                type="button"
                onClick={loadAll}
                className="inline-flex items-center gap-2 justify-center px-4 h-10 rounded-full bg-white border border-gray-200 text-gray-800 hover:bg-gray-50"
              >
                <FiRefreshCw />
                Refresh
              </button>
            </div>
          </div>

          {saveError ? (
            <div className="mt-4 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-900">{saveError}</div>
          ) : null}
        </div>
      </section>

      <section className="py-6 sm:py-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid gap-6">
            <div className="rounded-2xl bg-white/70 backdrop-blur border border-white/60 p-5 sm:p-6 shadow-sm">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div
                    className={`h-16 w-16 rounded-2xl border overflow-hidden bg-white flex items-center justify-center ${isEditing ? 'cursor-pointer hover:shadow-sm' : ''}`}
                    onClick={handleLogoPick}
                    role="button"
                    tabIndex={0}
                  >
                    {mergedProfile.basic.logoUrl ? (
                      <img src={mergedProfile.basic.logoUrl} alt="NGO logo" className="h-full w-full object-cover" />
                    ) : (
                      <FiUser className="h-7 w-7 text-gray-400" />
                    )}
                  </div>
                  <input ref={logoFileRef} type="file" accept="image/*" className="hidden" onChange={handleLogoFile} />
                  <div>
                    <div className="text-lg font-semibold text-gray-900">{locked.ngoName}</div>
                    <div className="mt-0.5 text-sm text-gray-600">{mergedProfile.basic.tagline || 'Add a tagline to describe your NGO'}</div>
                    <div className="mt-2 inline-flex items-center gap-2 text-xs">
                      <span className={`px-2.5 py-1 rounded-full ${String(locked.status) === 'approved' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>
                        {String(locked.status || 'pending')}
                      </span>
                      <span className="px-2.5 py-1 rounded-full bg-gray-100 text-gray-700">{locked.organizationType}</span>
                      <span className="px-2.5 py-1 rounded-full bg-gray-100 text-gray-700">Reg: {locked.registrationNumber}</span>
                    </div>
                  </div>
                </div>

                <div className="hidden sm:grid grid-cols-2 gap-3">
                  <div className="rounded-xl border border-gray-100 bg-white p-4">
                    <div className="flex items-center gap-2 text-xs text-gray-500"><FiTrendingUp className="h-4 w-4" />Total donations</div>
                    <div className="mt-2 text-2xl font-bold text-gray-900">{Number(ngoDashboard?.summary?.totalDonations ?? assignedDonations.length).toLocaleString()}</div>
                  </div>
                  <div className="rounded-xl border border-gray-100 bg-white p-4">
                    <div className="flex items-center gap-2 text-xs text-gray-500"><FiCheckCircle className="h-4 w-4" />Total donors</div>
                    <div className="mt-2 text-2xl font-bold text-gray-900">{Number(donorsCount).toLocaleString()}</div>
                  </div>
                </div>
              </div>

              <div className="mt-6 grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <div className="text-xs text-gray-500 mb-1">Tagline</div>
                  <input
                    disabled={!isEditing}
                    value={mergedProfile.basic.tagline}
                    maxLength={120}
                    onChange={(e) => setNgoProfile((p) => ({
                      ...(p || ({} as any)),
                      basic: {
                        ...((p as any)?.basic || {}),
                        tagline: e.target.value
                      }
                    }) as any)}
                    className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2"
                    placeholder="Max 120 characters"
                  />
                </div>
                <div>
                  <div className="text-xs text-gray-500 mb-1">Website</div>
                  <div className="relative">
                    <FiGlobe className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      disabled={!isEditing}
                      value={mergedProfile.basic.website}
                      onChange={(e) => setNgoProfile((p) => ({
                        ...(p || ({} as any)),
                        basic: {
                          ...((p as any)?.basic || {}),
                          website: e.target.value
                        }
                      }) as any)}
                      className="w-full bg-white border border-gray-200 rounded-lg pl-9 pr-3 py-2"
                      placeholder="https://..."
                    />
                  </div>
                </div>
                <div>
                  <div className="text-xs text-gray-500 mb-1">Contact person</div>
                  <input
                    disabled={!isEditing}
                    value={mergedProfile.basic.contactPersonName}
                    onChange={(e) => setNgoProfile((p) => ({
                      ...(p || ({} as any)),
                      basic: {
                        ...((p as any)?.basic || {}),
                        contactPersonName: e.target.value
                      }
                    }) as any)}
                    className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2"
                    placeholder="Name"
                  />
                </div>
                <div>
                  <div className="text-xs text-gray-500 mb-1">Phone</div>
                  <div className="relative">
                    <FiPhone className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      disabled={!isEditing}
                      value={mergedProfile.basic.phone}
                      onChange={(e) => setNgoProfile((p) => ({
                        ...(p || ({} as any)),
                        basic: {
                          ...((p as any)?.basic || {}),
                          phone: e.target.value
                        }
                      }) as any)}
                      className="w-full bg-white border border-gray-200 rounded-lg pl-9 pr-3 py-2"
                      placeholder="Phone"
                    />
                  </div>
                </div>
                <div>
                  <div className="text-xs text-gray-500 mb-1">Email</div>
                  <div className="relative">
                    <FiMail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      disabled={!isEditing}
                      value={mergedProfile.basic.email}
                      onChange={(e) => setNgoProfile((p) => ({
                        ...(p || ({} as any)),
                        basic: {
                          ...((p as any)?.basic || {}),
                          email: e.target.value
                        }
                      }) as any)}
                      className="w-full bg-white border border-gray-200 rounded-lg pl-9 pr-3 py-2"
                      placeholder="Email"
                    />
                  </div>
                </div>
                <div>
                  <div className="text-xs text-gray-500 mb-1">Operational areas</div>
                  <input
                    disabled={!isEditing}
                    value={mergedProfile.operationalAreas.join(', ')}
                    onChange={(e) => {
                      const items = e.target.value.split(',').map((s) => s.trim()).filter(Boolean);
                      setNgoProfile((p) => ({ ...(p || ({} as any)), operationalAreas: items }) as any);
                    }}
                    className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2"
                    placeholder="City/State separated by commas"
                  />
                </div>
              </div>

              <div className="mt-5">
                <div className="text-xs text-gray-500 mb-1">About NGO</div>
                <textarea
                  disabled={!isEditing}
                  value={mergedProfile.basic.aboutHtml}
                  onChange={(e) => setNgoProfile((p) => ({
                    ...(p || ({} as any)),
                    basic: {
                      ...((p as any)?.basic || {}),
                      aboutHtml: e.target.value
                    }
                  }) as any)}
                  className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 min-h-[120px]"
                  placeholder="Write about your NGO (HTML / text)"
                />
              </div>
            </div>

            <div className="rounded-2xl bg-white/70 backdrop-blur border border-white/60 p-5 sm:p-6 shadow-sm">
              <div className="text-lg font-semibold text-gray-900 mb-4">Documents & Verification</div>

              {regLoading ? (
                <div className="space-y-3">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="rounded-xl border border-gray-100 bg-white p-4">
                      <div className="h-4 w-40 bg-gray-100 rounded animate-pulse" />
                      <div className="mt-3 h-4 w-72 bg-gray-100 rounded animate-pulse" />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="rounded-xl border border-gray-100 bg-white p-4">
                    <div className="flex items-center justify-between">
                      <div className="text-sm font-semibold text-gray-900">Registration Certificate</div>
                      <span className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                        <FiShield /> {String(locked.status) === 'approved' ? 'Verified' : 'Pending'}
                      </span>
                    </div>
                    <div className="mt-2 text-xs text-gray-600 break-all">{locked.docs.ngoCertificate ? 'Available' : '—'}</div>
                  </div>
                  <div className="rounded-xl border border-gray-100 bg-white p-4">
                    <div className="flex items-center justify-between">
                      <div className="text-sm font-semibold text-gray-900">Address Proof</div>
                      <span className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                        <FiShield /> {String(locked.status) === 'approved' ? 'Verified' : 'Pending'}
                      </span>
                    </div>
                    <div className="mt-2 text-xs text-gray-600 break-all">{locked.docs.addressProof ? 'Available' : '—'}</div>
                  </div>
                  <div className="rounded-xl border border-gray-100 bg-white p-4">
                    <div className="flex items-center justify-between">
                      <div className="text-sm font-semibold text-gray-900">Identity Proof</div>
                      <span className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full bg-gray-50 text-gray-700 border border-gray-200">
                        <FiFileText /> Read-only
                      </span>
                    </div>
                    <div className="mt-2 text-xs text-gray-600 break-all">{locked.docs.aadhaarCard || locked.docs.alternateIdFile ? 'Available' : '—'}</div>
                  </div>
                  <div className="rounded-xl border border-gray-100 bg-white p-4">
                    <div className="flex items-center justify-between">
                      <div className="text-sm font-semibold text-gray-900">PAN / 12A / 80G / FCRA</div>
                      <span className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full bg-gray-50 text-gray-700 border border-gray-200">
                        <FiFileText /> Not collected
                      </span>
                    </div>
                    <div className="mt-2 text-xs text-gray-600">Not available from current registration flow</div>
                  </div>
                </div>
              )}
            </div>

            <div className="rounded-2xl bg-white/70 backdrop-blur border border-white/60 p-5 sm:p-6 shadow-sm">
              <div className="flex items-center justify-between gap-3 mb-4">
                <div>
                  <div className="text-lg font-semibold text-gray-900">Real-time Analytics</div>
                  <div className="text-sm text-gray-600">Live donation charts (no dummy data)</div>
                </div>
              </div>

              {(dashboardLoading || assignedLoading) ? (
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
                    <div className="flex items-center gap-2 text-sm font-semibold text-gray-900 mb-2"><FiBarChart2 />Resource-wise donations</div>
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

                  <div className="rounded-xl border border-gray-100 bg-white p-4">
                    <div className="flex items-center gap-2 text-sm font-semibold text-gray-900 mb-2"><FiTrendingUp />Monthly donation trend</div>
                    {lineData.length === 0 ? (
                      <div className="py-10 text-center text-sm text-gray-600">No activity data yet.</div>
                    ) : (
                      <div style={{ width: '100%', height: 260 }}>
                        <ResponsiveContainer>
                          <LineChart data={lineData}>
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

                  <div className="rounded-xl border border-gray-100 bg-white p-4 lg:col-span-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-sm font-semibold text-gray-900"><FiPieChart />Donation distribution</div>
                      <div className="text-sm text-gray-600">Total donors: <span className="font-semibold text-gray-900">{donorsCount}</span></div>
                    </div>
                    {donationsDistribution.length === 0 ? (
                      <div className="py-10 text-center text-sm text-gray-600">No donation data yet.</div>
                    ) : (
                      <div style={{ width: '100%', height: 280 }}>
                        <ResponsiveContainer>
                          <PieChart>
                            <Tooltip />
                            <Pie data={donationsDistribution} dataKey="value" nameKey="name" outerRadius={95}>
                              {donationsDistribution.map((_, idx) => (
                                <Cell key={idx} fill={COLORS[idx % COLORS.length]} />
                              ))}
                            </Pie>
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="rounded-2xl bg-white/70 backdrop-blur border border-white/60 p-5 sm:p-6 shadow-sm">
              <div className="text-lg font-semibold text-gray-900 mb-4">Live Needs & Campaigns</div>

              {needsLoading ? (
                <div className="space-y-3">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="rounded-xl border border-gray-100 bg-white p-4">
                      <div className="h-4 w-44 bg-gray-100 rounded animate-pulse" />
                      <div className="mt-3 h-3 w-full bg-gray-100 rounded animate-pulse" />
                    </div>
                  ))}
                </div>
              ) : needsProgress.length === 0 ? (
                <div className="rounded-xl border border-dashed border-gray-200 bg-white px-4 py-10 text-center">
                  <div className="text-sm font-semibold text-gray-900">No active needs</div>
                  <div className="mt-1 text-sm text-gray-600">Create needs from your NGO dashboard requests section.</div>
                </div>
              ) : (
                <div className="space-y-3">
                  {needsProgress.map((r: any) => (
                    <div key={String(r._id)} className="rounded-xl border border-gray-100 bg-white p-4">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                        <div>
                          <div className="text-sm font-semibold text-gray-900">{String(r.requestTitle || 'Need')}</div>
                          <div className="mt-0.5 text-xs text-gray-600">Priority: {String(r.urgencyLevel || '—')} • Status: {String(r.status || '—')}</div>
                        </div>
                        <div className="text-sm text-gray-700">
                          <span className="font-semibold">{Number(r.receivedQty || 0)}</span> / {Number(r.requiredQty || 0)}
                        </div>
                      </div>
                      <div className="mt-3 h-2 rounded-full bg-gray-100 overflow-hidden">
                        <div className="h-full bg-emerald-600" style={{ width: `${Number(r.pct || 0)}%` }} />
                      </div>
                      <div className="mt-2 text-xs text-gray-500">{Number(r.pct || 0)}% fulfilled</div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="rounded-2xl bg-white/70 backdrop-blur border border-white/60 p-5 sm:p-6 shadow-sm">
              <div className="text-lg font-semibold text-gray-900 mb-4">Logistics & Operations</div>
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <div className="text-xs text-gray-500 mb-1">Pickup available</div>
                  <label className="inline-flex items-center gap-2">
                    <input
                      type="checkbox"
                      disabled={!isEditing}
                      checked={Boolean(mergedProfile.logistics.pickupAvailable)}
                      onChange={(e) => setNgoProfile((p) => ({ ...(p || ({} as any)), logistics: { ...((p as any)?.logistics || {}), pickupAvailable: e.target.checked } }) as any)}
                    />
                    <span className="text-sm text-gray-900">Enable pickup</span>
                  </label>
                </div>
                <div>
                  <div className="text-xs text-gray-500 mb-1">Preferred pickup time</div>
                  <input
                    disabled={!isEditing}
                    value={mergedProfile.logistics.preferredPickupTime}
                    onChange={(e) => setNgoProfile((p) => ({ ...(p || ({} as any)), logistics: { ...((p as any)?.logistics || {}), preferredPickupTime: e.target.value } }) as any)}
                    className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2"
                    placeholder="e.g. 10AM - 2PM"
                  />
                </div>
                <div className="sm:col-span-2">
                  <div className="text-xs text-gray-500 mb-1">Pickup areas</div>
                  <input
                    disabled={!isEditing}
                    value={mergedProfile.logistics.pickupAreas.join(', ')}
                    onChange={(e) => {
                      const items = e.target.value.split(',').map((s) => s.trim()).filter(Boolean);
                      setNgoProfile((p) => ({ ...(p || ({} as any)), logistics: { ...((p as any)?.logistics || {}), pickupAreas: items } }) as any);
                    }}
                    className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2"
                    placeholder="Comma separated"
                  />
                </div>
                <div className="sm:col-span-2">
                  <div className="text-xs text-gray-500 mb-1">Drop location</div>
                  <input
                    disabled={!isEditing}
                    value={mergedProfile.logistics.dropLocation}
                    onChange={(e) => setNgoProfile((p) => ({ ...(p || ({} as any)), logistics: { ...((p as any)?.logistics || {}), dropLocation: e.target.value } }) as any)}
                    className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2"
                    placeholder="Address"
                  />
                </div>
                <div className="sm:col-span-2">
                  <div className="text-xs text-gray-500 mb-1">Emergency acceptance</div>
                  <label className="inline-flex items-center gap-2">
                    <input
                      type="checkbox"
                      disabled={!isEditing}
                      checked={Boolean(mergedProfile.logistics.emergencyAcceptance)}
                      onChange={(e) => setNgoProfile((p) => ({ ...(p || ({} as any)), logistics: { ...((p as any)?.logistics || {}), emergencyAcceptance: e.target.checked } }) as any)}
                    />
                    <span className="text-sm text-gray-900">Accept emergency donations</span>
                  </label>
                </div>
              </div>
            </div>

            <div className="rounded-2xl bg-white/70 backdrop-blur border border-white/60 p-5 sm:p-6 shadow-sm">
              <div className="text-lg font-semibold text-gray-900 mb-4">Transparency & Trust</div>
              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="rounded-xl border border-gray-100 bg-white p-4">
                  <div className="text-xs text-gray-500">Total donations received</div>
                  <div className="mt-2 text-2xl font-bold text-gray-900">{Number(ngoDashboard?.summary?.totalDonations ?? assignedDonations.length).toLocaleString()}</div>
                </div>
                <div className="rounded-xl border border-gray-100 bg-white p-4">
                  <div className="text-xs text-gray-500">Completed</div>
                  <div className="mt-2 text-2xl font-bold text-gray-900">{Number(ngoDashboard?.summary?.completedCount ?? 0).toLocaleString()}</div>
                </div>
                <div className="rounded-xl border border-gray-100 bg-white p-4">
                  <div className="text-xs text-gray-500">Active needs</div>
                  <div className="mt-2 text-2xl font-bold text-gray-900">{Number((myRequests || []).filter((r: any) => String(r.status) !== 'fulfilled').length).toLocaleString()}</div>
                </div>
                <div className="rounded-xl border border-gray-100 bg-white p-4">
                  <div className="text-xs text-gray-500">Years active</div>
                  <div className="mt-2 text-2xl font-bold text-gray-900">{yearsActive === null ? '—' : yearsActive}</div>
                </div>
              </div>

              <div className="mt-5 rounded-xl border border-gray-100 bg-white overflow-x-auto">
                <div className="px-4 py-3 text-sm font-semibold text-gray-900">Recent donations (anonymized)</div>
                <table className="min-w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left font-semibold text-gray-600">Resource</th>
                      <th className="px-4 py-3 text-left font-semibold text-gray-600">Qty</th>
                      <th className="px-4 py-3 text-left font-semibold text-gray-600">Status</th>
                      <th className="px-4 py-3 text-left font-semibold text-gray-600">Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(assignedDonations || []).slice(0, 6).map((d) => (
                      <tr key={d._id} className="border-t border-gray-100">
                        <td className="px-4 py-3 text-gray-900">{d.resourceType}</td>
                        <td className="px-4 py-3 text-gray-700">{d.quantity} {d.unit}</td>
                        <td className="px-4 py-3 text-gray-700">{d.status}</td>
                        <td className="px-4 py-3 text-gray-700">{d.createdAt ? new Date(d.createdAt).toLocaleDateString('en-IN') : '—'}</td>
                      </tr>
                    ))}
                    {(assignedDonations || []).length === 0 ? (
                      <tr>
                        <td className="px-4 py-8 text-center text-sm text-gray-600" colSpan={4}>No donations assigned yet.</td>
                      </tr>
                    ) : null}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
