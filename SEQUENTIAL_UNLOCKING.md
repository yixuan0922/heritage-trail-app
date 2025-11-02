# Sequential Marker Unlocking - How It Works

## The Rule

**Markers unlock ONLY when BOTH conditions are true:**
1. ✅ All previous markers are completed
2. ✅ You are within 20 meters of the marker

---

## Example Scenario

Let's say you have a route with 4 markers:

### **Route: "Chinatown Heritage Trail"**
```
Marker 1: Buddha Tooth Temple (orderIndex: 0)
  ↓
Marker 2: Chinatown Street Market (orderIndex: 1)
  ↓
Marker 3: Sri Mariamman Temple (orderIndex: 2)
  ↓
Marker 4: Thian Hock Keng Temple (orderIndex: 3)
```

---

## Scenario 1: Starting the Game

**Your Location:** At Buddha Tooth Temple (within 20m)

**Marker States:**
- ✅ **Marker 1**: 🟢 **GREEN** (unlocked - you're here and it's first)
- 🔒 **Marker 2**: ⚪ **GRAY** (locked - previous marker not completed)
- 🔒 **Marker 3**: ⚪ **GRAY** (locked - previous markers not completed)
- 🔒 **Marker 4**: ⚪ **GRAY** (locked - previous markers not completed)

**What You See:**
```
Bottom Card Says:
"Next Destination: Buddha Tooth Temple
15m away
[Answer Questions] ← This button is active"
```

**What Happens:**
You click "Answer Questions", complete all questions, get the hint to Marker 2.

---

## Scenario 2: Completed Marker 1, Walking to Marker 2

**Your Location:** Walking toward Chinatown Street Market (50m away)

**Marker States:**
- ✓ **Marker 1**: 🔵 **BLUE** (completed)
- 🔒 **Marker 2**: ⚪ **GRAY** (unlocked in sequence but too far - 50m > 20m)
- 🔒 **Marker 3**: ⚪ **GRAY** (locked - previous marker not completed)
- 🔒 **Marker 4**: ⚪ **GRAY** (locked - previous markers not completed)

**What You See:**
```
Bottom Card Says:
"Next Destination: Chinatown Street Market
50m away
⚠️ Get within 20m of this location to unlock questions"
```

---

## Scenario 3: Near Marker 2

**Your Location:** At Chinatown Street Market (within 15m)

**Marker States:**
- ✓ **Marker 1**: 🔵 **BLUE** (completed)
- ✅ **Marker 2**: 🟢 **GREEN** (unlocked - prev completed AND within 20m!)
- 🔒 **Marker 3**: ⚪ **GRAY** (locked - previous marker not completed)
- 🔒 **Marker 4**: ⚪ **GRAY** (locked - previous markers not completed)

**What You See:**
```
Bottom Card Says:
"Next Destination: Chinatown Street Market
15m away
[Answer Questions] ← This button is active"
```

---

## Scenario 4: THE KEY SCENARIO - Near Marker 3 But Marker 2 Not Done

**Your Location:** You walked past Marker 2 and are now standing RIGHT NEXT to Marker 3 (5m away!)

**Marker States:**
- ✓ **Marker 1**: 🔵 **BLUE** (completed)
- 🔒 **Marker 2**: ⚪ **GRAY** (next in sequence but 45m away)
- 🔒 **Marker 3**: ⚪ **GRAY** (LOCKED even though you're 5m away! - because Marker 2 not completed)
- 🔒 **Marker 4**: ⚪ **GRAY** (locked - previous markers not completed)

**What You See:**
```
Bottom Card Says:
"Next Destination: Chinatown Street Market
45m away
⚠️ Complete previous markers first to unlock this location"
```

**Why is Marker 3 locked?**
- You're standing 5m away (within the 20m radius) ✅
- BUT Marker 2 is not completed yet ❌
- The system enforces sequential completion
- You MUST go back and complete Marker 2 first

---

## Scenario 5: All Markers Except Last One Done

**Your Location:** At Thian Hock Keng Temple (within 10m)

**Marker States:**
- ✓ **Marker 1**: 🔵 **BLUE** (completed)
- ✓ **Marker 2**: 🔵 **BLUE** (completed)
- ✓ **Marker 3**: 🔵 **BLUE** (completed)
- ✅ **Marker 4**: 🟢 **GREEN** (unlocked - all previous done AND within 20m!)

**What You See:**
```
Bottom Card Says:
"Next Destination: Thian Hock Keng Temple
10m away
[Answer Questions] ← This button is active"
```

---

## Scenario 6: Campaign Complete!

**Your Location:** Anywhere

**Marker States:**
- ✓ **Marker 1**: 🔵 **BLUE** (completed)
- ✓ **Marker 2**: 🔵 **BLUE** (completed)
- ✓ **Marker 3**: 🔵 **BLUE** (completed)
- ✓ **Marker 4**: 🔵 **BLUE** (completed)

**What You See:**
```
Bottom Card Says:
"🎉 All markers completed!
Final Score: 125 points"
```

---

## Visual Flow Chart

```
┌─────────────────────────────────────────┐
│ Is this the NEXT marker in sequence?   │
│ (All previous markers completed?)      │
└─────────────┬───────────────────────────┘
              │
              ├─ NO ──→ 🔒 LOCKED (gray)
              │         "Complete previous markers first"
              │
              └─ YES ──→ Check Distance
                         ├─ > 20m ──→ 🔒 LOCKED (gray)
                         │            "Get within 20m"
                         │
                         └─ ≤ 20m ──→ 🟢 UNLOCKED (green)
                                      "Answer Questions!"
```

---

## Code Logic

```javascript
// For each marker:
const previousMarkers = markers.filter(m => m.orderIndex < marker.orderIndex);
const allPreviousCompleted = previousMarkers.every(m => isCompleted(m));
const withinRange = distance <= 20; // meters

const isUnlocked = allPreviousCompleted && withinRange;

if (isUnlocked) {
  marker.color = "green";
  marker.clickable = true;
} else {
  marker.color = "gray";
  marker.clickable = false;
}
```

---

## Common Questions

### Q: I'm standing at Marker 3, why can't I unlock it?
**A:** You must complete Marker 2 first. The game enforces sequential completion to maintain the story/educational flow.

### Q: Can I skip markers?
**A:** No. You must complete them in order (by orderIndex: 0, 1, 2, 3...).

### Q: What if I accidentally walk past a marker?
**A:** You'll need to go back. The "Next Destination" card will show you which marker to complete next and how far away it is.

### Q: Can I see all markers on the map?
**A:** Yes! All markers are visible, but only the next one in sequence (when you're within 20m) will be green and clickable.

### Q: What if two markers are in the same location?
**A:** They'll still unlock sequentially. Complete the first one, then the second will immediately unlock (since you're already at that location).

---

## Benefits of Sequential Unlocking

1. **Educational Flow**: Ensures users learn information in the intended order
2. **Story Progression**: Each marker builds on the previous one
3. **Prevents Cheating**: Can't skip to "easy" markers
4. **Guided Experience**: Users follow the designed route
5. **Hint System Works**: Each hint logically leads to the next marker
6. **Fair Scoring**: Everyone completes the same sequence

---

## Testing Tips

### For Admins Creating Routes:
1. **Test the sequence** yourself by walking the route
2. **Ensure hints are helpful** - they should guide to the next marker
3. **Don't put markers too far apart** - users will get frustrated
4. **Consider the narrative** - order matters for storytelling
5. **Set reasonable orderIndex values** (0, 1, 2, 3... in sequence)

### For Players:
1. **Follow the hints** - they're designed to lead you to the next marker
2. **Check the "Next Destination" card** - it shows what you need to do
3. **Don't skip ahead** - even if you know where Marker 3 is, complete Marker 2 first
4. **Use the distance indicator** - it updates in real-time as you walk

---

**This sequential system creates a true treasure hunt experience where players must follow the designed path!** 🗺️✨
