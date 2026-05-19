import { useState, useEffect } from 'react';
import { Heart, Users, Globe, Recycle, Award, TrendingUp, MapPin } from 'lucide-react';

interface ImpactData {
  metrics: {
    donations: number;
    beneficiaries: number;
    wasteReduced: number;
    ngos: number;
  };
  environmentalImpact: Array<{
    metric: string;
    value: string;
    icon: string;
    description: string;
  }>;
  successStories: Array<{
    name: string;
    story: string;
    location: string;
    impact: string;
  }>;
  ngoPartners: Array<{
    name: string;
    category: string;
    projects: number;
  }>;
}

const Impact = () => {
  const [animatedStats, setAnimatedStats] = useState({
    donations: 0,
    beneficiaries: 0,
    wasteReduced: 0,
    ngos: 0
  });
  const [impactData, setImpactData] = useState<ImpactData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch impact data from API
  useEffect(() => {
    const fetchImpactData = async () => {
      try {
        setLoading(true);
        const response = await fetch(`${import.meta.env.VITE_API_URL}/impact`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch impact data');
        }
        
        const result = await response.json();
        
        if (result.success) {
          setImpactData(result.data);
        } else {
          throw new Error(result.message || 'Error fetching data');
        }
      } catch (err) {
        console.error('Error fetching impact data:', err);
        setError(err instanceof Error ? err.message : 'Unknown error');
        // Set default data if API fails
        setImpactData({
          metrics: {
            donations: 127543,
            beneficiaries: 89201,
            wasteReduced: 34892,
            ngos: 45
          },
          environmentalImpact: [
            {
              metric: 'CO2 Reduced',
              value: '12.5 tons',
              icon: 'globe',
              description: 'Carbon emissions prevented through waste reduction'
            },
            {
              metric: 'Waste Diverted',
              value: '34,892 kg',
              icon: 'recycle',
              description: 'Items saved from landfills'
            },
            {
              metric: 'Growth Rate',
              value: '45%',
              icon: 'trending-up',
              description: 'Year-over-year increase in donations'
            }
          ],
          successStories: [
            {
              name: 'Community Food Drive',
              story: 'Local volunteers collected 500kg of food in one day',
              location: 'Mumbai',
              impact: 'Fed 200 families for a week'
            },
            {
              name: 'Book Donation Campaign',
              story: 'Students donated 1000+ books to rural schools',
              location: 'Delhi',
              impact: 'Established 5 new libraries'
            },
            {
              name: 'Clothing Distribution',
              story: 'Winter clothes drive helped 300 people',
              location: 'Bangalore',
              impact: 'Provided warmth during cold season'
            }
          ],
          ngoPartners: [
            { name: 'Feed India', category: 'Food Security', projects: 25 },
            { name: 'Education First', category: 'Education', projects: 18 },
            { name: 'Warm Hearts', category: 'Clothing', projects: 12 },
            { name: 'Green Future', category: 'Environment', projects: 15 }
          ]
        });
      } finally {
        setLoading(false);
      }
    };

    fetchImpactData();
  }, []);

  // Animate stats when data is loaded
  useEffect(() => {
    if (!impactData) return;

    const duration = 2000;
    const steps = 60;
    const increment = duration / steps;

    const animateValue = (start: number, end: number, key: keyof typeof animatedStats) => {
      let current = start;
      const step = (end - start) / steps;
      
      const timer = setInterval(() => {
        current += step;
        if (current >= end) {
          current = end;
          clearInterval(timer);
        }
        setAnimatedStats(prev => ({ ...prev, [key]: Math.floor(current) }));
      }, increment);
    };

    Object.keys(impactData.metrics).forEach((key, index) => {
      setTimeout(() => {
        animateValue(0, impactData.metrics[key as keyof typeof impactData.metrics], key as keyof typeof animatedStats);
      }, index * 200);
    });
  }, [impactData]);

  // Icon mapping
  const getIcon = (iconName: string) => {
    switch (iconName) {
      case 'globe':
        return <Globe className="w-6 h-6" />;
      case 'recycle':
        return <Recycle className="w-6 h-6" />;
      case 'trending-up':
        return <TrendingUp className="w-6 h-6" />;
      default:
        return <Award className="w-6 h-6" />;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-emerald-50 to-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading impact data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-emerald-50 to-white flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 mb-4">
            <Award className="w-12 h-12 mx-auto" />
          </div>
          <p className="text-gray-800 mb-2">Error loading impact data</p>
          <p className="text-gray-600">{error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="mt-4 px-6 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!impactData) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-emerald-50 to-white flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">No impact data available</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50 to-white">
      {/* Header */}
      <div className="bg-white text-gray-800 py-16">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4 text-gray-900">Our Impact</h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Creating meaningful change through the power of giving and community collaboration
          </p>
        </div>
      </div>

      {/* Key Metrics Dashboard */}
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-emerald-500">
            <div className="flex items-center justify-between mb-4">
              <Heart className="w-8 h-8 text-emerald-500" />
              <span className="text-sm text-gray-500">Total Donations</span>
            </div>
            <div className="text-3xl font-bold text-gray-800">{animatedStats.donations.toLocaleString()}</div>
            <div className="text-sm text-gray-600 mt-1">Items connected</div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-blue-500">
            <div className="flex items-center justify-between mb-4">
              <Users className="w-8 h-8 text-blue-500" />
              <span className="text-sm text-gray-500">Lives Impacted</span>
            </div>
            <div className="text-3xl font-bold text-gray-800">{animatedStats.beneficiaries.toLocaleString()}</div>
            <div className="text-sm text-gray-600 mt-1">People helped</div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-green-500">
            <div className="flex items-center justify-between mb-4">
              <Recycle className="w-8 h-8 text-green-500" />
              <span className="text-sm text-gray-500">Waste Reduced</span>
            </div>
            <div className="text-3xl font-bold text-gray-800">{animatedStats.wasteReduced.toLocaleString()}</div>
            <div className="text-sm text-gray-600 mt-1">Kilograms diverted</div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-purple-500">
            <div className="flex items-center justify-between mb-4">
              <Award className="w-8 h-8 text-purple-500" />
              <span className="text-sm text-gray-500">NGO Partners</span>
            </div>
            <div className="text-3xl font-bold text-gray-800">{animatedStats.ngos}</div>
            <div className="text-sm text-gray-600 mt-1">Organizations</div>
          </div>
        </div>

        {/* Success Stories */}
        <div className="mb-12">
          <h2 className="text-3xl font-bold text-gray-800 mb-8 text-center">Success Stories</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {impactData.successStories.map((story, index) => (
              <div key={index} className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition-shadow">
                <div className="flex items-start mb-4">
                  <div className="bg-emerald-100 rounded-full p-3 mr-4">
                    <Heart className="w-6 h-6 text-emerald-600" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-800 mb-1">{story.name}</h3>
                    <div className="flex items-center text-sm text-gray-500 mb-2">
                      <MapPin className="w-4 h-4 mr-1" />
                      {story.location}
                    </div>
                  </div>
                </div>
                <p className="text-gray-600 mb-3">{story.story}</p>
                <div className="bg-emerald-50 rounded-lg p-3">
                  <p className="text-sm font-medium text-emerald-700">{story.impact}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Environmental Impact */}
        <div className="mb-12">
          <h2 className="text-3xl font-bold text-gray-800 mb-8 text-center">Environmental Impact</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {impactData.environmentalImpact.map((item, index) => (
              <div key={index} className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-6 text-center">
                <div className="inline-flex items-center justify-center bg-white rounded-full p-4 mb-4 text-emerald-600">
                  {getIcon(item.icon)}
                </div>
                <div className="text-2xl font-bold text-gray-800 mb-2">{item.value}</div>
                <div className="font-semibold text-gray-700 mb-1">{item.metric}</div>
                <div className="text-sm text-gray-600">{item.description}</div>
              </div>
            ))}
          </div>
        </div>

        {/* NGO Partners */}
        <div className="mb-12">
          <h2 className="text-3xl font-bold text-gray-800 mb-8 text-center">Our NGO Partners</h2>
          <div className="bg-white rounded-xl shadow-lg p-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {impactData.ngoPartners.map((partner, index) => (
                <div key={index} className="text-center">
                  <div className="bg-gray-100 rounded-lg p-4 mb-4">
                    <Award className="w-8 h-8 text-emerald-600 mx-auto" />
                  </div>
                  <h3 className="font-semibold text-gray-800 mb-1">{partner.name}</h3>
                  <div className="text-sm text-gray-500 mb-2">{partner.category}</div>
                  <div className="text-lg font-bold text-emerald-600">{partner.projects} Projects</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Call to Action */}
        <div className="bg-gradient-to-r from-emerald-600 to-blue-600 rounded-xl p-8 text-center text-white">
          <h2 className="text-3xl font-bold mb-4">Be Part of the Change</h2>
          <p className="text-xl mb-6 max-w-2xl mx-auto">
            Join thousands of donors and NGOs making a real difference in communities across India
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button className="bg-white text-emerald-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors">
              Start Donating
            </button>
            <button className="border-2 border-white text-white px-8 py-3 rounded-lg font-semibold hover:bg-white hover:text-emerald-600 transition-colors">
              Partner with Us
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Impact;
