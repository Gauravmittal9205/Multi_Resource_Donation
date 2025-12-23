import { useState, useRef, useEffect } from 'react';

interface NotificationItem {
  id: string;
  message: string;
  time: string;
  read: boolean;
  type: 'donation' | 'request' | 'system';
}

const Notification = () => {
  const [isOpen, setIsOpen] = useState(false);
  const notificationRef = useRef<HTMLDivElement>(null);

  // Close notification when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    // Bind the event listener
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      // Unbind the event listener on clean up
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);
  
  // Sample notification data
  const [notifications, setNotifications] = useState<NotificationItem[]>([
    {
      id: '1',
      message: 'Your donation has been received and is being processed.',
      time: '2 hours ago',
      read: false,
      type: 'donation'
    },
    {
      id: '2',
      message: 'New donation request from Community Center',
      time: '1 day ago',
      read: false,
      type: 'request'
    },
    {
      id: '3',
      message: 'System maintenance scheduled for tomorrow at 2 AM',
      time: '2 days ago',
      read: true,
      type: 'system'
    }
  ]);

  const unreadCount = notifications.filter(n => !n.read).length;

  const markAsRead = (id: string) => {
    setNotifications(notifications.map(notification => 
      notification.id === id ? { ...notification, read: true } : notification
    ));
  };

  const markAllAsRead = () => {
    setNotifications(notifications.map(notification => ({
      ...notification,
      read: true
    })));
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
            {unreadCount}
          </span>
        )}
      </button>

      {/* Notification dropdown */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-xl border border-gray-200 overflow-hidden z-50">
          <div className="p-4 border-b border-gray-200 flex justify-between items-center">
            <h3 className="font-medium text-gray-800">Notifications</h3>
            <button 
              onClick={markAllAsRead}
              className="text-sm text-emerald-600 hover:text-emerald-700"
            >
              Mark all as read
            </button>
          </div>
          
          <div className="max-h-96 overflow-y-auto">
            {notifications.length > 0 ? (
              notifications.map((notification) => (
                <div 
                  key={notification.id}
                  onClick={() => markAsRead(notification.id)}
                  className={`p-4 border-b border-gray-100 hover:bg-gray-50 cursor-pointer ${
                    !notification.read ? 'bg-emerald-50' : ''
                  }`}
                >
                  <div className="flex items-start">
                    <div className="flex-shrink-0">
                      {notification.type === 'donation' && (
                        <div className="h-8 w-8 rounded-full bg-emerald-100 flex items-center justify-center">
                          <svg className="h-4 w-4 text-emerald-600" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M8 9a3 3 0 100-6 3 3 0 000 6zM8 11a6 3 0 016 3H2a6 3 0 016-3z" />
                          </svg>
                        </div>
                      )}
                      {notification.type === 'request' && (
                        <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                          <svg className="h-4 w-4 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                            <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                          </svg>
                        </div>
                      )}
                      {notification.type === 'system' && (
                        <div className="h-8 w-8 rounded-full bg-yellow-100 flex items-center justify-center">
                          <svg className="h-4 w-4 text-yellow-600" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h2a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                          </svg>
                        </div>
                      )}
                    </div>
                    <div className="ml-3 flex-1">
                      <p className="text-sm text-gray-700">
                        {notification.message}
                      </p>
                      <p className="mt-1 text-xs text-gray-500">
                        {notification.time}
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
              <div className="p-4 text-center text-gray-500 text-sm">
                No notifications yet
              </div>
            )}
          </div>
          
          <div className="p-3 bg-gray-50 text-center border-t border-gray-200">
            <a 
              href="#" 
              className="text-sm font-medium text-emerald-600 hover:text-emerald-700"
              onClick={(e) => e.preventDefault()}
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
