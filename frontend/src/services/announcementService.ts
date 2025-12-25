export interface Announcement {
  id: string;
  title: string;
  description: string;
  location: string;
  date: string;
  organization: string;
  imageUrl: string;
  category: string;
  contactEmail?: string;
  phoneNumber?: string;
  website?: string;
  requirements?: string[];
}

const getRandomPlaceholderImage = (category: string = 'donation'): string => {
  // Direct image URLs from Unsplash for better reliability
  const categoryImages: {[key: string]: string} = {
    'Food Drive': 'https://images.unsplash.com/photo-1507048331197-7d4ac70811cf?w=800&auto=format&fit=crop',
    'Clothing Donation': 'https://images.unsplash.com/photo-1441986300917-64674bd5d53a?w=800&auto=format&fit=crop',
    'Volunteer Opportunity': 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=800&auto=format&fit=crop',
    'Community Event': 'https://images.unsplash.com/photo-1517457373958-b7bdd4587205?w=800&auto=format&fit=crop',
    'Fundraiser': 'https://images.unsplash.com/photo-1527525443983-6e60c75fff46?w=800&auto=format&fit=crop',
    'Book Donation': 'https://images.unsplash.com/photo-1507842217343-583bb7270b66?w=800&auto=format&fit=crop',
    'default': 'https://images.unsplash.com/photo-1504674900247-087703934569?w=800&auto=format&fit=crop'
  };
  
  return categoryImages[category] || categoryImages['default'];
};

// Enhanced mock data
const MOCK_ANNOUNCEMENTS: Announcement[] = [
  {
    id: '1',
    title: 'Winter Food Drive 2023',
    description: 'Join our annual winter food drive to help feed families in need. We\'re collecting non-perishable food items at various locations across the city.',
    location: 'Multiple Locations',
    date: new Date('2023-12-20').toISOString(),
    organization: 'Food For All Foundation',
    category: 'Food Drive',
    imageUrl: 'https://images.unsplash.com/photo-1507048331197-7d4ac70811cf?w=800&auto=format&fit=crop',
    contactEmail: 'fooddrive@example.com',
    phoneNumber: '+1 (555) 123-4567',
    requirements: ['Non-perishable items only', 'No expired food', 'Check expiry dates']
  },
  {
    id: '2',
    title: 'Clothing Donation Drive',
    description: 'Help keep our community warm this winter by donating gently used winter clothing. We accept coats, sweaters, and blankets.',
    location: 'Community Center, 123 Main St',
    date: new Date('2023-12-22').toISOString(),
    organization: 'Warm Hearts Initiative',
    category: 'Clothing Donation',
    imageUrl: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=800&auto=format&fit=crop',
    contactEmail: 'donate@warmhearts.org',
    requirements: ['Clean and gently used items', 'No damaged clothing', 'Season-appropriate']
  },
  {
    id: '3',
    title: 'Volunteer Training Program',
    description: 'Become a certified volunteer! Join our 2-day training program to learn how you can make a meaningful impact in your community.',
    location: 'Online & Community Hall',
    date: new Date('2024-01-05').toISOString(),
    organization: 'Helping Hands Network',
    category: 'Volunteer Opportunity',
    imageUrl: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=800&auto=format&fit=crop',
    requirements: ['18+ years old', 'Background check required', '2-day commitment']
  },
  {
    id: '4',
    title: 'Community Kitchen - Holiday Meals',
    description: 'Volunteer to help prepare and serve holiday meals to those in need. Shifts available throughout December.',
    location: 'Community Kitchen, 456 Oak Ave',
    date: new Date('2023-12-24').toISOString(),
    organization: 'Meals That Matter',
    category: 'Community Event',
    imageUrl: getRandomPlaceholderImage('Community Event'),
    requirements: ['Food handler\'s certificate preferred', 'Comfortable standing for long periods']
  },
  {
    id: '5',
    title: 'Fundraising Gala Night',
    description: 'Join us for an evening of fine dining and entertainment to support our cause. All proceeds go towards feeding hungry children.',
    location: 'Grand Ballroom, 789 Park Ave',
    date: new Date('2024-01-15').toISOString(),
    organization: 'Nourish the Future',
    category: 'Fundraiser',
    imageUrl: 'https://images.unsplash.com/photo-1475721027785-f74eccf877e2?w=800&auto=format&fit=crop',
    website: 'https://nourishfuture.org/gala'
  },
  {
    id: '6',
    title: 'Book Donation Drive',
    description: 'Help us build a library for underprivileged children. We\'re collecting new and gently used children\'s books in all languages.',
    location: 'Local Schools & Libraries',
    date: new Date('2024-01-10').toISOString(),
    organization: 'Read to Succeed',
    category: 'Book Donation',
    imageUrl: 'https://images.unsplash.com/photo-1507842217343-583bb7270b66?w=800&auto=format&fit=crop',
    requirements: ['Books in good condition', 'Children\'s books preferred', 'All languages welcome']
  }
];


export const fetchAnnouncements = async (_keyword: string = 'donation'): Promise<Announcement[]> => {
  try {
    // Uncomment to test with actual API
    // const response = await fetch(`${API_BASE_URL}?keyword=${encodeURIComponent(_keyword)}`);
    // if (response.ok) {
    //   const data = await response.json();
    //   return data.results?.map((item: any, index: number) => ({
    //     id: item.id || `announcement-${index}`,
    //     title: item.title || 'Volunteer Opportunity',
    //     description: item.description || 'Help make a difference in your community.',
    //     location: item.location || 'Various Locations',
    //     date: item.date || new Date().toISOString(),
    //     organization: item.organization?.name || 'Local NGO',
    //     imageUrl: item.image_url || getRandomPlaceholderImage(item.category),
    //     category: item.category || 'Donation Drive',
    //     contactEmail: item.contact_email,
    //     phoneNumber: item.phone,
    //     website: item.website,
    //     requirements: item.requirements
    //   })) || MOCK_ANNOUNCEMENTS;
    // }
    
    // For now, return mock data with enhanced images
    return MOCK_ANNOUNCEMENTS.map(announcement => ({
      ...announcement,
      // Ensure we have a good quality image
      imageUrl: announcement.imageUrl.includes('unsplash.com') 
        ? announcement.imageUrl 
        : getRandomPlaceholderImage(announcement.category)
    }));
    
  } catch (error) {
    console.warn('Using mock data due to API error:', error);
    return MOCK_ANNOUNCEMENTS;
  }
};
