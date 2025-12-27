import { useState, useRef, useEffect } from 'react';
import { getMyNotifications, markNotificationAsRead, markAllNotificationsAsRead, type Notification as NotificationType } from '../services/notificationService';

const Notification = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationType[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState<'all' | 'donations' | 'system'>('all');
  const notificationRef = useRef<HTMLDivElement>(null);

  // Close notification when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Fetch notifications when dropdown opens
  useEffect(() => {
    if (isOpen) {
      fetchNotifications();
    }
  }, [isOpen, filter]);

  // Real-time updates - poll for unread count every 30 seconds
  useEffect(() => {
    const pollUnreadCount = async () => {
      try {
        const response = await getMyNotifications({ includeRead: false, limit: 1 });
        setUnreadCount(response.unreadCount);
      } catch (error) {
        console.error('Error polling unread count:', error);
      }
    };

    // Initial poll
    pollUnreadCount();

    // Set up polling interval
    const interval = setInterval(pollUnreadCount, 30000); // 30 seconds

    return () => clearInterval(interval);
  }, []);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const params = filter === 'all' ? {} : { category: filter };
      const response = await getMyNotifications(params);
      setNotifications(response.data);
      setUnreadCount(response.unreadCount);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsRead = async (id: string) => {
    try {
      await markNotificationAsRead(id);
      setNotifications(notifications.map(notification =>
        notification._id === id ? { ...notification, read: true, readAt: new Date().toISOString() } : notification
      ));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await markAllNotificationsAsRead();
      setNotifications(notifications.map(notification => ({
        ...notification,
        read: true,
        readAt: new Date().toISOString()
      })));
      setUnreadCount(0);
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  const handleNotificationClick = async (notification: NotificationType) => {
    if (!notification.read) {
      await handleMarkAsRead(notification._id);
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffInMs = now.getTime() - date.getTime();
    const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
    const diffInHours = Math.floor(diffInMinutes / 60);
    const diffInDays = Math.floor(diffInHours / 24);

    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInHours < 24) return `${diffInHours}h ago`;
    return `${diffInDays}d ago`;
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'donations':
        return (
          <div className="h-8 w-8 rounded-full bg-emerald-100 flex items-center justify-center">
            <svg className="h-4 w-4 text-emerald-600" fill="currentColor" viewBox="0 0 20 20">
              <path d="M8 9a3 3 0 100-6 3 3 0 000 6zM8 11a6 3 0 016 3H2a6 3 0 016-3z" />
            </svg>
          </div>
        );
      case 'pickups':
        return (
          <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
            <svg className="h-4 w-4 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
              <path d="M8 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM15 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z" />
              <path d="M3 4a1 1 0 00-1 1v10a1 1 0 001 1h1.05a2.5 2.5 0 014.9 0H10a1 1 0 001-1V5a1 1 0 00-1-1H3zM14 7a1 1 0 00-1 1v6.05A2.5 2.5 0 0115.95 16H17a1 1 0 001-1V8a1 1 0 00-1-1h-3z" />
            </svg>
          </div>
        );
      case 'system':
        return (
          <div className="h-8 w-8 rounded-full bg-yellow-100 flex items-center justify-center">
            <svg className="h-4 w-4 text-yellow-600" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h2a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
          </div>
        );
      default:
        return (
          <div className="h-8 w-8 rounded-full bg-gray-100 flex items-center justify-center">
            <svg className="h-4 w-4 text-gray-600" fill="currentColor" viewBox="0 0 20 20">
              <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
              <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
            </svg>
          </div>
        );
    }
  };

  return (
    <div className="relative" ref={notificationRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-600 hover:text-emerald-600 focus:outline-none"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-6 w-6"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
          />
        </svg>
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 h-4 w-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Notification dropdown */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-96 bg-white rounded-lg shadow-xl border border-gray-200 overflow-hidden z-50">
          <div className="p-4 border-b border-gray-200">
            <div className="flex justify-between items-center mb-3">
              <h3 className="font-medium text-gray-800">Notifications</h3>
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllAsRead}
                  className="text-sm text-emerald-600 hover:text-emerald-700"
                >
                  Mark all as read
                </button>
              )}
            </div>

            {/* Category filter */}
            <div className="flex space-x-1">
              {[
                { key: 'all', label: 'All' },
                { key: 'donations', label: 'Donations' },
                { key: 'system', label: 'System' }
              ].map(({ key, label }) => (
                <button
                  key={key}
                  onClick={() => setFilter(key as any)}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                    filter === key
                      ? 'bg-emerald-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div className="max-h-96 overflow-y-auto">
            {loading ? (
              <div className="p-4 text-center text-gray-500 text-sm">
                Loading notifications...
              </div>
            ) : notifications.length > 0 ? (
              notifications.map((notification) => (
                <div
                  key={notification._id}
                  onClick={() => handleNotificationClick(notification)}
                  className={`p-4 border-b border-gray-100 hover:bg-gray-50 cursor-pointer ${
                    !notification.read ? 'bg-emerald-50' : ''
                  }`}
                >
                  <div className="flex items-start">
                    <div className="flex-shrink-0">
                      {getCategoryIcon(notification.category)}
                    </div>
                    <div className="ml-3 flex-1">
                      <p className="text-sm font-medium text-gray-900 mb-1">
                        {notification.title}
                      </p>
                      <p className="text-sm text-gray-700">
                        {notification.message}
                      </p>
                      <p className="mt-1 text-xs text-gray-500">
                        {formatTimeAgo(notification.createdAt)}
                      </p>
                    </div>
                    {!notification.read && (
                      <div className="ml-2 flex-shrink-0">
                        <span className="h-2 w-2 rounded-full bg-emerald-500 inline-block"></span>
                      </div>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="p-8 text-center">
                <div className="text-gray-400 mb-2">
                  <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                  </svg>
                </div>
                <p className="text-gray-500 text-sm">
                  {filter === 'all' ? 'No notifications yet' : `No ${filter} notifications`}
                </p>
              </div>
            )}
          </div>

          <div className="p-3 bg-gray-50 text-center border-t border-gray-200">
            <a
              href="/donor/notifications"
              className="text-sm font-medium text-emerald-600 hover:text-emerald-700"
            >
              View all notifications
            </a>
          </div>
        </div>
      )}
    </div>
  );
};

export default Notification;
