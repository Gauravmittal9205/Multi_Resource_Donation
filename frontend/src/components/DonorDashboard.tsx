import { useMemo, useState } from 'react';
import type { User as FirebaseUser } from 'firebase/auth';

type DonorDashboardProps = {
  user: FirebaseUser | null;
  onBack: () => void;
};

type TabKey = 'dashboard' | 'donations' | 'requests';

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

  const [activeTab, setActiveTab] = useState<TabKey>('dashboard');

  const displayName = useMemo(() => {
    return user.displayName || user.email?.split('@')[0] || 'Donor';
  }, [user.displayName, user.email]);

  const initialLetter = useMemo(() => {
    return (user.displayName?.charAt(0) || user.email?.charAt(0) || 'D').toUpperCase();
  }, [user.displayName, user.email]);

  const TabButton = ({ tab, label }: { tab: TabKey; label: string }) => {
    const isActive = activeTab === tab;
    return (
      <button
        type="button"
        onClick={() => setActiveTab(tab)}
        className={
          isActive
            ? 'w-full text-left px-3 py-2 rounded-lg text-sm font-semibold bg-emerald-50 text-emerald-700'
            : 'w-full text-left px-3 py-2 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50'
        }
      >
        {label}
      </button>
    );
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Donor Dashboard</h1>
            <p className="text-sm text-gray-600">Welcome, {displayName}</p>
          </div>

          <button
            onClick={onBack}
            className="px-4 py-2 text-sm font-medium text-emerald-700 bg-emerald-50 rounded-md hover:bg-emerald-100"
          >
            Back
          </button>
        </div>

        <div className="flex gap-6">
          <aside className="w-64 shrink-0 self-stretch">
            <div className="sticky top-20">
              <div className="bg-white rounded-xl border border-gray-200 p-4">
                <div className="flex items-center gap-3 mb-5">
                  {user.photoURL ? (
                    <img
                      src={user.photoURL}
                      alt={user.displayName || 'User'}
                      className="w-10 h-10 rounded-full"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 font-semibold">
                      {initialLetter}
                    </div>
                  )}

                  <div className="min-w-0">
                    <div className="text-sm font-semibold text-gray-900 truncate">{displayName}</div>
                    <div className="text-xs text-gray-500 truncate">{user.email}</div>
                  </div>
                </div>

                <nav className="space-y-1">
                  <TabButton tab="dashboard" label="Dashboard" />
                  <TabButton tab="donations" label="My Donations" />
                  <TabButton tab="requests" label="Requests" />
                </nav>
              </div>
            </div>
          </aside>

          <section className="flex-1 min-w-0">
            {activeTab === 'dashboard' && (
              <>
                <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
                  <div className="bg-white rounded-xl border border-gray-200 p-4">
                    <div className="text-sm text-gray-600">Total Donations</div>
                    <div className="text-2xl font-bold text-gray-900 mt-1">0</div>
                    <div className="text-xs text-gray-500 mt-2">All time</div>
                  </div>
                  <div className="bg-white rounded-xl border border-gray-200 p-4">
                    <div className="text-sm text-gray-600">In Pickup</div>
                    <div className="text-2xl font-bold text-gray-900 mt-1">0</div>
                    <div className="text-xs text-gray-500 mt-2">Active handovers</div>
                  </div>
                  <div className="bg-white rounded-xl border border-gray-200 p-4">
                    <div className="text-sm text-gray-600">Completed</div>
                    <div className="text-2xl font-bold text-gray-900 mt-1">0</div>
                    <div className="text-xs text-gray-500 mt-2">Successfully delivered</div>
                  </div>
                </div>

                <div className="mt-6 bg-white rounded-xl border border-gray-200 p-4">
                  <div className="flex items-center justify-between">
                    <h2 className="text-lg font-semibold text-gray-900">Recent Activity</h2>
                    <span className="text-xs text-gray-500">Placeholder</span>
                  </div>
                  <div className="mt-4 text-sm text-gray-600">
                    No activity yet. Your donations will appear here.
                  </div>
                </div>
              </>
            )}

            {activeTab === 'donations' && (
              <div className="bg-white rounded-xl border border-gray-200">
                <div className="p-4 border-b border-gray-200">
                  <h2 className="text-lg font-semibold text-gray-900">My Donations</h2>
                  <p className="text-sm text-gray-600 mt-1">Track all items you have posted for donation.</p>
                </div>

                <div className="p-4 overflow-x-auto">
                  <table className="min-w-full text-sm">
                    <thead className="text-left text-gray-500">
                      <tr>
                        <th className="py-2 pr-4 font-medium">Item</th>
                        <th className="py-2 pr-4 font-medium">Category</th>
                        <th className="py-2 pr-4 font-medium">Status</th>
                        <th className="py-2 pr-4 font-medium">Created</th>
                      </tr>
                    </thead>
                    <tbody className="text-gray-700">
                      <tr className="border-t border-gray-200">
                        <td className="py-3 pr-4">-</td>
                        <td className="py-3 pr-4">-</td>
                        <td className="py-3 pr-4">
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-700">No data</span>
                        </td>
                        <td className="py-3 pr-4">-</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {activeTab === 'requests' && (
              <div className="bg-white rounded-xl border border-gray-200">
                <div className="p-4 border-b border-gray-200">
                  <h2 className="text-lg font-semibold text-gray-900">Requests</h2>
                  <p className="text-sm text-gray-600 mt-1">Requests from NGOs/volunteers for your listed donations.</p>
                </div>

                <div className="p-4">
                  <div className="rounded-lg border border-dashed border-gray-300 p-6 text-center">
                    <div className="text-sm font-semibold text-gray-900">No requests yet</div>
                    <div className="text-sm text-gray-600 mt-1">When someone requests your donation, it will show here.</div>
                  </div>
                </div>
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}

export default DonorDashboard;
