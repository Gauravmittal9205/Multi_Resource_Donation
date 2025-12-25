import { useState, useEffect } from 'react';
import { fetchAnnouncements, type Announcement } from '../services/announcementService';
import { registerForEvent } from '../services/eventRegistrationService';

interface ContactFormData {
  name: string;
  email: string;
  phone: string;
  message: string;
  eventType?: string;
}

interface Event {
  id: string;
  title: string;
  date: string;
  description: string;
  type: 'food' | 'training' | 'fundraising';
}

const EVENTS: Event[] = [
  {
    id: 'event-1',
    title: 'Food Distribution Day',
    date: 'December 28, 2023',
    description: 'Join us in distributing food to underprivileged families in our community.',
    type: 'food'
  },
  {
    id: 'event-2',
    title: 'Volunteer Training',
    date: 'January 5, 2024',
    description: 'New volunteer orientation session. Learn how you can contribute to our cause.',
    type: 'training'
  },
  {
    id: 'event-3',
    title: 'Fundraising Gala',
    date: 'January 15, 2024',
    description: 'An evening of celebration to support our community programs and initiatives.',
    type: 'fundraising'
  }
];

const categories = [
  'All',
  'Food Drive',
  'Clothing Donation',
  'Volunteer Opportunity',
  'Community Event',
  'Fundraiser'
];

export default function Announcements() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [expandedCard, setExpandedCard] = useState<string | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [showContactModal, setShowContactModal] = useState(false);
  const [contactFormData, setContactFormData] = useState<ContactFormData>({
    name: '',
    email: '',
    phone: '',
    message: '',
    eventType: ''
  });

  const [isSubmittingContact, setIsSubmittingContact] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    message: ''
  });
  
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const loadAnnouncements = async () => {
      try {
        setLoading(true);
        // First try to load from the API
        const data = await fetchAnnouncements('donation');
        if (data && data.length > 0) {
          setAnnouncements(data);
          setError(null);
        } else {
          // If no data from API, use mock data
          console.log('No data from API, using mock data');
          setAnnouncements(data); // This will use the mock data from the service
        }
      } catch (err) {
        console.error('Error loading announcements:', err);
        setError('Failed to load announcements. Using sample data instead.');
        // The fetchAnnouncements function already provides mock data on error
        try {
          const mockData = await fetchAnnouncements('donation');
          setAnnouncements(mockData);
        } catch (mockErr) {
          console.error('Failed to load even mock data:', mockErr);
        }
      } finally {
        setLoading(false);
      }
    };

    loadAnnouncements();
  }, []);

  const filteredAnnouncements = announcements.filter(announcement => {
    const matchesSearch = announcement.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      announcement.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || 
      announcement.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const handleEventClick = (event: Event) => {
    setSelectedEvent(event);
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }
    
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email';
    }
    
    if (!formData.phone.trim()) {
      newErrors.phone = 'Phone number is required';
    } else if (!/^[0-9+\-\s]+$/.test(formData.phone)) {
      newErrors.phone = 'Please enter a valid phone number';
    }
    
    if (selectedEvent?.type === 'fundraising' && !formData.message.trim()) {
      newErrors.message = 'Please specify number of tickets';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleCloseModal = () => {
    setSelectedEvent(null);
    setFormData({
      name: '',
      email: '',
      phone: '',
      message: ''
    });
    setErrors({});
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm() || !selectedEvent) {
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const registrationData = {
        eventId: selectedEvent.id,
        eventTitle: selectedEvent.title,
        eventType: selectedEvent.type,
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        message: formData.message
      };
      
      await registerForEvent(registrationData);
      
      // Reset form and close modal
      setFormData({
        name: '',
        email: '',
        phone: '',
        message: ''
      });
      
      alert('Thank you for registering! We will contact you soon.');
      handleCloseModal();
    } catch (error) {
      console.error('Registration error:', error);
      alert(error instanceof Error ? error.message : 'Failed to register for the event. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (selectedEvent) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [selectedEvent]);

  if (loading && announcements.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto"></div>
            <p className="mt-4 text-lg text-gray-600">Loading announcements...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error && announcements.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="bg-red-50 border-l-4 border-red-400 p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-700">
                  {error}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen bg-gray-50 ${selectedEvent ? 'overflow-hidden' : ''} pt-12`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12 mt-4">
          <h1 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">
            Latest Announcements
          </h1>
          <p className="mt-3 max-w-2xl mx-auto text-xl text-gray-500 sm:mt-4">
            Stay updated with our latest donation drives, volunteer opportunities, and community events.
          </p>
        </div>

        {/* Search and Filter */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="flex-1">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                  </svg>
                </div>
                <input
                  type="text"
                  className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm"
                  placeholder="Search announcements..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            <div className="w-full md:w-64">
              <select
                className="block w-full pl-3 pr-10 py-3 text-base border-gray-300 focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm rounded-md"
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
              >
                {categories.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Announcements Grid */}
        {filteredAnnouncements.length > 0 ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredAnnouncements.map((announcement) => (
              <div 
                key={announcement.id} 
                className="flex flex-col rounded-lg shadow-lg overflow-hidden bg-white hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
              >
                <div className="flex-shrink-0 h-48 overflow-hidden">
                  <img 
                    className="w-full h-full object-cover hover:scale-105 transition-transform duration-300" 
                    src={announcement.imageUrl} 
                    alt={announcement.title} 
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src = 'https://source.unsplash.com/random/600x400/?donation,help';
                    }}
                  />
                </div>
                <div className="flex-1 p-6 flex flex-col">
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">
                          {announcement.category || 'Announcement'}
                        </span>
                        <span className="ml-2 text-xs text-gray-500">
                          {formatDate(announcement.date)}
                        </span>
                      </div>
                    </div>
                    <div className="mt-2">
                      <h3 className="text-xl font-semibold text-gray-900">
                        {announcement.title}
                      </h3>
                      <div className="mt-2">
                        <p className={`text-gray-600 ${expandedCard === announcement.id ? '' : 'line-clamp-3'}`}>
                          {announcement.description}
                        </p>
                        <button
                          onClick={() => setExpandedCard(expandedCard === announcement.id ? null : announcement.id)}
                          className="mt-2 text-sm font-medium text-emerald-600 hover:text-emerald-500 focus:outline-none"
                        >
                          {expandedCard === announcement.id ? 'Show less' : 'Read more'}
                        </button>
                      </div>
                    </div>
                  </div>
                  <div className="mt-4 pt-4 border-t border-gray-100">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <span className="sr-only">{announcement.organization}</span>
                        <div className="h-8 w-8 rounded-full bg-emerald-100 flex items-center justify-center">
                          <span className="text-emerald-600 text-sm font-medium">
                            {announcement.organization.charAt(0).toUpperCase()}
                          </span>
                        </div>
                      </div>
                      <div className="ml-3">
                        <p className="text-sm font-medium text-gray-900">
                          {announcement.organization}
                        </p>
                        <div className="flex items-center text-xs text-gray-500">
                          <svg className="flex-shrink-0 mr-1.5 h-4 w-4 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                          </svg>
                          <span className="truncate">{announcement.location}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <svg
              className="mx-auto h-12 w-12 text-gray-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <h3 className="mt-2 text-lg font-medium text-gray-900">No announcements found</h3>
            <p className="mt-1 text-sm text-gray-500">
              We couldn't find any announcements matching your search. Try adjusting your filters.
            </p>
          </div>
        )}

        {/* Features Section */}
        <div className="mt-20 bg-gradient-to-br from-emerald-50 to-white py-16 rounded-2xl">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">
                Why Our Announcements Matter
              </h2>
              <p className="mt-3 max-w-2xl mx-auto text-xl text-gray-600">
                Stay connected and never miss an opportunity to make a difference
              </p>
            </div>

            <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-4">
              {/* Feature 1 */}
              <div className="bg-white p-6 rounded-xl shadow-sm hover:shadow-md transition-all duration-300 border border-gray-100">
                <div className="w-12 h-12 bg-emerald-100 rounded-lg flex items-center justify-center mb-4">
                  <svg className="h-6 w-6 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">Real-time Updates</h3>
                <p className="text-gray-600">Get instant notifications about new announcements and important updates from your community.</p>
              </div>

              {/* Feature 2 */}
              <div className="bg-white p-6 rounded-xl shadow-sm hover:shadow-md transition-all duration-300 border border-gray-100">
                <div className="w-12 h-12 bg-emerald-100 rounded-lg flex items-center justify-center mb-4">
                  <svg className="h-6 w-6 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">Event Registration</h3>
                <p className="text-gray-600">Easily register for upcoming events and activities directly from the announcements.</p>
              </div>

              {/* Feature 3 */}
              <div className="bg-white p-6 rounded-xl shadow-sm hover:shadow-md transition-all duration-300 border border-gray-100">
                <div className="w-12 h-12 bg-emerald-100 rounded-lg flex items-center justify-center mb-4">
                  <svg className="h-6 w-6 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">Community Engagement</h3>
                <p className="text-gray-600">Connect with like-minded individuals and participate in meaningful community initiatives.</p>
              </div>

              {/* Feature 4 */}
              <div className="bg-white p-6 rounded-xl shadow-sm hover:shadow-md transition-all duration-300 border border-gray-100">
                <div className="w-12 h-12 bg-emerald-100 rounded-lg flex items-center justify-center mb-4">
                  <svg className="h-6 w-6 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">Easy Navigation</h3>
                <p className="text-gray-600">Quickly find what you're looking for with our intuitive filtering and search features.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Upcoming Events Section */}
        <div className="mt-20 mb-16">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">
              Upcoming Events
            </h2>
            <p className="mt-4 max-w-2xl mx-auto text-xl text-gray-600">
              Join us in making a difference. Here are our upcoming events where you can participate.
            </p>
          </div>

          <div className="bg-white shadow-xl rounded-lg overflow-hidden">
            <div className="grid md:grid-cols-3 divide-y md:divide-y-0 md:divide-x">
              {EVENTS.map((event) => (
                <div 
                  key={event.id}
                  onClick={() => handleEventClick(event)}
                  className="p-6 cursor-pointer hover:bg-gray-50 transition-colors duration-200"
                >
                  <div className="flex items-center">
                    <div className="flex-shrink-0 bg-emerald-100 rounded-md p-3">
                      {event.type === 'food' && (
                        <svg className="h-8 w-8 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      )}
                      {event.type === 'training' && (
                        <svg className="h-8 w-8 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      )}
                      {event.type === 'fundraising' && (
                        <svg className="h-8 w-8 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
                        </svg>
                      )}
                    </div>
                    <div className="ml-4">
                      <h3 className="text-lg font-medium text-gray-900">{event.title}</h3>
                      <p className="text-sm text-gray-500">{event.date}</p>
                    </div>
                  </div>
                  <p className="mt-4 text-gray-600">{event.description}</p>
                  <div className="mt-4">
                    <span className="text-emerald-600 hover:text-emerald-500 font-medium">
                      {event.type === 'fundraising' ? 'Get tickets →' : 'Register now →'}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            <div className="border-t border-gray-200 px-6 py-10 sm:py-12">
              <div className="max-w-5xl mx-auto">
                <div className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
                  <div className="px-6 py-8 sm:px-10 sm:py-10 bg-gradient-to-br from-emerald-50 via-white to-indigo-50">
                    <div className="text-center">
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">
                        Host With Us
                      </span>
                      <h3 className="mt-3 text-2xl font-semibold text-gray-900">Want to host your own event?</h3>
                      <p className="mt-2 text-gray-600 max-w-2xl mx-auto">
                        Partner with us to organize donation drives, trainings, or community events.
                      </p>
                    </div>

                    <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
                      <div className="group rounded-xl border border-gray-100 bg-white/70 backdrop-blur p-5 shadow-sm">
                        <div className="flex items-start gap-3">
                          <div className="h-10 w-10 rounded-lg bg-emerald-100 flex items-center justify-center">
                            <svg className="h-5 w-5 text-emerald-700" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                              <path d="M2 5a2 2 0 012-2h3a1 1 0 010 2H4v12h12v-3a1 1 0 112 0v3a2 2 0 01-2 2H4a2 2 0 01-2-2V5z" />
                              <path d="M14.293 2.293a1 1 0 011.414 0l2 2a1 1 0 010 1.414l-7.5 7.5a1 1 0 01-.39.242l-3 1a1 1 0 01-1.265-1.265l1-3a1 1 0 01.242-.39l7.5-7.5z" />
                            </svg>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900">Step 1: Share details</p>
                            <p className="mt-1 text-sm text-gray-600">Tell us your idea, date, location, and expected turnout.</p>
                          </div>
                        </div>
                      </div>

                      <div className="group rounded-xl border border-gray-100 bg-white/70 backdrop-blur p-5 shadow-sm">
                        <div className="flex items-start gap-3">
                          <div className="h-10 w-10 rounded-lg bg-indigo-100 flex items-center justify-center">
                            <svg className="h-5 w-5 text-indigo-700" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.707a1 1 0 00-1.414-1.414L9 10.172 7.707 8.879A1 1 0 106.293 10.293l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900">Step 2: We confirm</p>
                            <p className="mt-1 text-sm text-gray-600">We align on requirements, logistics, and volunteer support.</p>
                          </div>
                        </div>
                      </div>

                      <div className="group rounded-xl border border-gray-100 bg-white/70 backdrop-blur p-5 shadow-sm">
                        <div className="flex items-start gap-3">
                          <div className="h-10 w-10 rounded-lg bg-amber-100 flex items-center justify-center">
                            <svg className="h-5 w-5 text-amber-700" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                              <path d="M2 3a1 1 0 011-1h14a1 1 0 011 1v10a1 1 0 01-1 1H7l-4 4v-4H3a1 1 0 01-1-1V3z" />
                            </svg>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900">Step 3: We publish</p>
                            <p className="mt-1 text-sm text-gray-600">We list it on the platform and manage registrations.</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
                      <button
                        type="button"
                        onClick={() => setShowContactModal(true)}
                        className="inline-flex items-center justify-center px-5 py-3 border border-transparent text-sm font-medium rounded-md text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500"
                      >
                        Contact to Host an Event
                      </button>
                    </div>
                    <p className="mt-4 text-sm text-gray-500 text-center">
                      We usually respond within 24–48 hours.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Registration Modal */}
        {selectedEvent && (
          <div className="fixed z-50 inset-0 overflow-y-auto">
            <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
              <div className="fixed inset-0 transition-opacity" aria-hidden="true">
                <div className="absolute inset-0 bg-gray-500 opacity-75" onClick={handleCloseModal}></div>
              </div>

              <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
              
              <div className="inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full sm:p-6">
                <div className="sm:flex sm:items-start">
                  <div className="mt-3 text-center sm:mt-0 sm:text-left w-full">
                    <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                      Register for {selectedEvent.title}
                    </h3>
                    <div className="mt-2">
                      <form onSubmit={handleSubmit}>
                        <div className="mb-4">
                          <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                            Full Name <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="text"
                            name="name"
                            id="name"
                            value={formData.name}
                            onChange={handleInputChange}
                            className={`w-full px-3 py-2 border ${
                              errors.name ? 'border-red-300' : 'border-gray-300'
                            } rounded-md shadow-sm focus:outline-none focus:ring-emerald-500 focus:border-emerald-500`}
                            placeholder="John Doe"
                          />
                          {errors.name && (
                            <p className="mt-1 text-sm text-red-600">{errors.name}</p>
                          )}
                        </div>
                        
                        <div className="mb-4">
                          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                            Email <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="email"
                            name="email"
                            id="email"
                            value={formData.email}
                            onChange={handleInputChange}
                            className={`w-full px-3 py-2 border ${
                              errors.email ? 'border-red-300' : 'border-gray-300'
                            } rounded-md shadow-sm focus:outline-none focus:ring-emerald-500 focus:border-emerald-500`}
                            placeholder="john@example.com"
                          />
                          {errors.email && (
                            <p className="mt-1 text-sm text-red-600">{errors.email}</p>
                          )}
                        </div>
                        
                        <div className="mb-4">
                          <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                            Phone Number <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="tel"
                            name="phone"
                            id="phone"
                            value={formData.phone}
                            onChange={handleInputChange}
                            className={`w-full px-3 py-2 border ${
                              errors.phone ? 'border-red-300' : 'border-gray-300'
                            } rounded-md shadow-sm focus:outline-none focus:ring-emerald-500 focus:border-emerald-500`}
                            placeholder="+1234567890"
                          />
                          {errors.phone && (
                            <p className="mt-1 text-sm text-red-600">{errors.phone}</p>
                          )}
                        </div>
                        
                        <div className="mb-4">
                          <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-1">
                            Additional Notes 
                            {selectedEvent.type === 'fundraising' && (
                              <span className="text-red-500">*</span>
                            )}
                            {selectedEvent.type === 'fundraising' && ' (e.g., number of tickets)'}
                          </label>
                          <textarea
                            name="message"
                            id="message"
                            rows={3}
                            value={formData.message}
                            onChange={handleInputChange}
                            className={`w-full px-3 py-2 border ${
                              errors.message ? 'border-red-300' : 'border-gray-300'
                            } rounded-md shadow-sm focus:outline-none focus:ring-emerald-500 focus:border-emerald-500`}
                            placeholder={
                              selectedEvent.type === 'fundraising' 
                                ? 'Number of tickets and any special requirements...' 
                                : 'Any additional information or questions...'
                            }
                          ></textarea>
                          {errors.message && (
                            <p className="mt-1 text-sm text-red-600">{errors.message}</p>
                          )}
                        </div>
                        
                        <div className="mt-5 sm:mt-6 sm:grid sm:grid-cols-2 sm:gap-3 sm:grid-flow-row-dense">
                          <button
                            type="submit"
                            className="w-full inline-flex justify-center items-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-emerald-600 text-base font-medium text-white hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 sm:col-start-2 sm:text-sm disabled:opacity-70 disabled:cursor-not-allowed"
                            disabled={isSubmitting}
                          >
                            {isSubmitting ? (
                              <>
                                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                {selectedEvent.type === 'fundraising' ? 'Processing...' : 'Registering...'}
                              </>
                            ) : (
                              selectedEvent.type === 'fundraising' ? 'Get Tickets' : 'Register Now'
                            )}
                          </button>
                          <button
                            type="button"
                            onClick={handleCloseModal}
                            className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 sm:mt-0 sm:col-start-1 sm:text-sm"
                          >
                            Cancel
                          </button>
                        </div>
                      </form>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
      {/* Contact Form Modal */}
      {showContactModal && (
        <div className="fixed z-50 inset-0 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true">
              <div className="absolute inset-0 bg-gray-500 opacity-75" onClick={() => setShowContactModal(false)}></div>
            </div>

            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
            
            <div className="inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full sm:p-6">
              <div className="sm:flex sm:items-start">
                <div className="mt-3 text-center sm:mt-0 sm:text-left w-full">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl leading-6 font-medium text-gray-900">
                      Host Your Event With Us
                    </h3>
                    <button
                      type="button"
                      onClick={() => setShowContactModal(false)}
                      className="text-gray-400 hover:text-gray-500 focus:outline-none"
                    >
                      <span className="sr-only">Close</span>
                      <svg className="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                  
                  <div className="mt-4">
                    <p className="text-sm text-gray-500 mb-6">
                      Fill out the form below and our team will get back to you within 24 hours to discuss your event details.
                    </p>
                    
                    <form onSubmit={async (e) => {
                      e.preventDefault();
                      setIsSubmittingContact(true);

                      try {
                        const mapContactTypeToEventType = (value?: string): 'food' | 'training' | 'fundraising' | 'other' => {
                          switch (value) {
                            case 'food-drive':
                              return 'food';
                            case 'fundraiser':
                              return 'fundraising';
                            case 'community':
                            case 'volunteer':
                              return 'other';
                            case 'other':
                            default:
                              return 'other';
                          }
                        };

                        await registerForEvent({
                          eventId: `host-request-${Date.now()}`,
                          eventTitle: 'Host Event Request',
                          eventType: mapContactTypeToEventType(contactFormData.eventType),
                          name: contactFormData.name,
                          email: contactFormData.email,
                          phone: contactFormData.phone,
                          message: contactFormData.message
                        });

                        setShowContactModal(false);
                        alert('Thank you for your interest! Our team will contact you soon to discuss your event.');
                        setContactFormData({
                          name: '',
                          email: '',
                          phone: '',
                          message: '',
                          eventType: ''
                        });
                      } catch (error) {
                        console.error('Contact form submit error:', error);
                        alert(error instanceof Error ? error.message : 'Failed to submit your request. Please try again.');
                      } finally {
                        setIsSubmittingContact(false);
                      }
                    }}>
                      <div className="space-y-4">
                        <div>
                          <label htmlFor="contact-name" className="block text-sm font-medium text-gray-700 mb-1">
                            Full Name <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="text"
                            id="contact-name"
                            required
                            value={contactFormData.name}
                            onChange={(e) => setContactFormData({...contactFormData, name: e.target.value})}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-emerald-500 focus:border-emerald-500"
                            placeholder="Your name"
                          />
                        </div>
                        
                        <div>
                          <label htmlFor="contact-email" className="block text-sm font-medium text-gray-700 mb-1">
                            Email <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="email"
                            id="contact-email"
                            required
                            value={contactFormData.email}
                            onChange={(e) => setContactFormData({...contactFormData, email: e.target.value})}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-emerald-500 focus:border-emerald-500"
                            placeholder="your.email@example.com"
                          />
                        </div>
                        
                        <div>
                          <label htmlFor="contact-phone" className="block text-sm font-medium text-gray-700 mb-1">
                            Phone Number <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="tel"
                            id="contact-phone"
                            required
                            value={contactFormData.phone}
                            onChange={(e) => setContactFormData({...contactFormData, phone: e.target.value})}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-emerald-500 focus:border-emerald-500"
                            placeholder="+1 (555) 123-4567"
                          />
                        </div>
                        
                        <div>
                          <label htmlFor="event-type" className="block text-sm font-medium text-gray-700 mb-1">
                            Type of Event <span className="text-red-500">*</span>
                          </label>
                          <select
                            id="event-type"
                            required
                            value={contactFormData.eventType}
                            onChange={(e) => setContactFormData({...contactFormData, eventType: e.target.value})}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-emerald-500 focus:border-emerald-500"
                          >
                            <option value="">Select event type</option>
                            <option value="food-drive">Food Drive</option>
                            <option value="fundraiser">Fundraiser</option>
                            <option value="community">Community Event</option>
                            <option value="volunteer">Volunteer Event</option>
                            <option value="other">Other</option>
                          </select>
                        </div>
                        
                        <div>
                          <label htmlFor="contact-message" className="block text-sm font-medium text-gray-700 mb-1">
                            Tell us about your event <span className="text-red-500">*</span>
                          </label>
                          <textarea
                            id="contact-message"
                            rows={4}
                            required
                            value={contactFormData.message}
                            onChange={(e) => setContactFormData({...contactFormData, message: e.target.value})}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-emerald-500 focus:border-emerald-500"
                            placeholder="Please provide details about your event, including preferred date, expected number of attendees, and any special requirements."
                          ></textarea>
                        </div>
                        
                        <div className="pt-2">
                          <button
                            type="submit"
                            disabled={isSubmittingContact}
                            className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 disabled:opacity-70 disabled:cursor-not-allowed"
                          >
                            {isSubmittingContact ? (
                              <>
                                <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                Sending...
                              </>
                            ) : 'Submit Request'}
                          </button>
                        </div>
                      </div>
                    </form>
                  </div>
                </div>
              </div>
              
              <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse">
                <button
                  type="button"
                  onClick={() => setShowContactModal(false)}
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-gray-100 text-base font-medium text-gray-700 hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 sm:ml-3 sm:w-auto sm:text-sm"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Additional Footer Spacing */}
      <div className="py-12"></div>
    </div>
  );
}



