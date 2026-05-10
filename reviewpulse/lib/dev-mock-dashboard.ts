/** Rich sample data in development only (set DEV_MOCK_DASHBOARD=false to disable). */
export function shouldUseDashboardMocks(): boolean {
  if (process.env.NODE_ENV !== 'development') return false
  return process.env.DEV_MOCK_DASHBOARD !== 'false'
}

function daysAgo(n: number) {
  const d = new Date()
  d.setDate(d.getDate() - n)
  d.setHours(12, 0, 0, 0)
  return d
}

/** Lean-like review shapes for dashboard / analytics (not full Mongoose documents). */
export const MOCK_REVIEWS: Array<{
  _id: string
  userId: string
  locationId: string
  reviewerName: string
  rating: number
  comment?: string
  sentiment: 'positive' | 'neutral' | 'negative'
  sentimentScore: number
  status: 'pending' | 'replied' | 'ignored'
  reviewCreatedAt: Date
  googleReviewId: string
}> = [
  {
    _id: '64f0a1b2c3d4e5f6a7b8c9d1',
    userId: 'demo',
    locationId: '64f0a1b2c3d4e5f6a7b8c9e1',
    reviewerName: 'Ananya K.',
    rating: 5,
    comment: 'Best biryani in Koramangala—packaging was neat and delivery was 12 minutes early.',
    sentiment: 'positive',
    sentimentScore: 0.85,
    status: 'replied',
    reviewCreatedAt: daysAgo(0),
    googleReviewId: 'mock-1',
  },
  {
    _id: '64f0a1b2c3d4e5f6a7b8c9d2',
    userId: 'demo',
    locationId: '64f0a1b2c3d4e5f6a7b8c9e1',
    reviewerName: 'Rohit M.',
    rating: 4,
    comment: 'Great service. Parking is a bit tight on weekends.',
    sentiment: 'positive',
    sentimentScore: 0.45,
    status: 'pending',
    reviewCreatedAt: daysAgo(1),
    googleReviewId: 'mock-2',
  },
  {
    _id: '64f0a1b2c3d4e5f6a7b8c9d3',
    userId: 'demo',
    locationId: '64f0a1b2c3d4e5f6a7b8c9e2',
    reviewerName: 'Priya S.',
    rating: 5,
    comment: 'Staff remembered my allergy from last visit. That level of care is rare.',
    sentiment: 'positive',
    sentimentScore: 0.92,
    status: 'replied',
    reviewCreatedAt: daysAgo(1),
    googleReviewId: 'mock-3',
  },
  {
    _id: '64f0a1b2c3d4e5f6a7b8c9d4',
    userId: 'demo',
    locationId: '64f0a1b2c3d4e5f6a7b8c9e1',
    reviewerName: 'Vikram D.',
    rating: 2,
    comment: 'Waited 40 minutes for a table despite reservation. Food was cold when it arrived.',
    sentiment: 'negative',
    sentimentScore: -0.72,
    status: 'pending',
    reviewCreatedAt: daysAgo(2),
    googleReviewId: 'mock-4',
  },
  {
    _id: '64f0a1b2c3d4e5f6a7b8c9d5',
    userId: 'demo',
    locationId: '64f0a1b2c3d4e5f6a7b8c9e3',
    reviewerName: 'Meera J.',
    rating: 5,
    comment: 'Facial was relaxing and the therapist explained each step in Hindi—loved it.',
    sentiment: 'positive',
    sentimentScore: 0.88,
    status: 'replied',
    reviewCreatedAt: daysAgo(2),
    googleReviewId: 'mock-5',
  },
  {
    _id: '64f0a1b2c3d4e5f6a7b8c9d6',
    userId: 'demo',
    locationId: '64f0a1b2c3d4e5f6a7b8c9e1',
    reviewerName: 'Arjun T.',
    rating: 3,
    comment: 'Food was okay. Portion size felt smaller than last month.',
    sentiment: 'neutral',
    sentimentScore: -0.05,
    status: 'ignored',
    reviewCreatedAt: daysAgo(3),
    googleReviewId: 'mock-6',
  },
  {
    _id: '64f0a1b2c3d4e5f6a7b8c9d7',
    userId: 'demo',
    locationId: '64f0a1b2c3d4e5f6a7b8c9e2',
    reviewerName: 'Sneha R.',
    rating: 5,
    comment: 'Paneer tikka was outstanding. Will order again for office parties.',
    sentiment: 'positive',
    sentimentScore: 0.9,
    status: 'replied',
    reviewCreatedAt: daysAgo(3),
    googleReviewId: 'mock-7',
  },
  {
    _id: '64f0a1b2c3d4e5f6a7b8c9d8',
    userId: 'demo',
    locationId: '64f0a1b2c3d4e5f6a7b8c9e1',
    reviewerName: 'Kabir L.',
    rating: 4,
    comment: 'Solid experience. Music was a touch loud for family dinner.',
    sentiment: 'neutral',
    sentimentScore: 0.22,
    status: 'pending',
    reviewCreatedAt: daysAgo(4),
    googleReviewId: 'mock-8',
  },
  {
    _id: '64f0a1b2c3d4e5f6a7b8c9d9',
    userId: 'demo',
    locationId: '64f0a1b2c3d4e5f6a7b8c9e3',
    reviewerName: 'Dr. Neha P.',
    rating: 5,
    comment: 'Front desk coordinated insurance smoothly. Very professional clinic.',
    sentiment: 'positive',
    sentimentScore: 0.8,
    status: 'replied',
    reviewCreatedAt: daysAgo(4),
    googleReviewId: 'mock-9',
  },
  {
    _id: '64f0a1b2c3d4e5f6a7b8c9da',
    userId: 'demo',
    locationId: '64f0a1b2c3d4e5f6a7b8c9e1',
    reviewerName: 'Imran S.',
    rating: 1,
    comment: 'Charged twice on UPI. Still waiting for refund after 6 days.',
    sentiment: 'negative',
    sentimentScore: -0.9,
    status: 'pending',
    reviewCreatedAt: daysAgo(5),
    googleReviewId: 'mock-10',
  },
  {
    _id: '64f0a1b2c3d4e5f6a7b8c9db',
    userId: 'demo',
    locationId: '64f0a1b2c3d4e5f6a7b8c9e2',
    reviewerName: 'Kavya N.',
    rating: 5,
    comment: 'Weekend brunch buffet is worth every rupee. Great variety for vegetarians.',
    sentiment: 'positive',
    sentimentScore: 0.86,
    status: 'replied',
    reviewCreatedAt: daysAgo(5),
    googleReviewId: 'mock-11',
  },
  {
    _id: '64f0a1b2c3d4e5f6a7b8c9dc',
    userId: 'demo',
    locationId: '64f0a1b2c3d4e5f6a7b8c9e1',
    reviewerName: 'Suresh G.',
    rating: 4,
    comment: '',
    sentiment: 'positive',
    sentimentScore: 0.55,
    status: 'pending',
    reviewCreatedAt: daysAgo(6),
    googleReviewId: 'mock-12',
  },
]

export const MOCK_LOCATIONS = [
  {
    _id: '64f0a1b2c3d4e5f6a7b8c9e1',
    name: 'Namma Biryani — Koramangala',
    address: '5th Block, Koramangala, Bengaluru',
    totalReviews: 842,
    averageRating: 4.7,
    category: 'Restaurant',
    locationSlug: 'namma-biryani-koramangala',
    qrScans: 128,
    bridgeVisits: 42,
  },
  {
    _id: '64f0a1b2c3d4e5f6a7b8c9e2',
    name: 'Namma Biryani — Indiranagar',
    address: '100 Feet Road, Indiranagar, Bengaluru',
    totalReviews: 611,
    averageRating: 4.5,
    category: 'Restaurant',
    locationSlug: 'namma-biryani-indiranagar',
    qrScans: 64,
    bridgeVisits: 18,
  },
  {
    _id: '64f0a1b2c3d4e5f6a7b8c9e3',
    name: 'ClinicNova Skin & Hair',
    address: 'Jubilee Hills, Hyderabad',
    totalReviews: 324,
    averageRating: 4.9,
    category: 'Medical clinic',
    locationSlug: 'clinicnova-skin-hair',
    qrScans: 41,
    bridgeVisits: 9,
  },
]
