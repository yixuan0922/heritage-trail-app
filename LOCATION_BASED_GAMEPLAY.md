# Location-Based Gameplay Guide

## Overview
The game mode now features **location-based gameplay** where users must physically be within **20 meters** of a marker to unlock and answer questions. This creates an immersive, real-world treasure hunt experience!

---

## 🎮 How It Works

### **The 20-Meter Rule + Sequential Unlocking**
- Users can see all markers on the map
- Markers unlock **sequentially** - you must complete them in order
- A marker is only unlocked when **BOTH conditions are met**:
  1. ✅ All previous markers in the route are completed
  2. ✅ User is within 20 meters of the marker
- Locked markers are displayed in **gray with a lock icon** 🔒
- Unlocked markers (next in sequence + within range) are **green**
- Completed markers show a **blue checkmark**

**Example:**
- Marker 1 (completed) → Blue ✓
- Marker 2 (next, within 20m) → Green (unlocked)
- Marker 3 (within 5m but Marker 2 not done) → Gray 🔒 (locked - must do Marker 2 first!)
- Marker 4 (60m away, Marker 2 not done) → Gray 🔒 (locked - too far and out of sequence)

### **Proximity Detection**
- Uses device GPS/location services
- Updates every 5 seconds automatically
- Calculates distance using the Haversine formula (accurate to ~1 meter)
- Real-time visual feedback as users move

---

## 📱 User Experience Flow

### **1. Starting the Game**
1. User navigates to Game Mode and selects a campaign
2. Clicks "Start Campaign"
3. Redirected to map view showing all markers

### **2. On the Map**
User sees:
- **Header**: Campaign name, score, progress
- **Interactive Map**: With all campaign markers
- **Legend Card** (top right):
  - 🟢 Green = Unlocked (within 20m)
  - 🔵 Blue = Completed
  - ⚪ Gray = Locked (too far)
- **Next Destination Card** (bottom):
  - Shows next marker to visit
  - Distance in meters
  - Lock status
  - "Answer Questions" button (if unlocked)

### **3. Approaching a Marker**
As user walks toward a marker:
- Distance updates in real-time
- When within 20m: marker turns green 🟢
- Yellow pulse indicator appears
- "Answer Questions" button becomes active

### **4. Answering Questions**
When user clicks on an unlocked marker:
- Dialog popup appears
- Shows marker name and location
- Presents questions one by one
- Immediate feedback (correct/incorrect)
- Points added to score

### **5. After Completing Questions**
- Hint to next location is displayed 💡
- User clicks "Continue Adventure"
- Marker turns blue (completed) ✅
- Next marker in sequence becomes the target

### **6. Completing the Campaign**
- All markers answered
- Final score displayed
- Progress saved to database

---

## 🗺️ Map Features

### **Visual Marker States**

| State | Color | Icon | Behavior |
|-------|-------|------|----------|
| Locked (far away) | Gray | 🔒 Lock | Not clickable, shows distance |
| Unlocked (within 20m) | Green | 🏛️ Landmark | Clickable, yellow pulse |
| Completed | Blue | ✅ Check | Clickable (view only) |

### **Map Interactions**
- **Click unlocked marker** → Open question dialog
- **Hover marker** → See name and distance
- **Zoom/Pan** → Navigate the map freely
- **Center on user** → Track your location (blue dot)

### **Bottom Card Features**
- Shows the **next incomplete marker**
- Real-time distance tracking
- Status badge (unlocked/locked)
- Quick access to questions

---

## 🎯 Game Mechanics

### **Marker Sequencing**
Markers must be completed **in strict order**:
1. Route markers have an `orderIndex` (0, 1, 2, ...)
2. Only the **next uncompleted marker** can be unlocked
3. Even if you're standing right next to Marker 3, if you haven't completed Marker 2, it stays locked 🔒
4. Users can see all markers on the map but can only interact with the next one in sequence
5. This prevents "skipping ahead" and ensures the narrative/educational flow

**Why Sequential?**
- Maintains the story/learning progression
- Prevents users from cherry-picking easy markers
- Ensures hints make sense (each hint leads to the next marker)
- Creates a guided tour experience

### **Progress Tracking**
Automatically saves:
- Current marker index
- Total score
- Completed markers
- Question attempts
- Completion status

### **Scoring System**
- Each question has configurable points (default: 10)
- Correct answers add points immediately
- Incorrect answers don't subtract points
- Total score displayed in header

---

## 🔧 Technical Implementation

### **Location Detection**
```javascript
// Uses browser Geolocation API
navigator.geolocation.watchPosition(
  (position) => {
    // Update user location every 5 seconds
    setUserLocation({
      lat: position.coords.latitude,
      lng: position.coords.longitude
    });
  },
  { enableHighAccuracy: true }
);
```

### **Distance Calculation**
```javascript
// Haversine formula for accurate Earth-surface distance
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371e3; // Earth radius in meters
  // ... formula returns distance in meters
}
```

### **Proximity Check**
```javascript
const PROXIMITY_RADIUS = 20; // 20 meters
const distance = calculateDistance(userLat, userLng, markerLat, markerLng);
const isUnlocked = distance <= PROXIMITY_RADIUS;
```

### **Real-time Updates**
- Location updates every 5 seconds
- Marker states recalculated automatically
- UI reflects changes instantly

---

## 📊 Data Flow

```
User Location (GPS)
  ↓
Calculate Distance to Each Marker
  ↓
Update Marker States (locked/unlocked)
  ↓
Render Map with Colored Markers
  ↓
User Clicks Unlocked Marker
  ↓
Show Question Dialog
  ↓
Submit Answer → Score Update
  ↓
All Questions Done → Show Hint
  ↓
Mark Complete → Next Marker
```

---

## 🎨 UI Components

### **GamePlayMap.tsx**
Main component featuring:
- Full-screen map view
- Header with campaign info and score
- Progress bar
- Floating legend
- Bottom navigation card
- Question dialog (modal)
- Hint dialog (modal)

### **InteractiveMap.tsx**
Google Maps integration:
- Custom marker rendering
- Real-time position tracking
- Zoom controls
- Location button

### **mapUtils.ts**
Updated marker creation:
- Dynamic color based on state
- Lock icon for locked markers
- Distance display in tooltip
- Click prevention for locked markers

---

## 🚀 Setup Requirements

### **For Testing**

1. **Enable Location Services**
   - Browser must have location permission
   - GPS/WiFi positioning enabled
   - High accuracy mode recommended

2. **Marker Locations**
   - Must have real GPS coordinates
   - Should be physically accessible
   - 20m radius should be reachable

3. **Testing Without Moving**
   ```javascript
   // For development: Override location
   setUserLocation({
     lat: 1.2813, // Chinatown
     lng: 103.8448
   });
   ```

### **For Production**

1. **HTTPS Required**
   - Geolocation API requires secure context
   - Deploy with SSL certificate

2. **Privacy Notice**
   - Inform users location is tracked
   - Add privacy policy
   - Option to deny location (with fallback)

3. **Battery Consideration**
   - GPS tracking drains battery
   - Consider reducing update frequency
   - Add low-power mode option

---

## 📱 Mobile Optimization

### **Best Practices**
- Full-screen map for better navigation
- Large tap targets (markers 48x48px minimum)
- Clear visual feedback
- Persistent bottom navigation
- Swipe gestures supported

### **Responsive Design**
- Header collapses on scroll
- Cards positioned for thumb access
- Text sizes readable on small screens
- Minimal text, maximum icons

---

## 🎮 Gameplay Tips

### **For Players**
1. **Enable High Accuracy GPS** for best experience
2. **Start at the first marker** location
3. **Walk to within 20m** to unlock questions
4. **Read hints carefully** for next location
5. **Complete in sequence** for best narrative

### **For Admins Creating Campaigns**
1. **Choose accessible locations** (public spaces)
2. **Set logical sequences** (don't backtrack unnecessarily)
3. **Write clear hints** (not too easy, not impossible)
4. **Test the route yourself** before publishing
5. **Consider walking distance** (20-30 min ideal)
6. **Add interesting questions** related to the location

---

## 🐛 Troubleshooting

### **Issue: Location Not Updating**
- Check browser permissions (should show location icon in address bar)
- Refresh the page
- Try in Chrome/Safari (better GPS support)
- Check device location services are ON

### **Issue: Markers Always Locked**
- Verify you're actually near the marker (use Google Maps to check)
- Check marker coordinates are correct (not 0,0)
- Wait 5-10 seconds for location to stabilize
- Try walking closer (GPS accuracy varies by 5-10m)

### **Issue: Can't Click Markers**
- Locked markers are intentionally not clickable
- Only green (unlocked) markers are interactive
- Completed (blue) markers may have limited interaction

### **Issue: Distance Seems Wrong**
- GPS accuracy varies (typically ±10 meters)
- Buildings/trees can affect signal
- Wait for "High Accuracy" mode to activate
- Try outdoors for better signal

---

## 🔐 Security & Privacy

### **Location Data**
- Location is **only used client-side**
- Not sent to server (except for scoring)
- Not stored in database
- Cleared when leaving game

### **Progress Data**
Server stores:
- Which markers completed (not where)
- Scores and answers
- Campaign progress
- Question attempts

Does NOT store:
- User GPS coordinates
- Movement patterns
- Time at locations
- Route taken

---

## 📈 Future Enhancements

Possible additions:
- [ ] AR camera mode (point at landmark)
- [ ] Team/multiplayer campaigns
- [ ] Time-based challenges (speed runs)
- [ ] Photo verification (prove you're there)
- [ ] Variable proximity radius per marker
- [ ] Offline mode (pre-download maps)
- [ ] Achievement for fastest completion
- [ ] Social sharing of routes

---

## 🎉 Try It Now!

1. Go to http://localhost:5001/game-mode
2. Login and select a campaign
3. Allow location access
4. Walk to the first marker location
5. Answer questions when within 20m
6. Follow hints to complete the adventure!

**Tip**: For testing, choose markers close to your current location or temporarily override the location in the code.

---

**Enjoy your location-based heritage trail adventure!** 🗺️✨
