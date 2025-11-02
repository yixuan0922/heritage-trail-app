# Hint-Based Navigation - Treasure Hunt Mode

## Overview
The "Next Destination" card now displays **hints from the previous marker** instead of the exact location name, creating a true treasure hunt experience!

---

## How It Works

### **Display Logic**

The card shows different information based on what's available:

```javascript
if (previousMarker.hintToNext exists) {
  // Show the hint as a clue
  Icon: 💡 Lightbulb (yellow)
  Title: "Follow the clue"
  Description: "The hint text in quotes"
} else {
  // Fall back to marker name
  Icon: 🔒 Lock
  Title: Marker name
  Description: Marker description
}
```

---

## Visual Examples

### **Scenario 1: First Marker (No Previous Hint)**

```
┌────────────────────────────────────┐
│ Next Destination                   │
├────────────────────────────────────┤
│ ✅ Buddha Tooth Temple    15m away │
│                                    │
│ A magnificent Buddhist temple...   │
│                                    │
│ [Answer Questions]                 │
└────────────────────────────────────┘
```

**Why?** There's no previous marker, so we show the actual name.

---

### **Scenario 2: Second Marker (With Hint)**

After completing Marker 1, the hint was: **"Look for the colorful building with dragon pillars"**

```
┌────────────────────────────────────┐
│ Next Destination                   │
├────────────────────────────────────┤
│ 💡 Follow the clue       45m away  │
│                                    │
│ "Look for the colorful building    │
│  with dragon pillars"              │
│                                    │
│ ⚠️ Get within 20m to unlock       │
└────────────────────────────────────┘
```

**Why?** We show the hint instead of "Sri Mariamman Temple" - users must figure it out!

---

### **Scenario 3: Third Marker (With Hint from Marker 2)**

After completing Marker 2, the hint was: **"A place where all of the clan resides"**

```
┌────────────────────────────────────┐
│ Next Destination                   │
├────────────────────────────────────┤
│ 💡 Follow the clue        8m away  │
│                                    │
│ "A place where all of the clan     │
│  resides"                          │
│                                    │
│ [Answer Questions]                 │
└────────────────────────────────────┘
```

**Why?** The hint creates mystery - users walk around looking for clan houses.

---

## User Experience Flow

### **Step 1: Complete First Marker**
- User answers all questions at Buddha Tooth Temple
- Hint dialog appears: "Look for the colorful building with dragon pillars"
- User clicks "Continue Adventure"

### **Step 2: Navigate Using Hint**
- Bottom card shows: 💡 **"Follow the clue"**
- Quote shows: **"Look for the colorful building with dragon pillars"**
- Distance updates: 45m... 38m... 25m... 18m...
- User looks around for a building matching the description

### **Step 3: Get Within Range**
- User sees a colorful temple with dragons
- Walks closer
- Card shows: "8m away"
- Marker on map turns green
- "Answer Questions" button activates

### **Step 4: Discover the Location**
- User clicks "Answer Questions"
- Dialog opens showing: **"Sri Mariamman Temple"**
- Now they know what it's called!
- Answer questions to earn points

---

## Benefits

### **For Users:**
1. **More Engaging** - Feels like a real treasure hunt
2. **Exploratory** - Encourages looking around, not just GPS following
3. **Educational** - Learn to recognize landmarks by description
4. **Fun** - The "aha!" moment when you find it
5. **Memorable** - Remember locations by their features, not just names

### **For Admins:**
1. **Creative Freedom** - Write interesting, cryptic, or poetic hints
2. **Difficulty Control** - Vague hints = harder, specific hints = easier
3. **Storytelling** - Weave a narrative through hints
4. **Cultural Context** - Describe historical/cultural significance

---

## Writing Good Hints

### **Types of Hints**

#### **Visual Description**
Good: "Look for the red lanterns hanging from the five-foot way"
Why: Describes what users will see

#### **Historical Clue**
Good: "Head to where immigrants first arrived in the 1820s"
Why: Educational and guides to historical site

#### **Directional + Feature**
Good: "Walk south toward the temple with the colorful gopuram tower"
Why: Combines direction with visual landmark

#### **Cultural Reference**
Good: "Find where the community gathers for Thaipusam celebrations"
Why: Teaches about local culture

#### **Riddle Style**
Good: "A place where all of the clan resides, guarded by lions at the gate"
Why: Fun and challenging, rewards knowledge

#### **Practical Hint**
Good: "Near the hawker center famous for chicken rice"
Why: Uses familiar landmarks

### **Hint Difficulty Levels**

**Easy (Specific):**
- "Walk 100m north to the large Buddhist temple with golden roof"
- "Look for the building with 'Heritage Centre' sign"

**Medium (Descriptive):**
- "Find the temple with colorful dragons on the pillars"
- "Head to where the clan associations meet"

**Hard (Cryptic):**
- "Where water flows but never drinks"
- "Guarded by stone sentinels, home to ancestral tablets"

---

## Example Campaign Hints

### **"Chinatown Heritage Trail"**

**Marker 1 → Marker 2:**
```
Hint: "Look for the vibrant street market where locals have traded
       for generations. The smell of incense guides the way."

This leads to: Chinatown Street Market
```

**Marker 2 → Marker 3:**
```
Hint: "Find the sacred space with a colorful gopuram tower reaching
       toward the sky. Mother goddess watches over all."

This leads to: Sri Mariamman Temple
```

**Marker 3 → Marker 4:**
```
Hint: "Seek the oldest Hokkien temple by the shore, where sailors
       once gave thanks for safe passage."

This leads to: Thian Hock Keng Temple
```

---

## Admin Tips

### **When Creating Hints:**

1. **Test the Route** - Walk it yourself and see what you notice
2. **Use Multiple Senses** - Sight, sound, smell (incense, food)
3. **Be Culturally Sensitive** - Respect religious/cultural sites
4. **Check Visibility** - Ensure features are visible from approach path
5. **Consider Time of Day** - "Red lanterns glow at night" won't help during day
6. **Account for Changes** - Avoid hints about temporary features

### **Fallback Strategy:**

Always set a hint, but make last marker more specific:
- Early markers: Cryptic/fun hints
- Middle markers: Balanced hints
- Final marker: More specific hint (to ensure completion)

### **No Hint Set?**

If you don't set a hint for a marker:
- Card shows actual marker name (fallback)
- Icon changes from 💡 to 🔒
- Still functional, just less treasure hunt-like

---

## Code Implementation

### **Previous Marker Lookup**
```javascript
const previousMarkers = allMarkers.filter(
  m => m.orderIndex < nextMarker.orderIndex &&
       m.routeId === nextMarker.routeId
);

const previousMarker = previousMarkers.length > 0
  ? previousMarkers[previousMarkers.length - 1]
  : null;

const hint = previousMarker?.hintToNext;
```

### **Display Logic**
```javascript
// Title
{hint ? 'Follow the clue' : nextMarker.waypoint.name}

// Icon
{hint ? <Lightbulb /> : <Lock />}

// Description
{hint ? `"${hint}"` : nextMarker.waypoint.description}
```

---

## Testing Your Hints

### **Checklist:**

- [ ] Can you find the location using only the hint?
- [ ] Is the hint visible/relevant from likely approach direction?
- [ ] Does the hint work in different weather/lighting?
- [ ] Is the hint culturally appropriate?
- [ ] Would a first-time visitor understand it?
- [ ] Is it too easy? Too hard?
- [ ] Does it teach something interesting?

### **Test Walk:**

1. Complete Marker 1
2. Read the hint (don't look at map)
3. Try to find Marker 2 using only the hint
4. If you can't find it in 5 minutes, hint needs improvement
5. If you find it instantly, consider making it more challenging

---

## User Feedback Scenarios

### **"I can't find the location!"**

Solutions:
- Make hints more specific
- Add directional information
- Include distance estimates
- Reference well-known landmarks

### **"It's too easy, I just look at GPS"**

Solutions:
- Make hints more cryptic/interesting
- Hide exact marker names
- Use riddles or cultural knowledge
- Make finding it part of the fun

### **"The hint doesn't match what I see"**

Solutions:
- Update hints when area changes
- Use permanent features only
- Test routes regularly
- Have backup descriptors

---

## Future Enhancements

Possible additions:
- [ ] Multi-part hints (reveal in stages)
- [ ] Photo hints (show historic images)
- [ ] Audio hints (listen to descriptions)
- [ ] Hint difficulty setting (easy/medium/hard per user preference)
- [ ] "Give me a better hint" button (costs points?)
- [ ] Community-submitted hints
- [ ] Seasonal hints (different hints for festivals)

---

## Summary

**Before:**
"Next Destination: Sri Mariamman Temple"
→ User just walks to GPS coordinates

**After:**
"Follow the clue: Look for the colorful gopuram tower"
→ User explores, observes, discovers!

**The treasure hunt experience is all about the journey and discovery!** 🗺️✨
