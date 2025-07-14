const mongoose = require('mongoose');
const Service = require('../models/Service');
require('dotenv').config();

const services = [
  // Cleaning Services
  {
    name: 'House Cleaning',
    description: 'Professional home cleaning service including kitchen, bathrooms, bedrooms, and living areas.',
    category: 'cleaning',
    subcategory: 'house-cleaning',
    icon: '🧹',
    image: '/images/services/house-cleaning.jpg',
    basePrice: 250,
    pricingType: 'fixed',
    currency: 'ZAR',
    estimatedDuration: { min: 120, max: 240 },
    requiresEquipment: true,
    equipmentList: ['Vacuum cleaner', 'Cleaning supplies', 'Mops and buckets'],
    availableProvinces: ['Gauteng', 'Western Cape', 'KwaZulu-Natal', 'Eastern Cape'],
    minimumAdvanceBooking: 2,
    maximumAdvanceBooking: 30,
    cancellationPolicy: 'moderate',
    isActive: true,
    tags: ['cleaning', 'house', 'domestic', 'hygiene']
  },
  {
    name: 'Deep Cleaning',
    description: 'Comprehensive deep cleaning service for homes that need extra attention.',
    category: 'cleaning',
    subcategory: 'deep-cleaning',
    icon: '🧽',
    image: '/images/services/deep-cleaning.jpg',
    basePrice: 400,
    pricingType: 'fixed',
    currency: 'ZAR',
    estimatedDuration: { min: 240, max: 480 },
    requiresEquipment: true,
    equipmentList: ['Professional cleaning equipment', 'Deep cleaning chemicals', 'Steam cleaners'],
    availableProvinces: ['Gauteng', 'Western Cape', 'KwaZulu-Natal'],
    minimumAdvanceBooking: 24,
    maximumAdvanceBooking: 30,
    cancellationPolicy: 'strict',
    isActive: true,
    tags: ['deep-cleaning', 'thorough', 'professional', 'sanitization']
  },

  // Pet Care Services
  {
    name: 'Pet Sitting',
    description: 'Professional pet care in your home while you\'re away.',
    category: 'pet-care',
    subcategory: 'pet-sitting',
    icon: '🐕',
    image: '/images/services/pet-sitting.jpg',
    basePrice: 150,
    pricingType: 'hourly',
    currency: 'ZAR',
    estimatedDuration: { min: 120, max: 480 },
    requiresEquipment: false,
    availableProvinces: ['Gauteng', 'Western Cape', 'KwaZulu-Natal', 'Eastern Cape'],
    minimumAdvanceBooking: 4,
    maximumAdvanceBooking: 30,
    cancellationPolicy: 'flexible',
    isActive: true,
    tags: ['pets', 'care', 'sitting', 'animals']
  },
  {
    name: 'Dog Walking',
    description: 'Daily dog walking service to keep your pet healthy and happy.',
    category: 'pet-care',
    subcategory: 'dog-walking',
    icon: '🚶‍♂️',
    image: '/images/services/dog-walking.jpg',
    basePrice: 80,
    pricingType: 'hourly',
    currency: 'ZAR',
    estimatedDuration: { min: 30, max: 90 },
    requiresEquipment: false,
    availableProvinces: ['Gauteng', 'Western Cape', 'KwaZulu-Natal', 'Eastern Cape', 'Free State'],
    minimumAdvanceBooking: 2,
    maximumAdvanceBooking: 30,
    cancellationPolicy: 'flexible',
    isActive: true,
    tags: ['dogs', 'walking', 'exercise', 'pets']
  },

  // Beauty & Personal Care Services
  {
    name: 'Home Hairdressing',
    description: 'Professional hair cutting, styling, and treatment services in your home.',
    category: 'beauty-personal-care',
    subcategory: 'hairdressing',
    icon: '💇‍♀️',
    image: '/images/services/hairdressing.jpg',
    basePrice: 200,
    pricingType: 'fixed',
    currency: 'ZAR',
    estimatedDuration: { min: 60, max: 180 },
    requiresEquipment: true,
    equipmentList: ['Hair cutting tools', 'Styling equipment', 'Hair products'],
    requiresElectricity: true,
    availableProvinces: ['Gauteng', 'Western Cape', 'KwaZulu-Natal'],
    minimumAdvanceBooking: 4,
    maximumAdvanceBooking: 30,
    cancellationPolicy: 'moderate',
    isActive: true,
    tags: ['hair', 'styling', 'beauty', 'personal-care']
  },
  {
    name: 'Mobile Massage Therapy',
    description: 'Relaxing massage therapy in the comfort of your home.',
    category: 'beauty-personal-care',
    subcategory: 'massage-therapy',
    icon: '💆‍♀️',
    image: '/images/services/massage-therapy.jpg',
    basePrice: 350,
    pricingType: 'hourly',
    currency: 'ZAR',
    estimatedDuration: { min: 60, max: 120 },
    requiresEquipment: true,
    equipmentList: ['Massage table', 'Oils and lotions', 'Towels'],
    availableProvinces: ['Gauteng', 'Western Cape', 'KwaZulu-Natal'],
    minimumAdvanceBooking: 4,
    maximumAdvanceBooking: 30,
    cancellationPolicy: 'moderate',
    requiredCertifications: ['Massage Therapy Certificate'],
    isActive: true,
    tags: ['massage', 'therapy', 'relaxation', 'wellness']
  },
  {
    name: 'Mobile Makeup Artist',
    description: 'Professional makeup services for special events and occasions.',
    category: 'beauty-personal-care',
    subcategory: 'makeup-artist',
    icon: '💄',
    image: '/images/services/makeup-artist.jpg',
    basePrice: 300,
    pricingType: 'fixed',
    currency: 'ZAR',
    estimatedDuration: { min: 60, max: 120 },
    requiresEquipment: true,
    equipmentList: ['Professional makeup kit', 'Brushes and tools', 'Lighting equipment'],
    availableProvinces: ['Gauteng', 'Western Cape', 'KwaZulu-Natal'],
    minimumAdvanceBooking: 24,
    maximumAdvanceBooking: 30,
    cancellationPolicy: 'strict',
    isActive: true,
    tags: ['makeup', 'beauty', 'events', 'special-occasions']
  },
  {
    name: 'Mobile Nail Technician',
    description: 'Professional nail care, manicures, and pedicures at your location.',
    category: 'beauty-personal-care',
    subcategory: 'nail-technician',
    icon: '💅',
    image: '/images/services/nail-technician.jpg',
    basePrice: 180,
    pricingType: 'fixed',
    currency: 'ZAR',
    estimatedDuration: { min: 45, max: 90 },
    requiresEquipment: true,
    equipmentList: ['Nail care tools', 'Polish and treatments', 'UV lamp'],
    requiresElectricity: true,
    availableProvinces: ['Gauteng', 'Western Cape', 'KwaZulu-Natal', 'Eastern Cape'],
    minimumAdvanceBooking: 4,
    maximumAdvanceBooking: 30,
    cancellationPolicy: 'moderate',
    isActive: true,
    tags: ['nails', 'manicure', 'pedicure', 'beauty']
  },

  // Gardening Services
  {
    name: 'Garden Maintenance',
    description: 'Complete garden care including weeding, pruning, and general maintenance.',
    category: 'gardening',
    subcategory: 'garden-maintenance',
    icon: '🌱',
    image: '/images/services/garden-maintenance.jpg',
    basePrice: 200,
    pricingType: 'hourly',
    currency: 'ZAR',
    estimatedDuration: { min: 120, max: 480 },
    requiresEquipment: true,
    equipmentList: ['Garden tools', 'Pruning shears', 'Wheelbarrow'],
    requiresWater: true,
    availableProvinces: ['Gauteng', 'Western Cape', 'KwaZulu-Natal', 'Eastern Cape', 'Free State'],
    minimumAdvanceBooking: 4,
    maximumAdvanceBooking: 30,
    cancellationPolicy: 'flexible',
    isActive: true,
    tags: ['gardening', 'maintenance', 'landscaping', 'outdoor']
  },
  {
    name: 'Lawn Mowing',
    description: 'Professional grass cutting and lawn care services.',
    category: 'gardening',
    subcategory: 'lawn-mowing',
    icon: '🌿',
    image: '/images/services/lawn-mowing.jpg',
    basePrice: 150,
    pricingType: 'fixed',
    currency: 'ZAR',
    estimatedDuration: { min: 60, max: 180 },
    requiresEquipment: true,
    equipmentList: ['Lawn mower', 'Edge trimmer', 'Grass collector'],
    requiresElectricity: true,
    availableProvinces: ['Gauteng', 'Western Cape', 'KwaZulu-Natal', 'Eastern Cape', 'Free State'],
    minimumAdvanceBooking: 2,
    maximumAdvanceBooking: 30,
    cancellationPolicy: 'flexible',
    isActive: true,
    tags: ['lawn', 'mowing', 'grass', 'maintenance']
  },

  // Automotive Services
  {
    name: 'Car Wash - Interior',
    description: 'Complete interior car cleaning including vacuuming and detailing.',
    category: 'automotive',
    subcategory: 'car-wash-interior',
    icon: '🧽',
    image: '/images/services/car-wash-interior.jpg',
    basePrice: 120,
    pricingType: 'fixed',
    currency: 'ZAR',
    estimatedDuration: { min: 45, max: 90 },
    requiresEquipment: true,
    equipmentList: ['Vacuum cleaner', 'Interior cleaning products', 'Microfiber cloths'],
    requiresElectricity: true,
    availableProvinces: ['Gauteng', 'Western Cape', 'KwaZulu-Natal', 'Eastern Cape', 'Free State'],
    minimumAdvanceBooking: 2,
    maximumAdvanceBooking: 30,
    cancellationPolicy: 'flexible',
    isActive: true,
    tags: ['car-wash', 'interior', 'cleaning', 'automotive']
  },
  {
    name: 'Car Wash - Exterior',
    description: 'Professional exterior car washing and waxing service.',
    category: 'automotive',
    subcategory: 'car-wash-exterior',
    icon: '🚗',
    image: '/images/services/car-wash-exterior.jpg',
    basePrice: 100,
    pricingType: 'fixed',
    currency: 'ZAR',
    estimatedDuration: { min: 30, max: 60 },
    requiresEquipment: true,
    equipmentList: ['Car washing supplies', 'Hose and buckets', 'Wax and polish'],
    requiresWater: true,
    availableProvinces: ['Gauteng', 'Western Cape', 'KwaZulu-Natal', 'Eastern Cape', 'Free State'],
    minimumAdvanceBooking: 2,
    maximumAdvanceBooking: 30,
    cancellationPolicy: 'flexible',
    isActive: true,
    tags: ['car-wash', 'exterior', 'cleaning', 'automotive']
  },
  {
    name: 'Full Car Wash - Sedan',
    description: 'Complete interior and exterior car wash for sedan vehicles.',
    category: 'automotive',
    subcategory: 'car-wash-full-sedan',
    icon: '🚙',
    image: '/images/services/car-wash-full-sedan.jpg',
    basePrice: 200,
    pricingType: 'fixed',
    currency: 'ZAR',
    estimatedDuration: { min: 90, max: 150 },
    requiresEquipment: true,
    equipmentList: ['Complete car washing kit', 'Vacuum cleaner', 'Detailing supplies'],
    requiresWater: true,
    requiresElectricity: true,
    availableProvinces: ['Gauteng', 'Western Cape', 'KwaZulu-Natal', 'Eastern Cape', 'Free State'],
    minimumAdvanceBooking: 2,
    maximumAdvanceBooking: 30,
    cancellationPolicy: 'flexible',
    isActive: true,
    tags: ['car-wash', 'full-service', 'sedan', 'automotive']
  },
  {
    name: 'Full Car Wash - SUV',
    description: 'Complete interior and exterior car wash for SUV and larger vehicles.',
    category: 'automotive',
    subcategory: 'car-wash-full-suv',
    icon: '🚛',
    image: '/images/services/car-wash-full-suv.jpg',
    basePrice: 250,
    pricingType: 'fixed',
    currency: 'ZAR',
    estimatedDuration: { min: 120, max: 180 },
    requiresEquipment: true,
    equipmentList: ['Complete car washing kit', 'Heavy-duty vacuum', 'SUV detailing supplies'],
    requiresWater: true,
    requiresElectricity: true,
    availableProvinces: ['Gauteng', 'Western Cape', 'KwaZulu-Natal', 'Eastern Cape', 'Free State'],
    minimumAdvanceBooking: 2,
    maximumAdvanceBooking: 30,
    cancellationPolicy: 'flexible',
    isActive: true,
    tags: ['car-wash', 'full-service', 'suv', 'automotive', 'large-vehicle']
  }
];

async function seedServices() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/helperhive');
    console.log('Connected to MongoDB');

    // Clear existing services
    await Service.deleteMany({});
    console.log('Cleared existing services');

    // Insert new services
    const createdServices = await Service.insertMany(services);
    console.log(`Successfully seeded ${createdServices.length} services`);

    console.log('\nServices created:');
    createdServices.forEach(service => {
      console.log(`- ${service.name} (${service.category}/${service.subcategory}): R${service.basePrice}`);
    });

    process.exit(0);
  } catch (error) {
    console.error('Error seeding services:', error);
    process.exit(1);
  }
}

// Run the seeder if called directly
if (require.main === module) {
  seedServices();
}

module.exports = { services, seedServices };