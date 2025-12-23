import { useEffect } from 'react';

interface AboutUsProps {
  onBack: () => void;
}

const AboutUs = ({ onBack }: AboutUsProps) => {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const verificationItems = [
    'Government Issued NGO Registration',
    'Audited Financial Statements',
    'Key People and Compliance',
    'Previous Projects'
  ];

  const teamMembers = [
    { id: 1, image: 'https://randomuser.me/api/portraits/men/32.jpg' },
    { id: 2, image: 'https://randomuser.me/api/portraits/women/44.jpg' },
    { id: 3, image: 'https://randomuser.me/api/portraits/men/22.jpg' }
  ];

  return (
    <div className="min-h-screen pt-24 pb-20 px-4 sm:px-6 lg:px-8 bg-gray-50 space-y-20">
      {/* Hero Section */}
      <div className="max-w-7xl mx-auto text-center mb-16">
        <h1 className="text-3xl font-bold text-gray-900 sm:text-4xl md:text-5xl">
          About ShareCare
        </h1>
        <p className="mt-6 max-w-3xl mx-auto text-xl text-gray-500">
          Connecting generosity with need to create a world where everyone has access to the resources they require.
        </p>
      </div>

      {/* Our Story */}
      <div className="max-w-7xl mx-auto">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <div className="lg:grid lg:grid-cols-2 lg:gap-8">
              <div className="mb-8 lg:mb-0">
                <h2 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">Our Story</h2>
                <p className="mt-4 text-lg text-gray-500">
                  ShareCare was founded in 2023 with a simple yet powerful idea: to create a platform that makes it easy for people to donate resources to those in need. 
                  What started as a small project has grown into a community of thousands of donors and organizations working together to make a difference.
                </p>
                <p className="mt-4 text-lg text-gray-500">
                  We believe that everyone has something valuable to contribute, and our platform makes it simple to connect those who want to help with those who need it most.
                </p>
              </div>
              <div className="lg:mt-0">
                <div className="relative rounded-lg overflow-hidden h-64 sm:h-80 lg:h-96">
                  <img
                    className="absolute inset-0 w-full h-full object-cover"
                    src="/src/assets/main.jpg"
                    alt="Our team working together"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src = 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1170&q=80';
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>


      {/* NGO Screening Section */}
      <div className="max-w-7xl mx-auto pt-10">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">Screening NGOs for fundraising</h2>
          <p className="mt-4 text-xl text-gray-500">We conduct thorough due diligence to ensure NGOs meet eligibility criteria to raise funds on ShareCare</p>
        </div>
        <div className="grid gap-8 md:grid-cols-3">
          {/* Left Card */}
          <div className="bg-white rounded-xl shadow-md overflow-hidden">
            <div className="p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-4">Data collection for NGO verification</h3>
              <div className="space-y-3">
                {verificationItems.map((item, index) => (
                  <div key={index} className="flex items-start">
                    <svg className="h-5 w-5 text-emerald-500 mr-2 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="text-gray-700">{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Middle Card */}
          <div className="bg-white rounded-xl shadow-md overflow-hidden">
            <div className="p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-4">Understanding long term vision by team meetings</h3>
              
              <div className="bg-gray-50 rounded-lg p-4 mb-4">
                <p className="text-sm font-medium text-gray-500 mb-3">NGO TEAM</p>
                <div className="flex -space-x-2">
                  {teamMembers.map(member => (
                    <img 
                      key={member.id}
                      className="w-10 h-10 rounded-full border-2 border-white" 
                      src={member.image} 
                      alt={`Team member ${member.id}`}
                    />
                  ))}
                </div>
              </div>
              
              <div className="bg-red-50 rounded-lg p-4">
                <div className="flex items-center">
                  <div className="w-8 h-8 bg-red-600 rounded-full flex items-center justify-center text-white font-bold mr-3">g</div>
                  <span className="font-medium text-gray-900">TEAM SHARECARE</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Card */}
          <div className="bg-white rounded-xl shadow-md overflow-hidden">
            <div className="p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-4">On-Site NGO Visits to verify past projects and beneficiaries</h3>
              <div className="relative">
                <div className="w-20 h-20 mx-auto mb-4 rounded-full overflow-hidden border-4 border-white shadow-md">
                  <img 
                    src="https://randomuser.me/api/portraits/children/1.jpg" 
                    alt="Beneficiary"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="absolute top-0 right-0 bg-emerald-100 text-emerald-800 text-xs font-medium px-2 py-1 rounded-full">
                  Verified
                </div>
              </div>
              <div className="text-center">
                <p className="font-medium text-gray-900">Rahul Sharma</p>
                <p className="text-sm text-gray-500">Helping Hands Foundation</p>
                <p className="mt-2 text-sm text-gray-600">Received regular meals, school kit and admitted to school</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* How It Works Section */}
      <div className="max-w-7xl mx-auto pt-10">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">How It Works?</h2>
          <p className="mt-4 text-xl text-gray-500">A simple and transparent donation process</p>
        </div>
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
          {/* Step 1 */}
          <div className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1">
            <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mb-4 mx-auto">
              <span className="text-2xl font-bold text-emerald-700">1</span>
            </div>
            <img 
              src="/src/assets/img1.webp" 
              alt="Choose a campaign" 
              className="w-full h-40 object-cover rounded-lg mb-4"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.src = 'https://placehold.co/400x200/f3f4f6/9ca3af?text=Campaign';
              }}
            />
            <h3 className="text-xl font-bold text-gray-900 mb-2 text-center">Choose a campaign</h3>
            <p className="text-gray-600 text-center">Select from our verified NGO campaigns that resonate with you</p>
          </div>

          {/* Step 2 */}
          <div className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1">
            <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mb-4 mx-auto">
              <span className="text-2xl font-bold text-emerald-700">2</span>
            </div>
            <img 
              src="/src/assets/img2.webp" 
              alt="Make a donation" 
              className="w-full h-40 object-cover rounded-lg mb-4"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.src = 'https://placehold.co/400x200/f3f4f6/9ca3af?text=Donate';
              }}
            />
            <h3 className="text-xl font-bold text-gray-900 mb-2 text-center">Make a donation</h3>
            <p className="text-gray-600 text-center">Contribute any amount you wish to support the cause</p>
          </div>

          {/* Step 3 */}
          <div className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1">
            <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mb-4 mx-auto">
              <span className="text-2xl font-bold text-emerald-700">3</span>
            </div>
            <img 
              src="/src/assets/img3.webp" 
              alt="Get regular updates" 
              className="w-full h-40 object-cover rounded-lg mb-4"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.src = 'https://placehold.co/400x200/f3f4f6/9ca3af?text=Updates';
              }}
            />
            <h3 className="text-xl font-bold text-gray-900 mb-2 text-center">Get regular updates</h3>
            <p className="text-gray-600 text-center">Receive updates on how your donation is making an impact</p>
          </div>

          {/* Step 4 */}
          <div className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1">
            <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mb-4 mx-auto">
              <span className="text-2xl font-bold text-emerald-700">4</span>
            </div>
            <img 
              src="/src/assets/img4.webp" 
              alt="See the impact" 
              className="w-full h-40 object-cover rounded-lg mb-4"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.src = 'https://placehold.co/400x200/f3f4f6/9ca3af?text=Impact';
              }}
            />
            <h3 className="text-xl font-bold text-gray-900 mb-2 text-center">See the impact</h3>
            <p className="text-gray-600 text-center">Witness the positive change your contribution has created</p>
          </div>
        </div>
      </div>

      {/* What We Do Section */}
      <div className="max-w-7xl mx-auto pt-10">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">🤝 What We Do</h2>
          <p className="mt-4 text-xl text-gray-500">
            DonateTogether is a hyper-local donation and pickup coordination platform
          </p>
        </div>
        
        <div className="grid gap-6 md:grid-cols-3 mb-12">
          {/* Card 1 */}
          <div className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1">
            <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mb-4 mx-auto">
              <span className="text-2xl">🏠</span>
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-3 text-center">For Donors</h3>
            <p className="text-gray-600 text-center">
              Individuals, restaurants, and organizations can easily donate surplus items through our platform.
            </p>
          </div>
          
          {/* Card 2 */}
          <div className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1">
            <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mb-4 mx-auto">
              <span className="text-2xl">🔔</span>
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-3 text-center">For NGOs & Volunteers</h3>
            <p className="text-gray-600 text-center">
              Receive real-time alerts for nearby donations and coordinate pickups efficiently.
            </p>
          </div>
          
          {/* Card 3 */}
          <div className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1">
            <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mb-4 mx-auto">
              <span className="text-2xl">✅</span>
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-3 text-center">Secure & Transparent</h3>
            <p className="text-gray-600 text-center">
              Our verification systems ensure secure pickups and transparent distribution of donations.
            </p>
          </div>
        </div>
        
        {/* Donation Categories */}
        <div className="mt-16">
          <h3 className="text-2xl font-bold text-center mb-8">We support donations across multiple categories:</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {/* Food */}
            <div className="bg-white rounded-xl overflow-hidden shadow-md hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1">
              <div className="h-40 bg-cover bg-center" style={{backgroundImage: 'url(https://images.unsplash.com/photo-1504674900247-0877039348bf?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1170&q=80)'}}></div>
              <div className="p-4">
                <h4 className="text-lg font-semibold text-center">🍱 Food</h4>
              </div>
            </div>
            
            {/* Clothes */}
            <div className="bg-white rounded-xl overflow-hidden shadow-md hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1">
              <div className="h-40 bg-cover bg-center" style={{backgroundImage: 'url(https://images.unsplash.com/photo-1489987707025-afc232f7ea0f?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1170&q=80)'}}></div>
              <div className="p-4">
                <h4 className="text-lg font-semibold text-center">👕 Clothes</h4>
              </div>
            </div>
            
            {/* Books */}
            <div className="bg-white rounded-xl overflow-hidden shadow-md hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1">
              <div className="h-40 bg-cover bg-center" style={{backgroundImage: 'url(https://images.unsplash.com/photo-1541963463532-d68292c34b19?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1176&q=80)'}}></div>
              <div className="p-4">
                <h4 className="text-lg font-semibold text-center">📚 Books</h4>
              </div>
            </div>
            
            {/* Essential Items */}
            <div className="bg-white rounded-xl overflow-hidden shadow-md hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1">
              <div className="h-40 bg-cover bg-center" style={{backgroundImage: 'url(https://images.unsplash.com/photo-1607082349566-187342175e2f?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1170&q=80)'}}></div>
              <div className="p-4">
                <h4 className="text-lg font-semibold text-center">🧺 Essential Items</h4>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="max-w-7xl mx-auto text-center pt-10">
        <div className="bg-gradient-to-r from-emerald-500 to-teal-600 rounded-2xl p-8 sm:p-12 text-white">
          <h2 className="text-3xl font-extrabold mb-4">Ready to make a difference?</h2>
          <p className="text-xl mb-8 max-w-3xl mx-auto">
            Join our community of donors and organizations working together to create positive change.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <button
              onClick={onBack}
              className="px-6 py-3 bg-white text-emerald-600 font-medium rounded-lg hover:bg-gray-100 transition-colors"
            >
              Donate Now
            </button>
            <button
              onClick={onBack}
              className="px-6 py-3 border-2 border-white text-white font-medium rounded-lg hover:bg-white/10 transition-colors"
            >
              Contact Us
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AboutUs;
