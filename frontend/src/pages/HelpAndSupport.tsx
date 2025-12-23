import { useState } from 'react';

const HelpAndSupport = () => {
  const [activeTab, setActiveTab] = useState('donors');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCard, setActiveCard] = useState<string | null>(null);
  
  const toggleCard = (cardId: string) => {
    setActiveCard(activeCard === cardId ? null : cardId);
  };

  const faqs = {
    donors: [
      {
        id: 'donate-items',
        question: 'How do I donate items?',
        answer: 'Click on the "Donate Now" button, select the items you wish to donate, and follow the simple steps to schedule a pickup.'
      },
      {
        id: 'volunteer-info',
        question: 'How can I volunteer?',
        answer: 'Join our volunteer program by signing up on our platform. You can help with pickup, sorting, and distribution of donations.'
      },
      {
        question: 'What items can I donate?',
        answer: 'We accept food (non-perishable), clothes, books, and other essentials in good condition. Please ensure items are clean and usable.'
      },
      {
        question: 'How do I track my donation?',
        answer: 'You can track your donation status in real-time through your dashboard. You\'ll receive notifications at each step of the process.'
      },
      {
        question: 'Are there any tax benefits?',
        answer: 'Yes, all donations are tax-deductible. You\'ll receive a tax receipt via email for your records.'
      },
      {
        question: 'How do I schedule a pickup?',
        answer: 'After submitting your donation details, you can choose a convenient pickup time slot from the available options.'
      }
    ],
    ngos: [
      {
        id: 'ngo-registration',
        question: 'How do we register as an NGO?',
        answer: 'Click on "Register as NGO" and complete the verification process by submitting the required documents for approval.'
      },
      {
        question: 'What documents are required?',
        answer: 'We require 12A/80G registration, PAN card, and a valid ID proof of the authorized signatory.'
      },
      {
        question: 'How do we receive donations?',
        answer: 'Once registered, you can view and accept available donations in your area through your dashboard.'
      },
      {
        question: 'What are our responsibilities?',
        answer: 'NGOs are responsible for timely pickup, proper utilization, and reporting of all received donations.'
      },
      {
        question: 'How to report impact?',
        answer: 'Use our impact reporting tool in your dashboard to share how the donations are being utilized.'
      }
    ]
  };

  const contactInfo = {
    donors: {
      email: 'donors@sharecare.org',
      phone: '+91 98765 43210',
      hours: '9:00 AM - 8:00 PM (Mon-Sat)'
    },
    ngos: {
      email: 'ngos@sharecare.org',
      phone: '+91 98765 43211',
      hours: '10:00 AM - 6:00 PM (Mon-Fri)'
    }
  };

  // Filter FAQs based on search query
  const filteredFaqs = {
    donors: faqs.donors.filter(faq => 
      faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      faq.answer.toLowerCase().includes(searchQuery.toLowerCase())
    ),
    ngos: faqs.ngos.filter(faq => 
      faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      faq.answer.toLowerCase().includes(searchQuery.toLowerCase())
    )
  };

  const activeFaqs = filteredFaqs[activeTab as keyof typeof filteredFaqs];
  const activeContact = contactInfo[activeTab as keyof typeof contactInfo];

  // Function to close modal when clicking outside content
  const closeModal = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      setActiveCard(null);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Help & Support</h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Find answers to common questions and get the support you need
          </p>
        </div>

        {/* Search Bar */}
        <div className="max-w-2xl mx-auto mb-12">
          <div className="relative">
            <input
              type="text"
              placeholder="Search help articles..."
              className="w-full px-6 py-3 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <svg
              className="absolute right-3 top-3 h-6 w-6 text-gray-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </div>
        </div>

        {/* Main Content */}
        <div className="text-center mb-6">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">How can we help you today?</h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto mb-8">
            Select your role to see the most relevant information for you.
          </p>

          {/* Help Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16 max-w-6xl mx-auto">
            {/* Donor Card */}
            <div 
              onClick={() => toggleCard('donor')}
              className={`group relative bg-white rounded-2xl shadow-lg overflow-hidden cursor-pointer transition-all duration-300 hover:shadow-xl hover:-translate-y-1 border-2 ${
                activeCard === 'donor' ? 'border-emerald-500 ring-4 ring-emerald-100' : 'border-transparent hover:border-emerald-200'
              }`}
            >
              <div className="relative h-48 overflow-hidden">
                <img
                  src="/src/assets/donation.webp"
                  alt="Donor"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                />
              </div>
              <div className="p-6 text-center">
                <div className="inline-flex items-center text-emerald-600 group-hover:text-emerald-700 transition-colors">
                  <span className="font-medium mr-2">Learn More</span>
                  <svg className="w-4 h-4 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path>
                  </svg>
                </div>
              </div>
              <div className="absolute top-4 right-4 bg-emerald-100 text-emerald-700 text-xs font-semibold px-3 py-1 rounded-full">
                Donate Now
              </div>
            </div>

            {/* Volunteer Card */}
            <div 
              onClick={() => toggleCard('volunteer')}
              className={`group relative bg-white rounded-2xl shadow-lg overflow-hidden cursor-pointer transition-all duration-300 hover:shadow-xl hover:-translate-y-1 border-2 ${
                activeCard === 'volunteer' ? 'border-orange-500 ring-4 ring-orange-100' : 'border-transparent hover:border-orange-200'
              }`}
            >
              <div className="relative h-48 overflow-hidden">
                <img
                  src="/src/assets/volunter.webp"
                  alt="Volunteer"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                />
              </div>
              <div className="p-6 text-center">
                <div className="inline-flex items-center text-orange-600 group-hover:text-orange-700 transition-colors">
                  <span className="font-medium mr-2">Get Involved</span>
                  <svg className="w-4 h-4 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path>
                  </svg>
                </div>
              </div>
              <div className="absolute top-4 right-4 bg-orange-100 text-orange-700 text-xs font-semibold px-3 py-1 rounded-full">
                Join Us
              </div>
            </div>

            {/* NGO Card */}
            <div 
              onClick={() => toggleCard('ngo')}
              className={`group relative bg-white rounded-2xl shadow-lg overflow-hidden cursor-pointer transition-all duration-300 hover:shadow-xl hover:-translate-y-1 border-2 ${
                activeCard === 'ngo' ? 'border-blue-500 ring-4 ring-blue-100' : 'border-transparent hover:border-blue-200'
              }`}
            >
              <div className="relative h-48 overflow-hidden">
                <img
                  src="/src/assets/ngos.jpg"
                  alt="NGO"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                />
              </div>
              <div className="p-6 text-center">
                <div className="inline-flex items-center text-blue-600 group-hover:text-blue-700 transition-colors">
                  <span className="font-medium mr-2">Learn More</span>
                  <svg className="w-4 h-4 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path>
                  </svg>
                </div>
              </div>
              <div className="absolute top-4 right-4 bg-blue-100 text-blue-700 text-xs font-semibold px-3 py-1 rounded-full">
                Partner
              </div>
            </div>
          </div>

          {/* Modal Overlay */}
          {activeCard && (
            <div 
              className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
              onClick={closeModal}
            >
              <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                <div className="p-8">
                  {/* Close Button */}
                  <button 
                    onClick={() => setActiveCard(null)}
                    className="absolute top-6 right-6 p-1 rounded-full hover:bg-gray-100 transition-colors duration-200"
                    aria-label="Close"
                  >
                    <svg className="h-6 w-6 text-gray-500 hover:text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                  
                  {/* Content based on active card */}
                  <div className="max-w-3xl mx-auto">
                    {activeCard === 'donor' && (
                      <div className="space-y-8">
                        <div className="text-center mb-8">
                          <h3 className="text-3xl font-bold text-emerald-700 mb-3">Information for Donors</h3>
                          <p className="text-gray-600 max-w-2xl mx-auto">Find answers to common questions about making donations and how your contributions help.</p>
                        </div>
                        <div className="space-y-8">
                          {faqs.donors.map((faq, index) => (
                            <div key={index} className="bg-gray-50 rounded-xl p-6 hover:bg-gray-100 transition-colors duration-200">
                              <h4 className="text-xl font-semibold text-gray-800 mb-3 flex items-center">
                                <span className="inline-flex items-center justify-center h-8 w-8 rounded-full bg-emerald-100 text-emerald-700 mr-3 flex-shrink-0">
                                  {index + 1}
                                </span>
                                {faq.question}
                              </h4>
                              <p className="text-gray-600 pl-11">{faq.answer}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {activeCard === 'volunteer' && (
                      <div className="space-y-8">
                        <div className="text-center mb-8">
                          <h3 className="text-3xl font-bold text-emerald-700 mb-3">Volunteer Opportunities</h3>
                          <p className="text-gray-600 max-w-2xl mx-auto">Join our team of dedicated volunteers and make a difference in your community.</p>
                        </div>
                        <div className="space-y-8">
                          {[
                            {
                              question: 'How can I become a volunteer?',
                              answer: 'Sign up through our volunteer portal, complete the registration process, and attend an orientation session.'
                            },
                            {
                              question: 'What are the volunteer requirements?',
                              answer: 'You must be at least 18 years old, complete a background check, and attend a training session.'
                            },
                            {
                              question: 'What kind of volunteer work is available?',
                              answer: 'We need help with donation pickup, sorting, distribution, and community outreach programs.'
                            }
                          ].map((faq, index) => (
                            <div key={index} className="bg-gray-50 rounded-xl p-6 hover:bg-gray-100 transition-colors duration-200">
                              <h4 className="text-xl font-semibold text-gray-800 mb-3 flex items-center">
                                <span className="inline-flex items-center justify-center h-8 w-8 rounded-full bg-orange-100 text-orange-700 mr-3 flex-shrink-0">
                                  {index + 1}
                                </span>
                                {faq.question}
                              </h4>
                              <p className="text-gray-600 pl-11">{faq.answer}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {activeCard === 'ngo' && (
                      <div className="space-y-8">
                        <div className="text-center mb-8">
                          <h3 className="text-3xl font-bold text-emerald-700 mb-3">Information for NGOs</h3>
                          <p className="text-gray-600 max-w-2xl mx-auto">Learn how to partner with us and manage your organization's profile.</p>
                        </div>
                        <div className="space-y-8">
                          {faqs.ngos.map((faq, index) => (
                            <div key={index} className="bg-gray-50 rounded-xl p-6 hover:bg-gray-100 transition-colors duration-200">
                              <h4 className="text-xl font-semibold text-gray-800 mb-3 flex items-center">
                                <span className="inline-flex items-center justify-center h-8 w-8 rounded-full bg-blue-100 text-blue-700 mr-3 flex-shrink-0">
                                  {index + 1}
                                </span>
                                {faq.question}
                              </h4>
                              <p className="text-gray-600 pl-11">{faq.answer}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Tabs with Icons */}
        <div className="flex justify-center mb-12">
          <div className="inline-flex rounded-xl bg-white p-1 shadow-md border border-gray-200">
            <button
              onClick={() => setActiveTab('donors')}
              className={`px-8 py-4 rounded-lg flex items-center space-x-2 text-sm font-medium transition-all duration-200 ${
                activeTab === 'donors'
                  ? 'bg-emerald-600 text-white shadow-lg'
                  : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              <span>For Donors</span>
            </button>
            <button
              onClick={() => setActiveTab('ngos')}
              className={`px-8 py-4 rounded-lg flex items-center space-x-2 text-sm font-medium transition-all duration-200 ${
                activeTab === 'ngos'
                  ? 'bg-emerald-600 text-white shadow-lg'
                  : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
              <span>For NGOs</span>
            </button>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          {/* Search Bar */}
          <div className="p-6 border-b border-gray-200">
            <div className="relative max-w-2xl mx-auto">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="h-5 w-5 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                </svg>
              </div>
              <input
                type="text"
                className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg bg-gray-50 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                placeholder={`Search ${activeTab === 'donors' ? 'donor' : 'NGO'} help articles...`}
              />
            </div>
          </div>

          {/* FAQ Section */}
          <div className="p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Frequently Asked Questions</h2>
            <div className="space-y-4">
              {activeFaqs.map((faq, index) => (
                <div key={index} id={faq.id} className="border-b border-gray-200 pb-6 mb-6 rounded-lg p-4 hover:bg-gray-50 transition-colors duration-200">
                  <h3 className="font-medium text-gray-900">{faq.question}</h3>
                  <p className="mt-1 text-gray-600">{faq.answer}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Contact Section */}
          <div className="bg-gray-50 p-6 border-t border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Still need help?</h2>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-medium text-gray-900 mb-2">Contact Support</h3>
                <div className="space-y-2 text-gray-600">
                  <p className="flex items-center">
                    <svg className="h-5 w-5 mr-2 text-emerald-600" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                      <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                    </svg>
                    {activeContact.email}
                  </p>
                  <p className="flex items-center">
                    <svg className="h-5 w-5 mr-2 text-emerald-600" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
                    </svg>
                    {activeContact.phone}
                  </p>
                  <p className="flex items-center">
                    <svg className="h-5 w-5 mr-2 text-emerald-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                    </svg>
                    {activeContact.hours}
                  </p>
                </div>
              </div>
              <div>
                <h3 className="font-medium text-gray-900 mb-2">Quick Links</h3>
                <ul className="space-y-2">
                  <li>
                    <a href="#" className="text-emerald-600 hover:text-emerald-800">
                      {activeTab === 'donors' ? 'Donation Guidelines' : 'NGO Registration Process'}
                    </a>
                  </li>
                  <li>
                    <a href="#" className="text-emerald-600 hover:text-emerald-800">
                      {activeTab === 'donors' ? 'Track Your Donation' : 'View Donation Requests'}
                    </a>
                  </li>
                  <li>
                    <a href="#" className="text-emerald-600 hover:text-emerald-800">
                      {activeTab === 'donors' ? 'Tax Exemption FAQs' : 'Impact Reporting Guide'}
                    </a>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Additional Resources */}
        <div className="mt-8 grid md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <div className="h-12 w-12 bg-emerald-100 rounded-lg flex items-center justify-center text-emerald-600 mb-4">
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h3 className="font-medium text-gray-900 mb-2">Documentation</h3>
            <p className="text-gray-600 text-sm">Browse our detailed guides and tutorials for {activeTab === 'donors' ? 'donors' : 'NGOs'}</p>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <div className="h-12 w-12 bg-orange-100 rounded-lg flex items-center justify-center text-orange-600 mb-4">
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="font-medium text-gray-900 mb-2">Community Forum</h3>
            <p className="text-gray-600 text-sm">Get help from our community of {activeTab === 'donors' ? 'donors' : 'NGOs'} and experts</p>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center text-blue-600 mb-4">
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <h3 className="font-medium text-gray-900 mb-2">Upcoming Webinars</h3>
            <p className="text-gray-600 text-sm">Join our training sessions for {activeTab === 'donors' ? 'donors' : 'NGOs'}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HelpAndSupport;
