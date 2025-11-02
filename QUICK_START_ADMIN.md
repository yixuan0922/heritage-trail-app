# Quick Start Guide - Admin Setup

## Step 1: Access the Application

The development server is running at: **http://localhost:5001**

## Step 2: Register as Admin

1. Open your browser and go to: **http://localhost:5001/register**

2. Fill in the registration form:
   - **Username**: Choose any username (e.g., "admin")
   - **Email**: Optional (you can leave it blank)
   - **Password**: At least 6 characters (e.g., "admin123")
   - **Confirm Password**: Same as above
   - **✅ Register as Admin**: **CHECK THIS BOX!** This is important!

3. Click "Create Account"

4. You will be automatically redirected to the Admin Dashboard at `/admin/campaigns`

## Step 3: Create Your First Campaign

Now you're on the Admin Dashboard. Let's create a campaign:

1. Click the **"Create New Campaign"** button

2. Fill in the campaign details:
   - **Name**: e.g., "Heritage Quest" or "Chinatown Adventure"
   - **Description**: Brief description of the campaign
   - **Difficulty**: Choose Easy, Medium, or Hard
   - **Duration**: Estimated time in minutes (e.g., 60)
   - **Hero Image URL**: (Optional) Add an image URL
   - **Active**: Toggle ON to make it visible to players

3. Click **"Create"**

## Step 4: Manage Routes

After creating a campaign, you'll see it listed. Now let's add routes:

1. Click **"Manage Routes"** on your campaign card

2. You'll see three columns:
   - **Routes** (left)
   - **Markers** (middle)
   - **Questions** (right)

### Create a Route:

1. Click the **"+"** button in the Routes column

2. Fill in:
   - **Name**: e.g., "Temple Trail" or "Colonial District"
   - **Description**: What this route is about
   - **Order**: 0 for first route, 1 for second, etc.

3. Click **"Create"**

4. Your route will appear in the list. Click on it to select it.

## Step 5: Add Markers to Route

Now that you have a route selected, add markers (waypoints):

1. Click the **"+"** button in the Markers column

2. Select a **Waypoint** from the dropdown
   - These are existing waypoints from your trails
   - Choose locations you want players to visit

3. Set the **Hint to Next**: This hint will be shown to players after they complete this marker's questions
   - Example: "Look for the red lanterns near the river"

4. Set **Order**: 0 for first marker, 1 for second, etc.

5. Click **"Add Marker"**

6. Repeat for all locations in your route

7. Click on a marker to select it (to add questions)

## Step 6: Add Questions to Marker

With a marker selected, now add questions:

1. Click the **"+"** button in the Questions column

2. Fill in the question details:
   - **Question**: The question text
   - **Type**: Choose from:
     - **Multiple Choice**: Players choose from options
     - **True/False**: Simple yes/no questions
     - **Text Input**: Players type the answer

3. For **Multiple Choice**:
   - Fill in the 4 option fields
   - Set the correct answer exactly as it appears in options

4. For **True/False**:
   - Set correct answer to "true" or "false" (lowercase)

5. For **Text Input**:
   - Type the exact correct answer
   - Note: Answers are case-insensitive

6. Set **Points**: How many points for correct answer (default: 10)

7. Click **"Add Question"**

8. Add multiple questions per marker (recommended: 2-3 questions)

## Step 7: Activate Your Campaign

1. Go back to the Admin Dashboard (`/admin/campaigns`)

2. Make sure your campaign has the **"Active"** badge

3. If not, click the toggle switch to activate it

## Step 8: Test as a Player

Now let's test your campaign from a player's perspective:

1. **Logout** (or open a private/incognito browser window)

2. Register a new regular user:
   - Go to `/register`
   - Create an account
   - **DON'T** check the "Register as Admin" box
   - Click "Create Account"

3. You'll be redirected to `/game-mode`

4. You should see your campaign listed!

5. Click **"Start Campaign"** and play through it

## Troubleshooting

### Issue: I don't see the "Register as Admin" checkbox
**Solution**: Refresh the page. The code has been updated.

### Issue: I registered but don't see the Admin Dashboard button
**Solution**: You need to register with the "Register as Admin" checkbox checked. If you already registered without it, you'll need to register a new account.

### Issue: No waypoints appear in the dropdown
**Solution**: Make sure you have existing trails with waypoints in your database. You can check by going to the main map view (`/`).

### Issue: Campaign doesn't appear in game mode
**Solution**:
1. Make sure the campaign is marked as "Active" (green badge)
2. Try refreshing the page
3. Check browser console for errors

### Issue: Questions aren't showing when playing
**Solution**:
1. Make sure you added questions to the markers
2. Check that the route has markers
3. Verify the order index is set correctly (starts at 0)

## Quick Navigation Links

- **Admin Dashboard**: http://localhost:5001/admin/campaigns
- **Game Mode (Player)**: http://localhost:5001/game-mode
- **Register**: http://localhost:5001/register
- **Login**: http://localhost:5001/login
- **Main Map**: http://localhost:5001/

## Complete Workflow Summary

```
1. Register with "Admin" checkbox ✅
   ↓
2. Create Campaign
   ↓
3. Click "Manage Routes"
   ↓
4. Create Route(s)
   ↓
5. Add Markers to Route (select waypoints)
   ↓
6. Add Questions to each Marker
   ↓
7. Make sure Campaign is Active
   ↓
8. Test as player (register new user without admin)
   ↓
9. Play the campaign!
```

## Example Campaign Structure

```
Campaign: "Chinatown Heritage Quest"
├── Route 1: "Temple Trail"
│   ├── Marker 1: Buddha Tooth Relic Temple
│   │   ├── Question 1: "What year was this temple built?" (Multiple Choice)
│   │   ├── Question 2: "How many floors does the temple have?" (Text Input)
│   │   └── Hint: "Head towards the red lanterns at Maxwell Food Centre"
│   │
│   ├── Marker 2: Sri Mariamman Temple
│   │   ├── Question 1: "What religion is this temple?" (Multiple Choice)
│   │   └── Hint: "Look for the colorful shophouses on Smith Street"
│   │
│   └── Marker 3: Thian Hock Keng Temple
│       ├── Question 1: "Is this the oldest Chinese temple in Singapore?" (True/False)
│       └── Hint: "Campaign complete!"
│
└── Route 2: "Food Heritage" (optional second route)
    └── ... (similar structure)
```

---

**You're all set! Start creating your first campaign now! 🎉**
