import { useState, useEffect } from 'react';
import type { User as FirebaseUser } from 'firebase/auth';
import { signOutUser } from '../firebase';
import { getAllNgoRequests, updateNgoRequestStatus, getNgosWithActiveRequests, type NgoWithRequests } from '../services/ngoRequestService';
import { getAllNgoRegistrations, updateRegistrationStatus } from '../services/ngoRegistrationService';

declare global {
  namespace JSX {
    interface IntrinsicElements {
      [elemName: string]: any;
    }
  }
}
import {
  LayoutDashboard,
  Building2,
  ChevronDown,
  Check,
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
  RefreshCw,
  User as UserIcon,
  ArrowUp,
  ArrowDown,
  Activity,
  Eye,
  MapPin,
  Target,
  Award,
  Flame,
  AlertCircle,
  Calendar,
  CalendarCheck,
} from 'lucide-react';

interface AdminDashboardProps {
  user: FirebaseUser | null;
  onBack: () => void;
}

type TabKey = 'overview' | 'ngos' | 'donations' | 'pickups' | 'reports' | 'analytics' | 'announcements' | 'users' | 'settings';

interface RequestDetailsModalProps {
  request: any;
  onClose: () => void;
  onReject?: (requestId: string) => void;
}

const RequestDetailsModal = ({ request, onClose, onReject }: RequestDetailsModalProps) => {
  if (!request) return null;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'in_progress': return 'bg-blue-100 text-blue-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      case 'approved': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-start">
            <div>
              <div>
                <h3 className="text-2xl font-bold text-gray-900">{request.title || 'NGO Request'}</h3>
                <div className="flex items-center mt-1 space-x-2 text-sm text-gray-500">
                  <span>ID: {request._id?.substring(0, 8)}</span>
                  <span>•</span>
                  <span className="capitalize">{request.type || 'Request'}</span>
                  {request.ngoId?.name && (
                    <>
                      <span>•</span>
                      <span className="font-medium text-gray-700">{request.ngoId.name}</span>
                    </>
                  )}
                </div>
              </div>
            </div>
            <button 
              onClick={onClose}
              className="text-gray-400 hover:text-gray-500"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
          
          <div className="mt-6 space-y-6">
            {/* Status and Priority */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-sm font-medium text-gray-500">Status</p>
                <div className="mt-1 flex items-center">
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(request.status)}`}>
                    {request.status === 'in_progress' ? 'In Progress' : request.status}
                  </span>
                </div>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-sm font-medium text-gray-500">Urgency Level</p>
                <div className="mt-1">
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getPriorityColor(request.urgencyLevel || request.priority)}`}>
                    {request.urgencyLevel || request.priority || 'Not specified'}
                  </span>
                </div>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-sm font-medium text-gray-500">Request Type</p>
                <div className="mt-1">
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                    {request.type || 'General'}
                  </span>
                </div>
              </div>
            </div>

            {/* Request Details */}
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h4 className="text-lg font-semibold text-gray-900 mb-4">Request Information</h4>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {request.ngoId?.name && (
                  <div>
                    <p className="text-sm font-medium text-gray-500">NGO Name</p>
                    <p className="mt-1 text-gray-900 font-medium">{request.ngoId.name}</p>
                  </div>
                )}
                <div>
                  <p className="text-sm font-medium text-gray-500">Request Title</p>
                  <p className="mt-1 text-gray-900 font-medium">{request.title || 'No title provided'}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Created On</p>
                  <p className="mt-1 text-gray-900">{formatDate(request.createdAt)}</p>
                </div>
                {request.requiredBy && (
                  <div>
                    <p className="text-sm font-medium text-gray-500">Required By</p>
                    <p className="mt-1 text-gray-900">{formatDate(request.requiredBy)}</p>
                  </div>
                )}
                {request.location && (
                  <div className="md:col-span-2">
                    <p className="text-sm font-medium text-gray-500">Location</p>
                    <p className="mt-1 text-gray-900 flex items-center">
                      <MapPin className="w-4 h-4 mr-1 text-gray-500" />
                      {request.location}
                    </p>
                  </div>
                )}
              </div>

              {/* Description */}
              <div className="mt-6">
                <p className="text-sm font-medium text-gray-500">Description</p>
                <p className="mt-2 text-gray-700 bg-gray-50 p-4 rounded-lg">
                  {request.description || 'No description provided.'}
                </p>
              </div>

              {/* Category-Specific Details */}
              <div className="mt-6">
                <p className="text-sm font-medium text-gray-500 mb-3">Category Details</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Food Category */}
                  {request.category === 'food' && (
                    <>
                      {request.foodType && (
                        <div>
                          <p className="text-sm font-medium text-gray-500">Food Type</p>
                          <p className="text-gray-900">{request.foodType}</p>
                        </div>
                      )}
                      {request.foodCategory && (
                        <div>
                          <p className="text-sm font-medium text-gray-500">Food Category</p>
                          <p className="text-gray-900">{request.foodCategory}</p>
                        </div>
                      )}
                      {request.approxWeight && (
                        <div>
                          <p className="text-sm font-medium text-gray-500">Approx. Weight</p>
                          <p className="text-gray-900">{request.approxWeight} kg</p>
                        </div>
                      )}
                      {request.expiryTime && (
                        <div>
                          <p className="text-sm font-medium text-gray-500">Expiry Time</p>
                          <p className="text-gray-900">{formatDate(request.expiryTime)}</p>
                        </div>
                      )}
                    </>
                  )}

                  {/* Clothing Category */}
                  {request.category === 'clothing' && (
                    <>
                      {request.clothingType && (
                        <div>
                          <p className="text-sm font-medium text-gray-500">Clothing Type</p>
                          <p className="text-gray-900">{request.clothingType}</p>
                        </div>
                      )}
                      {request.condition && (
                        <div>
                          <p className="text-sm font-medium text-gray-500">Condition</p>
                          <p className="text-gray-900">{request.condition}</p>
                        </div>
                      )}
                      {request.season && (
                        <div>
                          <p className="text-sm font-medium text-gray-500">Season</p>
                          <p className="text-gray-900">{request.season}</p>
                        </div>
                      )}
                    </>
                  )}

                  {/* Medical Category */}
                  {request.category === 'medical' && (
                    <>
                      {request.medicalType && (
                        <div>
                          <p className="text-sm font-medium text-gray-500">Medical Type</p>
                          <p className="text-gray-900">{request.medicalType}</p>
                        </div>
                      )}
                      {request.expiryDate && (
                        <div>
                          <p className="text-sm font-medium text-gray-500">Expiry Date</p>
                          <p className="text-gray-900">{formatDate(request.expiryDate)}</p>
                        </div>
                      )}
                      {request.storageRequirements && (
                        <div>
                          <p className="text-sm font-medium text-gray-500">Storage Requirements</p>
                          <p className="text-gray-900">{request.storageRequirements}</p>
                        </div>
                      )}
                    </>
                  )}

                  {/* Education Category */}
                  {request.category === 'education' && (
                    <>
                      {request.bookType && (
                        <div>
                          <p className="text-sm font-medium text-gray-500">Book Type</p>
                          <p className="text-gray-900">{request.bookType}</p>
                        </div>
                      )}
                      {request.subject && (
                        <div>
                          <p className="text-sm font-medium text-gray-500">Subject</p>
                          <p className="text-gray-900">{request.subject}</p>
                        </div>
                      )}
                      {request.ageGroup && (
                        <div>
                          <p className="text-sm font-medium text-gray-500">Age Group</p>
                          <p className="text-gray-900">{request.ageGroup}</p>
                        </div>
                      )}
                    </>
                  )}

                  {/* Other Category */}
                  {request.category === 'other' && (
                    <>
                      {request.itemType && (
                        <div>
                          <p className="text-sm font-medium text-gray-500">Item Type</p>
                          <p className="text-gray-900">{request.itemType}</p>
                        </div>
                      )}
                      {request.specifications && (
                        <div className="md:col-span-2">
                          <p className="text-sm font-medium text-gray-500">Specifications</p>
                          <p className="text-gray-900">{request.specifications}</p>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>

              {/* Quantity and Unit */}
              {(request.quantity || request.unit) && (
                <div className="mt-6">
                  <p className="text-sm font-medium text-gray-500">Request Details</p>
                  <div className="mt-2 flex space-x-4">
                    {request.quantity && (
                      <div className="bg-blue-50 text-blue-800 px-3 py-2 rounded-lg">
                        <p className="text-sm font-medium">Quantity</p>
                        <p className="text-lg font-semibold">{request.quantity}</p>
                      </div>
                    )}
                    {request.unit && (
                      <div className="bg-green-50 text-green-800 px-3 py-2 rounded-lg">
                        <p className="text-sm font-medium">Unit</p>
                        <p className="text-lg font-semibold capitalize">{request.unit}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Contact Information */}
            {request.contactInfo && (
              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <h4 className="text-lg font-semibold text-gray-900 mb-4">Contact Information</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {request.contactInfo.name && (
                    <div>
                      <p className="text-sm font-medium text-gray-500">Contact Person</p>
                      <p className="mt-1 text-gray-900">{request.contactInfo.name}</p>
                    </div>
                  )}
                  {request.contactInfo.phone && (
                    <div>
                      <p className="text-sm font-medium text-gray-500">Phone Number</p>
                      <a 
                        href={`tel:${request.contactInfo.phone}`} 
                        className="mt-1 text-blue-600 hover:underline flex items-center"
                      >
                        <svg className="w-4 h-4 mr-2 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                        </svg>
                        {request.contactInfo.phone}
                      </a>
                    </div>
                  )}
                  {request.contactInfo.email && (
                    <div className="md:col-span-2">
                      <p className="text-sm font-medium text-gray-500">Email Address</p>
                      <a 
                        href={`mailto:${request.contactInfo.email}`} 
                        className="mt-1 text-blue-600 hover:underline flex items-center"
                      >
                        <svg className="w-4 h-4 mr-2 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                        {request.contactInfo.email}
                      </a>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Additional Notes */}
            {request.notes && request.notes.length > 0 && (
              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <h4 className="text-lg font-semibold text-gray-900 mb-4">Additional Notes</h4>
                <div className="space-y-4">
                  {request.notes.map((note: any, index: number) => (
                    <div key={index} className="border-l-4 border-blue-500 pl-4 py-2">
                      <p className="text-gray-700">{note.text}</p>
                      <p className="mt-1 text-xs text-gray-500">
                        Added by {note.createdBy?.name || 'System'} • {formatDate(note.createdAt)}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="mt-8 pt-6 border-t border-gray-200 flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2.5 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
            >
              Close
            </button>
            {request.status === 'pending' && (
                <button
                  type="button"
                  onClick={() => {
                    // Handle reject action
                    if (onReject) {
                      onReject(request._id);
                    }
                    onClose();
                  }}
                  className="px-6 py-2.5 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors"
                >
                  Reject
                </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default function AdminDashboard({ user, onBack }: AdminDashboardProps) {
  const [activeTab, setActiveTab] = useState<TabKey>('overview');
  const [loading, setLoading] = useState(true);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<any>(null);
  const [animatedStats, setAnimatedStats] = useState({
    totalDonations: 0,
    verifiedNGOs: 0,
    pendingNGOs: 0, // This will show the count of pending NGO requests
    activePickups: 0,
    mealsSaved: 0,
    openIssues: 0,
    completedDonations: 0
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
    const timer = setTimeout(() => setLoading(false), 1000);
    
    // Fetch initial data
    (async () => {
      try {
        // Fetch completed donations
        const donationService = await import('../services/donationService');
        const [donationsResponse, ngoRequestsResponse, ngoRegistrations] = await Promise.all([
          donationService.fetchAllDonations({ status: 'completed' }),
          getAllNgoRequests(),
          getAllNgoRegistrations()
        ]);
        
        // Count pending NGO requests
        const pendingRequestsCount = ngoRequestsResponse.data?.filter(
          (req: any) => req.status === 'pending'
        ).length || 0;
        
        // Count approved/verified NGOs
        const verifiedNgosCount = Array.isArray(ngoRegistrations) 
          ? ngoRegistrations.filter((reg: any) => reg.status === 'approved').length 
          : 0;
        
        if (donationsResponse.success) {
          const completedCount = donationsResponse.data.length;
          
          // Update the stats with the final counts
          setAnimatedStats(prev => ({
            ...prev,
            totalDonations: completedCount,
            completedDonations: completedCount,
            pendingNGOs: pendingRequestsCount,
            verifiedNGOs: verifiedNgosCount,
            activePickups: 0,
            mealsSaved: 0,
            openIssues: 0
          }));
        }
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      }
    })();
    
    return () => {
      clearTimeout(timer);
    };
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
                      <p className="text-sm font-medium text-gray-600 group-hover:text-blue-700 transition-colors">Completed Donations</p>
                      <p className="text-3xl font-bold text-gray-900 mt-2 group-hover:text-blue-800 transition-colors">
                        {animatedStats.completedDonations.toLocaleString()}
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
          {activeTab === 'ngos' && <NGOVerificationPanel onViewRequest={setSelectedRequest} />}

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
      
      {/* Request Details Modal */}
      {selectedRequest && (
        <RequestDetailsModal 
          request={selectedRequest} 
          onClose={() => setSelectedRequest(null)} 
        />
      )}
    </div>
  );
}

// NGO Requests Component
interface NGORequestsProps {
  onViewRequest: (request: any) => void;
}

function NGORequests({ onViewRequest }: NGORequestsProps) {
  const [activeTab, setActiveTab] = useState<'all' | 'pending' | 'resolved'>('all');
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [selectedRequest, setSelectedRequest] = useState<any>(null);

  // Handle request approval
  const handleApproveRequest = async (requestId: string) => {
    try {
      // Call backend API to update status
      const response = await updateNgoRequestStatus(requestId, 'approved');
      
      if (response.success) {
        // Update the request status in local state
        setRequests(prev => 
          prev.map(request => 
            request._id === requestId 
              ? { ...request, status: 'approved' }
              : request
          )
        );
        
        // Show success message
        setSuccessMessage('Request approved successfully!');
        
        // Hide success message after 3 seconds
        setTimeout(() => {
          setSuccessMessage(null);
        }, 3000);
      } else {
        setError('Failed to approve request');
      }
    } catch (error) {
      console.error('Error approving request:', error);
      setError('Failed to approve request');
    }
  };

  // Handle request rejection
  const handleRejectRequest = async (requestId: string) => {
    try {
      // Call backend API to update status
      const response = await updateNgoRequestStatus(requestId, 'rejected');
      
      if (response.success) {
        // Update the request status in local state
        setRequests(prev => 
          prev.map(request => 
            request._id === requestId 
              ? { ...request, status: 'rejected' }
              : request
          )
        );
        
        // Show success message
        setSuccessMessage('Request rejected successfully!');
        
        // Hide success message after 3 seconds
        setTimeout(() => {
          setSuccessMessage(null);
        }, 3000);
      } else {
        setError('Failed to reject request');
      }
    } catch (error) {
      console.error('Error rejecting request:', error);
      setError('Failed to reject request');
    }
  };

  // Fetch all NGO requests from backend (admin only)
  const fetchRequests = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await getAllNgoRequests();
      
      if (response.success) {
        setRequests(response.data || []);
      } else {
        setError('Failed to fetch requests');
      }
    } catch (err) {
      setError('An error occurred while fetching requests');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  // Filter requests based on active tab
  const filteredRequests = requests.filter(request => {
    if (activeTab === 'all') return true;
    if (activeTab === 'pending') return request.status === 'pending';
    if (activeTab === 'resolved') return request.status !== 'pending';
    return true;
  });

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    } catch (e) {
      console.error('Invalid date string:', dateString);
      return 'Invalid date';
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6">
        <div className="flex">
          <div className="flex-shrink-0">
            <XCircle className="h-5 w-5 text-red-500" />
          </div>
          <div className="ml-3">
            <p className="text-sm text-red-700">{error}</p>
            <button
              onClick={fetchRequests}
              className="mt-2 text-sm text-red-600 hover:text-red-800 font-medium"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (successMessage) {
    return (
      <div className="bg-green-50 border-l-4 border-green-500 p-4 mb-6">
        <div className="flex">
          <div className="flex-shrink-0">
            <CheckCircle className="h-5 w-5 text-green-500" />
          </div>
          <div className="ml-3">
            <p className="text-sm text-green-700">{successMessage}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-8">
      <div className="mb-6">
        <h3 className="text-xl font-semibold text-gray-900 mb-2">NGO Requests</h3>
        <p className="text-gray-600">Manage resource and volunteer requests from NGOs</p>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            {[
              { id: 'all', label: 'All Requests', count: requests.length },
              { 
                id: 'pending', 
                label: 'Pending', 
                count: requests.filter(r => r.status === 'pending').length 
              },
              { 
                id: 'resolved', 
                label: 'Resolved', 
                count: requests.filter(r => r.status !== 'pending').length 
              }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
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
          {filteredRequests.length > 0 ? (
            <div className="space-y-4">
              {filteredRequests.map((request: any) => {
                const getPriorityColor = () => {
                  switch (request.priority) {
                    case 'high': return { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200' };
                    case 'medium': return { bg: 'bg-yellow-50', text: 'text-yellow-700', border: 'border-yellow-200' };
                    default: return { bg: 'bg-green-50', text: 'text-green-700', border: 'border-green-200' };
                  }
                };

                const getStatusColor = () => {
                  if (!request.status) {
                    return { bg: 'bg-gray-50', text: 'text-gray-700', border: 'border-gray-200', icon: <AlertCircle className="w-4 h-4" /> };
                  }
                  
                  switch (request.status) {
                    case 'pending': 
                      return { 
                        bg: 'bg-yellow-50', 
                        text: 'text-yellow-700', 
                        border: 'border-yellow-200', 
                        icon: <Clock className="w-4 h-4" /> 
                      };
                    case 'completed': 
                      return { 
                        bg: 'bg-green-50', 
                        text: 'text-green-700', 
                        border: 'border-green-200', 
                        icon: <CheckCircle className="w-4 h-4" /> 
                      };
                    case 'rejected': 
                      return { 
                        bg: 'bg-red-50', 
                        text: 'text-red-700', 
                        border: 'border-red-200', 
                        icon: <XCircle className="w-4 h-4" /> 
                      };
                    case 'in_progress': 
                      return { 
                        bg: 'bg-blue-50', 
                        text: 'text-blue-700', 
                        border: 'border-blue-200', 
                        icon: <Activity className="w-4 h-4" /> 
                      };
                    default: 
                      return { 
                        bg: 'bg-gray-50', 
                        text: 'text-gray-700', 
                        border: 'border-gray-200', 
                        icon: <AlertCircle className="w-4 h-4" /> 
                      };
                  }
                };

                const priority = getPriorityColor();
                const status = getStatusColor();
                const urgencyIcons: Record<string, React.ReactElement> = {
                  high: <Flame className="w-4 h-4 text-red-500" />,
                  medium: <Activity className="w-4 h-4 text-yellow-500" />,
                  low: <Clock className="w-4 h-4 text-green-500" />
                };

                return (
                  <div 
                    key={request._id} 
                    className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-all duration-300 transform hover:-translate-y-0.5"
                  >
                    <div className="p-6">
                      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center flex-wrap gap-2 mb-3">
                            <h3 className="text-xl font-semibold text-gray-900 truncate">
                              {request.title}
                            </h3>
                            <div className="flex items-center gap-2">
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${status.bg} ${status.text} ${status.border} border`}>
                                {status.icon}
                                <span className="ml-1">{request.status.replace('_', ' ')}</span>
                              </span>
                            </div>
                          </div>
                          
                          <div className="mt-1.5 flex flex-wrap items-center gap-2 text-sm text-gray-500">
                            <span className="flex items-center">
                              <Building2 className="w-4 h-4 mr-1.5 text-gray-400" />
                              {request.ngoName || request.ngoId?.name || 'N/A'}
                            </span>
                            <span>•</span>
                            <span className="capitalize">{request.type}</span>
                            <span>•</span>
                            <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${getPriorityColor().bg} ${getPriorityColor().text} border ${getPriorityColor().border}`}>
                              {request.urgencyLevel || request.priority || 'Normal'}
                            </span>
                            <div className="flex items-center">
                              <Package className="w-4 h-4 mr-1.5 text-gray-400" />
                              <span>{request.type}</span>
                            </div>
                            {request.quantity && (
                              <>
                                <div className="w-px h-4 bg-gray-200"></div>
                                <div className="flex items-center">
                                  <span className="font-medium">{request.quantity}</span>
                                  <span className="ml-1 text-gray-500">{request.unit || 'units'}</span>
                                </div>
                              </>
                            )}
                          </div>

                          <p className="text-gray-600 mb-4 line-clamp-2">{request.description}</p>
                          
                          <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500 mt-4 pt-4 border-t border-gray-100">
                            <div className="flex items-center">
                              <Calendar className="w-4 h-4 mr-1.5 text-gray-400" />
                              <span>Requested: {formatDate(request.createdAt)}</span>
                            </div>
                            {request.requiredBy && (
                              <div className="flex items-center">
                                <CalendarCheck className="w-4 h-4 mr-1.5 text-gray-400" />
                                <span>Required by: {formatDate(request.requiredBy)}</span>
                              </div>
                            )}
                            {request.location && (
                              <div className="flex items-center">
                                <MapPin className="w-4 h-4 mr-1.5 text-gray-400" />
                                <span>{request.location}</span>
                              </div>
                            )}
                          </div>

                          {request.contactInfo && (
                            <div className="mt-4 pt-4 border-t border-gray-100">
                              <h5 className="text-sm font-medium text-gray-700 mb-2 flex items-center">
                                <UserIcon className="w-4 h-4 mr-1.5 text-gray-400" />
                                Contact Information
                              </h5>
                              <div className="space-y-1 text-sm text-gray-600">
                                {request.contactInfo.name && (
                                  <p className="flex items-center">
                                    <span className="inline-block w-2 h-2 rounded-full bg-blue-500 mr-2"></span>
                                    {request.contactInfo.name}
                                  </p>
                                )}
                                {request.contactInfo.phone && (
                                  <p className="flex items-center">
                                    <span className="inline-block w-2 h-2 rounded-full bg-blue-500 mr-2"></span>
                                    <a href={`tel:${request.contactInfo.phone}`} className="hover:text-blue-600 hover:underline">
                                      {request.contactInfo.phone}
                                    </a>
                                  </p>
                                )}
                                {request.contactInfo.email && (
                                  <p className="flex items-center">
                                    <span className="inline-block w-2 h-2 rounded-full bg-blue-500 mr-2"></span>
                                    <a href={`mailto:${request.contactInfo.email}`} className="hover:text-blue-600 hover:underline">
                                      {request.contactInfo.email}
                                    </a>
                                  </p>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                        
                        <div className="flex flex-col sm:flex-row sm:items-center gap-3 w-full sm:w-auto mt-4 sm:mt-0">
                          <button 
                            className="px-4 py-2 bg-white border border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50 transition-colors flex items-center justify-center gap-2 font-medium"
                            onClick={() => setSelectedRequest(request)}
                          >
                            <Eye className="w-4 h-4" />
                            <span>View</span>
                          </button>
                          {request.status === 'pending' && (
                            <button 
                              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center gap-2 font-medium"
                              onClick={() => handleApproveRequest(request._id)}
                            >
                              <CheckCircle className="w-4 h-4" />
                              <span>Approve</span>
                            </button>
                          )}
                        </div>
                      </div>
                      
                      {request.notes && request.notes.length > 0 && (
                        <div className="mt-6 pt-6 border-t border-gray-100">
                          <h5 className="text-sm font-medium text-gray-700 mb-3 flex items-center">
                            <MessageSquare className="w-4 h-4 mr-1.5 text-gray-400" />
                            Notes
                          </h5>
                          <div className="space-y-3">
                            {request.notes.map((note: any, index: number) => (
                              <div key={index} className="bg-gray-50 p-4 rounded-lg border border-gray-100">
                                <p className="text-sm text-gray-700">{note.text}</p>
                                <p className="text-xs text-gray-500 mt-1 flex items-center">
                                  <span className="w-3 h-3 mr-1">👤</span>
                                  {note.createdBy?.name || 'System'} • {formatDate(note.createdAt)}
                                </p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                <FileText className="w-8 h-8 text-gray-400" />
              </div>
              <h4 className="text-lg font-medium text-gray-900">No requests found</h4>
              <p className="mt-1 text-gray-500">
                {activeTab === 'all' 
                  ? "There are no NGO requests yet." 
                  : `No ${activeTab} requests found.`}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Request Details Modal */}
      {selectedRequest && (
        <RequestDetailsModal 
          request={selectedRequest} 
          onClose={() => setSelectedRequest(null)}
          onReject={handleRejectRequest}
        />
      )}
    </div>
  );
}

interface NGOVerificationPanelProps {
  onViewRequest: (request: any) => void;
}

// NGO Verification Panel Component
function NGOVerificationPanel({ onViewRequest }: NGOVerificationPanelProps) {
  const [activeSection, setActiveSection] = useState<'pending' | 'approved' | 'rejected'>('pending');
  const [registrations, setRegistrations] = useState<{
    pending: any[];
    approved: any[];
    rejected: any[];
    loading: boolean;
    error: string | null;
  }>({
    pending: [],
    approved: [],
    rejected: [],
    loading: true,
    error: null
  });

  // Fetch NGO registrations
  useEffect(() => {
    const fetchRegistrations = async () => {
      try {
        setRegistrations(prev => ({ ...prev, loading: true, error: null }));
        
        // Fetch all statuses in parallel
        const [pending, approved, rejected] = await Promise.all([
          getAllNgoRegistrations('pending'),
          getAllNgoRegistrations('approved'),
          getAllNgoRegistrations('rejected')
        ]);
        
        setRegistrations({
          pending,
          approved,
          rejected,
          loading: false,
          error: null
        });
      } catch (error) {
        console.error('Error fetching NGO registrations:', error);
        setRegistrations(prev => ({
          ...prev,
          loading: false,
          error: 'Failed to load NGO registrations. Please try again.'
        }));
      }
    };

    fetchRegistrations();
  }, []);

  // Handle status update
  const handleStatusUpdate = async (id: string, status: 'approved' | 'rejected') => {
    try {
      await updateRegistrationStatus(id, status);
      
      // Update local state to reflect the change
      setRegistrations(prev => {
        const updated = { ...prev };
        const registration = updated[activeSection].find((r: any) => r._id === id);
        
        if (registration) {
          // Remove from current section
          updated[activeSection] = updated[activeSection].filter((r: any) => r._id !== id);
          
          // Add to new section
          registration.status = status;
          updated[status] = [registration, ...updated[status]];
        }
        
        return updated;
      });
      
      // Show success message
      alert(`NGO registration ${status} successfully`);
    } catch (error) {
      console.error('Error updating status:', error);
      alert(`Failed to update status: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
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
              { id: 'pending', label: 'Pending', count: registrations.pending.length },
              { id: 'approved', label: 'Approved', count: registrations.approved.length },
              { id: 'rejected', label: 'Rejected', count: registrations.rejected.length }
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
          {registrations.loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
              <p className="mt-4 text-gray-600">Loading NGO registrations...</p>
            </div>
          ) : registrations.error ? (
            <div className="text-center py-12 text-red-600">
              <p>{registrations.error}</p>
              <button 
                onClick={() => window.location.reload()}
                className="mt-4 px-4 py-2 bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200"
              >
                Retry
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {registrations[activeSection].length > 0 ? (
                registrations[activeSection].map((ngo) => (
                  <div key={ngo._id} className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
                    <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
                      <div className="flex-1">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                          <h3 className="text-lg font-semibold text-gray-900">{ngo.ngoName}</h3>
                          <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                            ngo.status === 'approved' ? 'bg-green-100 text-green-800' :
                            ngo.status === 'rejected' ? 'bg-red-100 text-red-800' :
                            'bg-yellow-100 text-yellow-800'
                          }`}>
                            {ngo.status?.charAt(0).toUpperCase() + ngo.status?.slice(1) || 'Pending'}
                          </span>
                        </div>
                        
                        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
                          <div>
                            <p><span className="font-medium">Organization Type:</span> {ngo.organizationType}</p>
                            <p><span className="font-medium">Contact Person:</span> {ngo.contactPerson}</p>
                            <p><span className="font-medium">Email:</span> {ngo.email || 'N/A'}</p>
                            <p><span className="font-medium">Phone:</span> {ngo.phone}</p>
                          </div>
                          <div>
                            <p><span className="font-medium">Address:</span> {[ngo.address, ngo.city, ngo.state, ngo.pincode].filter(Boolean).join(', ')}</p>
                            <p><span className="font-medium">Registration #:</span> {ngo.registrationNumber}</p>
                            <p><span className="font-medium">Pickup/Delivery:</span> {ngo.pickupDeliveryPreference || 'N/A'}</p>
                            <p><span className="font-medium">Submitted:</span> {new Date(ngo.createdAt).toLocaleDateString()}</p>
                          </div>
                        </div>

                        {/* Documents */}
                        <div className="mt-4">
                          <p className="text-sm font-medium text-gray-700 mb-2">Documents:</p>
                          <div className="flex flex-wrap gap-2">
                            {[
                              { label: 'NGO Certificate', url: ngo.ngoCertificate },
                              { label: 'Address Proof', url: ngo.addressProof },
                              { label: 'Aadhaar Card', url: ngo.aadhaarCard },
                              ...(ngo.alternateIdFile ? [{ label: ngo.alternateIdType || 'Alternate ID', url: ngo.alternateIdFile }] : [])
                            ].map((doc, idx) => (
                              doc.url && (
                                <a 
                                  key={idx} 
                                  href={doc.url} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 hover:bg-blue-200 transition-colors"
                                >
                                  <FileText className="w-3 h-3 mr-1" />
                                  {doc.label}
                                </a>
                              )
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      {activeSection === 'pending' && (
                        <div className="flex flex-col sm:flex-row md:flex-col gap-2 w-full md:w-48 flex-shrink-0">
                          <button 
                            onClick={() => handleStatusUpdate(ngo._id, 'approved')}
                            className="flex items-center justify-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                          >
                            <CheckCircle className="w-4 h-4" />
                            <span>Approve</span>
                          </button>
                          <button 
                            onClick={() => {
                              const reason = prompt('Please enter the reason for rejection:');
                              if (reason) {
                                updateRegistrationStatus(ngo._id, 'rejected', reason);
                              }
                            }}
                            className="flex items-center justify-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                          >
                            <XCircle className="w-4 h-4" />
                            <span>Reject</span>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-12">
                  <FileText className="w-12 h-12 mx-auto text-gray-400" />
                  <p className="mt-2 text-gray-500">
                    No {activeSection} NGO registrations found
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      
      {/* NGO Requests Section */}
      <NGORequests onViewRequest={onViewRequest} />
    </div>
  );
}

// Donation Monitoring Component
function DonationMonitoring() {
  const [donations, setDonations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    status: '',
    resourceType: '',
    city: '',
    startDate: '',
    endDate: ''
  });
  const [lastDonationCount, setLastDonationCount] = useState(0);
  const [showNotification, setShowNotification] = useState(false);
  const [newDonation, setNewDonation] = useState<any>(null);
  const [selectedDonation, setSelectedDonation] = useState<any>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [ngos, setNgos] = useState<NgoWithRequests[]>([]);
  const [loadingNGOs, setLoadingNGOs] = useState(true);
  const [expandedNgos, setExpandedNgos] = useState<Set<string>>(new Set());
  const [assigningNGO, setAssigningNGO] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<{ngoId: string, requestId: string} | null>(null);
  const [formData, setFormData] = useState<{
    selectedNGO: string;
    status: string;
  }>({
    selectedNGO: '',
    status: ''
  });

  const fetchDonations = async () => {
    try {
      const donationService = await import('../services/donationService');
      type DonationStatus = 'pending' | 'assigned' | 'picked' | 'completed' | 'cancelled';
      const response = await donationService.fetchAllDonations({
        status: filters.status ? (filters.status as DonationStatus) : undefined,
        resourceType: filters.resourceType || undefined,
        city: filters.city || undefined,
        startDate: filters.startDate || undefined,
        endDate: filters.endDate || undefined
      });

      if (response.success) {
        // Check for new donations
        if (lastDonationCount > 0 && response.data.length > lastDonationCount) {
          const newDonations = response.data.slice(0, response.data.length - lastDonationCount);
          if (newDonations.length > 0) {
            setNewDonation(newDonations[0]);
            setShowNotification(true);
            // Auto-hide notification after 5 seconds
            setTimeout(() => {
              setShowNotification(false);
            }, 5000);
          }
        }
        
        setDonations(response.data);
        setLastDonationCount(response.data.length);
      }
    } catch (error) {
      console.error('Error fetching donations:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchNGOs = async () => {
    try {
      setLoadingNGOs(true);
      console.log('Fetching NGOs with pending requests...');
      
      // First, fetch all NGOs with their requests
      let response;
      try {
        response = await getNgosWithActiveRequests();
        console.log('Successfully fetched NGOs with requests:', response);
      } catch (error) {
        console.error('Error in getNgosWithActiveRequests:', error);
        // Show error to user
        alert('Failed to load NGO requests. Please check console for details.');
        setNgos([]);
        return;
      }
      
      // Ensure we have an array
      const allNgos = Array.isArray(response) ? response : [];
      console.log(`Found ${allNgos.length} NGOs with requests`);
      
      if (allNgos.length === 0) {
        console.log('No NGOs with requests found');
        setNgos([]);
        return;
      }
      
      // Log all NGOs and their requests for debugging
      allNgos.forEach((ngo, index) => {
        console.log(`NGO #${index + 1}:`, {
          id: ngo._id,
          name: ngo.ngoName,
          totalRequests: ngo.requests?.length || 0,
          requests: ngo.requests?.map(r => ({
            id: r._id,
            title: r.requestTitle,
            status: r.status,
            category: r.category,
            quantity: r.quantity,
            urgency: r.urgencyLevel
          })) || []
        });
      });
      
      // Backend already filters by pending status and excludes assigned requests
      // But add an extra safety check to ensure we only show pending requests
      const ngosWithPendingRequests = allNgos
        .map(ngo => {
          // Only include pending requests (backend should have filtered already, but double-check)
          const validRequests = ngo.requests?.filter(request => 
            request.status?.toLowerCase() === 'pending'
          ) || [];
          
          console.log(`NGO ${ngo.ngoName} has ${validRequests.length} pending requests`);
          
          return {
            ...ngo,
            requests: validRequests
          };
        })
        .filter(ngo => ngo.requests.length > 0);
      
      console.log(`Found ${ngosWithPendingRequests.length} NGOs with pending requests`);
      
      // Set the filtered NGOs with pending requests
      setNgos(ngosWithPendingRequests);
      
      // Expand all NGOs by default
      const ngoIds = ngosWithPendingRequests.map(ngo => ngo._id).filter(Boolean);
      console.log('Expanding NGOs with pending requests:', ngoIds);
      setExpandedNgos(new Set(ngoIds));
    } catch (error) {
      console.error('Error fetching NGOs with active requests:', error);
    } finally {
      setLoadingNGOs(false);
    }
  };

  useEffect(() => {
    fetchDonations();
    fetchNGOs();
    // Poll for new donations every 10 seconds
    const interval = setInterval(fetchDonations, 10000);
    return () => clearInterval(interval);
  }, [filters]);

  useEffect(() => {
    // Reset form when modal opens
    if (showDetailsModal && selectedDonation) {
      setFormData({
        selectedNGO: selectedDonation.assignedNGO?.ngoFirebaseUid || '',
        status: selectedDonation.status || ''
      });
    }
  }, [showDetailsModal, selectedDonation]);

  const formatDate = (dateString: string) => {
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
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'assigned':
        return 'bg-blue-100 text-blue-800';
      case 'picked':
        return 'bg-purple-100 text-purple-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getUrgencyColor = (urgency: string) => {
    switch (urgency?.toLowerCase()) {
      case 'high':
        return 'bg-red-100 text-red-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'low':
      default:
        return 'bg-green-100 text-green-800';
    }
  };

  const handleNgoSelect = (ngoFirebaseUid: string, requestId: string, ngoId: string) => {
    setFormData({
      ...formData,
      selectedNGO: ngoFirebaseUid, // Use firebaseUid for assignment
      status: 'assigned'
    });
    setSelectedRequest({
      ngoId, // Keep ngoId for UI selection tracking
      requestId
    });
  };

  const renderNgoRequestItem = (ngo: any, request: any) => {
    const isSelected = selectedRequest?.ngoId === ngo._id && selectedRequest?.requestId === request._id;
    const ngoFirebaseUid = ngo.firebaseUid || ngo._id; // Fallback to _id if firebaseUid not available
    
    return (
      <div 
        key={request._id}
        className={`p-4 rounded-lg border transition-colors cursor-pointer ${
          isSelected 
            ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200' 
            : 'border-gray-200 hover:border-blue-300 hover:bg-blue-50/50'
        }`}
        onClick={() => handleNgoSelect(ngoFirebaseUid, request._id, ngo._id)}
      >
        <div className="flex justify-between items-start">
          <div className="space-y-2 flex-1">
            <div className="flex items-center justify-between">
              <h4 className="font-medium text-gray-900">{request.requestTitle}</h4>
              <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                request.status === 'pending' 
                  ? 'bg-yellow-100 text-yellow-800' 
                  : 'bg-green-100 text-green-800'
              }`}>
                {request.status}
              </span>
            </div>
            
            <p className="text-sm text-gray-600">{request.description}</p>
            
            <div className="flex flex-wrap gap-2 pt-1">
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                {request.category}
              </span>
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getUrgencyColor(request.urgencyLevel)}`}>
                {request.urgencyLevel} priority
              </span>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                Qty: {request.quantity}
              </span>
            </div>
            
            <div className="pt-1 space-y-1 text-xs text-gray-500">
              {request.neededBy && (
                <div className="flex items-center">
                  <Calendar className="w-3.5 h-3.5 mr-1.5 flex-shrink-0" />
                  <span>Needed by: {new Date(request.neededBy).toLocaleDateString()}</span>
                </div>
              )}
              
              <div className="flex items-center">
                <UserIcon className="w-3.5 h-3.5 mr-1.5 flex-shrink-0" />
                <span className="truncate">{ngo.ngoName}</span>
              </div>
              
              {ngo.location?.city && (
                <div className="flex items-center">
                  <MapPin className="w-3.5 h-3.5 mr-1.5 flex-shrink-0" />
                  <span className="truncate">
                    {[ngo.location.city, ngo.location.state, ngo.location.pincode].filter(Boolean).join(', ')}
                  </span>
                </div>
              )}
            </div>
          </div>
          
          {isSelected && (
            <div className="ml-3 flex-shrink-0">
              <div className="h-5 w-5 rounded-full bg-blue-500 flex items-center justify-center">
                <Check className="h-3.5 w-3.5 text-white" />
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };
  
  const renderNgoAccordion = (ngo: any) => {
    const isExpanded = expandedNgos.has(ngo._id);
    const hasRequests = ngo.requests?.length > 0;
    
    return (
      <div key={ngo._id} className="border rounded-lg overflow-hidden mb-3">
        <button
          type="button"
          onClick={() => {
            const newSet = new Set(expandedNgos);
            if (isExpanded) {
              newSet.delete(ngo._id);
            } else {
              newSet.add(ngo._id);
            }
            setExpandedNgos(newSet);
          }}
          className="w-full text-left p-3 bg-white hover:bg-gray-50 focus:outline-none flex justify-between items-center"
        >
          <div>
            <p className="font-medium text-gray-900">{ngo.ngoName}</p>
            <p className="text-sm text-gray-500">
              {hasRequests 
                ? `${ngo.requests.length} active request${ngo.requests.length !== 1 ? 's' : ''}`
                : 'No active requests'}
            </p>
          </div>
          <ChevronDown 
            className={`w-5 h-5 text-gray-400 transition-transform ${
              isExpanded ? 'transform rotate-180' : ''
            }`} 
          />
        </button>
        
        {isExpanded && hasRequests && (
          <div className="bg-gray-50 p-3 border-t">
            <div className="space-y-3">
              {ngo.requests.map((request: any) => renderNgoRequestItem(ngo, request))}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* New Donation Notification Popup */}
      {showNotification && newDonation && (
        <div className="fixed top-4 right-4 z-50 animate-slide-in-right">
          <div className="bg-green-500 text-white rounded-lg shadow-2xl p-6 max-w-md border-l-4 border-green-600">
            <div className="flex items-start justify-between">
              <div className="flex items-start space-x-3">
                <Package className="w-6 h-6 mt-1 flex-shrink-0" />
                <div>
                  <h3 className="font-bold text-lg mb-1">New Donation Received! 🎉</h3>
                  <p className="text-sm opacity-90">
                    <span className="font-semibold">{newDonation.donorName}</span> donated{' '}
                    <span className="font-semibold">{newDonation.quantity} {newDonation.unit}</span> of{' '}
                    <span className="font-semibold">{newDonation.resourceType}</span>
                  </p>
                  <p className="text-xs opacity-75 mt-1">
                    Location: {newDonation.address?.city || 'N/A'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowNotification(false)}
                className="text-white hover:text-gray-200 transition-colors ml-4"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      )}

      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Donation Monitoring</h2>
        <p className="text-gray-600">Track and manage all donations in real-time</p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
            <select
              value={filters.resourceType}
              onChange={(e) => setFilters({ ...filters, resourceType: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            >
              <option value="">All Categories</option>
              <option value="Food">Food</option>
              <option value="Clothes">Clothes</option>
              <option value="Books">Books</option>
              <option value="Medical Supplies">Medical Supplies</option>
              <option value="Other Essentials">Other Essentials</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">City</label>
            <input
              type="text"
              placeholder="Filter by city"
              value={filters.city}
              onChange={(e) => setFilters({ ...filters, city: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
            <select
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            >
              <option value="">All Status</option>
              <option value="pending">Pending</option>
              <option value="assigned">Assigned</option>
              <option value="picked">Picked</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Date</label>
            <input
              type="date"
              value={filters.startDate}
              onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            />
          </div>
        </div>
        <div className="mt-4 flex justify-end">
          <button
            onClick={() => setFilters({ status: '', resourceType: '', city: '', startDate: '', endDate: '' })}
            className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800"
          >
            Clear Filters
          </button>
        </div>
      </div>

      {/* Donations Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {loading ? (
          <div className="p-8 text-center">
            <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading donations...</p>
          </div>
        ) : donations.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <Package className="w-12 h-12 mx-auto mb-4 text-gray-400" />
            <p>No donations found</p>
          </div>
        ) : (
          <>
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">
                Total Donations: {donations.length}
              </h3>
              <button
                onClick={fetchDonations}
                className="flex items-center space-x-2 text-sm text-blue-600 hover:text-blue-800 transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Refresh</span>
              </button>
            </div>
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
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Completion Time</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {donations.map((donation) => (
                    <tr key={donation._id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {donation._id.substring(0, 8).toUpperCase()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{donation.donorName || 'Unknown'}</div>
                        <div className="text-sm text-gray-500">{donation.donorEmail || ''}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{donation.resourceType}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {donation.quantity} {donation.unit}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {donation.address?.city || 'N/A'}, {donation.address?.state || 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(donation.status)}`}>
                          {donation.status.charAt(0).toUpperCase() + donation.status.slice(1)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(donation.createdAt)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {donation.status === 'completed' && donation.updatedAt 
                          ? formatDate(donation.updatedAt) 
                          : donation.status === 'completed' 
                            ? formatDate(donation.createdAt) 
                            : '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button 
                          onClick={() => {
                            setSelectedDonation(donation);
                            setShowDetailsModal(true);
                          }}
                          className="text-blue-600 hover:text-blue-900 flex items-center space-x-1"
                        >
                          <Eye className="w-4 h-4" />
                          <span>View</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      {/* Donation Details Modal */}
      {showDetailsModal && selectedDonation && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0 w-full">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true">
              <div className="absolute inset-0 bg-gray-500 opacity-75" onClick={() => setShowDetailsModal(false)}></div>
            </div>
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-5xl sm:w-full sm:p-6">
              <div className="bg-white w-full">
                <div className="sm:flex sm:items-start">
                  <div className="w-full">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-2xl leading-6 font-bold text-gray-900">Donation Details</h3>
                      <button
                        onClick={() => setShowDetailsModal(false)}
                        className="text-gray-400 hover:text-gray-600 transition-colors"
                      >
                        <X className="w-6 h-6" />
                      </button>
                    </div>
                    
                    {/* Basic Information */}
                    <div className="bg-gray-50 rounded-lg p-4 mb-4">
                      <h4 className="text-lg font-semibold text-gray-900 mb-3">Basic Information</h4>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm font-medium text-gray-500">Donation ID</p>
                          <p className="text-sm text-gray-900">{selectedDonation._id?.substring(0, 8).toUpperCase() || 'N/A'}</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-500">Status</p>
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(selectedDonation.status)}`}>
                            {selectedDonation.status?.charAt(0).toUpperCase() + selectedDonation.status?.slice(1) || 'N/A'}
                          </span>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-500">Resource Type</p>
                          <p className="text-sm text-gray-900">{selectedDonation.resourceType || 'N/A'}</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-500">Quantity</p>
                          <p className="text-sm text-gray-900">{selectedDonation.quantity} {selectedDonation.unit || ''}</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-500">Created Date</p>
                          <p className="text-sm text-gray-900">{formatDate(selectedDonation.createdAt)}</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-500">Urgency</p>
                          <p className="text-sm text-gray-900">{selectedDonation.urgency || 'Normal'}</p>
                        </div>
                      </div>
                    </div>

                    {/* Donor Information */}
                    <div className="bg-blue-50 rounded-lg p-4 mb-4">
                      <h4 className="text-lg font-semibold text-gray-900 mb-3">Donor Information</h4>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm font-medium text-gray-500">Name</p>
                          <p className="text-sm text-gray-900">{selectedDonation.donorName || 'N/A'}</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-500">Email</p>
                          <p className="text-sm text-gray-900">{selectedDonation.donorEmail || 'N/A'}</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-500">Phone</p>
                          <p className="text-sm text-gray-900">{selectedDonation.donorPhone || 'N/A'}</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-500">User ID</p>
                          <p className="text-sm text-gray-900">{selectedDonation.donorFirebaseUid?.substring(0, 8).toUpperCase() || 'N/A'}</p>
                        </div>
                      </div>
                    </div>

                    {/* Pickup Address */}
                    <div className="bg-green-50 rounded-lg p-4 mb-4">
                      <h4 className="text-lg font-semibold text-gray-900 mb-3">Pickup Address</h4>
                      <div className="grid grid-cols-1 gap-4">
                        <div>
                          <p className="text-sm font-medium text-gray-500">Address Line</p>
                          <p className="text-sm text-gray-900">{selectedDonation.address?.addressLine || 'N/A'}</p>
                        </div>
                        <div className="grid grid-cols-3 gap-4">
                          <div>
                            <p className="text-sm font-medium text-gray-500">City</p>
                            <p className="text-sm text-gray-900">{selectedDonation.address?.city || 'N/A'}</p>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-500">State</p>
                            <p className="text-sm text-gray-900">{selectedDonation.address?.state || 'N/A'}</p>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-500">Pincode</p>
                            <p className="text-sm text-gray-900">{selectedDonation.address?.pincode || 'N/A'}</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Additional Details */}
                    {(selectedDonation.notes || selectedDonation.pickup?.preferredTime || selectedDonation.pickup?.instructions) && (
                      <div className="bg-yellow-50 rounded-lg p-4 mb-4">
                        <h4 className="text-lg font-semibold text-gray-900 mb-3">Additional Details</h4>
                        {selectedDonation.notes && (
                          <div className="mb-3">
                            <p className="text-sm font-medium text-gray-500">Notes</p>
                            <p className="text-sm text-gray-900">{selectedDonation.notes}</p>
                          </div>
                        )}
                        {selectedDonation.pickup?.preferredTime && (
                          <div className="mb-3">
                            <p className="text-sm font-medium text-gray-500">Preferred Pickup Time</p>
                            <p className="text-sm text-gray-900">{selectedDonation.pickup.preferredTime}</p>
                          </div>
                        )}
                        {selectedDonation.pickup?.instructions && (
                          <div>
                            <p className="text-sm font-medium text-gray-500">Pickup Instructions</p>
                            <p className="text-sm text-gray-900">{selectedDonation.pickup.instructions}</p>
                          </div>
                        )}
                      </div>
                    )}

                    {/* NGO Assignment Display */}
                    {selectedDonation.assignedNGO?.ngoName && (
                      <div className="bg-purple-50 rounded-lg p-4 mb-4">
                        <h4 className="text-lg font-semibold text-gray-900 mb-3">NGO Assignment</h4>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <p className="text-sm font-medium text-gray-500">Assigned NGO</p>
                            <p className="text-sm text-gray-900">{selectedDonation.assignedNGO.ngoName}</p>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-500">Assigned At</p>
                            <p className="text-sm text-gray-900">{selectedDonation.assignedNGO.assignedAt ? formatDate(selectedDonation.assignedNGO.assignedAt) : 'N/A'}</p>
                          </div>
                          {selectedDonation.assignedNGO?.assignedRequestId && (
                            <div className="md:col-span-2">
                              <p className="text-sm font-medium text-gray-500">Assigned Request ID</p>
                              <p className="text-sm text-gray-900 font-mono">{selectedDonation.assignedNGO.assignedRequestId.substring(0, 8).toUpperCase()}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* NGO Assignment & Status Update Form */}
                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-6 mb-4 border-2 border-blue-200">
                      <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                        <Package className="w-5 h-5 mr-2 text-blue-600" />
                        Assign NGO & Update Status
                      </h4>
                      
                      <form onSubmit={async (e) => {
                        e.preventDefault();
                        if (!formData.selectedNGO && !formData.status) {
                          alert('Please select an NGO request or update status');
                          return;
                        }

                        setAssigningNGO(true);
                        try {
                          const donationService = await import('../services/donationService');
                          type DonationStatus = 'pending' | 'assigned' | 'picked' | 'completed' | 'cancelled';
                          const requestIdToAssign = selectedRequest?.requestId || undefined;
                          
                          console.log('Assigning donation:', {
                            donationId: selectedDonation._id,
                            ngoFirebaseUid: formData.selectedNGO,
                            requestId: requestIdToAssign
                          });
                          
                          await donationService.updateDonation(selectedDonation._id, {
                            ngoFirebaseUid: formData.selectedNGO || undefined,
                            status: formData.status ? (formData.status as DonationStatus) : undefined,
                            requestId: requestIdToAssign
                          });
                          
                          // Wait a bit for backend to process
                          await new Promise(resolve => setTimeout(resolve, 500));
                          
                          // Refresh donations and NGOs (force refresh)
                          await fetchDonations();
                          // Clear the NGOs list first, then fetch fresh data
                          setNgos([]);
                          await fetchNGOs();
                          
                          setShowDetailsModal(false);
                          setFormData({ selectedNGO: '', status: '' });
                          setSelectedRequest(null);
                          alert('Donation updated successfully! The assigned request has been removed from the list.');
                        } catch (error: any) {
                          console.error('Error updating donation:', error);
                          alert(error.response?.data?.error || 'Failed to update donation');
                        } finally {
                          setAssigningNGO(false);
                        }
                      }}>
                        <div className="space-y-4">
                          {/* NGO Requests List */}
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Select NGO Request
                            </label>
                            
                            {loadingNGOs ? (
                              <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                              <p className="text-sm text-blue-800">Loading NGO requests...</p>
                            </div>
                            ) : ngos.length === 0 ? (
                              <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                                <p className="text-sm text-yellow-800">No active NGO requests found.</p>
                                <p className="text-xs text-yellow-700 mt-1">Please check back later or verify that NGOs have created requests.</p>
                              </div>
                            ) : (
                              <div className="space-y-4">
                                {ngos.length > 0 ? (
                                  ngos.map(renderNgoAccordion)
                                ) : (
                                  <div className="text-center py-6">
                                    <Package className="mx-auto h-12 w-12 text-gray-400" />
                                    <h3 className="mt-2 text-sm font-medium text-gray-900">No active requests</h3>
                                    <p className="mt-1 text-sm text-gray-500">There are currently no active NGO requests matching your filters.</p>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>

                          {/* Status Selection */}
                          <div className="space-y-2">
                            <label className="block text-sm font-medium text-gray-700">
                              Donation Status
                            </label>
                            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                              {[
                                { value: 'pending', label: 'Pending', color: 'yellow' },
                                { value: 'assigned', label: 'Assigned', color: 'blue' },
                                { value: 'picked', label: 'Picked', color: 'purple' },
                                { value: 'completed', label: 'Completed', color: 'green' },
                                { value: 'cancelled', label: 'Cancelled', color: 'red' },
                              ].map((status) => (
                                <button
                                  key={status.value}
                                  type="button"
                                  onClick={() => setFormData({ ...formData, status: status.value })}
                                  className={`flex items-center justify-center px-3 py-2 rounded-lg border ${
                                    formData.status === status.value
                                      ? `bg-${status.color}-100 border-${status.color}-500 text-${status.color}-800 font-medium`
                                      : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                                  } transition-colors`}
                                >
                                  {status.label}
                                </button>
                              ))}
                            </div>
                          </div>

                          {/* Submit Button */}
                          <div className="flex space-x-3">
                            <button
                              type="submit"
                              disabled={assigningNGO || (!formData.selectedNGO && !formData.status)}
                              className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 shadow-sm"
                            >
                              {assigningNGO ? (
                                <>
                                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                  <span>Updating...</span>
                                </>
                              ) : (
                                <>
                                  <CheckCircle className="w-4 h-4" />
                                  <span>Approve & Assign</span>
                                </>
                              )}
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setFormData({ selectedNGO: '', status: '' });
                              }}
                              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                              disabled={assigningNGO}
                            >
                              Clear
                            </button>
                          </div>
                        </div>
                      </form>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button
                  type="button"
                  onClick={() => setShowDetailsModal(false)}
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <style dangerouslySetInnerHTML={{
        __html: `
          @keyframes slide-in-right {
            from {
              opacity: 0;
              transform: translateX(100%);
            }
            to {
              opacity: 1;
              transform: translateX(0);
            }
          }
          .animate-slide-in-right {
            animation: slide-in-right 0.3s ease-out;
          }
        `
      }} />
    </div>
  );
}

// Pickup Tracking Component
function PickupTracking() {
  const [donations, setDonations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [requestDetails, setRequestDetails] = useState<Map<string, any>>(new Map());
  const [filters, setFilters] = useState({
    status: 'assigned',
    search: ''
  });

  useEffect(() => {
    fetchPickupDonations();
    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchPickupDonations, 30000);
    return () => clearInterval(interval);
  }, [filters.status]);

  const fetchPickupDonations = async () => {
    try {
      setLoading(true);
      const donationService = await import('../services/donationService');
      type DonationStatus = 'pending' | 'assigned' | 'picked' | 'completed' | 'cancelled';
      const response = await donationService.fetchAllDonations({
        status: (filters.status || 'assigned') as DonationStatus
      });

      if (response.success) {
        // Get all assigned donations (not just those with requestId)
        const assignedDonations = response.data.filter(
          (d: any) => d.assignedNGO?.ngoFirebaseUid
        );
        setDonations(assignedDonations);

        // Fetch request details for all assigned requests
        const requestIds = assignedDonations
          .map((d: any) => d.assignedNGO?.assignedRequestId)
          .filter(Boolean);

        const detailsMap = new Map();
        await Promise.all(
          requestIds.map(async (requestId: string) => {
            try {
              const { auth } = await import('../firebase');
              const axios = await import('axios');
              const token = await auth.currentUser?.getIdToken();
              if (!token) return;
              
              const response = await axios.default.get(
                `http://localhost:5000/api/v1/ngo-requests/admin/${requestId}`,
                {
                  headers: { Authorization: `Bearer ${token}` }
                }
              );
              if (response.data.success) {
                detailsMap.set(requestId, response.data.data);
              }
            } catch (error) {
              console.error(`Error fetching request ${requestId}:`, error);
            }
          })
        );
        setRequestDetails(detailsMap);
      }
    } catch (error) {
      console.error('Error fetching pickup donations:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateDonationStatus = async (donationId: string, newStatus: 'assigned' | 'picked' | 'completed' | 'cancelled') => {
    try {
      const donationService = await import('../services/donationService');
      await donationService.updateDonation(donationId, {
        status: newStatus
      });
      await fetchPickupDonations();
      alert('Status updated successfully!');
    } catch (error: any) {
      console.error('Error updating status:', error);
      alert(error.response?.data?.error || 'Failed to update status');
    }
  };

  const formatDate = (dateString: string) => {
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
      case 'picked':
        return 'bg-purple-100 text-purple-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getTrackingSteps = (status: string) => {
    const steps = [
      { id: 1, name: 'Assigned', status: 'completed' },
      { id: 2, name: 'Pickup Scheduled', status: status === 'assigned' ? 'current' : status === 'picked' || status === 'completed' ? 'completed' : 'pending' },
      { id: 3, name: 'Picked Up', status: status === 'picked' ? 'current' : status === 'completed' ? 'completed' : 'pending' },
      { id: 4, name: 'Delivered', status: status === 'completed' ? 'completed' : 'pending' }
    ];
    return steps;
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Pickup & Logistics Tracking</h2>
          <p className="text-gray-600">Monitor pickup status and OTP verifications</p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        </div>
      </div>
    );
  }

  const filteredDonations = donations.filter(donation => {
    if (!filters.search) return true;
    const search = filters.search.toLowerCase();
    return (
      donation.donorName?.toLowerCase().includes(search) ||
      donation.resourceType?.toLowerCase().includes(search) ||
      donation.assignedNGO?.ngoName?.toLowerCase().includes(search) ||
      donation.address?.city?.toLowerCase().includes(search) ||
      donation._id?.toLowerCase().includes(search)
    );
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Pickup & Logistics Tracking</h2>
          <p className="text-gray-600">Monitor pickup status, assigned NGO requests, and track deliveries</p>
        </div>
        <button
          onClick={fetchPickupDonations}
          className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          <span>Refresh</span>
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Status Filter</label>
            <select
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            >
              <option value="assigned">Assigned</option>
              <option value="picked">Picked</option>
              <option value="completed">Completed</option>
              <option value="">All Status</option>
            </select>
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
            <input
              type="text"
              placeholder="Search by donor, NGO, resource type, city, or donation ID..."
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            />
          </div>
        </div>
      </div>

      {loading ? (
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        </div>
      ) : filteredDonations.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-center py-12">
            <Truck className="w-16 h-16 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Active Pickups</h3>
            <p className="text-gray-500">There are currently no donations matching your filters.</p>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredDonations.map((donation) => {
            const requestId = donation.assignedNGO?.assignedRequestId;
            const request = requestId ? requestDetails.get(requestId) : null;
            const trackingSteps = getTrackingSteps(donation.status);

            return (
              <div
                key={donation._id}
                className="bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden hover:shadow-xl transition-shadow"
              >
                {/* Header */}
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-6 py-4 border-b border-gray-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                        <Package className="w-6 h-6 text-blue-600" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">
                          Donation #{donation._id.substring(0, 8).toUpperCase()}
                        </h3>
                        <p className="text-sm text-gray-500">Created: {formatDate(donation.createdAt)}</p>
                      </div>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(donation.status)}`}>
                      {donation.status.charAt(0).toUpperCase() + donation.status.slice(1)}
                    </span>
                  </div>
                </div>

                <div className="p-6">
                  {/* Tracking Timeline */}
                  <div className="mb-6">
                    <h4 className="text-sm font-semibold text-gray-700 mb-4 flex items-center">
                      <Activity className="w-4 h-4 mr-2" />
                      Tracking Progress
                    </h4>
                    <div className="flex items-center space-x-4">
                      {trackingSteps.map((step, index) => (
                        <div key={step.id} className="flex items-center flex-1">
                          <div className="flex flex-col items-center flex-1">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 ${
                              step.status === 'completed' ? 'bg-green-500 border-green-500 text-white' :
                              step.status === 'current' ? 'bg-blue-500 border-blue-500 text-white' :
                              'bg-gray-100 border-gray-300 text-gray-400'
                            }`}>
                              {step.status === 'completed' ? (
                                <Check className="w-5 h-5" />
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
                          <Package className="w-4 h-4 mr-2 text-gray-600" />
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
                          <div>
                            <p className="text-xs font-medium text-gray-500">Donor Name</p>
                            <p className="text-sm text-gray-900">{donation.donorName || 'N/A'}</p>
                          </div>
                          <div>
                            <p className="text-xs font-medium text-gray-500">Donor Email</p>
                            <p className="text-sm text-gray-900">{donation.donorEmail || 'N/A'}</p>
                          </div>
                          <div>
                            <p className="text-xs font-medium text-gray-500">Donor Phone</p>
                            <p className="text-sm text-gray-900">{donation.donorPhone || 'N/A'}</p>
                          </div>
                          {donation.urgency && (
                            <div>
                              <p className="text-xs font-medium text-gray-500">Urgency</p>
                              <p className="text-sm text-gray-900">{donation.urgency}</p>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Pickup Address */}
                      <div className="bg-green-50 rounded-lg p-4">
                        <h4 className="text-sm font-semibold text-gray-900 mb-3 flex items-center">
                          <MapPin className="w-4 h-4 mr-2 text-green-600" />
                          Pickup Address
                        </h4>
                        <div className="space-y-1 text-sm text-gray-700">
                          <p>{donation.address?.addressLine || 'N/A'}</p>
                          <p>{donation.address?.city || 'N/A'}, {donation.address?.state || 'N/A'}</p>
                          <p>Pincode: {donation.address?.pincode || 'N/A'}</p>
                          {donation.pickup?.pickupDate && (
                            <p className="mt-2">
                              <Calendar className="w-4 h-4 inline mr-1" />
                              Pickup Date: {formatDate(donation.pickup.pickupDate)}
                            </p>
                          )}
                          {donation.pickup?.timeSlot && (
                            <p>Time Slot: {donation.pickup.timeSlot}</p>
                          )}
                        </div>
                        {donation.pickup?.instructions && (
                          <div className="mt-3 pt-3 border-t border-green-200">
                            <p className="text-xs font-medium text-gray-500">Pickup Instructions</p>
                            <p className="text-sm text-gray-700">{donation.pickup.instructions}</p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* NGO Assignment Details */}
                    <div className="space-y-4">
                      <div className="bg-purple-50 rounded-lg p-4">
                        <h4 className="text-sm font-semibold text-gray-900 mb-3 flex items-center">
                          <Building2 className="w-4 h-4 mr-2 text-purple-600" />
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
                          {donation.assignedNGO?.assignedBy && (
                            <div>
                              <p className="text-xs font-medium text-gray-500">Assigned By</p>
                              <p className="text-sm text-gray-700">
                                Admin ({donation.assignedNGO.assignedBy.substring(0, 8)}...)
                              </p>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Assigned Request Details */}
                      {request && (
                        <div className="bg-blue-50 rounded-lg p-4">
                          <div className="flex items-center space-x-2 mb-3">
                            <FileText className="w-4 h-4 text-blue-600" />
                            <h4 className="text-sm font-semibold text-gray-900">Assigned NGO Request</h4>
                          </div>
                          <div className="space-y-2">
                            <div>
                              <p className="text-xs font-medium text-gray-500">Request Title</p>
                              <p className="text-sm text-gray-900 font-medium">{request.requestTitle}</p>
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                              <div>
                                <p className="text-xs font-medium text-gray-500">Category</p>
                                <p className="text-sm text-gray-900 capitalize">{request.category}</p>
                              </div>
                              <div>
                                <p className="text-xs font-medium text-gray-500">Quantity Needed</p>
                                <p className="text-sm text-gray-900">{request.quantity}</p>
                              </div>
                            </div>
                            <div>
                              <p className="text-xs font-medium text-gray-500">Urgency Level</p>
                              <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                request.urgencyLevel === 'high' ? 'bg-red-100 text-red-800' :
                                request.urgencyLevel === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                                'bg-green-100 text-green-800'
                              }`}>
                                {request.urgencyLevel}
                              </span>
                            </div>
                            {request.neededBy && (
                              <div>
                                <p className="text-xs font-medium text-gray-500">Needed By</p>
                                <p className="text-sm text-gray-900">{formatDate(request.neededBy)}</p>
                              </div>
                            )}
                            {request.description && (
                              <div>
                                <p className="text-xs font-medium text-gray-500">Description</p>
                                <p className="text-sm text-gray-700 mt-1">{request.description}</p>
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Status Update Actions */}
                      <div className="bg-white border border-gray-200 rounded-lg p-4">
                        <h4 className="text-sm font-semibold text-gray-900 mb-3">Update Status</h4>
                        <div className="flex flex-wrap gap-2">
                          {donation.status === 'assigned' && (
                            <button
                              onClick={() => updateDonationStatus(donation._id, 'picked')}
                              className="px-3 py-1.5 bg-purple-600 text-white text-sm rounded-lg hover:bg-purple-700 transition-colors"
                            >
                              Mark as Picked
                            </button>
                          )}
                          {donation.status === 'picked' && (
                            <button
                              onClick={() => updateDonationStatus(donation._id, 'completed')}
                              className="px-3 py-1.5 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition-colors"
                            >
                              Mark as Completed
                            </button>
                          )}
                          {donation.status !== 'completed' && donation.status !== 'cancelled' && (
                            <button
                              onClick={() => {
                                if (confirm('Are you sure you want to cancel this donation?')) {
                                  updateDonationStatus(donation._id, 'cancelled');
                                }
                              }}
                              className="px-3 py-1.5 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 transition-colors"
                            >
                              Cancel
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Additional Notes */}
                  {donation.notes && (
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <p className="text-xs font-medium text-gray-500 mb-1">Additional Notes</p>
                      <p className="text-sm text-gray-700">{donation.notes}</p>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
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
  const [requests, setRequests] = useState<any[]>([]);
  const [registrations, setRegistrations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Fetch both NGO requests and NGO registrations
      const [requestsResponse, registrationsResponse] = await Promise.all([
        getAllNgoRequests(),
        getAllNgoRegistrations()
      ]);
      
      const requestData = requestsResponse.success ? requestsResponse.data || [] : [];
      const registrationData = registrationsResponse.success ? registrationsResponse.data || [] : [];
      
      setRequests(requestData);
      setRegistrations(registrationData);
      
      // Count unread items (both requests and registrations)
      const unreadRequests = requestData.filter((req: any) => !req.isRead).length;
      const unreadRegistrations = registrationData.filter((reg: any) => !reg.isRead).length;
      setUnreadCount(unreadRequests + unreadRegistrations);
      
    } catch (err) {
      setError('An error occurred while fetching data');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffTime = Math.abs(now.getTime() - date.getTime());
      const diffHours = Math.ceil(diffTime / (1000 * 60 * 60));
      
      if (diffHours < 1) {
        return 'Just now';
      } else if (diffHours < 24) {
        return `${diffHours}h ago`;
      } else {
        return date.toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric'
        });
      }
    } catch (e) {
      console.error('Invalid date string:', dateString);
      return 'Invalid date';
    }
  };

  const markAsRead = (itemId: string, type: 'request' | 'registration') => {
    if (type === 'request') {
      setRequests(prev => 
        prev.map(item => 
          item._id === itemId 
            ? { ...item, isRead: true }
            : item
        )
      );
    } else {
      setRegistrations(prev => 
        prev.map(item => 
          item._id === itemId 
            ? { ...item, isRead: true }
            : item
        )
      );
    }
    setUnreadCount(prev => Math.max(0, prev - 1));
  };

  // Combine both requests and registrations for display
  const allItems = [
    ...requests.map(req => ({ ...req, type: 'request' })),
    ...registrations.map(reg => ({ ...reg, type: 'registration' }))
  ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Announcements & Alerts</h2>
          <p className="text-gray-600">NGO Requests & Registrations</p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Announcements & Alerts</h2>
        <p className="text-gray-600">NGO Requests & Registrations</p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">{error}</p>
        </div>
      )}

      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <h3 className="text-lg font-medium text-gray-900">Recent Activity</h3>
              {unreadCount > 0 && (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 animate-pulse">
                  {unreadCount} new
                </span>
              )}
            </div>
            <span className="text-sm text-gray-500">
              {allItems.length} total
            </span>
          </div>
        </div>
        
        <div className="p-6 overflow-x-auto">
          {allItems.length === 0 ? (
            <div className="text-center py-12 min-w-full">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-gray-100">
                <svg className="h-6 w-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <h3 className="mt-2 text-sm font-medium text-gray-900">No activity yet</h3>
              <p className="mt-1 text-sm text-gray-500">When NGOs create requests or register, they'll appear here as alerts.</p>
            </div>
          ) : (
            <div className="space-y-2 min-w-full">
              {allItems.map((item) => (
                <div
                  key={item._id}
                  className={`p-4 rounded-lg border transition-all cursor-pointer min-w-full ${
                    !item.isRead 
                      ? 'bg-green-50 border-green-200 hover:bg-green-100' 
                      : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                  }`}
                  onClick={() => {
                    markAsRead(item._id, item.type);
                    // Navigate to NGO tab and specific section
                    const ngoTab = document.querySelector('[data-tab="ngos"]') as HTMLElement;
                    if (ngoTab) {
                      ngoTab.click();
                      
                      // After tab switch, navigate to specific section
                      setTimeout(() => {
                        if (item.type === 'registration') {
                          // Switch to registrations section
                          const registrationTab = document.querySelector('[data-ngo-tab="registrations"]') as HTMLElement;
                          if (registrationTab) {
                            registrationTab.click();
                          }
                        } else {
                          // Switch to requests section
                          const requestTab = document.querySelector('[data-ngo-tab="requests"]') as HTMLElement;
                          if (requestTab) {
                            requestTab.click();
                          }
                        }
                      }, 100);
                    }
                  }}
                >
                  <div className="flex items-start justify-between flex-wrap">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2 mb-2 flex-wrap">
                        {!item.isRead && (
                          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse flex-shrink-0"></div>
                        )}
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                          item.type === 'registration' 
                            ? 'bg-blue-100 text-blue-800' 
                            : 'bg-purple-100 text-purple-800'
                        }`}>
                          {item.type === 'registration' ? 'Registration' : 'Request'}
                        </span>
                        <span className="text-xs text-gray-500 whitespace-nowrap">
                          {formatDate(item.createdAt)}
                        </span>
                      </div>
                      
                      <h4 className="text-sm font-semibold text-gray-900 mb-1 truncate">
                        {item.type === 'registration' 
                          ? `New NGO Registration: ${item.ngoName || 'Unknown NGO'}`
                          : item.requestTitle || 'New Request'
                        }
                      </h4>
                      
                      <div className="flex items-center space-x-4 text-xs text-gray-600 mb-2 flex-wrap">
                        {item.type === 'registration' ? (
                          <>
                            <span className="flex items-center whitespace-nowrap">
                              <svg className="w-3 h-3 mr-1 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                              </svg>
                              NGO Registration
                            </span>
                            <span className="flex items-center whitespace-nowrap">
                              <svg className="w-3 h-3 mr-1 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                              </svg>
                              {item.ngoName || 'Unknown NGO'}
                            </span>
                            {item.city && (
                              <span className="flex items-center whitespace-nowrap">
                                <svg className="w-3 h-3 mr-1 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                </svg>
                                {item.city}
                              </span>
                            )}
                          </>
                        ) : (
                          <>
                            <span className="flex items-center whitespace-nowrap">
                              <svg className="w-3 h-3 mr-1 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                              </svg>
                              {item.category || 'General'}
                            </span>
                            <span className="flex items-center whitespace-nowrap">
                              <svg className="w-3 h-3 mr-1 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                              </svg>
                              {item.ngoName || 'NGO'}
                            </span>
                            <span className="flex items-center whitespace-nowrap">
                              <svg className="w-3 h-3 mr-1 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                              </svg>
                              Qty: {item.quantity || '1'}
                            </span>
                          </>
                        )}
                      </div>
                      
                      <p className="text-xs text-gray-600 line-clamp-2">
                        {item.type === 'registration' 
                          ? `New NGO registration request from ${item.ngoName || 'Unknown NGO'}${item.city ? ` in ${item.city}` : ''}. Registration number: ${item.registrationNumber || 'N/A'}`
                          : item.description || 'No description provided'
                        }
                      </p>
                    </div>
                    
                    <div className="ml-4 flex-shrink-0">
                      <div className="text-xs text-gray-500 whitespace-nowrap">
                        Click to view →
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// User Management Component
function UserManagement() {
  const [donors, setDonors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedDonor, setSelectedDonor] = useState<any>(null);
  const [showNotificationModal, setShowNotificationModal] = useState(false);
  const [notificationData, setNotificationData] = useState({
    title: '',
    message: ''
  });
  const [sendingNotification, setSendingNotification] = useState(false);
  const [notificationSuccess, setNotificationSuccess] = useState<string | null>(null);

  useEffect(() => {
    fetchDonors();
  }, []);

  const fetchDonors = async () => {
    try {
      setLoading(true);
      setError(null);
      const userService = await import('../services/userService');
      const response = await userService.getAllDonors();
      if (response.success) {
        setDonors(response.data || []);
      } else {
        setError('Failed to fetch donors');
      }
    } catch (err: any) {
      console.error('Error fetching donors:', err);
      setError(err.response?.data?.error || 'Failed to fetch donors');
    } finally {
      setLoading(false);
    }
  };

  const handleSendNotification = async () => {
    if (!selectedDonor || !notificationData.title || !notificationData.message) {
      alert('Please fill in both title and message');
      return;
    }

    try {
      setSendingNotification(true);
      const userService = await import('../services/userService');
      const response = await userService.sendNotificationToDonor({
        donorFirebaseUid: selectedDonor.firebaseUid,
        title: notificationData.title,
        message: notificationData.message
      });

      if (response.success) {
        setNotificationSuccess('Notification sent successfully!');
        setNotificationData({ title: '', message: '' });
        setShowNotificationModal(false);
        setTimeout(() => {
          setNotificationSuccess(null);
        }, 3000);
      }
    } catch (err: any) {
      console.error('Error sending notification:', err);
      alert(err.response?.data?.error || 'Failed to send notification');
    } finally {
      setSendingNotification(false);
    }
  };

  const openNotificationModal = (donor: any) => {
    setSelectedDonor(donor);
    setNotificationData({ title: '', message: '' });
    setShowNotificationModal(true);
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">User Management</h2>
          <p className="text-gray-600">Manage donors and volunteers</p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">User Management</h2>
        <p className="text-gray-600">Manage donors and volunteers</p>
      </div>

      {notificationSuccess && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <p className="text-green-800">{notificationSuccess}</p>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">{error}</p>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow p-6 border-l-4 border-blue-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Total Donors</p>
              <p className="mt-1 text-3xl font-bold text-gray-900">{donors.length}</p>
            </div>
            <div className="flex-shrink-0 bg-blue-100 rounded-lg p-3">
              <Users className="w-8 h-8 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6 border-l-4 border-green-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Total Donations</p>
              <p className="mt-1 text-3xl font-bold text-gray-900">
                {donors.reduce((sum, donor) => sum + (donor.stats?.totalDonations || 0), 0)}
              </p>
            </div>
            <div className="flex-shrink-0 bg-green-100 rounded-lg p-3">
              <Package className="w-8 h-8 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6 border-l-4 border-emerald-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Completed Donations</p>
              <p className="mt-1 text-3xl font-bold text-gray-900">
                {donors.reduce((sum, donor) => sum + (donor.stats?.completedDonations || 0), 0)}
              </p>
            </div>
            <div className="flex-shrink-0 bg-emerald-100 rounded-lg p-3">
              <CheckCircle className="w-8 h-8 text-emerald-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Donors List */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
          <h3 className="text-lg font-medium text-gray-900">All Donors</h3>
        </div>
        <div className="p-6">
          {donors.length === 0 ? (
            <div className="text-center py-12">
              <Users className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No donors found</h3>
              <p className="mt-1 text-sm text-gray-500">No donors have registered yet.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {donors.map((donor) => (
                <div
                  key={donor._id}
                  className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-4">
                        <div className="flex-shrink-0">
                          <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
                            <span className="text-blue-600 font-semibold text-lg">
                              {donor.name?.charAt(0)?.toUpperCase() || 'D'}
                            </span>
                          </div>
                        </div>
                        <div className="flex-1">
                          <h4 className="text-lg font-semibold text-gray-900">{donor.name}</h4>
                          <p className="text-sm text-gray-500">{donor.email}</p>
                        </div>
                        {donor.isVerified && (
                          <span className="px-3 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">
                            Verified
                          </span>
                        )}
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                        {donor.phone && (
                          <div>
                            <p className="text-sm font-medium text-gray-500">Phone</p>
                            <p className="text-sm text-gray-900">{donor.phone}</p>
                          </div>
                        )}
                        {donor.address?.city && (
                          <div>
                            <p className="text-sm font-medium text-gray-500">City</p>
                            <p className="text-sm text-gray-900">{donor.address.city}</p>
                          </div>
                        )}
                        {donor.address?.state && (
                          <div>
                            <p className="text-sm font-medium text-gray-500">State</p>
                            <p className="text-sm text-gray-900">{donor.address.state}</p>
                          </div>
                        )}
                        <div>
                          <p className="text-sm font-medium text-gray-500">Joined</p>
                          <p className="text-sm text-gray-900">
                            {new Date(donor.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>

                      {/* Donation Stats */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg">
                        <div>
                          <p className="text-sm font-medium text-gray-500">Total Donations</p>
                          <p className="text-lg font-semibold text-gray-900">
                            {donor.stats?.totalDonations || 0}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-500">Completed</p>
                          <p className="text-lg font-semibold text-green-600">
                            {donor.stats?.completedDonations || 0}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-500">Pending</p>
                          <p className="text-lg font-semibold text-yellow-600">
                            {donor.stats?.pendingDonations || 0}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="ml-4 flex-shrink-0">
                      <button
                        onClick={() => openNotificationModal(donor)}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                      >
                        <MessageSquare className="w-4 h-4" />
                        <span>Send Notification</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Notification Modal */}
      {showNotificationModal && selectedDonor && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-gray-900">
                  Send Notification to {selectedDonor.name}
                </h3>
                <button
                  onClick={() => setShowNotificationModal(false)}
                  className="text-gray-400 hover:text-gray-500"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            <div className="px-6 py-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Title *
                </label>
                <input
                  type="text"
                  value={notificationData.title}
                  onChange={(e) =>
                    setNotificationData({ ...notificationData, title: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter notification title"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Message *
                </label>
                <textarea
                  value={notificationData.message}
                  onChange={(e) =>
                    setNotificationData({ ...notificationData, message: e.target.value })
                  }
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter notification message"
                />
              </div>
            </div>
            <div className="px-6 py-4 border-t border-gray-200 flex justify-end space-x-3">
              <button
                onClick={() => setShowNotificationModal(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSendNotification}
                disabled={sendingNotification || !notificationData.title || !notificationData.message}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {sendingNotification ? 'Sending...' : 'Send Notification'}
              </button>
            </div>
          </div>
        </div>
      )}
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
