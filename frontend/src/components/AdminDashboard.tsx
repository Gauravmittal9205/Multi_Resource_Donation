import { useState, useEffect } from 'react';
import type { User } from 'firebase/auth';
import { signOutUser } from '../firebase';
import {
  LayoutDashboard,
  Building2,
  Package,
  Truck,
  AlertTriangle,
  BarChart3,
  Megaphone,
  Users,
  Settings,
  CheckCircle,
  XCircle,
  Clock,
  FileText,
  Ban,
  MessageSquare,
  Menu,
  X,
  TrendingUp,
  Activity,
  ArrowUp,
  ArrowDown,
  RefreshCw,
  Eye,
  MapPin,
  Flame,
  Award,
  Target
} from 'lucide-react';

interface AdminDashboardProps {
  user: User | null;
  onBack: () => void;
}

type TabKey = 'overview' | 'ngos' | 'donations' | 'pickups' | 'reports' | 'analytics' | 'announcements' | 'users' | 'settings';

export default function AdminDashboard({ user, onBack }: AdminDashboardProps) {
  const [activeTab, setActiveTab] = useState<TabKey>('overview');
  const [loading, setLoading] = useState(true);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [animatedStats, setAnimatedStats] = useState({
    totalDonations: 0,
    verifiedNGOs: 0,
    pendingNGOs: 0,
    activePickups: 0,
    mealsSaved: 0,
    openIssues: 0
  });

  const cityDonations = [
    { city: 'Mumbai', donations: 342, percentage: 27.4, trend: 'up', change: 15 },
    { city: 'Delhi', donations: 289, percentage: 23.1, trend: 'up', change: 8 },
    { city: 'Bangalore', donations: 198, percentage: 15.8, trend: 'up', change: 22 },
    { city: 'Hyderabad', donations: 156, percentage: 12.5, trend: 'down', change: -5 },
    { city: 'Chennai', donations: 134, percentage: 10.7, trend: 'up', change: 12 },
    { city: 'Kolkata', donations: 98, percentage: 7.8, trend: 'up', change: 3 },
    { city: 'Pune', donations: 87, percentage: 7.0, trend: 'down', change: -2 },
    { city: 'Ahmedabad', donations: 65, percentage: 5.2, trend: 'up', change: 18 }
  ];

  const getHeatColor = (percentage: number) => {
    if (percentage >= 20) return 'bg-red-500';
    if (percentage >= 15) return 'bg-orange-500';
    if (percentage >= 10) return 'bg-yellow-500';
    if (percentage >= 5) return 'bg-green-500';
    return 'bg-blue-500';
  };

  const getHeatBgColor = (percentage: number) => {
    if (percentage >= 20) return 'bg-red-50 hover:bg-red-100';
    if (percentage >= 15) return 'bg-orange-50 hover:bg-orange-100';
    if (percentage >= 10) return 'bg-yellow-50 hover:bg-yellow-100';
    if (percentage >= 5) return 'bg-green-50 hover:bg-green-100';
    return 'bg-blue-50 hover:bg-blue-100';
  };

  const getHeatTextColor = (percentage: number) => {
    if (percentage >= 20) return 'text-red-700';
    if (percentage >= 15) return 'text-orange-700';
    if (percentage >= 10) return 'text-yellow-700';
    if (percentage >= 5) return 'text-green-700';
    return 'text-blue-700';
  };

  const recentActivities = [
    {
      id: 1,
      type: 'donation',
      title: 'New donation received',
      description: '50kg of food items donated by John Doe',
      time: '2 minutes ago',
      icon: Package,
      color: 'text-blue-500'
    },
    {
      id: 2,
      type: 'pickup',
      title: 'Pickup completed',
      description: 'Food items delivered to Feed India NGO',
      time: '15 minutes ago',
      icon: Truck,
      color: 'text-green-500'
    },
    {
      id: 3,
      type: 'registration',
      title: 'New NGO registration',
      description: 'Help Foundation applied for verification',
      time: '1 hour ago',
      icon: Building2,
      color: 'text-purple-500'
    },
    {
      id: 4,
      type: 'issue',
      title: 'Issue resolved',
      description: 'Delivery delay issue marked as resolved',
      time: '2 hours ago',
      icon: CheckCircle,
      color: 'text-green-500'
    }
  ];

  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false);
      // Mock data - replace with actual API calls
      const newStats = {
        totalDonations: 1247,
        verifiedNGOs: 45,
        pendingNGOs: 12,
        activePickups: 23,
        mealsSaved: 49880,
        openIssues: 8
      };
      
      // Animate stats counting up
      Object.keys(newStats).forEach((key, index) => {
        setTimeout(() => {
          const targetValue = newStats[key as keyof typeof newStats];
          const duration = 1500;
          const steps = 30;
          const increment = targetValue / steps;
          let current = 0;
          
          const counter = setInterval(() => {
            current += increment;
            if (current >= targetValue) {
              current = targetValue;
              clearInterval(counter);
            }
            setAnimatedStats(prev => ({
              ...prev,
              [key]: Math.floor(current)
            }));
          }, duration / steps);
        }, index * 100);
      });
    }, 500);
    
    return () => clearTimeout(timer);
  }, []);

  const handleLogout = async () => {
    try {
      await signOutUser();
      onBack();
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-4xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-gray-800">Authentication Required</h2>
          <p className="text-gray-600 mt-2">Please sign in to access the admin dashboard</p>
        </div>
      </div>
    );
  }

  const menuItems = [
    { id: 'overview' as TabKey, label: 'Dashboard', icon: LayoutDashboard },
    { id: 'ngos' as TabKey, label: 'NGOs', icon: Building2 },
    { id: 'donations' as TabKey, label: 'Donations', icon: Package },
    { id: 'pickups' as TabKey, label: 'Pickups', icon: Truck },
    { id: 'reports' as TabKey, label: 'Reports', icon: AlertTriangle },
    { id: 'analytics' as TabKey, label: 'Analytics', icon: BarChart3 },
    { id: 'announcements' as TabKey, label: 'Announcements', icon: Megaphone },
    { id: 'users' as TabKey, label: 'Users', icon: Users },
    { id: 'settings' as TabKey, label: 'Settings', icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <aside className={`bg-white border-r border-gray-200 flex flex-col transition-all duration-300 ease-in-out overflow-hidden h-screen fixed left-0 top-0 ${
        sidebarCollapsed ? 'w-20' : 'w-64'
      }`}>
        {/* Header */}
        <div className="p-6 border-b border-gray-200 flex items-center justify-between">
          {!sidebarCollapsed ? (
            <div>
              <h1 className="text-xl font-bold text-gray-900">Admin Panel</h1>
              <p className="text-sm text-gray-500 mt-1 truncate">{user?.email}</p>
            </div>
          ) : (
            <div className="flex justify-center">
              <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">A</span>
              </div>
            </div>
          )}
          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="w-6 h-6 bg-gray-100 border border-gray-300 rounded-full flex items-center justify-center hover:bg-gray-200 transition-colors shadow-sm"
          >
            {sidebarCollapsed ? (
              <Menu className="w-4 h-4 text-gray-600" />
            ) : (
              <X className="w-4 h-4 text-gray-600" />
            )}
          </button>
        </div>
        
        <nav className="flex-1 p-4 space-y-1 overflow-hidden">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            
            return (
              <div key={item.id} className="relative group">
                <button
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center ${sidebarCollapsed ? 'justify-center' : 'space-x-3'} px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 transform hover:scale-105 ${
                    isActive
                      ? 'bg-gradient-to-r from-blue-50 to-blue-100 text-blue-700 border border-blue-200 shadow-sm'
                      : 'text-gray-700 hover:bg-gray-50 hover:shadow-sm'
                  }`}
                >
                  <Icon className={`w-5 h-5 transition-transform duration-200 ${
                    isActive ? 'scale-110' : 'group-hover:scale-110'
                  }`} />
                  {!sidebarCollapsed && (
                    <span className="transition-all duration-200">{item.label}</span>
                  )}
                </button>
                
                {/* Tooltip for collapsed state */}
                {sidebarCollapsed && (
                  <div className="absolute left-full ml-2 top-1/2 transform -translate-y-1/2 bg-gray-900 text-white text-sm px-3 py-2 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50">
                    {item.label}
                    <div className="absolute left-0 top-1/2 transform -translate-y-1/2 -translate-x-1 w-2 h-2 bg-gray-900 rotate-45"></div>
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200">
          {!sidebarCollapsed ? (
            <button
              onClick={handleLogout}
              className="w-full flex items-center justify-center space-x-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 hover:shadow-sm transition-all duration-200 transform hover:scale-105"
            >
              <span>Logout</span>
            </button>
          ) : (
            <button
              onClick={handleLogout}
              className="w-full flex items-center justify-center px-4 py-3 text-gray-700 hover:bg-gray-50 rounded-lg transition-all duration-200 transform hover:scale-105 group"
              title="Logout"
            >
              <X className="w-5 h-5 group-hover:rotate-90 transition-transform duration-200" />
            </button>
          )}
        </div>
      </aside>

      {/* Main Content */}
      <main className={`flex-1 overflow-y-auto transition-all duration-300 ease-in-out ${
        sidebarCollapsed ? 'ml-20' : 'ml-64'
      }`}>
        <div className="p-8">
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Dashboard Overview</h2>
                <p className="text-gray-600">System health and key metrics at a glance</p>
              </div>

              {/* Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <button
                  onClick={() => setActiveTab('donations')}
                  className="bg-white rounded-lg shadow p-6 border-l-4 border-blue-500 hover:shadow-xl transform hover:scale-105 transition-all duration-300 group relative overflow-hidden"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  <div className="relative flex items-center justify-between">
                    <div className="text-left">
                      <p className="text-sm font-medium text-gray-600 group-hover:text-blue-700 transition-colors">Total Donations</p>
                      <p className="text-3xl font-bold text-gray-900 mt-2 group-hover:text-blue-800 transition-colors">
                        {animatedStats.totalDonations.toLocaleString()}
                      </p>
                      <div className="flex items-center mt-2 text-xs text-green-600">
                        <ArrowUp className="w-3 h-3 mr-1" />
                        <span>+12% from last month</span>
                      </div>
                    </div>
                    <div className="relative">
                      <Package className="w-12 h-12 text-blue-500 group-hover:scale-110 transition-transform duration-300" />
                      <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                    </div>
                  </div>
                </button>

                <button
                  onClick={() => setActiveTab('ngos')}
                  className="bg-white rounded-lg shadow p-6 border-l-4 border-green-500 hover:shadow-xl transform hover:scale-105 transition-all duration-300 group relative overflow-hidden"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-green-50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  <div className="relative flex items-center justify-between">
                    <div className="text-left">
                      <p className="text-sm font-medium text-gray-600 group-hover:text-green-700 transition-colors">Verified NGOs</p>
                      <p className="text-3xl font-bold text-gray-900 mt-2 group-hover:text-green-800 transition-colors">
                        {animatedStats.verifiedNGOs}
                      </p>
                      <div className="flex items-center mt-2 text-xs text-green-600">
                        <ArrowUp className="w-3 h-3 mr-1" />
                        <span>+8% from last month</span>
                      </div>
                    </div>
                    <Building2 className="w-12 h-12 text-green-500 group-hover:scale-110 transition-transform duration-300" />
                  </div>
                </button>

                <button
                  onClick={() => setActiveTab('ngos')}
                  className="bg-white rounded-lg shadow p-6 border-l-4 border-yellow-500 hover:shadow-xl transform hover:scale-105 transition-all duration-300 group relative overflow-hidden"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-yellow-50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  <div className="relative flex items-center justify-between">
                    <div className="text-left">
                      <p className="text-sm font-medium text-gray-600 group-hover:text-yellow-700 transition-colors">Pending NGO Requests</p>
                      <p className="text-3xl font-bold text-gray-900 mt-2 group-hover:text-yellow-800 transition-colors">
                        {animatedStats.pendingNGOs}
                      </p>
                      <div className="flex items-center mt-2 text-xs text-yellow-600">
                        <Clock className="w-3 h-3 mr-1" />
                        <span>Needs attention</span>
                      </div>
                    </div>
                    <Clock className="w-12 h-12 text-yellow-500 group-hover:scale-110 transition-transform duration-300" />
                  </div>
                </button>

                <button
                  onClick={() => setActiveTab('pickups')}
                  className="bg-white rounded-lg shadow p-6 border-l-4 border-purple-500 hover:shadow-xl transform hover:scale-105 transition-all duration-300 group relative overflow-hidden"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-purple-50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  <div className="relative flex items-center justify-between">
                    <div className="text-left">
                      <p className="text-sm font-medium text-gray-600 group-hover:text-purple-700 transition-colors">Active Pickups</p>
                      <p className="text-3xl font-bold text-gray-900 mt-2 group-hover:text-purple-800 transition-colors">
                        {animatedStats.activePickups}
                      </p>
                      <div className="flex items-center mt-2 text-xs text-purple-600">
                        <Activity className="w-3 h-3 mr-1" />
                        <span>3 in progress</span>
                      </div>
                    </div>
                    <Truck className="w-12 h-12 text-purple-500 group-hover:scale-110 transition-transform duration-300" />
                  </div>
                </button>

                <button
                  onClick={() => setActiveTab('analytics')}
                  className="bg-white rounded-lg shadow p-6 border-l-4 border-orange-500 hover:shadow-xl transform hover:scale-105 transition-all duration-300 group relative overflow-hidden"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-orange-50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  <div className="relative flex items-center justify-between">
                    <div className="text-left">
                      <p className="text-sm font-medium text-gray-600 group-hover:text-orange-700 transition-colors">Meals Saved</p>
                      <p className="text-3xl font-bold text-gray-900 mt-2 group-hover:text-orange-800 transition-colors">
                        {animatedStats.mealsSaved.toLocaleString()}
                      </p>
                      <div className="flex items-center mt-2 text-xs text-orange-600">
                        <TrendingUp className="w-3 h-3 mr-1" />
                        <span>+25% impact</span>
                      </div>
                    </div>
                    <BarChart3 className="w-12 h-12 text-orange-500 group-hover:scale-110 transition-transform duration-300" />
                  </div>
                </button>

                <button
                  onClick={() => setActiveTab('reports')}
                  className="bg-white rounded-lg shadow p-6 border-l-4 border-red-500 hover:shadow-xl transform hover:scale-105 transition-all duration-300 group relative overflow-hidden"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-red-50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  <div className="relative flex items-center justify-between">
                    <div className="text-left">
                      <p className="text-sm font-medium text-gray-600 group-hover:text-red-700 transition-colors">Open Issues</p>
                      <p className="text-3xl font-bold text-gray-900 mt-2 group-hover:text-red-800 transition-colors">
                        {animatedStats.openIssues}
                      </p>
                      <div className="flex items-center mt-2 text-xs text-red-600">
                        <ArrowDown className="w-3 h-3 mr-1" />
                        <span>-40% from last week</span>
                      </div>
                    </div>
                    <AlertTriangle className="w-12 h-12 text-red-500 group-hover:scale-110 transition-transform duration-300" />
                  </div>
                </button>
              </div>

              {/* Recent Activity */}
              <div className="bg-white rounded-lg shadow overflow-hidden">
                <div className="p-6 border-b border-gray-200 flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900">Recent Activity</h3>
                  <button className="flex items-center space-x-2 text-sm text-blue-600 hover:text-blue-800 transition-colors">
                    <RefreshCw className="w-4 h-4" />
                    <span>Refresh</span>
                  </button>
                </div>
                <div className="divide-y divide-gray-100">
                  {recentActivities.map((activity, index) => {
                    const Icon = activity.icon;
                    return (
                      <div
                        key={activity.id}
                        className="p-4 hover:bg-gray-50 transition-all duration-200 cursor-pointer group"
                        style={{
                          animation: `slideIn 0.3s ease-out ${index * 0.1}s both`
                        }}
                      >
                        <div className="flex items-start space-x-4">
                          <div className={`flex-shrink-0 w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center group-hover:scale-110 transition-transform duration-200`}>
                            <Icon className={`w-5 h-5 ${activity.color}`} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <p className="text-sm font-medium text-gray-900 group-hover:text-blue-600 transition-colors">
                                {activity.title}
                              </p>
                              <span className="text-xs text-gray-500">{activity.time}</span>
                            </div>
                            <p className="text-sm text-gray-600 mt-1">{activity.description}</p>
                            <div className="flex items-center space-x-4 mt-2">
                              <button className="text-xs text-blue-600 hover:text-blue-800 transition-colors flex items-center space-x-1">
                                <Eye className="w-3 h-3" />
                                <span>View Details</span>
                              </button>
                              <button className="text-xs text-gray-500 hover:text-gray-700 transition-colors">
                                Dismiss
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
                <div className="p-4 bg-gray-50 border-t border-gray-200">
                  <button className="w-full text-center text-sm text-blue-600 hover:text-blue-800 transition-colors font-medium">
                    View All Activities →
                  </button>
                </div>
              </div>

              {/* City-wise Heat Map */}
              <div className="bg-white rounded-lg shadow overflow-hidden">
                <div className="p-6 border-b border-gray-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-gradient-to-br from-orange-500 to-red-500 rounded-lg flex items-center justify-center">
                        <MapPin className="w-4 h-4 text-white" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">City-wise Impact Heat Map</h3>
                        <p className="text-sm text-gray-500">Hyper-local donation distribution across cities</p>
                      </div>
                    </div>
                    <button className="flex items-center space-x-2 text-sm text-blue-600 hover:text-blue-800 transition-colors">
                      <Target className="w-4 h-4" />
                      <span>View Analytics</span>
                    </button>
                  </div>
                </div>
                
                <div className="p-6">
                  {/* Top 3 Cities */}
                  <div className="mb-6">
                    <div className="flex items-center space-x-2 mb-4">
                      <Award className="w-5 h-5 text-yellow-500" />
                      <h4 className="text-sm font-semibold text-gray-700">Top 3 Active Cities</h4>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {cityDonations.slice(0, 3).map((city, index) => (
                        <div
                          key={city.city}
                          className={`p-4 rounded-lg border-2 transition-all duration-300 hover:shadow-lg transform hover:scale-105 ${
                            index === 0 ? 'border-yellow-400 bg-yellow-50' :
                            index === 1 ? 'border-gray-400 bg-gray-50' :
                            'border-orange-400 bg-orange-50'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center space-x-2">
                              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                                index === 0 ? 'bg-yellow-400' :
                                index === 1 ? 'bg-gray-400' :
                                'bg-orange-400'
                              }`}>
                                <span className="text-white font-bold text-sm">{index + 1}</span>
                              </div>
                              <span className="font-semibold text-gray-900">{city.city}</span>
                            </div>
                            {index === 0 && <Flame className="w-4 h-4 text-red-500 animate-pulse" />}
                          </div>
                          <div className="text-2xl font-bold text-gray-900">{city.donations}</div>
                          <div className="text-xs text-gray-600">{city.percentage}% of total</div>
                          <div className={`flex items-center mt-2 text-xs ${
                            city.trend === 'up' ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {city.trend === 'up' ? <ArrowUp className="w-3 h-3 mr-1" /> : <ArrowDown className="w-3 h-3 mr-1" />}
                            {Math.abs(city.change)}% from last month
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Heat Map Grid */}
                  <div>
                    <div className="flex items-center space-x-2 mb-4">
                      <div className="w-5 h-5 bg-gradient-to-r from-blue-500 via-green-500 via-yellow-500 via-orange-500 to-red-500 rounded"></div>
                      <h4 className="text-sm font-semibold text-gray-700">All Cities by Donation Volume</h4>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      {cityDonations.map((city, index) => (
                        <div
                          key={city.city}
                          className={`p-4 rounded-lg border transition-all duration-300 cursor-pointer transform hover:scale-105 hover:shadow-lg ${getHeatBgColor(city.percentage)}`}
                          style={{
                            animation: `fadeInUp 0.5s ease-out ${index * 0.1}s both`
                          }}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <span className={`font-semibold text-sm ${getHeatTextColor(city.percentage)}`}>
                              {city.city}
                            </span>
                            <div className={`w-3 h-3 rounded-full ${getHeatColor(city.percentage)} animate-pulse`}></div>
                          </div>
                          <div className={`text-xl font-bold ${getHeatTextColor(city.percentage)}`}>
                            {city.donations}
                          </div>
                          <div className="text-xs text-gray-600">{city.percentage}%</div>
                          <div className={`flex items-center mt-2 text-xs ${
                            city.trend === 'up' ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {city.trend === 'up' ? <ArrowUp className="w-3 h-3 mr-1" /> : <ArrowDown className="w-3 h-3 mr-1" />}
                            {Math.abs(city.change)}%
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Heat Map Legend */}
                  <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <span className="text-xs font-medium text-gray-600">Volume Intensity:</span>
                        <div className="flex items-center space-x-2">
                          <div className="flex items-center space-x-1">
                            <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                            <span className="text-xs text-gray-600">Low</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                            <span className="text-xs text-gray-600">Medium</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                            <span className="text-xs text-gray-600">High</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
                            <span className="text-xs text-gray-600">Very High</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                            <span className="text-xs text-gray-600">Critical</span>
                          </div>
                        </div>
                      </div>
                      <button className="text-xs text-blue-600 hover:text-blue-800 transition-colors font-medium">
                        Expand Map →
                      </button>
                    </div>
                  </div>
                </div>
              </div>
              
              <style dangerouslySetInnerHTML={{
                __html: `
                  @keyframes slideIn {
                    from {
                      opacity: 0;
                      transform: translateX(-20px);
                    }
                    to {
                      opacity: 1;
                      transform: translateX(0);
                    }
                  }
                  
                  @keyframes fadeInUp {
                    from {
                      opacity: 0;
                      transform: translateY(20px);
                    }
                    to {
                      opacity: 1;
                      transform: translateY(0);
                    }
                  }
                `
              }} />
            </div>
          )}

          {/* NGOs Tab */}
          {activeTab === 'ngos' && <NGOVerificationPanel />}

          {/* Donations Tab */}
          {activeTab === 'donations' && <DonationMonitoring />}

          {/* Pickups Tab */}
          {activeTab === 'pickups' && <PickupTracking />}

          {/* Reports Tab */}
          {activeTab === 'reports' && <ReportsManagement />}

          {/* Analytics Tab */}
          {activeTab === 'analytics' && <ImpactAnalytics />}

          {/* Announcements Tab */}
          {activeTab === 'announcements' && <AnnouncementsPanel />}

          {/* Users Tab */}
          {activeTab === 'users' && <UserManagement />}

          {/* Settings Tab */}
          {activeTab === 'settings' && <SettingsPanel />}
        </div>
      </main>
    </div>
  );
}

// NGO Verification Panel Component
function NGOVerificationPanel() {
  const [activeSection, setActiveSection] = useState<'pending' | 'verified' | 'rejected'>('pending');

  const mockNGOs = {
    pending: [
      {
        id: 1,
        name: 'Help Foundation',
        registrationNo: 'REG123456',
        address: '123 Main St, Mumbai',
        contactPerson: 'Raj Kumar',
        email: 'raj@helpfoundation.org',
        phone: '+91 98765 43210',
        documents: ['Registration Certificate', 'PAN Card', '12A Certificate'],
        submittedDate: '2024-01-15'
      }
    ],
    verified: [],
    rejected: []
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">NGO Verification</h2>
        <p className="text-gray-600">Manage NGO registrations and verifications</p>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            {[
              { id: 'pending', label: 'Pending', count: mockNGOs.pending.length },
              { id: 'verified', label: 'Verified', count: mockNGOs.verified.length },
              { id: 'rejected', label: 'Rejected', count: mockNGOs.rejected.length }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveSection(tab.id as any)}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeSection === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab.label} ({tab.count})
              </button>
            ))}
          </nav>
        </div>

        <div className="p-6">
          {activeSection === 'pending' && (
            <div className="space-y-4">
              {mockNGOs.pending.map((ngo) => (
                <div key={ngo.id} className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900">{ngo.name}</h3>
                      <div className="mt-2 space-y-1 text-sm text-gray-600">
                        <p><span className="font-medium">Registration:</span> {ngo.registrationNo}</p>
                        <p><span className="font-medium">Address:</span> {ngo.address}</p>
                        <p><span className="font-medium">Contact:</span> {ngo.contactPerson}</p>
                        <p><span className="font-medium">Email:</span> {ngo.email}</p>
                        <p><span className="font-medium">Phone:</span> {ngo.phone}</p>
                        <p><span className="font-medium">Submitted:</span> {ngo.submittedDate}</p>
                      </div>
                      <div className="mt-4">
                        <p className="text-sm font-medium text-gray-700 mb-2">Documents:</p>
                        <div className="flex flex-wrap gap-2">
                          {ngo.documents.map((doc, idx) => (
                            <span key={idx} className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                              <FileText className="w-3 h-3 mr-1" />
                              {doc}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                    <div className="ml-6 flex flex-col space-y-2">
                      <button className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
                        <CheckCircle className="w-4 h-4" />
                        <span>Approve</span>
                      </button>
                      <button className="flex items-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors">
                        <XCircle className="w-4 h-4" />
                        <span>Reject</span>
                      </button>
                      <button className="flex items-center space-x-2 px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors">
                        <Ban className="w-4 h-4" />
                        <span>Suspend</span>
                      </button>
                      <button className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                        <MessageSquare className="w-4 h-4" />
                        <span>Message</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
              {mockNGOs.pending.length === 0 && (
                <p className="text-center text-gray-500 py-8">No pending NGO requests</p>
              )}
            </div>
          )}
          {activeSection === 'verified' && (
            <p className="text-center text-gray-500 py-8">Verified NGOs will appear here</p>
          )}
          {activeSection === 'rejected' && (
            <p className="text-center text-gray-500 py-8">Rejected NGOs will appear here</p>
          )}
        </div>
      </div>
    </div>
  );
}

// Donation Monitoring Component
function DonationMonitoring() {

  const mockDonations = [
    {
      id: 'DON001',
      donorName: 'John Doe',
      type: 'Food',
      quantity: '50 kg',
      location: 'Mumbai',
      status: 'Open',
      assignedNGO: 'Feed India',
      date: '2024-01-20'
    }
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Donation Monitoring</h2>
        <p className="text-gray-600">Track and manage all donations</p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
            <select className="w-full px-3 py-2 border border-gray-300 rounded-lg">
              <option value="">All Categories</option>
              <option value="food">Food</option>
              <option value="clothes">Clothes</option>
              <option value="books">Books</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">City</label>
            <input type="text" placeholder="Filter by city" className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
            <select className="w-full px-3 py-2 border border-gray-300 rounded-lg">
              <option value="">All Status</option>
              <option value="open">Open</option>
              <option value="picked">Picked</option>
              <option value="delivered">Delivered</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Date</label>
            <input type="date" className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
          </div>
        </div>
      </div>

      {/* Donations Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Donation ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Donor</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Location</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Assigned NGO</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {mockDonations.map((donation) => (
                <tr key={donation.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{donation.id}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{donation.donorName}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{donation.type}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{donation.quantity}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{donation.location}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      donation.status === 'Open' ? 'bg-yellow-100 text-yellow-800' :
                      donation.status === 'Picked' ? 'bg-blue-100 text-blue-800' :
                      'bg-green-100 text-green-800'
                    }`}>
                      {donation.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{donation.assignedNGO || 'Unassigned'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button className="text-blue-600 hover:text-blue-900">View</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// Pickup Tracking Component
function PickupTracking() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Pickup & Logistics Tracking</h2>
        <p className="text-gray-600">Monitor pickup status and OTP verifications</p>
      </div>
      <div className="bg-white rounded-lg shadow p-6">
        <p className="text-gray-500 text-center py-8">Pickup tracking will appear here</p>
      </div>
    </div>
  );
}

// Reports Management Component
function ReportsManagement() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Reports & Complaints</h2>
        <p className="text-gray-600">Manage user reports and complaints</p>
      </div>
      <div className="bg-white rounded-lg shadow p-6">
        <p className="text-gray-500 text-center py-8">Reports will appear here</p>
      </div>
    </div>
  );
}

// Impact Analytics Component
function ImpactAnalytics() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Impact Analytics</h2>
        <p className="text-gray-600">View detailed impact metrics and charts</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Total Food Saved</h3>
          <p className="text-3xl font-bold text-gray-900">31,235 kg</p>
          <p className="text-sm text-gray-500 mt-2">= 124,940 meals (1kg = 4 meals)</p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Clothes Donated</h3>
          <p className="text-3xl font-bold text-gray-900">89,201</p>
          <p className="text-sm text-gray-500 mt-2">Items distributed</p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Books Distributed</h3>
          <p className="text-3xl font-bold text-gray-900">34,892</p>
          <p className="text-sm text-gray-500 mt-2">Books to schools</p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">City-wise Impact</h3>
          <p className="text-gray-500">City breakdown will appear here</p>
        </div>
      </div>
    </div>
  );
}

// Announcements Panel Component
function AnnouncementsPanel() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Announcements & Alerts</h2>
        <p className="text-gray-600">Post and manage platform announcements</p>
      </div>
      <div className="bg-white rounded-lg shadow p-6">
        <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
          Create New Announcement
        </button>
        <div className="mt-6">
          <p className="text-gray-500 text-center py-8">Announcements will appear here</p>
        </div>
      </div>
    </div>
  );
}

// User Management Component
function UserManagement() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">User Management</h2>
        <p className="text-gray-600">Manage donors and volunteers</p>
      </div>
      <div className="bg-white rounded-lg shadow p-6">
        <p className="text-gray-500 text-center py-8">User management will appear here</p>
      </div>
    </div>
  );
}

// Settings Panel Component
function SettingsPanel() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Settings & Configuration</h2>
        <p className="text-gray-600">Configure platform settings</p>
      </div>
      <div className="bg-white rounded-lg shadow p-6 space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Meal Conversion (1kg = ? meals)</label>
          <input type="number" defaultValue={4} className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Pickup Radius (km)</label>
          <input type="number" defaultValue={10} className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Auto-expiry Time for Food (hours)</label>
          <input type="number" defaultValue={24} className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
        </div>
        <button className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
          Save Settings
        </button>
      </div>
    </div>
  );
}
