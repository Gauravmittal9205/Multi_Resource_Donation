import React, { useEffect, useMemo, useRef, useState } from 'react';
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
  const [activeTab, setActiveTab] = useState<'active' | 'completed'>('active');
  const [isEditing, setIsEditing] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [profile, setProfile] = useState({
    name: 'Amit Verma',
    donorType: 'Individual' as 'Individual' | 'Restaurant' | 'Corporate',
    email: 'amit.verma@example.com',
    phone: '+91 98765 43210',
    location: 'Pune',
    tagline: '“Serving communities through timely donations”',
    avatar: '' as string,
  });

  // Load saved profile from localStorage on first render
  useEffect(() => {
    try {
      const raw = localStorage.getItem('donor_profile');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed === 'object') {
          setProfile((p) => ({ ...p, ...parsed }));
        }
      }
    } catch {}
  }, []);

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      setAvatarPreview(dataUrl);
    };
    reader.readAsDataURL(file);
  };

  const handleField = (key: keyof typeof profile) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setProfile(p => ({ ...p, [key]: e.target.value }));
  };

  const handleSave = () => {
    setProfile(p => {
      const next = { ...p, avatar: avatarPreview || p.avatar };
      try {
        localStorage.setItem('donor_profile', JSON.stringify(next));
      } catch {}
      return next;
    });
    setIsEditing(false);
  };

  const handleCancel = () => {
    setAvatarPreview(null);
    setIsEditing(false);
  };

  type DonationItem = { type: 'Food'|'Clothes'|'Books'|'Medicines'; qty: string; status: string; date: string; countdown?: string };
  const donations = useMemo<Record<'active'|'completed', DonationItem[]>>(() => ({
    active: [
      { type: 'Food', qty: '25 kg', status: 'Pending', date: 'Dec 18, 2025', countdown: '02:45:10' },
    ],
    completed: [
      { type: 'Books', qty: '120', status: 'Distributed', date: 'Dec 12, 2025' },
      { type: 'Medicines', qty: '15 kits', status: 'Distributed', date: 'Dec 02, 2025' },
    ],
  }), []);

  const [detail, setDetail] = useState<DonationItem | null>(null);
  const activeHighlight = donations.active[0];

  const badges = useMemo(() => [
    { title: 'First Donation', icon: '🎉' },
    { title: '100 Meals Donated', icon: '🍱' },
    { title: 'Community Supporter', icon: '🤝' },
    { title: 'Verified Contributor', icon: '✔️' },
  ], []);
  const [showAllBadges, setShowAllBadges] = useState(false);

  type MediaItem = { type: 'image' | 'video'; src: string };
  const [gallery, setGallery] = useState<MediaItem[]>([
    { type: 'image', src: 'https://source.unsplash.com/collection/1163637/800x600' },
    { type: 'image', src: 'https://source.unsplash.com/collection/1424340/800x600' },
    { type: 'image', src: 'https://source.unsplash.com/collection/1424348/800x600' },
    { type: 'image', src: 'https://source.unsplash.com/collection/1136817/800x600' },
  ]);
  const [galleryOpen, setGalleryOpen] = useState(false);
  const galleryInputRef = useRef<HTMLInputElement | null>(null);
  const handleGalleryFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    const readers = files.map(f => new Promise<MediaItem>((resolve) => {
      const r = new FileReader();
      r.onload = () => resolve({ type: f.type.startsWith('video') ? 'video' : 'image', src: r.result as string });
      r.readAsDataURL(f);
    }));
    Promise.all(readers).then(items => setGallery(prev => [...items, ...prev]));
  };

  const [showChangePwd, setShowChangePwd] = useState(false);
  
  // Quick Actions handlers (demo wiring)
  const handleDonateAgain = () => {
    alert('Navigating to Donate Items...');
  };
  const handleChangePassword = () => {
    alert('Password change flow will open here.');
  };
  const handleDeleteAccount = () => {
    if (confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
      alert('Account deletion flow will proceed.');
    }
  };

  // (Gallery removed for donor-focused minimal layout)

  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50/60 via-white to-blue-50/60">
      {/* Header: Donor-focused with edit and avatar upload */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-emerald-100/60 via-white to-blue-100/60" />
        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-10">
          <div className="flex flex-col sm:flex-row sm:items-center gap-6 sm:gap-8">
            <button
              className="group relative w-36 h-36 sm:w-40 sm:h-40 rounded-full overflow-hidden bg-white/70 backdrop-blur border border-white/60 shadow flex items-center justify-center text-3xl"
              onClick={() => fileInputRef.current?.click()}
            >
              { (avatarPreview || profile.avatar) ? (
                <img src={avatarPreview || profile.avatar} alt="avatar" className="w-full h-full object-cover" />
              ) : (
                <span>👤</span>
              )}
              <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                <span className="text-2xl sm:text-3xl">📷</span>
              </div>
              <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
            </button>
            <div className="flex-1 text-center sm:text-left">
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3">
                {isEditing ? (
                  <input
                    value={profile.name}
                    onChange={handleField('name')}
                    className="text-3xl sm:text-4xl font-bold text-gray-900 bg-white border border-gray-200 rounded-md px-3 py-1"
                  />
                ) : (
                  <h1 className="text-3xl sm:text-4xl font-bold text-gray-900">{profile.name}</h1>
                )}
                {isEditing ? (
                  <select
                    value={profile.donorType}
                    onChange={(e) => setProfile(p => ({ ...p, donorType: e.target.value as any }))}
                    className="px-2 py-1 rounded-full text-xs bg-emerald-100 text-emerald-700"
                  >
                    <option>Individual</option>
                    <option>Restaurant</option>
                    <option>Corporate</option>
                  </select>
                ) : (
                  <span className="px-2.5 py-1 rounded-full text-xs bg-emerald-100 text-emerald-700">{profile.donorType}</span>
                )}
                {!isEditing && (
                  <button
                    aria-label="Edit profile"
                    onClick={() => setIsEditing(true)}
                    className="ml-1 inline-flex items-center justify-center w-8 h-8 rounded-full bg-white border border-gray-200 text-gray-700 hover:bg-gray-50"
                  >
                    ✏️
                  </button>
                )}
                {isEditing && (
                  <>
                    <button onClick={handleSave} className="ml-1 inline-flex items-center justify-center px-3 h-8 rounded-full bg-emerald-600 text-white text-sm">Save</button>
                    <button onClick={handleCancel} className="inline-flex items-center justify-center px-3 h-8 rounded-full bg-white border border-gray-200 text-gray-700 text-sm">Cancel</button>
                  </>
                )}
              </div>
              <div className="mt-2 text-sm text-gray-600 flex flex-wrap items-center justify-center sm:justify-start gap-3">
                {isEditing ? (
                  <input value={profile.location} onChange={handleField('location')} className="bg-white border border-gray-200 rounded px-2 py-1" />
                ) : (
                  <span>📍 {profile.location}</span>
                )}
              </div>
              <div className="mt-2 text-sm text-gray-700 flex flex-wrap items-center justify-center sm:justify-start gap-4">
                {isEditing ? (
                  <input value={profile.email} onChange={handleField('email')} className="bg-white border border-gray-200 rounded px-2 py-1" />
                ) : (
                  <span className="flex items-center gap-1">📧 {profile.email}</span>
                )}
                {isEditing ? (
                  <input value={profile.phone} onChange={handleField('phone')} className="bg-white border border-gray-200 rounded px-2 py-1" />
                ) : (
                  <span className="flex items-center gap-1">📞 {profile.phone}</span>
                )}
              </div>
              {isEditing ? (
                <input value={profile.tagline} onChange={handleField('tagline')} className="mt-3 w-full sm:w-auto bg-white border border-gray-200 rounded px-2 py-1 text-gray-700" />
              ) : (
                <p className="mt-3 text-gray-700">{profile.tagline}</p>
              )}
            </div>
            {/* Edit actions moved inline next to name */}
          </div>
        </div>
      </section>

      {/* Impact Overview (compact 3-4 metrics) */}
      <section className="py-6 sm:py-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            <StatCard icon={<span>🍽️</span>} label="Total Meals Donated" value={240} bg="bg-emerald-50" />
            <StatCard icon={<span>📦</span>} label="Total Donations" value={36} bg="bg-blue-50" />
            <StatCard icon={<span>♻️</span>} label="Resources Saved" value={340} bg="bg-emerald-50" />
            <StatCard icon={<span>❤️</span>} label="Lives Impacted" value={520} bg="bg-blue-50" />
          </div>
        </div>
      </section>

      {/* Tabs (moved above Badges) */}
      <section className="py-6 sm:py-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white/70 backdrop-blur rounded-2xl border border-white/60 shadow-sm">
            <div className="flex gap-2 p-3">
              {[
                { key: 'active', label: 'Active Donations' },
                { key: 'completed', label: 'Completed Donations' },
              ].map((t) => (
                <button
                  key={t.key}
                  onClick={() => setActiveTab(t.key as any)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    activeTab === t.key
                      ? 'bg-emerald-600 text-white shadow'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>

            <div className="p-4 sm:p-6 grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {donations[activeTab].map((d, i) => (
                <div key={i} className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm hover:shadow-md transition-all">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center">
                        <span className="text-lg">{d.type === 'Food' ? '🍽️' : d.type === 'Clothes' ? '👕' : d.type === 'Books' ? '📚' : '💊'}</span>
                      </div>
                      <div>
                        <div className="font-semibold text-gray-900">{d.type}</div>
                        <div className="text-sm text-gray-600">{d.qty} • {d.date}</div>
                      </div>
                    </div>
                    <span className="text-xs px-2 py-1 rounded-full bg-blue-50 text-blue-700">{d.status}</span>
                  </div>
                  <div className="mt-4 flex justify-between">
                    <button onClick={() => setDetail(d)} className="text-sm px-3 py-1.5 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700">View Details</button>
                    <button className="text-sm px-3 py-1.5 rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200">Message</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Badges & Achievements (moved below Tabs) */}
      <section className="py-6 sm:py-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-3">
            <div className="font-semibold text-gray-900">Badges & Achievements</div>
            <button onClick={() => setShowAllBadges(v => !v)} className="text-sm text-emerald-700 hover:underline">{showAllBadges ? 'Hide' : 'View All'}</button>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {(showAllBadges ? badges : badges.slice(0,3)).map((b, i) => (
              <div key={i} className="rounded-xl bg-white/70 backdrop-blur border border-white/60 p-4 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="text-xl">{b.icon}</div>
                  <div className="text-gray-800">{b.title}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {activeHighlight && (
        <section className="py-6 sm:py-8">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center">🍽️</div>
                  <div>
                    <div className="font-semibold text-gray-900">Active Donation: {activeHighlight.type}</div>
                    <div className="text-sm text-gray-700">{activeHighlight.qty} • {activeHighlight.date}</div>
                  </div>
                </div>
                {activeHighlight.countdown && (
                  <span className="text-xs px-2 py-1 rounded-full bg-orange-100 text-orange-700">Countdown: {activeHighlight.countdown}</span>
                )}
              </div>
              <div className="mt-3 grid sm:grid-cols-3 gap-3 text-sm">
                <div className="rounded-lg bg-white p-3">Volunteer: <span className="font-medium">Rahul S.</span></div>
                <div className="rounded-lg bg-white p-3">Pickup Status: <span className="font-medium">Scheduled</span></div>
                <div className="rounded-lg bg-white p-3">OTP: <span className="font-medium">Pending</span></div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Gallery moved here below active donation */}
      <section className="py-6 sm:py-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-3">
            <div className="font-semibold text-gray-900">Gallery / Proof</div>
            <div className="flex items-center gap-3">
              <button onClick={() => setGalleryOpen(true)} className="text-sm text-emerald-700 hover:underline">View More</button>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            {gallery.slice(0,2).map((m, i) => (
              <div key={i} className="overflow-hidden rounded-xl border border-gray-200 bg-gray-50">
                {m.type === 'image' ? (
                  <img src={m.src} alt="proof" loading="lazy" className="w-full h-36 sm:h-44 object-cover" />
                ) : (
                  <video src={m.src} controls className="w-full h-36 sm:h-44 object-cover" />
                )}
              </div>
            ))}
            <button
              onClick={() => galleryInputRef.current?.click()}
              className="rounded-xl border-2 border-dashed border-emerald-300 text-emerald-600 hover:bg-emerald-50 flex items-center justify-center"
            >
              <span className="text-3xl">+</span>
            </button>
            <input ref={galleryInputRef} type="file" accept="image/*,video/*" multiple className="hidden" onChange={handleGalleryFiles} />
          </div>
        </div>
      </section>

      <section className="py-6 sm:py-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid gap-4">
            <div className="rounded-2xl bg-white/70 backdrop-blur border border-white/60 p-5">
              <div className="text-center text-xl font-semibold text-gray-900 mb-4">Quick Actions</div>
              <div className="flex flex-wrap gap-3 justify-center">
                <button onClick={handleDonateAgain} className="px-5 py-2 rounded-full bg-emerald-600 text-white hover:bg-emerald-700">Donate Again</button>
                <button onClick={() => setShowChangePwd(true)} className="px-5 py-2 rounded-full bg-white border border-gray-200 text-gray-700 hover:bg-gray-50">Change Password</button>
                <button onClick={handleDeleteAccount} className="px-5 py-2 rounded-full bg-white border border-gray-200 text-red-600 hover:bg-gray-50">Delete Account</button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Sticky bottom actions removed as requested */}

      {/* Details modal */}
      {detail && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur flex items-center justify-center p-4" onClick={() => setDetail(null)}>
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-5" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <div className="font-semibold text-gray-900">{detail.type} • {detail.qty}</div>
              <button onClick={() => setDetail(null)} className="text-gray-500 hover:text-gray-700">✕</button>
            </div>
            <div className="mt-2 text-sm text-gray-600">{detail.date}</div>
            <div className="mt-4 text-sm">Status: <span className="px-2 py-0.5 text-xs rounded-full bg-blue-50 text-blue-700">{detail.status}</span></div>
            {detail.countdown && (
              <div className="mt-2 text-sm text-orange-700">⏱️ Time-sensitive: {detail.countdown}</div>
            )}
            <div className="mt-5 flex justify-end gap-2">
              <button className="px-4 py-2 rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200" onClick={() => setDetail(null)}>Close</button>
              <button className="px-4 py-2 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700">Message Volunteer</button>
            </div>
          </div>
        </div>
      )}

      {/* Gallery modal */}
      {galleryOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur flex items-center justify-center p-4" onClick={() => setGalleryOpen(false)}>
          <div className="bg-white rounded-2xl shadow-xl max-w-3xl w-full p-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-3">
              <div className="font-semibold text-gray-900">Gallery</div>
              <div className="flex items-center gap-3">
                <button onClick={() => galleryInputRef.current?.click()} className="text-sm text-emerald-700 hover:underline">Add Media</button>
                <button onClick={() => setGalleryOpen(false)} className="text-gray-500 hover:text-gray-700">✕</button>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {gallery.slice(0,6).map((m, i) => (
                <div key={i} className="overflow-hidden rounded-xl bg-gray-100">
                  {m.type === 'image' ? (
                    <img src={m.src} alt="proof" className="w-full h-36 object-cover" />
                  ) : (
                    <video src={m.src} controls className="w-full h-36 object-cover" />
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Change Password modal */}
      {showChangePwd && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur flex items-center justify-center p-4" onClick={() => setShowChangePwd(false)}>
          <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-3">
              <div className="text-xl font-bold text-gray-900">Change Password</div>
              <button onClick={() => setShowChangePwd(false)} className="text-gray-500 hover:text-gray-700">✕</button>
            </div>
            <p className="text-sm text-gray-600 mb-4">Enter your current password and choose a new one.</p>
            <form
              onSubmit={(e) => { e.preventDefault(); alert('Password updated (demo)'); setShowChangePwd(false); }}
              className="space-y-3"
            >
              <div>
                <label className="block text-sm text-gray-700 mb-1">Current Password</label>
                <input type="password" required className="w-full border border-gray-200 rounded-lg px-3 py-2" placeholder="Enter current password" />
              </div>
              <div>
                <label className="block text-sm text-gray-700 mb-1">New Password</label>
                <input type="password" minLength={6} required className="w-full border border-gray-200 rounded-lg px-3 py-2" placeholder="Enter new password" />
              </div>
              <div>
                <label className="block text-sm text-gray-700 mb-1">Confirm New Password</label>
                <input type="password" minLength={6} required className="w-full border border-gray-200 rounded-lg px-3 py-2" placeholder="Confirm new password" />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setShowChangePwd(false)} className="px-4 py-2 rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200">Cancel</button>
                <button type="submit" className="px-4 py-2 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700">Update Password</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfilePage;
