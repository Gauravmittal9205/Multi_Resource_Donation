import { Heart, Package, Users, MapPin, Shield, CheckCircle, Clock, TrendingUp, Camera, Lock } from 'lucide-react';

function App() {
  return (
    <div className="min-h-screen bg-white">
      <header className="fixed top-0 w-full bg-white/95 backdrop-blur-sm border-b border-gray-100 z-50">
        <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Heart className="w-8 h-8 text-emerald-600" />
            <span className="text-xl font-bold text-gray-900">ShareCare</span>
          </div>
          <button className="px-6 py-2 bg-emerald-600 text-white rounded-full hover:bg-emerald-700 transition-colors font-medium">
            Sign In
          </button>
        </nav>
      </header>

      <main className="pt-16">
        <section className="relative bg-gradient-to-br from-emerald-50 via-white to-orange-50 py-20 sm:py-28">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-4xl mx-auto">
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 leading-tight mb-6">
                Turn Surplus into <span className="text-emerald-600">Support</span>
              </h1>
              <p className="text-lg sm:text-xl text-gray-600 mb-10 leading-relaxed">
                Donate food, clothes, books, and essentials to nearby NGOs in real time.
                Connect directly with volunteers who can turn your donations into meaningful impact.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                <button className="w-full sm:w-auto px-8 py-4 bg-emerald-600 text-white rounded-full hover:bg-emerald-700 transition-all hover:scale-105 font-semibold text-lg shadow-lg">
                  Donate Now
                </button>
                <button className="w-full sm:w-auto px-8 py-4 bg-white text-emerald-600 border-2 border-emerald-600 rounded-full hover:bg-emerald-50 transition-all font-semibold text-lg">
                  Become a Volunteer
                </button>
              </div>
            </div>
          </div>
        </section>

        <section className="py-16 sm:py-24 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl mx-auto text-center">
              <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-6">
                The Problem We're Solving
              </h2>
              <p className="text-lg text-gray-600 leading-relaxed mb-8">
                Every day, thousands of tons of usable food, clothing, and books go to waste.
                Not because they're unwanted, but because there's <span className="font-semibold text-gray-900">no easy way to connect</span> those
                who have surplus with those in need.
              </p>
              <div className="grid sm:grid-cols-3 gap-6 mt-12">
                <div className="p-6 bg-orange-50 rounded-2xl">
                  <div className="text-4xl font-bold text-orange-600 mb-2">30%</div>
                  <p className="text-gray-700">Food wasted annually</p>
                </div>
                <div className="p-6 bg-orange-50 rounded-2xl">
                  <div className="text-4xl font-bold text-orange-600 mb-2">85M</div>
                  <p className="text-gray-700">Tons of textiles discarded</p>
                </div>
                <div className="p-6 bg-orange-50 rounded-2xl">
                  <div className="text-4xl font-bold text-orange-600 mb-2">2.2M</div>
                  <p className="text-gray-700">Children lack books</p>
                </div>
              </div>
              <p className="text-xl text-gray-900 font-semibold mt-12">
                We bridge this gap with technology, transparency, and trust.
              </p>
            </div>
          </div>
        </section>

        <section className="py-16 sm:py-24 bg-gradient-to-br from-emerald-50 to-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
                How It Works
              </h2>
              <p className="text-lg text-gray-600">Simple, fast, and transparent</p>
            </div>

            <div className="grid md:grid-cols-3 gap-8 lg:gap-12">
              <div className="text-center">
                <div className="w-20 h-20 bg-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
                  <Package className="w-10 h-10 text-white" />
                </div>
                <div className="inline-block px-4 py-1 bg-emerald-100 text-emerald-700 rounded-full text-sm font-semibold mb-4">
                  Step 1
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">Post Your Donation</h3>
                <p className="text-gray-600 leading-relaxed">
                  Select the category—food, clothes, books, or essentials. Add photos,
                  quantity, and your location. It takes less than 2 minutes.
                </p>
              </div>

              <div className="text-center">
                <div className="w-20 h-20 bg-orange-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
                  <MapPin className="w-10 h-10 text-white" />
                </div>
                <div className="inline-block px-4 py-1 bg-orange-100 text-orange-700 rounded-full text-sm font-semibold mb-4">
                  Step 2
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">Instant Notification</h3>
                <p className="text-gray-600 leading-relaxed">
                  Nearby verified volunteers and NGOs are notified immediately.
                  They can accept and coordinate pickup with you directly.
                </p>
              </div>

              <div className="text-center">
                <div className="w-20 h-20 bg-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
                  <Users className="w-10 h-10 text-white" />
                </div>
                <div className="inline-block px-4 py-1 bg-emerald-100 text-emerald-700 rounded-full text-sm font-semibold mb-4">
                  Step 3
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">Pickup & Distribution</h3>
                <p className="text-gray-600 leading-relaxed">
                  Volunteers collect your donation using OTP verification.
                  Items are distributed to those in need, and you get impact updates.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="py-16 sm:py-24 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
                Key Features
              </h2>
              <p className="text-lg text-gray-600">Built for trust, speed, and impact</p>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
              <div className="p-6 border border-gray-200 rounded-2xl hover:border-emerald-300 hover:shadow-lg transition-all">
                <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center mb-4">
                  <Package className="w-6 h-6 text-emerald-600" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">Category-Based Donations</h3>
                <p className="text-gray-600">
                  Organize by food, clothing, books, or essentials for efficient matching
                </p>
              </div>

              <div className="p-6 border border-gray-200 rounded-2xl hover:border-emerald-300 hover:shadow-lg transition-all">
                <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center mb-4">
                  <Clock className="w-6 h-6 text-orange-600" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">Real-Time Notifications</h3>
                <p className="text-gray-600">
                  Instant alerts to nearby volunteers when you post a donation
                </p>
              </div>

              <div className="p-6 border border-gray-200 rounded-2xl hover:border-emerald-300 hover:shadow-lg transition-all">
                <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center mb-4">
                  <MapPin className="w-6 h-6 text-emerald-600" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">Location-Based Pickup</h3>
                <p className="text-gray-600">
                  Smart matching with volunteers closest to your location
                </p>
              </div>

              <div className="p-6 border border-gray-200 rounded-2xl hover:border-emerald-300 hover:shadow-lg transition-all">
                <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center mb-4">
                  <Lock className="w-6 h-6 text-orange-600" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">OTP Verification</h3>
                <p className="text-gray-600">
                  Secure pickup confirmation system for donor peace of mind
                </p>
              </div>

              <div className="p-6 border border-gray-200 rounded-2xl hover:border-emerald-300 hover:shadow-lg transition-all">
                <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center mb-4">
                  <Camera className="w-6 h-6 text-emerald-600" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">Image Proof</h3>
                <p className="text-gray-600">
                  Photo documentation at every step for full transparency
                </p>
              </div>

              <div className="p-6 border border-gray-200 rounded-2xl hover:border-emerald-300 hover:shadow-lg transition-all">
                <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center mb-4">
                  <TrendingUp className="w-6 h-6 text-orange-600" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">Impact Tracking</h3>
                <p className="text-gray-600">
                  See the real-world difference your donations make over time
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="py-16 sm:py-24 bg-gradient-to-br from-emerald-600 to-emerald-700 text-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl sm:text-4xl font-bold mb-4">
                Our Growing Impact
              </h2>
              <p className="text-lg text-emerald-100">Every donation makes a real difference</p>
            </div>

            <div className="grid sm:grid-cols-3 gap-8 lg:gap-12">
              <div className="text-center">
                <div className="text-5xl sm:text-6xl font-bold mb-3">127,543</div>
                <p className="text-xl text-emerald-100 font-medium">Meals Saved</p>
                <p className="text-emerald-200 mt-2">Feeding families in need</p>
              </div>
              <div className="text-center">
                <div className="text-5xl sm:text-6xl font-bold mb-3">89,201</div>
                <p className="text-xl text-emerald-100 font-medium">Clothes Distributed</p>
                <p className="text-emerald-200 mt-2">Keeping people warm</p>
              </div>
              <div className="text-center">
                <div className="text-5xl sm:text-6xl font-bold mb-3">34,892</div>
                <p className="text-xl text-emerald-100 font-medium">Books Donated</p>
                <p className="text-emerald-200 mt-2">Empowering through education</p>
              </div>
            </div>

            <div className="mt-16 text-center">
              <p className="text-2xl font-semibold mb-2">Join thousands making a difference</p>
              <p className="text-emerald-100">Together, we're building a more compassionate community</p>
            </div>
          </div>
        </section>

        <section className="py-16 sm:py-24 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
                Trust & Safety First
              </h2>
              <p className="text-lg text-gray-600">Your donations are in safe hands</p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              <div className="text-center p-8 bg-gray-50 rounded-2xl">
                <div className="w-16 h-16 bg-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Shield className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">Verified NGOs</h3>
                <p className="text-gray-600 leading-relaxed">
                  Every organization and volunteer undergoes a thorough verification process
                  before joining our network.
                </p>
              </div>

              <div className="text-center p-8 bg-gray-50 rounded-2xl">
                <div className="w-16 h-16 bg-orange-500 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Camera className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">Photo Verification</h3>
                <p className="text-gray-600 leading-relaxed">
                  Image documentation and OTP verification at pickup ensures complete
                  transparency and accountability.
                </p>
              </div>

              <div className="text-center p-8 bg-gray-50 rounded-2xl">
                <div className="w-16 h-16 bg-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6">
                  <CheckCircle className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">Admin Monitoring</h3>
                <p className="text-gray-600 leading-relaxed">
                  Our team actively monitors all transactions and maintains quality
                  standards across the platform.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="py-20 sm:py-28 bg-gradient-to-br from-orange-50 via-white to-emerald-50">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-6">
              Ready to Make an Impact?
            </h2>
            <p className="text-lg sm:text-xl text-gray-600 mb-10 leading-relaxed">
              Join our community of donors and volunteers creating positive change.
              Your surplus can be someone else's support.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <button className="w-full sm:w-auto px-8 py-4 bg-emerald-600 text-white rounded-full hover:bg-emerald-700 transition-all hover:scale-105 font-semibold text-lg shadow-lg">
                Start Donating
              </button>
              <button className="w-full sm:w-auto px-8 py-4 bg-orange-500 text-white rounded-full hover:bg-orange-600 transition-all hover:scale-105 font-semibold text-lg shadow-lg">
                Join as Volunteer
              </button>
            </div>
          </div>
        </section>
      </main>

      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <Heart className="w-6 h-6 text-emerald-400" />
                <span className="text-lg font-bold">ShareCare</span>
              </div>
              <p className="text-gray-400 text-sm">
                Connecting donors with communities in need through technology and trust.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Platform</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">How It Works</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Donate</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Volunteer</a></li>
                <li><a href="#" className="hover:text-white transition-colors">NGO Partnership</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Resources</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">About Us</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Impact Stories</a></li>
                <li><a href="#" className="hover:text-white transition-colors">FAQ</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Contact</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Legal</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Terms of Service</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Community Guidelines</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 pt-8 text-center text-sm text-gray-400">
            <p>© 2024 ShareCare. All rights reserved. Built with purpose.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
