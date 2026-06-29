# Adding Test Restaurants to MongoDB

## Quick Start: Load Sample Data via UI

Now that `ALLOW_DEV_SEED=true` is set in your `.env`, you have two options:

### Option 1: Auto-Load Sample Data (Recommended)
1. **Restart your dev server**: `npm run dev`
2. Go to **Locations** page
3. You'll see a **"Development: sample data"** card at the top
4. Click **"Load sample data"** button
5. ✅ Three restaurants + reviews will be instantly created:
   - **Namma Kitchen — Indiranagar** (Restaurant)
   - **Namma Kitchen — HSR** (Restaurant)  
   - **ClinicNova — Jayanagar** (Clinic)

Each location comes with 5+ reviews showing different sentiment scores, ratings, and reply statuses.

---

### Option 2: Manually Add Restaurants via MongoDB

If you want to add custom restaurants directly:

#### Step 1: Connect to your local MongoDB
```bash
npm run mongo:local:connect
# or manually connect to: mongodb://127.0.0.1:27017
```

#### Step 2: Insert a Location document
```javascript
db.locations.insertOne({
  userId: ObjectId("YOUR_USER_ID"),
  googleLocationId: "custom-resto-001",
  googleAccountId: "custom-account",
  name: "My Test Restaurant",
  address: "123 Main St, City, State 12345",
  category: "Restaurant",
  businessType: "restaurant",
  phone: "+91 1234567890",
  accessToken: "test-token",
  refreshToken: "test-token",
  tokenExpiresAt: new Date(Date.now() + 365*24*60*60*1000),
  isActive: true,
  totalReviews: 0,
  averageRating: 0,
  createdAt: new Date(),
  updatedAt: new Date()
})
```

#### Step 3: Insert Review documents (optional, for test data)
```javascript
const locationId = ObjectId("LOCATION_ID_FROM_STEP_2");
const userId = ObjectId("YOUR_USER_ID");

db.reviews.insertOne({
  userId: userId,
  locationId: locationId,
  googleReviewId: "test-review-001",
  reviewerName: "Test User",
  rating: 5,
  comment: "Excellent food and service!",
  sentiment: "positive",
  sentimentScore: 0.85,
  reviewCreatedAt: new Date(),
  syncedAt: new Date(),
  createdAt: new Date(),
  updatedAt: new Date()
})
```

---

## Why New Data Isn't Showing Up?

### Root Cause: Next.js Caching
When you update MongoDB data directly, the **Locations page might not refresh** because:

1. **Server-side cache**: Next.js caches the server-rendered component
2. **Router cache**: Browser caches the page route
3. **Data cache**: Next.js caches database queries

### Solutions:

#### ✅ Solution 1: Hard Refresh (Fastest)
```bash
# Press in browser:
Cmd + Shift + R  (Mac)
Ctrl + Shift + R  (Windows/Linux)
```

#### ✅ Solution 2: Clear Next.js Cache & Restart
```bash
# Stop dev server (Ctrl+C)
rm -rf .next
npm run dev
```

#### ✅ Solution 3: Use the DevSeedPanel
The "Load sample data" button calls an API that:
- Deletes old seed data
- Creates fresh locations & reviews
- Returns clean, fresh data

This is the **most reliable** way because it bypasses cache.

---

## Checking Your User ID

If you need to manually insert data, find your user ID:

```javascript
// In MongoDB:
db.users.findOne({ email: "your-email@example.com" })._id
```

Or check the browser console when logged in:
```javascript
console.log(JSON.parse(localStorage.getItem('authToken')))
```

---

## Adding More Locations Programmatically

Create a file `scripts/add-test-locations.js`:

```javascript
const mongoose = require('mongoose');
require('dotenv').config();

const locationSchema = new mongoose.Schema({
  userId: mongoose.Schema.Types.ObjectId,
  name: String,
  address: String,
  // ... other fields
});

const Location = mongoose.model('Location', locationSchema);

async function addLocations(userId) {
  await mongoose.connect(process.env.MONGODB_URI_LOCAL);
  
  const locations = [
    {
      userId,
      googleLocationId: 'resto-1',
      name: 'Lakshmi Palace',
      address: '45 Mysore Rd, Bengaluru',
    },
    {
      userId,
      googleLocationId: 'resto-2',
      name: 'The Biryani House',
      address: '78 MG Rd, Bengaluru',
    },
  ];
  
  await Location.insertMany(locations);
  console.log('✅ Locations added!');
  process.exit(0);
}

addLocations('YOUR_USER_ID');
```

Then run:
```bash
node scripts/add-test-locations.js
```

---

## Summary

| Method | Ease | Reliability | Data Quality |
|--------|------|-------------|--------------|
| **Load Sample Data (UI)** | ⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐ (full reviews) |
| **MongoDB Direct Insert** | ⭐⭐ | ⭐⭐ | 🔲 (empty reviews) |
| **Node.js Script** | ⭐⭐⭐ | ⭐⭐⭐ | Custom data |

**Recommendation**: Start with "Load sample data" button, then use custom inserts if needed.
