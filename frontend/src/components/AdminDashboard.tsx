import { useState, useEffect } from 'react';
import type { User as FirebaseUser } from 'firebase/auth';
import { signOutUser, subscribeToPendingNgoRequests, subscribeToPendingReports } from '../firebase';
import { getAllNgoRequests, updateNgoRequestStatus, getNgosWithActiveRequests, type NgoWithRequests } from '../services/ngoRequestService';
import { getAllNgoRegistrations, updateRegistrationStatus } from '../services/ngoRegistrationService';
import { getAllHelpMessages } from '../services/contactService';
import { PieChart, Pie, Cell, LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

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
  Bell,
  Users,
  Settings,
  CheckCircle,
  XCircle,
  Clock,
  FileText,
  MessageSquare,
  X,
  TrendingUp,
  RefreshCw,
  User as UserIcon,
  ArrowUp,
  Activity,
  Eye,
  MapPin,
  AlertCircle,
  Calendar,
  CalendarCheck,
} from 'lucide-react';

import adminIcon from '../assets/admin.jpg';

interface AdminDashboardProps {
  user: FirebaseUser | null;
  onBack: () => void;
}

type TabKey = 'overview' | 'ngos' | 'donations' | 'pickups' | 'reports' | 'analytics' | 'notifications' | 'users' | 'settings';

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
    completedDonations: 0,
    pendingApprovals: 0, // NGOs waiting for approval
    stuckDonations: 0,   // Donations stuck for long time
    pendingReports: 0,   // Reports not yet resolved
    pendingDonations: 0  // Pending donations count
  });
  const [chartData, setChartData] = useState({
    categoryBreakdown: [] as Array<{ name: string; value: number; count: number }>,
    timeline: [] as Array<{ date: string; count: number; quantity: number }>,
    statusDistribution: [] as Array<{ name: string; count: number }>,
    loading: true
  });

  // Heat map helper functions (commented out as unused)
  /*
  

  const getHeatColor = (percentage: number) => {
    if (percentage >= 20) return 'bg-red-500';
    if (percentage >= 15) return 'bg-orange-500';
    if (percentage >= 10) return 'bg-yellow-500';
    if (percentage >= 5) return 'bg-green-500';
    return 'bg-blue-500';
  };


  const getHeatTextColor = (percentage: number) => {
    if (percentage >= 20) return 'text-red-700';
    if (percentage >= 15) return 'text-orange-700';
    if (percentage >= 10) return 'text-yellow-700';
    if (percentage >= 5) return 'text-green-700';
    return 'text-blue-700';
  };
  */


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

  // Function to fetch active pickups count
  const fetchActivePickupsCount = async () => {
    try {
      const donationService = await import('../services/donationService');
      
      // Fetch donations with active pickup statuses (assigned, volunteer_assigned, picked)
      const [assignedResponse, volunteerAssignedResponse, pickedResponse] = await Promise.all([
        donationService.fetchAllDonations({ status: 'assigned' }).catch(() => ({ success: false, count: 0, data: [] })),
        donationService.fetchAllDonations({ status: 'volunteer_assigned' }).catch(() => ({ success: false, count: 0, data: [] })),
        donationService.fetchAllDonations({ status: 'picked' }).catch(() => ({ success: false, count: 0, data: [] }))
      ]);

      // Count active pickups from all statuses
      const assignedCount = assignedResponse.success 
        ? assignedResponse.count || (Array.isArray(assignedResponse.data) ? assignedResponse.data.length : 0)
        : 0;
      
      const volunteerAssignedCount = volunteerAssignedResponse.success 
        ? volunteerAssignedResponse.count || (Array.isArray(volunteerAssignedResponse.data) ? volunteerAssignedResponse.data.length : 0)
        : 0;
      
      const pickedCount = pickedResponse.success 
        ? pickedResponse.count || (Array.isArray(pickedResponse.data) ? pickedResponse.data.length : 0)
        : 0;

      const totalActivePickups = assignedCount + volunteerAssignedCount + pickedCount;

      // Update activePickups count
      setAnimatedStats(prev => ({
        ...prev,
        activePickups: totalActivePickups
      }));
    } catch (error) {
      console.error('Error fetching active pickups count:', error);
    }
  };

  // Function to fetch and process chart data
  const fetchChartData = async () => {
    try {
      setChartData(prev => ({ ...prev, loading: true }));
      const donationService = await import('../services/donationService');
      
      // Fetch all donations for chart analysis
      const response = await donationService.fetchAllDonations();
      
      if (response.success && Array.isArray(response.data)) {
        const donations = response.data;
        
        // Process category breakdown
        const categoryMap = new Map<string, { count: number; quantity: number }>();
        
        donations.forEach((donation: any) => {
          const category = donation.resourceType || 'Other';
          const current = categoryMap.get(category) || { count: 0, quantity: 0 };
          categoryMap.set(category, {
            count: current.count + 1,
            quantity: current.quantity + (donation.quantity || 0)
          });
        });
        
        // Convert to array format for pie chart
        const categoryBreakdown = Array.from(categoryMap.entries()).map(([name, data]) => ({
          name,
          value: data.quantity,
          count: data.count
        }));
        
        // Process timeline data - group by date
        const timelineMap = new Map<string, { count: number; quantity: number }>();
        
        donations.forEach((donation: any) => {
          if (donation.createdAt) {
            const date = new Date(donation.createdAt);
            const dateKey = date.toISOString().split('T')[0]; // YYYY-MM-DD format
            
            const current = timelineMap.get(dateKey) || { count: 0, quantity: 0 };
            timelineMap.set(dateKey, {
              count: current.count + 1,
              quantity: current.quantity + (donation.quantity || 0)
            });
          }
        });
        
        // Convert to array and sort by date
        const timeline = Array.from(timelineMap.entries())
          .map(([date, data]) => ({
            date,
            count: data.count,
            quantity: data.quantity
          }))
          .sort((a, b) => a.date.localeCompare(b.date));
        
        // Process status distribution
        // Posted: pending + assigned + volunteer_assigned
        // Picked: picked
        // Delivered: completed
        const statusCounts = {
          Posted: 0,
          Picked: 0,
          Delivered: 0
        };
        
        donations.forEach((donation: any) => {
          const status = donation.status || 'pending';
          if (status === 'pending' || status === 'assigned' || status === 'volunteer_assigned') {
            statusCounts.Posted += 1;
          } else if (status === 'picked') {
            statusCounts.Picked += 1;
          } else if (status === 'completed') {
            statusCounts.Delivered += 1;
          }
        });
        
        // Convert to array format for bar chart
        const statusDistribution = [
          { name: 'Posted', count: statusCounts.Posted },
          { name: 'Picked', count: statusCounts.Picked },
          { name: 'Delivered', count: statusCounts.Delivered }
        ];
        
        setChartData({
          categoryBreakdown,
          timeline,
          statusDistribution,
          loading: false
        });
      } else {
        setChartData(prev => ({ ...prev, loading: false }));
      }
    } catch (error) {
      console.error('Error fetching chart data:', error);
      setChartData(prev => ({ ...prev, loading: false }));
    }
  };

  // Function to calculate total food in kg from donations
  const calculateTotalFoodKg = async () => {
    try {
      const donationService = await import('../services/donationService');
      
      // Fetch all donations (or just completed ones for food saved)
      const response = await donationService.fetchAllDonations();
      
      if (response.success && Array.isArray(response.data)) {
        let totalFoodKg = 0;
        
        response.data.forEach((donation: any) => {
          // Only count Food donations
          if (donation.resourceType === 'Food') {
            // If unit is kg, use quantity directly
            if (donation.unit === 'kg') {
              totalFoodKg += donation.quantity || 0;
            } 
            // If unit is items/packets/boxes, try to get weight from details
            else if (donation.details && donation.details.approxWeight) {
              const weight = typeof donation.details.approxWeight === 'number' 
                ? donation.details.approxWeight 
                : Number(donation.details.approxWeight) || 0;
              totalFoodKg += weight;
            }
            // If no weight in details, estimate based on quantity (rough estimate: 1 item = 0.5kg)
            else {
              totalFoodKg += (donation.quantity || 0) * 0.5;
            }
          }
        });
        
        // Update mealsSaved with total food in kg
        setAnimatedStats(prev => ({
          ...prev,
          mealsSaved: Math.round(totalFoodKg)
        }));
      }
    } catch (error) {
      console.error('Error calculating total food kg:', error);
    }
  };

  // Function to fetch pending NGO requests count
  const fetchPendingNgoRequests = async () => {
    try {
      const ngoRequestsResponse = await getAllNgoRequests();
      const pendingRequestsCount = ngoRequestsResponse.data?.filter(
        (req: any) => req.status === 'pending'
      ).length || 0;

      // Update pendingNGOs with requests count (not registrations)
      setAnimatedStats(prev => ({
        ...prev,
        pendingNGOs: pendingRequestsCount
      }));
    } catch (error) {
      console.error('Error fetching pending NGO requests:', error);
    }
  };

  // Function to fetch all pending counts from backend
  const fetchPendingCounts = async () => {
    try {
      const donationService = await import('../services/donationService');
      
      // Fetch all pending data in parallel
      const [
        pendingDonationsResponse,
        pendingNgoRegistrations,
        allHelpMessages
      ] = await Promise.all([
        donationService.fetchAllDonations({ status: 'pending' }).catch(() => ({ success: false, count: 0, data: [] })),
        getAllNgoRegistrations('pending').catch(() => []),
        getAllHelpMessages().catch(() => ({ success: false, data: [] }))
      ]);

      // Count pending donations
      const pendingDonationsCount = pendingDonationsResponse.success 
        ? pendingDonationsResponse.count || (Array.isArray(pendingDonationsResponse.data) ? pendingDonationsResponse.data.length : 0)
        : 0;

      // Count pending NGO verifications (registrations with status 'pending')
      const pendingNgoVerificationsCount = Array.isArray(pendingNgoRegistrations)
        ? pendingNgoRegistrations.length
        : 0;

      // Count pending reports (help messages with status 'new' only - not read yet)
      const pendingReportsCount = allHelpMessages.success && Array.isArray(allHelpMessages.data)
        ? allHelpMessages.data.filter((msg: any) => msg.status === 'new').length
        : 0;

      // Update stats with real-time counts (DO NOT overwrite pendingNGOs - that's for requests, not registrations)
      setAnimatedStats(prev => ({
        ...prev,
        pendingDonations: pendingDonationsCount,
        pendingApprovals: pendingNgoVerificationsCount,
        // pendingNGOs is updated separately by fetchPendingNgoRequests()
        pendingReports: pendingReportsCount,
        openIssues: pendingReportsCount // Update openIssues with new reports count
      }));
    } catch (error) {
      console.error('Error fetching pending counts:', error);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 1000);
    
    // Subscribe to all real-time updates (keeping for backward compatibility)
    const unsubscribePendingNgos = subscribeToPendingNgoRequests((count) => {
      setAnimatedStats(prev => ({
        ...prev,
        pendingApprovals: count,
        pendingNGOs: count // Also update the pendingNGOs count for consistency
      }));
    });

    const unsubscribePendingReports = subscribeToPendingReports((count) => {
      setAnimatedStats(prev => ({
        ...prev,
        pendingReports: count
      }));
    });
    
    // Fetch initial data and pending counts
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
            openIssues: 0,
            pendingApprovals: pendingRequestsCount,
            stuckDonations: 0,
            pendingReports: 0  // Will be updated by real-time subscription
          }));
        }

        // Fetch real-time pending counts, active pickups, chart data, and calculate food kg
        await Promise.all([
          fetchPendingCounts(),
          fetchPendingNgoRequests(), // Fetch pending NGO requests separately
          fetchActivePickupsCount(),
          fetchChartData(),
          calculateTotalFoodKg()
        ]);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      }
    })();

    // Set up interval to refresh pending counts, active pickups, chart data, and food kg every 30 seconds
    const intervalId = setInterval(() => {
      fetchPendingCounts();
      fetchPendingNgoRequests(); // Also refresh pending requests
      fetchActivePickupsCount();
      fetchChartData();
      calculateTotalFoodKg();
    }, 30000);
    
    return () => {
      clearTimeout(timer);
      clearInterval(intervalId);
      unsubscribePendingNgos();
      unsubscribePendingReports();
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
    { id: 'reports' as TabKey, label: 'Reports & Support', icon: AlertTriangle },
    { id: 'analytics' as TabKey, label: 'Analytics', icon: BarChart3 },
    { id: 'notifications' as TabKey, label: 'Notifications', icon: Bell },
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
        <div className="p-6 border-b border-gray-200 relative">
          {!sidebarCollapsed ? (
            <div className="flex flex-col items-center text-center">
              <div className="relative w-20 h-20 mb-3">
                <img
                  src={adminIcon}
                  alt="Admin"
                  className="w-20 h-20 rounded-full object-cover shadow-lg border-2 border-blue-100 bg-white"
                />
              </div>
              <div className="font-semibold text-gray-900 text-lg">{user?.displayName || 'Admin'}</div>
              <div className="text-sm text-gray-600 mt-1 truncate w-full">{user?.email}</div>
            </div>
          ) : (
            <div className="flex items-center justify-center w-full">
              <img
                src={adminIcon}
                alt="Admin"
                className="w-10 h-10 rounded-full object-cover shadow-md border border-blue-100 bg-white"
              />
            </div>
          )}
          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="absolute -right-3 top-8 z-10 h-6 w-6 rounded-full bg-white border border-gray-200 shadow-md flex items-center justify-center text-gray-600 hover:bg-gray-50 transition-colors"
            title={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {sidebarCollapsed ? (
              <ChevronDown className="h-4 w-4 -rotate-90" />
            ) : (
              <ChevronDown className="h-4 w-4 rotate-90" />
            )}
          </button>
        </div>
        
        
        <nav className="flex-1 min-h-0 p-4 space-y-1 overflow-y-auto scrollbar-hide">
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
                        <span>{animatedStats.activePickups} in progress</span>
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
                      <p className="text-sm font-medium text-gray-600 group-hover:text-orange-700 transition-colors">Total Food Donated</p>
                      <p className="text-3xl font-bold text-gray-900 mt-2 group-hover:text-orange-800 transition-colors">
                        {animatedStats.mealsSaved.toLocaleString()} kg
                      </p>
                      <div className="flex items-center mt-2 text-xs text-orange-600">
                        <TrendingUp className="w-3 h-3 mr-1" />
                        <span>Total food donated</span>
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
                      <p className="text-sm font-medium text-gray-600 group-hover:text-red-700 transition-colors">New Reports</p>
                      <p className="text-3xl font-bold text-gray-900 mt-2 group-hover:text-red-800 transition-colors">
                        {animatedStats.openIssues}
                      </p>
                      <div className="flex items-center mt-2 text-xs text-red-600">
                        <AlertTriangle className="w-3 h-3 mr-1" />
                        <span>Unread support tickets</span>
                      </div>
                    </div>
                    <AlertTriangle className="w-12 h-12 text-red-500 group-hover:scale-110 transition-transform duration-300" />
                  </div>
                </button>
              </div>

              {/* Pending Actions Box */}
              <div className="bg-white rounded-xl shadow-md p-6 border border-red-100">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                    <AlertCircle className="w-5 h-5 text-red-500 mr-2" />
                    Pending Actions (Admin To-Do)
                  </h3>
                  <span className="px-3 py-1 bg-red-100 text-red-800 text-xs font-medium rounded-full">
                    Action Required
                  </span>
                </div>
                
                <div className="space-y-4">
                  <button 
                    onClick={() => setActiveTab('ngos')}
                    className="w-full flex items-center justify-between p-4 bg-red-50 hover:bg-red-100 rounded-lg transition-colors duration-200 group"
                  >
                    <div className="flex items-center">
                      <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center mr-4 group-hover:bg-red-200 transition-colors">
                        <Users className="w-5 h-5 text-red-600" />
                      </div>
                      <div className="text-left">
                        <h4 className="font-medium text-gray-900">NGOs Waiting for Approval</h4>
                        <p className="text-sm text-gray-500">Review and verify new NGO registrations</p>
                      </div>
                    </div>
                    <div className="flex items-center">
                      <span className={`text-sm font-medium px-2.5 py-0.5 rounded-full ${
                        animatedStats.pendingApprovals > 0 
                          ? 'bg-red-500 text-white' 
                          : 'bg-gray-100 text-gray-600'
                      }`}>
                        {animatedStats.pendingApprovals}
                      </span>
                      <ChevronDown className="w-5 h-5 ml-2 text-gray-400 group-hover:text-gray-600 transition-colors" />
                    </div>
                  </button>

                  <button 
                    onClick={() => setActiveTab('donations')}
                    className="w-full flex items-center justify-between p-4 bg-green-50 hover:bg-green-100 rounded-lg transition-colors duration-200 group"
                  >
                    <div className="flex items-center">
                      <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center mr-4 group-hover:bg-green-200 transition-colors">
                        <Package className="w-5 h-5 text-green-600" />
                      </div>
                      <div className="text-left">
                        <h4 className="font-medium text-gray-900">Pending Donations</h4>
                        <p className="text-sm text-gray-500">Review and assign pending donations</p>
                      </div>
                    </div>
                    <div className="flex items-center">
                      <span className={`text-sm font-medium px-2.5 py-0.5 rounded-full ${
                        animatedStats.pendingDonations > 0 
                          ? 'bg-green-500 text-white' 
                          : 'bg-gray-100 text-gray-600'
                      }`}>
                        {animatedStats.pendingDonations}
                      </span>
                      <ChevronDown className="w-5 h-5 ml-2 text-gray-400 group-hover:text-gray-600 transition-colors" />
                    </div>
                  </button>

                  <button 
                    onClick={() => setActiveTab('reports')}
                    className="w-full flex items-center justify-between p-4 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors duration-200 group"
                  >
                    <div className="flex items-center">
                      <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center mr-4 group-hover:bg-blue-200 transition-colors">
                        <AlertTriangle className="w-5 h-5 text-blue-600" />
                      </div>
                      <div className="text-left">
                        <h4 className="font-medium text-gray-900">Reports Not Yet Resolved</h4>
                        <p className="text-sm text-gray-500">Address open issues and support tickets</p>
                      </div>
                    </div>
                    <div className="flex items-center">
                      <span className={`text-sm font-medium px-2.5 py-0.5 rounded-full ${
                        animatedStats.pendingReports > 0 
                          ? 'bg-blue-500 text-white' 
                          : 'bg-gray-100 text-gray-600'
                      }`}>
                        {animatedStats.pendingReports}
                      </span>
                      <ChevronDown className="w-5 h-5 ml-2 text-gray-400 group-hover:text-gray-600 transition-colors" />
                    </div>
                  </button>
                </div>
              </div>

              {/* Charts Section */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
                {/* Donation Category Breakdown - Pie/Donut Chart */}
                <div className="bg-white rounded-xl shadow-md p-6 border border-gray-200">
                  <div className="mb-4">
                    <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                      <BarChart3 className="w-5 h-5 text-blue-500 mr-2" />
                      Donation Category Breakdown
                    </h3>
                    <p className="text-sm text-gray-500 mt-1">Distribution by resource type</p>
                  </div>
                  {chartData.loading ? (
                    <div className="flex justify-center items-center h-64">
                      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
                    </div>
                  ) : chartData.categoryBreakdown.length > 0 ? (
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={chartData.categoryBreakdown}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percent }) => `${name}: ${((percent || 0) * 100).toFixed(0)}%`}
                          outerRadius={80}
                          innerRadius={40}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {chartData.categoryBreakdown.map((entry, index) => {
                            const colors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];
                            return <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />;
                          })}
                        </Pie>
                        <Tooltip 
                          formatter={(value: any, name: any, props: any) => {
                            const numValue = typeof value === 'number' ? value : 0;
                            return [
                              `${numValue} ${props.payload?.unit || 'items'}`,
                              `${props.payload?.count || 0} donations`
                            ];
                          }}
                        />
                        <Legend 
                          formatter={(value, entry: any) => `${value} (${entry.payload?.count || 0})`}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex justify-center items-center h-64 text-gray-500">
                      <p>No donation data available</p>
                    </div>
                  )}
                </div>

                {/* Donation Timeline - Line Chart */}
                <div className="bg-white rounded-xl shadow-md p-6 border border-gray-200">
                  <div className="mb-4">
                    <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                      <TrendingUp className="w-5 h-5 text-green-500 mr-2" />
                      Donation Timeline
                    </h3>
                    <p className="text-sm text-gray-500 mt-1">Donor consistency and donation trends</p>
                  </div>
                  {chartData.loading ? (
                    <div className="flex justify-center items-center h-64">
                      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500"></div>
                    </div>
                  ) : chartData.timeline.length > 0 ? (
                    <ResponsiveContainer width="100%" height={300}>
                      <LineChart data={chartData.timeline}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                        <XAxis 
                          dataKey="date" 
                          stroke="#6b7280"
                          tick={{ fontSize: 12 }}
                          angle={-45}
                          textAnchor="end"
                          height={80}
                        />
                        <YAxis 
                          yAxisId="left"
                          stroke="#6b7280"
                          label={{ value: 'Count', angle: -90, position: 'insideLeft' }}
                        />
                        <YAxis 
                          yAxisId="right"
                          orientation="right"
                          stroke="#6b7280"
                          label={{ value: 'Quantity', angle: 90, position: 'insideRight' }}
                        />
                        <Tooltip 
                          formatter={(value: any, name: any) => {
                            const numValue = typeof value === 'number' ? value : 0;
                            if (name === 'count') return [`${numValue} donations`, 'Count'];
                            if (name === 'quantity') return [`${numValue} items`, 'Quantity'];
                            return numValue;
                          }}
                          labelFormatter={(label) => `Date: ${new Date(label).toLocaleDateString()}`}
                        />
                        <Legend />
                        <Line 
                          yAxisId="left"
                          type="monotone" 
                          dataKey="count" 
                          stroke="#3B82F6" 
                          strokeWidth={2}
                          name="Donation Count"
                          dot={{ r: 4 }}
                          activeDot={{ r: 6 }}
                        />
                        <Line 
                          yAxisId="right"
                          type="monotone" 
                          dataKey="quantity" 
                          stroke="#10B981" 
                          strokeWidth={2}
                          name="Total Quantity"
                          dot={{ r: 4 }}
                          activeDot={{ r: 6 }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex justify-center items-center h-64 text-gray-500">
                      <p>No timeline data available</p>
                    </div>
                  )}
                </div>

                {/* Donation Status Distribution - Bar Chart */}
                <div className="bg-white rounded-xl shadow-md p-6 border border-gray-200">
                  <div className="mb-4">
                    <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                      <BarChart3 className="w-5 h-5 text-purple-500 mr-2" />
                      Donation Status Distribution
                    </h3>
                    <p className="text-sm text-gray-500 mt-1">Distribution by donation status</p>
                  </div>
                  {chartData.loading ? (
                    <div className="flex justify-center items-center h-64">
                      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
                    </div>
                  ) : chartData.statusDistribution.length > 0 ? (
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={chartData.statusDistribution}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                        <XAxis 
                          dataKey="name" 
                          stroke="#6b7280"
                          tick={{ fontSize: 12 }}
                        />
                        <YAxis 
                          stroke="#6b7280"
                          label={{ value: 'Count', angle: -90, position: 'insideLeft' }}
                        />
                        <Tooltip 
                          formatter={(value: any) => [`${value} donations`, 'Count']}
                        />
                        <Legend />
                        <Bar 
                          dataKey="count" 
                          name="Donations"
                          radius={[8, 8, 0, 0]}
                        >
                          {chartData.statusDistribution.map((entry, index) => {
                            const colors = ['#3B82F6', '#10B981', '#F59E0B'];
                            return <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />;
                          })}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex justify-center items-center h-64 text-gray-500">
                      <p>No status data available</p>
                    </div>
                  )}
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
          {activeTab === 'donations' && <DonationsManagement />}

          {/* Pickups Tab */}
          {activeTab === 'pickups' && <PickupTracking />}

          {/* Reports Tab */}
          {activeTab === 'reports' && <ReportsManagement />}

          {/* Analytics Tab */}
          {activeTab === 'analytics' && <ImpactAnalytics />}

          {/* Notifications Tab */}
          {activeTab === 'notifications' && <NotificationsPanel />}

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

function NGORequests({ onViewRequest: _onViewRequest }: NGORequestsProps) {
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

                const status = getStatusColor();

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
  const [refreshing, setRefreshing] = useState(false);

  // Fetch NGO registrations
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
      } finally {
        setRefreshing(false);
      }
  };

  useEffect(() => {
    fetchRegistrations();
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchRegistrations();
  };

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
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">NGO Verification</h2>
          <p className="text-gray-600">Manage NGO registrations and verifications</p>
        </div>
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
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
function DonationsManagement() {
  const [donations, setDonations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastDonationCount, setLastDonationCount] = useState(0);
  const [showNotification, setShowNotification] = useState(false);
  const [newDonation, setNewDonation] = useState<any>(null);
  const [filters, setFilters] = useState({
    status: '',
    resourceType: '',
    city: '',
    startDate: '',
    endDate: ''
  });
  const [ngos, setNgos] = useState<NgoWithRequests[]>([]);
  const [loadingNGOs, setLoadingNGOs] = useState(true);
  const [expandedNgos, setExpandedNgos] = useState<Set<string>>(new Set());
  const [selectedDonation, setSelectedDonation] = useState<any>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [assigningNGO, setAssigningNGO] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<any>(null);
  const [cancelReason, setCancelReason] = useState('');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    selectedNGO: '',
    status: ''
  });
  const [assignmentError, setAssignmentError] = useState<string | null>(null);

  // Function to handle image click
  const handleImageClick = (image: string) => {
    setSelectedImage(image);
    document.body.style.overflow = 'hidden'; // Prevent scrolling when modal is open
  };

  // Function to close the image viewer
  const closeImageViewer = () => {
    setSelectedImage(null);
    document.body.style.overflow = 'auto'; // Re-enable scrolling
  };

  // Effect to handle escape key press to close the image viewer
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && selectedImage) {
        closeImageViewer();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'auto'; // Cleanup on unmount
    };
  }, [selectedImage]);

  const ImageViewerModal = () => (
    <div 
      className="fixed inset-0 z-50 bg-black bg-opacity-90 flex items-center justify-center p-4"
      onClick={closeImageViewer}
    >
      <div className="relative max-w-4xl w-full max-h-[90vh]">
        <button 
          className="absolute -top-10 right-0 text-white hover:text-gray-300"
          onClick={(e) => {
            e.stopPropagation();
            closeImageViewer();
          }}
        >
          <X className="w-8 h-8" />
        </button>
        <img 
          src={selectedImage || ''} 
          alt="Fullscreen" 
          className="max-w-full max-h-[80vh] mx-auto object-contain"
          onClick={(e) => e.stopPropagation()}
        />
        <div className="text-white text-center mt-2">
          Click anywhere to close
        </div>
      </div>
    </div>
  );

  const fetchDonations = async () => {
    try {
      const donationService = await import('../services/donationService');
      type DonationStatus = 'pending' | 'assigned' | 'cancelled';
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

  const fetchNGOs = async (retryCount = 0) => {
    const maxRetries = 2;
    
    try {
      setLoadingNGOs(true);
      console.log(`Fetching NGOs with pending requests... ${retryCount > 0 ? `(Retry ${retryCount}/${maxRetries})` : ''}`);
      
      // First, fetch all NGOs with their requests
      let response;
      try {
        response = await getNgosWithActiveRequests();
        console.log('Successfully fetched NGOs with requests:', response);
      } catch (error: any) {
        console.error('Error in getNgosWithActiveRequests:', error);
        
        // Retry logic for timeout errors
        if ((error.message?.includes('timed out') || error.code === 'ECONNABORTED') && retryCount < maxRetries) {
          console.log(`Retrying due to timeout... (${retryCount + 1}/${maxRetries})`);
          await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2 seconds before retry
          return fetchNGOs(retryCount + 1);
        }
        
        // Handle specific error types
        if (error.message?.includes('timed out') || error.code === 'ECONNABORTED') {
          alert('Request timed out after multiple attempts. The server may be overloaded. Please try again later.');
        } else if (error.message?.includes('session has expired') || error.message?.includes('401')) {
          alert('Your session has expired. Please log in again.');
        } else if (error.message?.includes('permission') || error.message?.includes('403')) {
          alert('You do not have permission to view this resource.');
        } else if (error.message?.includes('network') || error.message?.includes('connection')) {
          alert('Network error. Please check your internet connection and try again.');
        } else {
          alert('Failed to load NGO requests. Please try again later.');
        }
        
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
      setCancelReason(selectedDonation.cancelReason || '');
    }
  }, [showDetailsModal, selectedDonation]);

  useEffect(() => {
    if (!showDetailsModal) {
      setCancelReason('');
    }
  }, [showDetailsModal]);

  const cancelDonationNow = async () => {
    if (!selectedDonation?._id) return;
    const reason = cancelReason.trim();
    if (!reason) {
      alert('Please enter a cancellation reason.');
      return;
    }

    setAssigningNGO(true);
    try {
      const donationService = await import('../services/donationService');
      await donationService.updateDonation(selectedDonation._id, {
        status: 'cancelled',
        cancelReason: reason
      });

      await new Promise(resolve => setTimeout(resolve, 300));
      await fetchDonations();
      setNgos([]);
      await fetchNGOs();

      setShowDetailsModal(false);
      setFormData({ selectedNGO: '', status: '' });
      setSelectedRequest(null);
      setCancelReason('');
      alert('Donation cancelled successfully!');
    } catch (error: any) {
      console.error('Error cancelling donation:', error);
      alert(error.response?.data?.error || 'Failed to cancel donation');
    } finally {
      setAssigningNGO(false);
    }
  };

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

      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Donation Monitoring</h2>
          <p className="text-gray-600">Track and manage all donations in real-time</p>
        </div>
        <button
          onClick={() => { fetchDonations(); fetchNGOs(); }}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
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
              <option value="Blood">Blood</option>
              <option value="Funds">Funds</option>
              <option value="Devices">Devices</option>
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
                        {donation.status !== 'cancelled' && (
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
                        )}
                        {donation.status === 'cancelled' && (
                          <span className="text-gray-400 text-sm">-</span>
                        )}
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

                    {/* Donation Images */}
                    {selectedDonation.images?.length > 0 && (
                      <div className="bg-purple-50 rounded-lg p-4 mb-4">
                        <h4 className="text-lg font-semibold text-gray-900 mb-3">Donation Images</h4>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                          {selectedDonation.images.map((image: string, index: number) => (
                            <div key={index} className="relative group">
                              <img
                                src={image}
                                alt={`Donation ${index + 1}`}
                                className="w-full h-40 object-cover rounded-lg border border-gray-200 hover:shadow-md transition-shadow cursor-pointer"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleImageClick(image);
                                }}
                              />
<div 
                                className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 cursor-pointer"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleImageClick(image);
                                }}
                              >
                                <span 
                                  className="text-white text-sm bg-black bg-opacity-50 px-2 py-1 rounded"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleImageClick(image);
                                  }}
                                >
                                  Click to view
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

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
                        setAssignmentError(null);
                        
                        if (!formData.selectedNGO && !formData.status) {
                          setAssignmentError('Please select an NGO request or update status');
                          return;
                        }

                        if (formData.status === 'cancelled') {
                          setAssignmentError('Use the Cancel Donation button to cancel with a reason.');
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
                            requestId: requestIdToAssign,
                            cancelReason: formData.status === 'cancelled' ? cancelReason.trim() : undefined
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
                          setCancelReason('');
                          setAssignmentError('Donation updated successfully! The assigned request has been removed from the list.');
                        } catch (error: any) {
                          console.error('Error updating donation:', error);
                          setAssignmentError(error.response?.data?.error || 'Failed to update donation');
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
                            <div className="grid grid-cols-3 gap-3">
                              {[
                                { value: 'pending', label: 'Pending', color: 'yellow' },
                                { value: 'assigned', label: 'Assigned', color: 'blue' },
                                { value: 'cancelled', label: 'Cancelled', color: 'red' },
                              ].map((status) => (
                                <button
                                  key={status.value}
                                  type="button"
                                  onClick={() => {
                                    setFormData({ ...formData, status: status.value });
                                  }}
                                  className={`relative px-4 py-2.5 rounded-lg font-medium
                                    ${formData.status === status.value
                                      ? `bg-${status.color}-500 text-white shadow-lg transform transition-all duration-200 hover:translate-y-[-2px] hover:shadow-xl active:translate-y-[1px] active:shadow-sm border-b-4 border-${status.color}-700 hover:bg-${status.color}-600`
                                      : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 shadow-sm hover:shadow transform transition-all duration-200 hover:translate-y-[-2px] active:translate-y-[1px]'}`}
                                >
                                  <span className="relative z-10">{status.label}</span>
                                  {formData.status === status.value && (
                                    <span className="absolute inset-0 rounded-lg bg-white opacity-10"></span>
                                  )}
                                </button>
                              ))}
                            </div>
                          </div>

                          {/* Submit Button */}
                          <div className="flex space-x-3">
                            {formData.status !== 'cancelled' ? (
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
                            ) : formData.status === 'cancelled' && selectedDonation.status !== 'completed' ? (
                              <button
                                type="button"
                                onClick={cancelDonationNow}
                                disabled={assigningNGO || !cancelReason.trim()}
                                className="flex-1 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 shadow-sm"
                              >
                                {assigningNGO ? (
                                  <>
                                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                    <span>Cancelling...</span>
                                  </>
                                ) : (
                                  <>
                                    <XCircle className="w-4 h-4" />
                                    <span>Cancel Donation</span>
                                  </>
                                )}
                              </button>
                            ) : (
                              <div className="flex-1 text-center text-gray-500 text-sm">
                                Cannot cancel completed donations
                              </div>
                            )}
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
                          {assignmentError && (
                            <div className="mt-3 p-3 rounded-md text-sm" style={assignmentError.includes('success') ? {
                              backgroundColor: '#f0fdf4',
                              border: '1px solid #bbf7d0',
                              color: '#166534'
                            } : {
                              backgroundColor: '#fef2f2',
                              border: '1px solid #fecaca',
                              color: '#b91c1c'
                            }}>
                              {assignmentError}
                            </div>
                          )}
                        </div>
                      </form>
                    </div>

                    {(formData.status === 'cancelled' || selectedDonation.status === 'cancelled') && (
                      <div className="bg-red-50 rounded-lg p-6 mb-4 border-2 border-red-200">
                        <h4 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                          <XCircle className="w-5 h-5 mr-2 text-red-600" />
                          Cancellation Reason
                        </h4>
                        <div className="space-y-3">
                          <textarea
                            value={cancelReason}
                            onChange={(e) => setCancelReason(e.target.value)}
                            rows={4}
                            className="w-full px-3 py-2 border border-red-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                            placeholder="Write a short reason for cancellation..."
                            disabled={assigningNGO}
                          />
                          {formData.status === 'cancelled' && !cancelReason.trim() && (
                            <p className="text-sm text-red-700">Cancellation reason is required.</p>
                          )}
                        </div>
                      </div>
                    )}
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
                {selectedDonation.status !== 'completed' && selectedDonation.status !== 'cancelled' && (
                  <button
                    type="button"
                    onClick={() => {
                      setFormData((prev) => ({ ...prev, status: 'cancelled' }));
                    }}
                    className="mt-3 w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:mt-0 sm:w-auto sm:text-sm"
                  >
                    Cancel Donation
                  </button>
                )}
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
  const [showCancelReasonModal, setShowCancelReasonModal] = useState(false);
  const [cancelTargetDonation, setCancelTargetDonation] = useState<any>(null);
  const [cancelReason, setCancelReason] = useState('');
  const [cancelling, setCancelling] = useState(false);
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
      type DonationStatus = 'pending' | 'assigned' | 'cancelled';
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

  const submitPickupCancellation = async () => {
    if (!cancelTargetDonation?._id) return;
    const reason = cancelReason.trim();
    if (!reason) {
      alert('Please enter a cancellation reason.');
      return;
    }

    setCancelling(true);
    try {
      const donationService = await import('../services/donationService');
      await donationService.updateDonation(cancelTargetDonation._id, {
        status: 'cancelled',
        cancelReason: reason
      });
      await fetchPickupDonations();
      setShowCancelReasonModal(false);
      setCancelTargetDonation(null);
      setCancelReason('');
      alert('Donation cancelled successfully!');
    } catch (error: any) {
      console.error('Error cancelling donation:', error);
      alert(error.response?.data?.error || 'Failed to cancel donation');
    } finally {
      setCancelling(false);
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
      case 'volunteer_assigned':
        return 'bg-purple-100 text-purple-800';
      case 'picked':
        return 'bg-yellow-100 text-yellow-800';
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
      { 
        id: 2, 
        name: 'Volunteer Assigned', 
        status: status === 'assigned' ? 'pending' : 
                status === 'volunteer_assigned' || status === 'picked' || status === 'completed' ? 'completed' : 
                status === 'volunteer_assigned' ? 'current' : 'pending'
      },
      { 
        id: 3, 
        name: 'Picked Up', 
        status: status === 'picked' ? 'current' : status === 'completed' ? 'completed' : 'pending' 
      },
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

  const filteredDonations = donations.filter((donation: any) => {
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
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
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
              <option value="volunteer_assigned">Volunteer Assigned</option>
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

                      {/* Volunteer Assignment Details */}
                      {donation.assignedVolunteer && (
                        <div className="bg-purple-50 rounded-lg p-4">
                          <div className="flex items-center space-x-2 mb-3">
                            <UserIcon className="w-4 h-4 text-purple-600" />
                            <h4 className="text-sm font-semibold text-gray-900">Assigned Volunteer</h4>
                          </div>
                          <div className="space-y-2">
                            <div>
                              <p className="text-xs font-medium text-gray-500">Volunteer Name</p>
                              <p className="text-sm text-gray-900 font-medium">
                                {donation.assignedVolunteer.volunteerName}
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

                      {/* Status Update Actions */}
                      <div className="bg-white border border-gray-200 rounded-lg p-4">
                        <h4 className="text-sm font-semibold text-gray-900 mb-3">Update Status</h4>
                        <div className="flex flex-wrap gap-2">
                          {donation.status !== 'completed' && donation.status !== 'cancelled' && (
                            <button
                              onClick={() => {
                                setCancelTargetDonation(donation);
                                setCancelReason('');
                                setShowCancelReasonModal(true);
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
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showCancelReasonModal && cancelTargetDonation && (
        <div className="fixed inset-0 z-[70] overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0 w-full">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true">
              <div
                className="absolute inset-0 bg-gray-900 opacity-50"
                onClick={() => !cancelling && setShowCancelReasonModal(false)}
              ></div>
            </div>
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full sm:p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Cancel Donation</h3>
                <button
                  onClick={() => setShowCancelReasonModal(false)}
                  disabled={cancelling}
                  className="text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-50"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-3">
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <p className="text-sm text-red-800">
                    Donation ID:{' '}
                    <span className="font-mono">{cancelTargetDonation._id?.substring(0, 8).toUpperCase()}</span>
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Cancellation Reason <span className="text-red-600">*</span>
                  </label>
                  <textarea
                    value={cancelReason}
                    onChange={(e) => setCancelReason(e.target.value)}
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                    placeholder="Write a short reason for cancellation..."
                    disabled={cancelling}
                  />
                </div>
              </div>

              <div className="mt-6 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowCancelReasonModal(false)}
                  disabled={cancelling}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
                >
                  Back
                </button>
                <button
                  type="button"
                  onClick={submitPickupCancellation}
                  disabled={cancelling || !cancelReason.trim()}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {cancelling ? 'Cancelling...' : 'Confirm Cancel'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Reports and Support Management Component
function ReportsManagement() {
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    status: '' as 'new' | 'read' | 'closed' | '',
    userType: '' as 'donor' | 'ngo' | '',
    queryType: ''
  });
  const [selectedMessage, setSelectedMessage] = useState<any>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  useEffect(() => {
    fetchHelpMessages();
  }, [filters]);

  const fetchHelpMessages = async () => {
    try {
      setLoading(true);
      const contactService = await import('../services/contactService');
      const response = await contactService.getAllHelpMessages({
        status: filters.status || undefined,
        userType: filters.userType || undefined,
        queryType: filters.queryType || undefined
      });

      if (response.success) {
        setMessages(response.data);
      }
    } catch (error) {
      console.error('Error fetching help messages:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateMessageStatus = async (messageId: string, status: 'new' | 'read' | 'closed') => {
    try {
      const contactService = await import('../services/contactService');
      await contactService.updateHelpMessageStatus(messageId, status);
      await fetchHelpMessages();
      if (selectedMessage?._id === messageId) {
        setSelectedMessage({ ...selectedMessage, status });
      }
    } catch (error: any) {
      console.error('Error updating message status:', error);
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
      case 'new':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'read':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'closed':
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getUserTypeColor = (userType: string) => {
    switch (userType) {
      case 'donor':
        return 'bg-blue-100 text-blue-800';
      case 'ngo':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getQueryTypeColor = (queryType: string) => {
    const type = queryType?.toLowerCase() || '';
    if (type.includes('complaint') || type.includes('issue') || type.includes('problem')) {
      return 'bg-red-100 text-red-800';
    } else if (type.includes('question') || type.includes('query') || type.includes('help')) {
      return 'bg-blue-100 text-blue-800';
    } else if (type.includes('suggestion') || type.includes('feedback')) {
      return 'bg-green-100 text-green-800';
    } else {
      return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredMessages = messages.filter(msg => {
    if (filters.status && msg.status !== filters.status) return false;
    if (filters.userType && msg.userType !== filters.userType) return false;
    if (filters.queryType && !msg.queryType?.toLowerCase().includes(filters.queryType.toLowerCase())) return false;
    return true;
  });

  const stats = {
    new: messages.filter(m => m.status === 'new').length,
    read: messages.filter(m => m.status === 'read').length,
    closed: messages.filter(m => m.status === 'closed').length,
    total: messages.length
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Reports & Support</h2>
            <p className="text-gray-600">Manage help messages and support requests</p>
          </div>
          <button
            onClick={fetchHelpMessages}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
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
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Reports & Support</h2>
          <p className="text-gray-600">Manage help messages and support requests from users</p>
        </div>
        <button
          onClick={fetchHelpMessages}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow p-4 border-l-4 border-red-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">New Messages</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{stats.new}</p>
            </div>
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
              <AlertCircle className="w-6 h-6 text-red-600" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-4 border-l-4 border-yellow-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Read</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{stats.read}</p>
            </div>
            <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center">
              <Eye className="w-6 h-6 text-yellow-600" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-4 border-l-4 border-green-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Closed</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{stats.closed}</p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-4 border-l-4 border-blue-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Total</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{stats.total}</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
              <MessageSquare className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
            <select
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value as any })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            >
              <option value="">All Status</option>
              <option value="new">New</option>
              <option value="read">Read</option>
              <option value="closed">Closed</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">User Type</label>
            <select
              value={filters.userType}
              onChange={(e) => setFilters({ ...filters, userType: e.target.value as any })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            >
              <option value="">All Users</option>
              <option value="donor">Donor</option>
              <option value="ngo">NGO</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Query Type</label>
            <input
              type="text"
              placeholder="Search query type..."
              value={filters.queryType}
              onChange={(e) => setFilters({ ...filters, queryType: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            />
          </div>
        </div>
        <div className="mt-4 flex justify-end">
          <button
            onClick={() => setFilters({ status: '', userType: '', queryType: '' })}
            className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800"
          >
            Clear Filters
          </button>
        </div>
      </div>

      {/* Messages List */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
          <h3 className="text-lg font-medium text-gray-900">
            Help Messages ({filteredMessages.length})
          </h3>
        </div>
        {filteredMessages.length === 0 ? (
          <div className="p-8 text-center">
            <MessageSquare className="w-16 h-16 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Messages Found</h3>
            <p className="text-gray-500">No help messages match your filters.</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {filteredMessages.map((message) => (
              <div
                key={message._id}
                className={`p-6 hover:bg-gray-50 transition-colors cursor-pointer ${
                  message.status === 'new' ? 'bg-red-50/30' : ''
                }`}
                onClick={() => {
                  setSelectedMessage(message);
                  setShowDetailsModal(true);
                  if (message.status === 'new') {
                    updateMessageStatus(message._id, 'read');
                  }
                }}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      {message.status === 'new' && (
                        <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                      )}
                      <h4 className="text-lg font-semibold text-gray-900">{message.name}</h4>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(message.status)}`}>
                        {message.status.charAt(0).toUpperCase() + message.status.slice(1)}
                      </span>
                      {message.userType && (
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getUserTypeColor(message.userType)}`}>
                          {message.userType.charAt(0).toUpperCase() + message.userType.slice(1)}
                        </span>
                      )}
                      {message.queryType && (
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getQueryTypeColor(message.queryType)}`}>
                          {message.queryType}
                        </span>
                      )}
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-3">
                      <div>
                        <p className="text-sm text-gray-500">Email</p>
                        <p className="text-sm text-gray-900">{message.email}</p>
                      </div>
                      {message.phone && (
                        <div>
                          <p className="text-sm text-gray-500">Phone</p>
                          <p className="text-sm text-gray-900">{message.phone}</p>
                        </div>
                      )}
                      {message.organizationName && (
                        <div>
                          <p className="text-sm text-gray-500">Organization</p>
                          <p className="text-sm text-gray-900">{message.organizationName}</p>
                        </div>
                      )}
                      <div>
                        <p className="text-sm text-gray-500">Received</p>
                        <p className="text-sm text-gray-900">{formatDate(message.createdAt)}</p>
                      </div>
                    </div>
                    <p className="text-sm text-gray-700 line-clamp-2">{message.message}</p>
                  </div>
                  <div className="ml-4 flex-shrink-0">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedMessage(message);
                        setShowDetailsModal(true);
                        if (message.status === 'new') {
                          updateMessageStatus(message._id, 'read');
                        }
                      }}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                    >
                      View Details
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Message Details Modal */}
      {showDetailsModal && selectedMessage && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-2xl font-bold text-gray-900">{selectedMessage.name}</h3>
                  <div className="flex items-center space-x-2 mt-2">
                    <span className={`px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(selectedMessage.status)}`}>
                      {selectedMessage.status.charAt(0).toUpperCase() + selectedMessage.status.slice(1)}
                    </span>
                    {selectedMessage.userType && (
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${getUserTypeColor(selectedMessage.userType)}`}>
                        {selectedMessage.userType.charAt(0).toUpperCase() + selectedMessage.userType.slice(1)}
                      </span>
                    )}
                    {selectedMessage.queryType && (
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${getQueryTypeColor(selectedMessage.queryType)}`}>
                        {selectedMessage.queryType}
                      </span>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => setShowDetailsModal(false)}
                  className="text-gray-400 hover:text-gray-500"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="space-y-4 mt-6">
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="text-sm font-semibold text-gray-900 mb-3">Contact Information</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium text-gray-500">Email</p>
                      <a href={`mailto:${selectedMessage.email}`} className="text-sm text-blue-600 hover:underline">
                        {selectedMessage.email}
                      </a>
                    </div>
                    {selectedMessage.phone && (
                      <div>
                        <p className="text-sm font-medium text-gray-500">Phone</p>
                        <a href={`tel:${selectedMessage.phone}`} className="text-sm text-blue-600 hover:underline">
                          {selectedMessage.phone}
                        </a>
                      </div>
                    )}
                    {selectedMessage.organizationName && (
                      <div>
                        <p className="text-sm font-medium text-gray-500">Organization</p>
                        <p className="text-sm text-gray-900">{selectedMessage.organizationName}</p>
                      </div>
                    )}
                    <div>
                      <p className="text-sm font-medium text-gray-500">Received</p>
                      <p className="text-sm text-gray-900">{formatDate(selectedMessage.createdAt)}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-blue-50 rounded-lg p-4">
                  <h4 className="text-sm font-semibold text-gray-900 mb-3">Message</h4>
                  <p className="text-sm text-gray-700 whitespace-pre-wrap">{selectedMessage.message}</p>
                </div>

                <div className="flex space-x-3 pt-4 border-t border-gray-200">
                  {selectedMessage.status !== 'read' && (
                    <button
                      onClick={() => updateMessageStatus(selectedMessage._id, 'read')}
                      className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors"
                    >
                      Mark as Read
                    </button>
                  )}
                  {selectedMessage.status !== 'closed' && (
                    <button
                      onClick={() => updateMessageStatus(selectedMessage._id, 'closed')}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                    >
                      Mark as Closed
                    </button>
                  )}
                  {selectedMessage.status !== 'new' && (
                    <button
                      onClick={() => updateMessageStatus(selectedMessage._id, 'new')}
                      className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                    >
                      Mark as New
                    </button>
                  )}
                  <button
                    onClick={() => setShowDetailsModal(false)}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Impact Analytics Component
function ImpactAnalytics() {
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState({
    successRate: 0,
    expiredFailedRate: 0,
    avgTimePerStage: 0
  });
  const [chartData, setChartData] = useState({
    mealsServed: 0,
    clothesDistributed: 0,
    booksDonated: 0,
    donationsByType: [] as Array<{ name: string; value: number }>,
    donationsByStatus: [] as Array<{ name: string; value: number }>,
    donationsOverTime: [] as Array<{ name: string; value: number }>,
    categoryBreakdown: [] as Array<{ name: string; value: number }>
  });
  const [ngoTableData, setNgoTableData] = useState<Array<{
    ngoName: string;
    donationsHandled: number;
    successRate: number;
    avgPickupTime: number;
    complaintsCount: number;
  }>>([]);

  useEffect(() => {
    fetchAnalyticsData();
    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchAnalyticsData, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchAnalyticsData = async () => {
    try {
      setLoading(true);
      const donationService = await import('../services/donationService');
      const contactService = await import('../services/contactService');
      const { fetchAllNGOs } = donationService;

      // Fetch all donations, NGOs, and help messages
      const [donationsResponse, ngosResponse, helpMessagesResponse] = await Promise.all([
        donationService.fetchAllDonations(),
        fetchAllNGOs(),
        contactService.getAllHelpMessages()
      ]);

      if (donationsResponse.success && Array.isArray(donationsResponse.data)) {
        const donations = donationsResponse.data;
        const totalDonations = donations.length;
        
        // Calculate metrics
        const completed = donations.filter((d: any) => d.status === 'completed').length;
        const cancelled = donations.filter((d: any) => d.status === 'cancelled').length;
        const successRate = totalDonations > 0 ? (completed / totalDonations) * 100 : 0;
        const expiredFailedRate = totalDonations > 0 ? (cancelled / totalDonations) * 100 : 0;

        // Calculate average time per stage
        let totalTime = 0;
        let stageCount = 0;
        donations.forEach((donation: any) => {
          if (donation.createdAt && donation.updatedAt) {
            const created = new Date(donation.createdAt);
            const updated = new Date(donation.updatedAt);
            const diffHours = (updated.getTime() - created.getTime()) / (1000 * 60 * 60);
            if (diffHours > 0) {
              totalTime += diffHours;
              stageCount++;
            }
          }
        });
        const avgTimePerStage = stageCount > 0 ? totalTime / stageCount : 0;

        setMetrics({
          successRate: Math.round(successRate * 10) / 10,
          expiredFailedRate: Math.round(expiredFailedRate * 10) / 10,
          avgTimePerStage: Math.round(avgTimePerStage * 10) / 10
        });

        // Calculate chart data
        let mealsServed = 0;
        let clothesDistributed = 0;
        let booksDonated = 0;

        // Donations by resource type
        const donationsByTypeMap = new Map<string, number>();
        // Donations by status
        const donationsByStatusMap = new Map<string, number>();
        // Donations over time (last 12 months)
        const donationsOverTimeMap = new Map<string, number>();
        // Category breakdown
        const categoryBreakdownMap = new Map<string, number>();

        donations.forEach((donation: any) => {
          // Resource type breakdown
          const resourceType = donation.resourceType || 'Other';
          donationsByTypeMap.set(resourceType, (donationsByTypeMap.get(resourceType) || 0) + 1);

          // Status breakdown
          const status = donation.status || 'pending';
          donationsByStatusMap.set(status, (donationsByStatusMap.get(status) || 0) + 1);

          // Time-based data (group by month)
          if (donation.createdAt) {
            const date = new Date(donation.createdAt);
            const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
            donationsOverTimeMap.set(monthKey, (donationsOverTimeMap.get(monthKey) || 0) + 1);
          }

          // Completed donations for impact metrics
          if (donation.status === 'completed') {
            if (donation.resourceType === 'Food') {
              if (donation.unit === 'kg') {
                mealsServed += donation.quantity || 0;
              } else if (donation.details?.approxWeight) {
                mealsServed += Number(donation.details.approxWeight) || 0;
              }
            } else if (donation.resourceType === 'Clothes') {
              clothesDistributed += donation.quantity || 0;
            } else if (donation.resourceType === 'Books') {
              booksDonated += donation.quantity || 0;
            }

            // Category breakdown for completed donations
            const category = donation.details?.category || donation.resourceType || 'Other';
            categoryBreakdownMap.set(category, (categoryBreakdownMap.get(category) || 0) + 1);
          }
        });

        // Convert maps to arrays for charts
        const donationsByType = Array.from(donationsByTypeMap.entries())
          .map(([name, value]) => ({ name, value }))
          .sort((a, b) => b.value - a.value);

        const donationsByStatus = Array.from(donationsByStatusMap.entries())
          .map(([name, value]) => ({ 
            name: name.charAt(0).toUpperCase() + name.slice(1).replace('_', ' '), 
            value 
          }))
          .sort((a, b) => b.value - a.value);

        // Sort donations over time by date
        const donationsOverTime = Array.from(donationsOverTimeMap.entries())
          .map(([name, value]) => ({ name, value }))
          .sort((a, b) => a.name.localeCompare(b.name))
          .slice(-12); // Last 12 months

        const categoryBreakdown = Array.from(categoryBreakdownMap.entries())
          .map(([name, value]) => ({ name, value }))
          .sort((a, b) => b.value - a.value);

        setChartData({
          mealsServed: Math.round(mealsServed),
          clothesDistributed,
          booksDonated,
          donationsByType,
          donationsByStatus,
          donationsOverTime,
          categoryBreakdown
        });

        // Calculate NGO table data
        if (ngosResponse.success && Array.isArray(ngosResponse.data)) {
          const ngos = ngosResponse.data;
          const helpMessages = helpMessagesResponse.success && Array.isArray(helpMessagesResponse.data) 
            ? helpMessagesResponse.data 
            : [];

          console.log('Calculating NGO stats:', {
            ngosCount: ngos.length,
            donationsCount: donations.length,
            donationsWithNGO: donations.filter((d: any) => d.assignedNGO?.ngoFirebaseUid).length
          });

          const ngoStats = ngos.map((ngo: any) => {
            // Filter donations assigned to this NGO
            // Handle cases where assignedNGO might be null, undefined, or empty object
            const ngoDonations = donations.filter((d: any) => {
              if (!d.assignedNGO || !ngo.firebaseUid) return false;
              
              // Check if ngoFirebaseUid matches (handle both string and object cases)
              const donationNgoUid = d.assignedNGO.ngoFirebaseUid;
              const match = donationNgoUid && donationNgoUid === ngo.firebaseUid;
              
              if (match) {
                console.log(`Donation ${d._id} matched NGO ${ngo.organizationName || ngo.name}:`, {
                  donationNGO: donationNgoUid,
                  ngoFirebaseUid: ngo.firebaseUid,
                  status: d.status,
                  assignedAt: d.assignedNGO?.assignedAt
                });
              }
              return match;
            });
            
            const completedDonations = ngoDonations.filter((d: any) => d.status === 'completed');
            const donationsHandled = ngoDonations.length;
            const successRate = donationsHandled > 0 
              ? (completedDonations.length / donationsHandled) * 100 
              : 0;

            // Calculate average pickup time
            // Calculate time from assignment to pickup/completion for donations that have been picked or completed
            let totalPickupTime = 0;
            let pickupCount = 0;
            ngoDonations.forEach((donation: any) => {
              // Calculate time for donations that have been picked or completed
              if (['picked', 'completed'].includes(donation.status) && donation.assignedNGO?.assignedAt) {
                try {
                  const assigned = new Date(donation.assignedNGO.assignedAt);
                  // Use updatedAt as the time when status changed to picked/completed
                  const statusChanged = new Date(donation.updatedAt);
                  const diffHours = (statusChanged.getTime() - assigned.getTime()) / (1000 * 60 * 60);
                  // Only count positive time differences (sanity check)
                  if (diffHours > 0 && diffHours < 720) { // Max 30 days (720 hours) to filter out invalid data
                    totalPickupTime += diffHours;
                    pickupCount++;
                  }
                } catch (error) {
                  console.error('Error calculating pickup time for donation:', donation._id, error);
                }
              }
            });
            const avgPickupTime = pickupCount > 0 ? totalPickupTime / pickupCount : 0;

            // Count complaints (help messages from this NGO)
            const complaintsCount = helpMessages.filter((msg: any) => 
              msg.userType === 'ngo' && 
              (msg.organizationName?.toLowerCase().includes(ngo.organizationName?.toLowerCase() || '') ||
               msg.firebaseUid === ngo.firebaseUid)
            ).length;

            const stats = {
              ngoName: ngo.organizationName || ngo.name || 'Unknown NGO',
              donationsHandled,
              successRate: Math.round(successRate * 10) / 10,
              avgPickupTime: Math.round(avgPickupTime * 10) / 10,
              complaintsCount
            };

            console.log(`NGO ${stats.ngoName} stats:`, stats);
            return stats;
          });

          // Filter out invalid NGOs (like "ABC" or empty names) and NGOs with no data
          const validNgoStats = ngoStats.filter(ngo => {
            const isValidName = ngo.ngoName && 
                                ngo.ngoName.trim() !== '' && 
                                ngo.ngoName.toLowerCase() !== 'abc' &&
                                ngo.ngoName.toLowerCase() !== 'unknown ngo' &&
                                ngo.ngoName !== 'NGO';
            return isValidName;
          });

          const sortedStats = validNgoStats.sort((a, b) => b.donationsHandled - a.donationsHandled);
          console.log('Final NGO table data (filtered):', sortedStats);
          setNgoTableData(sortedStats);
        } else {
          console.error('Failed to fetch NGOs or invalid response:', ngosResponse);
        }
      }
    } catch (error) {
      console.error('Error fetching analytics data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Analytics Dashboard</h2>
          <p className="text-gray-600">Real-time analytics and performance metrics</p>
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
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Analytics Dashboard</h2>
            <p className="text-gray-600">Real-time analytics and performance metrics</p>
          </div>
          <button
            onClick={fetchAnalyticsData}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-green-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Successfully Distributed</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{metrics.successRate}%</p>
              <p className="text-xs text-gray-500 mt-1">Completed donations</p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-red-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Expired / Failed</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{metrics.expiredFailedRate}%</p>
              <p className="text-xs text-gray-500 mt-1">Cancelled donations</p>
            </div>
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
              <XCircle className="w-6 h-6 text-red-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-blue-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Avg Time Per Stage</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{metrics.avgTimePerStage}h</p>
              <p className="text-xs text-gray-500 mt-1">Average processing time</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
              <Clock className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Impact Metrics Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Total Meals Served */}
        <div className="bg-white rounded-xl shadow-md p-6 border border-gray-200">
          <div className="mb-4">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center">
              <span className="text-2xl mr-2">🍽️</span>
              Total Meals Served
            </h3>
            <p className="text-sm text-gray-500 mt-1">Food distributed (in kg)</p>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={[{ name: 'Meals', value: chartData.mealsServed }]}>
              <Bar dataKey="value" fill="#10B981" radius={[8, 8, 0, 0]}>
                <Cell fill="#10B981" />
              </Bar>
              <Tooltip formatter={(value: any) => [`${value} kg`, 'Food']} />
            </BarChart>
          </ResponsiveContainer>
          <p className="text-2xl font-bold text-gray-900 mt-4 text-center">{chartData.mealsServed.toLocaleString()} kg</p>
        </div>

        {/* Clothes Distributed */}
        <div className="bg-white rounded-xl shadow-md p-6 border border-gray-200">
          <div className="mb-4">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center">
              <span className="text-2xl mr-2">👕</span>
              Clothes Distributed
            </h3>
            <p className="text-sm text-gray-500 mt-1">Items distributed</p>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={[{ name: 'Clothes', value: chartData.clothesDistributed }]}>
              <Bar dataKey="value" fill="#3B82F6" radius={[8, 8, 0, 0]}>
                <Cell fill="#3B82F6" />
              </Bar>
              <Tooltip formatter={(value: any) => [`${value} items`, 'Clothes']} />
            </BarChart>
          </ResponsiveContainer>
          <p className="text-2xl font-bold text-gray-900 mt-4 text-center">{chartData.clothesDistributed.toLocaleString()}</p>
        </div>

        {/* Books Donated */}
        <div className="bg-white rounded-xl shadow-md p-6 border border-gray-200">
          <div className="mb-4">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center">
              <span className="text-2xl mr-2">📚</span>
              Books Donated
            </h3>
            <p className="text-sm text-gray-500 mt-1">Books distributed</p>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={[{ name: 'Books', value: chartData.booksDonated }]}>
              <Bar dataKey="value" fill="#F59E0B" radius={[8, 8, 0, 0]}>
                <Cell fill="#F59E0B" />
              </Bar>
              <Tooltip formatter={(value: any) => [`${value} books`, 'Books']} />
            </BarChart>
          </ResponsiveContainer>
          <p className="text-2xl font-bold text-gray-900 mt-4 text-center">{chartData.booksDonated.toLocaleString()}</p>
        </div>
      </div>

      {/* Analytics Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        {/* Donations by Resource Type */}
        <div className="bg-white rounded-xl shadow-md p-6 border border-gray-200">
          <div className="mb-4">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center">
              <BarChart3 className="w-5 h-5 mr-2 text-blue-500" />
              Donations by Resource Type
            </h3>
            <p className="text-sm text-gray-500 mt-1">Distribution across all resource types</p>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={chartData.donationsByType}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name}: ${((percent || 0) * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {chartData.donationsByType.map((entry, index) => {
                  const colors = ['#10B981', '#3B82F6', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#06B6D4', '#84CC16'];
                  return <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />;
                })}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Donations by Status */}
        <div className="bg-white rounded-xl shadow-md p-6 border border-gray-200">
          <div className="mb-4">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center">
              <Activity className="w-5 h-5 mr-2 text-purple-500" />
              Donations by Status
            </h3>
            <p className="text-sm text-gray-500 mt-1">Current status distribution</p>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData.donationsByStatus}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="value" fill="#8B5CF6" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Donations Over Time */}
        <div className="bg-white rounded-xl shadow-md p-6 border border-gray-200">
          <div className="mb-4">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center">
              <TrendingUp className="w-5 h-5 mr-2 text-green-500" />
              Donations Over Time
            </h3>
            <p className="text-sm text-gray-500 mt-1">Monthly donation trends</p>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData.donationsOverTime}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="value" stroke="#10B981" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Category Breakdown */}
        <div className="bg-white rounded-xl shadow-md p-6 border border-gray-200">
          <div className="mb-4">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center">
              <Package className="w-5 h-5 mr-2 text-orange-500" />
              Category Breakdown
            </h3>
            <p className="text-sm text-gray-500 mt-1">Completed donations by category</p>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData.categoryBreakdown}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="value" fill="#F59E0B" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* NGO Performance Table */}
      <div className="bg-white rounded-xl shadow-md border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">NGO Performance</h3>
          <p className="text-sm text-gray-500 mt-1">Detailed metrics for each NGO</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">NGO Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Donations Handled</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Success Rate</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Avg Pickup Time</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Complaints Count</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {ngoTableData.length > 0 ? (
                ngoTableData.map((ngo, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{ngo.ngoName}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{ngo.donationsHandled}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="text-sm font-medium text-gray-900">{ngo.successRate}%</div>
                        <div className={`ml-2 w-16 h-2 bg-gray-200 rounded-full overflow-hidden`}>
                          <div 
                            className={`h-full ${ngo.successRate >= 80 ? 'bg-green-500' : ngo.successRate >= 60 ? 'bg-yellow-500' : 'bg-red-500'}`}
                            style={{ width: `${Math.min(ngo.successRate, 100)}%` }}
                          />
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{ngo.avgPickupTime.toFixed(1)}h</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        ngo.complaintsCount === 0 
                          ? 'bg-green-100 text-green-800' 
                          : ngo.complaintsCount <= 2 
                          ? 'bg-yellow-100 text-yellow-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {ngo.complaintsCount}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="px-6 py-4 text-center text-sm text-gray-500">
                    No NGO data available
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// Notifications Panel Component
function NotificationsPanel() {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'unread' | 'read'>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  useEffect(() => {
    fetchNotifications();
    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, [filter, categoryFilter]);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const { auth } = await import('../firebase');
      const axios = await import('axios');
      const token = await auth.currentUser?.getIdToken();
      if (!token) throw new Error('No auth token');
      
      const params: any = {};
      if (filter === 'unread') params.read = 'false';
      else if (filter === 'read') params.read = 'true';
      if (categoryFilter !== 'all') params.category = categoryFilter;
      
      const response = await axios.default.get('http://localhost:5000/api/v1/notifications/admin/all', {
        headers: { Authorization: `Bearer ${token}` },
        params
      });
      
      if (response.data.success) {
        setNotifications(response.data.data || []);
      } else {
        setError('Failed to fetch notifications');
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'An error occurred while fetching notifications');
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
      const diffMinutes = Math.floor(diffTime / (1000 * 60));
      const diffHours = Math.floor(diffTime / (1000 * 60 * 60));
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
      
      if (diffMinutes < 1) {
        return 'Just now';
      } else if (diffMinutes < 60) {
        return `${diffMinutes}m ago`;
      } else if (diffHours < 24) {
        return `${diffHours}h ago`;
      } else if (diffDays < 7) {
        return `${diffDays}d ago`;
      } else {
        return date.toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric'
        });
      }
    } catch (e) {
      console.error('Invalid date string:', dateString);
      return 'Invalid date';
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'donations':
        return 'bg-blue-100 text-blue-800';
      case 'pickups':
        return 'bg-green-100 text-green-800';
      case 'system':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredNotifications = notifications.filter(notif => {
    if (filter === 'unread' && notif.read) return false;
    if (filter === 'read' && !notif.read) return false;
    if (categoryFilter !== 'all' && notif.category !== categoryFilter) return false;
    return true;
  });

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Notifications</h2>
          <p className="text-gray-600">View all notifications sent to donors</p>
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
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Notifications</h2>
        <p className="text-gray-600">View all notifications sent to donors</p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">{error}</p>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex flex-wrap gap-4 items-center">
          <div className="flex items-center space-x-2">
            <label className="text-sm font-medium text-gray-700">Status:</label>
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value as 'all' | 'unread' | 'read')}
              className="px-3 py-1.5 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All</option>
              <option value="unread">Unread</option>
              <option value="read">Read</option>
            </select>
          </div>
          <div className="flex items-center space-x-2">
            <label className="text-sm font-medium text-gray-700">Category:</label>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-3 py-1.5 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All</option>
              <option value="donations">Donations</option>
              <option value="pickups">Pickups</option>
              <option value="system">System</option>
            </select>
          </div>
          <button
            onClick={fetchNotifications}
            className="ml-auto px-4 py-1.5 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
        </div>
      </div>

      {/* Notifications List */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium text-gray-900">All Notifications</h3>
            <span className="text-sm text-gray-500">
              {filteredNotifications.length} notification{filteredNotifications.length !== 1 ? 's' : ''}
            </span>
          </div>
        </div>
        
        <div className="p-6 overflow-x-auto">
          {filteredNotifications.length === 0 ? (
            <div className="text-center py-12 min-w-full">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-gray-100">
                <Bell className="h-6 w-6 text-gray-400" />
              </div>
              <h3 className="mt-2 text-sm font-medium text-gray-900">No notifications found</h3>
              <p className="mt-1 text-sm text-gray-500">
                {filter === 'all' 
                  ? "No notifications have been sent yet." 
                  : `No ${filter} notifications found.`}
              </p>
            </div>
          ) : (
            <div className="space-y-3 min-w-full">
              {filteredNotifications.map((notification) => (
                <div
                  key={notification._id}
                  className={`p-4 rounded-lg border transition-all min-w-full ${
                    !notification.read 
                      ? 'bg-blue-50 border-blue-200' 
                      : 'bg-gray-50 border-gray-200'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2 mb-2 flex-wrap">
                        {!notification.read && (
                          <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse flex-shrink-0"></div>
                        )}
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${getCategoryColor(notification.category)}`}>
                          {notification.category || 'System'}
                        </span>
                        <span className="text-xs text-gray-500 whitespace-nowrap">
                          {formatDate(notification.createdAt)}
                        </span>
                        {notification.read && (
                          <span className="text-xs text-gray-400">• Read</span>
                        )}
                      </div>
                      
                      <h4 className="text-sm font-semibold text-gray-900 mb-1">
                        {notification.title}
                      </h4>
                      
                      <p className="text-sm text-gray-600 mb-2">
                        {notification.message}
                      </p>
                      
                      <div className="flex items-center space-x-4 text-xs text-gray-600">
                        <span className="flex items-center">
                          <UserIcon className="w-3 h-3 mr-1" />
                          {notification.donor?.name || 'Unknown Donor'}
                        </span>
                        <span className="flex items-center">
                          <MessageSquare className="w-3 h-3 mr-1" />
                          {notification.donor?.email || 'N/A'}
                        </span>
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
  const [activeTab, setActiveTab] = useState('platform');
  const [settings, setSettings] = useState({
    // Platform Settings
    pickupRadius: 5,
    maxActiveDonations: 5,
    foodExpiryHours: 4,
    clothesExpiryDays: 7,
    booksExpiryDays: 30,
    enabledCategories: ['food', 'clothes', 'books', 'other'] as string[],
    
    // Impact Settings
    foodToMealsRatio: 4,
    clothesToFamiliesRatio: 1,
    booksToChildrenRatio: 3,
    
    // Verification
    requireDocuments: true,
    autoApproveNGOs: false,
    requiredDocuments: ['Registration Certificate', 'PAN Card', 'Address Proof'] as string[],
    
    // User Management
    allowNewNgoRegistrations: true,
    allowProfileEdits: true,
    allowDonorSelfEdit: true,
    
    // Notifications
    notifyOnDonation: true,
    notifyFoodExpiry: true,
    notifyNgoStatus: true,
    enableAnnouncements: true,
    
    // Safety
    requireQualityChecklist: true,
    minPhotosRequired: 2,
    allowNgoRejection: true,
    
    // Reports
    autoEscalationHours: 24,
    reportCategories: ['Poor Quality', 'No Show', 'Inappropriate', 'Other'] as string[],
    blacklistedEmails: [] as string[],
  });

  const [newReportCategory, setNewReportCategory] = useState('');
  const [newBlacklistedEmail, setNewBlacklistedEmail] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const handleSaveSettings = async () => {
    setIsSaving(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      // Here you would typically make an API call to save the settings
      // await saveSettings(settings);
      alert('Settings saved successfully!');
    } catch (error) {
      console.error('Error saving settings:', error);
      alert('Failed to save settings');
    } finally {
      setIsSaving(false);
    }
  };

  const addReportCategory = () => {
    if (newReportCategory && !settings.reportCategories.includes(newReportCategory)) {
      setSettings({
        ...settings,
        reportCategories: [...settings.reportCategories, newReportCategory]
      });
      setNewReportCategory('');
    }
  };

  const removeReportCategory = (category: string) => {
    setSettings({
      ...settings,
      reportCategories: settings.reportCategories.filter(c => c !== category)
    });
  };

  const addBlacklistedEmail = () => {
    if (newBlacklistedEmail && !settings.blacklistedEmails.includes(newBlacklistedEmail)) {
      setSettings({
        ...settings,
        blacklistedEmails: [...settings.blacklistedEmails, newBlacklistedEmail]
      });
      setNewBlacklistedEmail('');
    }
  };

  const removeBlacklistedEmail = (email: string) => {
    setSettings({
      ...settings,
      blacklistedEmails: settings.blacklistedEmails.filter(e => e !== email)
    });
  };

  const toggleCategory = (category: string) => {
    setSettings({
      ...settings,
      enabledCategories: settings.enabledCategories.includes(category)
        ? settings.enabledCategories.filter(c => c !== category)
        : [...settings.enabledCategories, category]
    });
  };

  const toggleDocument = (doc: string) => {
    setSettings({
      ...settings,
      requiredDocuments: settings.requiredDocuments.includes(doc)
        ? settings.requiredDocuments.filter(d => d !== doc)
        : [...settings.requiredDocuments, doc]
    });
  };

  const renderSettingItem = (label: string, description: string, control: React.ReactNode, className: string = "flex items-center justify-between") => (
    <div className={className}>
      <div className="space-y-0.5">
        <label className="block text-sm font-medium text-gray-700">{label}</label>
        <p className="text-xs text-gray-500">{description}</p>
      </div>
      {control}
    </div>
  );

  return (
    <div className="space-y-6 p-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Admin Settings</h2>
          <p className="text-sm text-gray-600">Configure platform settings and behavior</p>
        </div>
        <button 
          onClick={handleSaveSettings}
          disabled={isSaving}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center"
        >
          {isSaving ? 'Saving...' : 'Save Settings'}
        </button>
      </div>

      <div className="flex space-x-2 overflow-x-auto pb-2">
        {['Platform', 'Impact', 'Verification', 'Users', 'Notifications', 'Safety', 'Reports'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab.toLowerCase())}
            className={`px-4 py-2 rounded-lg text-sm font-medium ${
              activeTab === tab.toLowerCase() 
                ? 'bg-blue-100 text-blue-700' 
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-xl shadow p-6 space-y-6">
        {activeTab === 'platform' && (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold">Platform Configuration</h3>
            
            <div className="space-y-4">
              <h4 className="font-medium">Donation Settings</h4>
              {renderSettingItem(
                "Default Pickup Radius (km)",
                "Maximum distance for donors to see available donations",
                <input
                  type="number"
                  className="w-24 px-3 py-2 border border-gray-300 rounded-lg"
                  value={settings.pickupRadius}
                  onChange={(e) => setSettings({...settings, pickupRadius: Number(e.target.value)})}
                  min={1}
                  max={50}
                />
              )}

              {renderSettingItem(
                "Max Active Donations per Donor",
                "Maximum number of active donations per donor",
                <input
                  type="number"
                  className="w-24 px-3 py-2 border border-gray-300 rounded-lg"
                  value={settings.maxActiveDonations}
                  onChange={(e) => setSettings({...settings, maxActiveDonations: Number(e.target.value)})}
                  min={1}
                />
              )}
            </div>

            <div className="space-y-4">
              <h4 className="font-medium">Donation Expiry</h4>
              {renderSettingItem(
                "Food Expiry (hours)",
                "Time after which food donations expire",
                <input
                  type="number"
                  className="w-24 px-3 py-2 border border-gray-300 rounded-lg"
                  value={settings.foodExpiryHours}
                  onChange={(e) => setSettings({...settings, foodExpiryHours: Number(e.target.value)})}
                  min={1}
                />
              )}

              {renderSettingItem(
                "Clothes Expiry (days)",
                "Time after which clothing donations expire",
                <input
                  type="number"
                  className="w-24 px-3 py-2 border border-gray-300 rounded-lg"
                  value={settings.clothesExpiryDays}
                  onChange={(e) => setSettings({...settings, clothesExpiryDays: Number(e.target.value)})}
                  min={1}
                />
              )}

              {renderSettingItem(
                "Books Expiry (days)",
                "Time after which book donations expire",
                <input
                  type="number"
                  className="w-24 px-3 py-2 border border-gray-300 rounded-lg"
                  value={settings.booksExpiryDays}
                  onChange={(e) => setSettings({...settings, booksExpiryDays: Number(e.target.value)})}
                  min={1}
                />
              )}
            </div>

            <div className="space-y-4">
              <h4 className="font-medium">Enabled Categories</h4>
              <div className="grid grid-cols-2 gap-4">
                {['food', 'clothes', 'books', 'other'].map((category) => (
                  <div key={category} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id={`category-${category}`}
                      checked={settings.enabledCategories.includes(category)}
                      onChange={() => toggleCategory(category)}
                      className="h-4 w-4 text-blue-600 rounded"
                    />
                    <label htmlFor={`category-${category}`} className="text-sm font-medium text-gray-700">
                      {category.charAt(0).toUpperCase() + category.slice(1)}
                    </label>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'impact' && (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold">Impact Calculation</h3>
            
            {renderSettingItem(
              "1 kg of Food = Meals",
              "Number of meals per kg of food",
              <input
                type="number"
                className="w-24 px-3 py-2 border border-gray-300 rounded-lg"
                value={settings.foodToMealsRatio}
                onChange={(e) => setSettings({...settings, foodToMealsRatio: Number(e.target.value)})}
                min={1}
              />
            )}

            {renderSettingItem(
              "1 kg of Clothes = Families Helped",
              "Number of families helped per kg of clothes",
              <input
                type="number"
                step="0.1"
                className="w-24 px-3 py-2 border border-gray-300 rounded-lg"
                value={settings.clothesToFamiliesRatio}
                onChange={(e) => setSettings({...settings, clothesToFamiliesRatio: Number(e.target.value)})}
                min={0.1}
              />
            )}

            {renderSettingItem(
              "1 Book = Children Benefited",
              "Number of children benefited per book",
              <input
                type="number"
                className="w-24 px-3 py-2 border border-gray-300 rounded-lg"
                value={settings.booksToChildrenRatio}
                onChange={(e) => setSettings({...settings, booksToChildrenRatio: Number(e.target.value)})}
                min={1}
              />
            )}
          </div>
        )}

        {activeTab === 'verification' && (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold">NGO Verification Rules</h3>
            
            {renderSettingItem(
              "Require Documents for Verification",
              "NGOs must upload required documents for verification",
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  className="sr-only peer"
                  checked={settings.requireDocuments}
                  onChange={(e) => setSettings({...settings, requireDocuments: e.target.checked})}
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            )}

            {renderSettingItem(
              "Auto-approve NGOs",
              "Automatically approve NGOs after document submission",
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  className="sr-only peer"
                  checked={settings.autoApproveNGOs}
                  onChange={(e) => setSettings({...settings, autoApproveNGOs: e.target.checked})}
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            )}

            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">Required Documents</label>
              <div className="space-y-2">
                {['Registration Certificate', 'PAN Card', 'Address Proof', 'Bank Details'].map((doc) => (
                  <div key={doc} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id={`doc-${doc}`}
                      checked={settings.requiredDocuments.includes(doc)}
                      onChange={() => toggleDocument(doc)}
                      className="h-4 w-4 text-blue-600 rounded"
                    />
                    <label htmlFor={`doc-${doc}`} className="text-sm text-gray-700">
                      {doc}
                    </label>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'users' && (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold">User Management</h3>
            
            {renderSettingItem(
              "Allow New NGO Registrations",
              "Enable/disable new NGO signups",
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  className="sr-only peer"
                  checked={settings.allowNewNgoRegistrations}
                  onChange={(e) => setSettings({...settings, allowNewNgoRegistrations: e.target.checked})}
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            )}

            {renderSettingItem(
              "Allow Profile Edits by Admins",
              "Allow admins to edit user profiles",
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  className="sr-only peer"
                  checked={settings.allowProfileEdits}
                  onChange={(e) => setSettings({...settings, allowProfileEdits: e.target.checked})}
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            )}

            {renderSettingItem(
              "Allow Donor Self-Edit",
              "Allow donors to edit their own profiles",
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  className="sr-only peer"
                  checked={settings.allowDonorSelfEdit}
                  onChange={(e) => setSettings({...settings, allowDonorSelfEdit: e.target.checked})}
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            )}
          </div>
        )}

        {activeTab === 'notifications' && (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold">Notification Settings</h3>
            
            {renderSettingItem(
              "Notify on New Donation",
              "Send notification when a new donation is posted",
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  className="sr-only peer"
                  checked={settings.notifyOnDonation}
                  onChange={(e) => setSettings({...settings, notifyOnDonation: e.target.checked})}
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            )}

            {renderSettingItem(
              "Notify on Food Expiry",
              "Send notification when food is about to expire",
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  className="sr-only peer"
                  checked={settings.notifyFoodExpiry}
                  onChange={(e) => setSettings({...settings, notifyFoodExpiry: e.target.checked})}
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            )}

            {renderSettingItem(
              "Notify on NGO Status Change",
              "Send notification when NGO verification status changes",
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  className="sr-only peer"
                  checked={settings.notifyNgoStatus}
                  onChange={(e) => setSettings({...settings, notifyNgoStatus: e.target.checked})}
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            )}

            {renderSettingItem(
              "Enable Announcements",
              "Allow sending broadcast announcements to users",
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  className="sr-only peer"
                  checked={settings.enableAnnouncements}
                  onChange={(e) => setSettings({...settings, enableAnnouncements: e.target.checked})}
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            )}
          </div>
        )}

        {activeTab === 'safety' && (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold">Safety & Quality Controls</h3>
            
            {renderSettingItem(
              "Require Quality Checklist",
              "Donors must complete quality checklist before posting",
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  className="sr-only peer"
                  checked={settings.requireQualityChecklist}
                  onChange={(e) => setSettings({...settings, requireQualityChecklist: e.target.checked})}
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            )}

            {renderSettingItem(
              "Minimum Photos Required",
              "Minimum number of photos required for donation",
              <select
                className="border border-gray-300 rounded-lg px-3 py-2"
                value={settings.minPhotosRequired}
                onChange={(e) => setSettings({...settings, minPhotosRequired: Number(e.target.value)})}
              >
                {[0, 1, 2, 3, 4, 5].map(num => (
                  <option key={num} value={num}>{num} {num === 1 ? 'photo' : 'photos'}</option>
                ))}
              </select>
            )}

            {renderSettingItem(
              "Allow NGO to Reject Donations",
              "Allow NGOs to reject donations with valid reasons",
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  className="sr-only peer"
                  checked={settings.allowNgoRejection}
                  onChange={(e) => setSettings({...settings, allowNgoRejection: e.target.checked})}
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            )}
          </div>
        )}

        {activeTab === 'reports' && (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold">Report & Complaint Settings</h3>
            
            {renderSettingItem(
              "Auto-escalation Time (hours)",
              "Time after which unresolved reports are escalated",
              <input
                type="number"
                className="w-24 px-3 py-2 border border-gray-300 rounded-lg"
                value={settings.autoEscalationHours}
                onChange={(e) => setSettings({...settings, autoEscalationHours: Number(e.target.value)})}
                min={1}
              />
            )}

            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">Report Categories</label>
              <div className="flex space-x-2">
                <input
                  type="text"
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg"
                  value={newReportCategory}
                  onChange={(e) => setNewReportCategory(e.target.value)}
                  placeholder="Add new category"
                  onKeyPress={(e) => e.key === 'Enter' && addReportCategory()}
                />
                <button
                  onClick={addReportCategory}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Add
                </button>
              </div>
              <div className="flex flex-wrap gap-2 mt-2">
                {settings.reportCategories.map((category) => (
                  <div key={category} className="flex items-center bg-gray-100 rounded-full px-3 py-1 text-sm">
                    {category}
                    <button
                      onClick={() => removeReportCategory(category)}
                      className="ml-2 text-gray-500 hover:text-red-500"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">Blacklisted Emails</label>
              <div className="flex space-x-2">
                <input
                  type="email"
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg"
                  value={newBlacklistedEmail}
                  onChange={(e) => setNewBlacklistedEmail(e.target.value)}
                  placeholder="Add email to blacklist"
                  onKeyPress={(e) => e.key === 'Enter' && addBlacklistedEmail()}
                />
                <button
                  onClick={addBlacklistedEmail}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                >
                  Block
                </button>
              </div>
              {settings.blacklistedEmails.length > 0 && (
                <div className="mt-2 space-y-1">
                  {settings.blacklistedEmails.map((email) => (
                    <div key={email} className="flex items-center justify-between bg-red-50 rounded-lg px-3 py-2 text-sm">
                      <span>{email}</span>
                      <button
                        onClick={() => removeBlacklistedEmail(email)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
