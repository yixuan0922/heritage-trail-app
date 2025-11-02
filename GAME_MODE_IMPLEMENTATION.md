# Game Mode Implementation Guide

## Overview
This document describes the game mode feature added to the Heritage Trail App. The game mode allows admins to create campaigns with routes and challenges, while users can login and play through these campaigns by visiting markers and answering questions.

## Database Schema

### New Tables Created

#### 1. **users** (Extended)
- Added `email` field (optional, unique)
- Added `role` field: 'user' or 'admin' (default: 'user')

#### 2. **campaigns**
- `id`: UUID primary key
- `name`: Campaign name
- `description`: Campaign description
- `createdBy`: Reference to admin user who created it
- `isActive`: Whether campaign is currently active
- `difficulty`: easy, medium, or hard
- `estimatedDuration`: Estimated time in minutes
- `heroImage`: Optional hero image URL
- `createdAt`, `updatedAt`: Timestamps

#### 3. **routes**
- `id`: UUID primary key
- `campaignId`: Reference to parent campaign
- `name`: Route name
- `description`: Route description
- `orderIndex`: Order within the campaign
- `createdAt`, `updatedAt`: Timestamps

#### 4. **routeMarkers**
- `id`: UUID primary key
- `routeId`: Reference to parent route
- `waypointId`: Reference to existing waypoint (reuses existing waypoint system)
- `orderIndex`: Sequence order within the route
- `hintToNext`: Hint text shown after completing this marker's questions
- `createdAt`: Timestamp

#### 5. **questions**
- `id`: UUID primary key
- `routeMarkerId`: Reference to the marker this question belongs to
- `questionText`: The question text
- `questionType`: 'multiple_choice', 'true_false', or 'text_input'
- `options`: JSON array of answer options (for multiple choice)
- `correctAnswer`: The correct answer
- `orderIndex`: Order of questions at this marker
- `points`: Points awarded for correct answer (default: 10)
- `createdAt`, `updatedAt`: Timestamps

#### 6. **campaignProgress**
- `id`: UUID primary key
- `userId`: Reference to user playing
- `campaignId`: Reference to campaign being played
- `currentRouteId`: Current route user is on
- `currentMarkerIndex`: Current marker index within the route
- `completedRoutes`: JSON array of completed route IDs
- `totalScore`: User's total score
- `isCompleted`: Whether campaign is completed
- `startedAt`, `completedAt`, `lastActivityAt`: Timestamps

#### 7. **questionAttempts**
- `id`: UUID primary key
- `userId`: Reference to user who attempted
- `questionId`: Reference to question attempted
- `campaignProgressId`: Reference to campaign progress
- `userAnswer`: The user's submitted answer
- `isCorrect`: Whether answer was correct
- `pointsEarned`: Points earned for this attempt
- `attemptedAt`: Timestamp

## API Endpoints

### Authentication

#### POST `/api/auth/register`
Register a new user account
```json
{
  "username": "string (min 3 chars)",
  "email": "string (optional)",
  "password": "string (min 6 chars)",
  "role": "user" | "admin" (default: "user")
}
```

#### POST `/api/auth/login`
Login with username and password
```json
{
  "username": "string",
  "password": "string"
}
```

### Campaign Management (Admin)

#### GET `/api/campaigns`
Get all campaigns

#### GET `/api/campaigns/active`
Get only active campaigns

#### GET `/api/campaigns/:id`
Get campaign by ID

#### POST `/api/campaigns`
Create a new campaign (requires admin role)
```json
{
  "name": "string",
  "description": "string",
  "createdBy": "userId",
  "isActive": true,
  "difficulty": "easy" | "medium" | "hard",
  "estimatedDuration": 60,
  "heroImage": "url (optional)"
}
```

#### PUT `/api/campaigns/:id`
Update a campaign

#### DELETE `/api/campaigns/:id`
Delete a campaign

### Route Management

#### GET `/api/campaigns/:campaignId/routes`
Get all routes for a campaign

#### GET `/api/routes/:id`
Get route by ID

#### POST `/api/routes`
Create a new route
```json
{
  "campaignId": "string",
  "name": "string",
  "description": "string (optional)",
  "orderIndex": 0
}
```

#### PUT `/api/routes/:id`
Update a route

#### DELETE `/api/routes/:id`
Delete a route

### Route Marker Management

#### GET `/api/routes/:routeId/markers`
Get all markers for a route (in order)

#### GET `/api/markers/:id`
Get marker by ID

#### POST `/api/markers`
Create a new route marker
```json
{
  "routeId": "string",
  "waypointId": "string",
  "orderIndex": 0,
  "hintToNext": "string (optional)"
}
```

#### PUT `/api/markers/:id`
Update a marker

#### DELETE `/api/markers/:id`
Delete a marker

### Question Management

#### GET `/api/markers/:markerId/questions`
Get all questions for a marker (in order)

#### GET `/api/questions/:id`
Get question by ID

#### POST `/api/questions`
Create a new question
```json
{
  "routeMarkerId": "string",
  "questionText": "string",
  "questionType": "multiple_choice" | "true_false" | "text_input",
  "options": ["option1", "option2", "option3"],
  "correctAnswer": "string",
  "orderIndex": 0,
  "points": 10
}
```

#### PUT `/api/questions/:id`
Update a question

#### DELETE `/api/questions/:id`
Delete a question

### Game Play

#### GET `/api/users/:userId/campaign-progress`
Get all campaign progresses for a user

#### GET `/api/users/:userId/campaigns/:campaignId/progress`
Get specific campaign progress

#### POST `/api/campaign-progress`
Start a new campaign
```json
{
  "userId": "string",
  "campaignId": "string",
  "currentRouteId": "string (optional)"
}
```

#### PUT `/api/campaign-progress/:id`
Update campaign progress
```json
{
  "currentRouteId": "string",
  "currentMarkerIndex": 0,
  "completedRoutes": ["routeId1", "routeId2"],
  "totalScore": 100,
  "isCompleted": false
}
```

#### GET `/api/campaign-progress/:progressId/attempts`
Get all question attempts for a campaign progress

#### POST `/api/question-attempts`
Submit an answer to a question
```json
{
  "userId": "string",
  "questionId": "string",
  "campaignProgressId": "string",
  "userAnswer": "string"
}
```
**Note:** The API automatically checks if the answer is correct and awards points.

## Game Flow

### For Admin Users

1. **Login** with admin credentials
2. **Create Campaign**: Define name, description, difficulty, duration
3. **Create Routes**: Add one or more routes to the campaign
4. **Add Markers to Routes**: Select existing waypoints and add them to routes in sequence
5. **Add Questions to Markers**: Create questions for each marker
6. **Set Hints**: Define hints that will be shown after completing each marker
7. **Activate Campaign**: Set `isActive` to true

### For Regular Users

1. **Register/Login**: Create account or login
2. **Browse Campaigns**: View available active campaigns
3. **Start Campaign**: Select a campaign to start playing
4. **Navigate to Marker**: Travel to the first marker location
5. **Answer Questions**: Upon arriving, answer all questions for that marker
6. **Get Hint**: After answering correctly, receive hint to next marker
7. **Repeat**: Continue through all markers in the route
8. **Complete Route**: Finish all markers in a route
9. **Next Route**: Move to next route in campaign (if any)
10. **Complete Campaign**: Finish all routes to complete the campaign

## Implementation Status

### ✅ Completed
- [x] Database schema with all game mode tables
- [x] User authentication system (register/login)
- [x] Admin role system
- [x] Complete backend API for campaigns, routes, markers, and questions
- [x] Game progress tracking backend
- [x] Question attempt and scoring system
- [x] Database storage layer with all CRUD operations

### 🚧 To Be Implemented
- [ ] Database migration (run `npm run db:push` to apply schema)
- [ ] Admin dashboard UI for campaign management
- [ ] Login/Registration UI components
- [ ] Game mode UI with campaign selection
- [ ] Map integration for game mode markers
- [ ] Question/answer interface
- [ ] Hint display after correct answers
- [ ] Progress tracking UI
- [ ] Leaderboards (optional future enhancement)
- [ ] Password hashing (currently storing plaintext - MUST FIX before production)

## Security Notes

⚠️ **IMPORTANT:**
- Passwords are currently stored in plaintext
- Before deploying to production, implement proper password hashing (bcrypt, argon2, etc.)
- Add authentication middleware to protect admin-only endpoints
- Implement session management or JWT tokens
- Add rate limiting on auth endpoints

## Next Steps

1. **Run Database Migration**
   ```bash
   npm run db:push
   ```

2. **Create Admin Dashboard Pages**
   - Campaign management interface
   - Route builder
   - Question editor

3. **Create User Authentication UI**
   - Login form
   - Registration form
   - Auth context provider

4. **Build Game Mode UI**
   - Campaign selection screen
   - Game map view with route markers
   - Question interface
   - Progress indicators

5. **Integrate with Existing Map**
   - Reuse existing waypoint markers
   - Add game mode overlay
   - Show current route and hints

## File Structure

```
/shared
  /schema.ts - Extended with game mode tables

/server
  /storage.ts - Added game mode storage methods
  /routes.ts - Added game mode API endpoints

/client (To be created)
  /src
    /pages
      /Auth
        Login.tsx
        Register.tsx
      /Admin
        AdminDashboard.tsx
        CampaignEditor.tsx
        RouteBuilder.tsx
        QuestionEditor.tsx
      /GameMode
        GameModeView.tsx
        CampaignSelection.tsx
        QuestionChallenge.tsx
    /components
      /Game
        GameMap.tsx
        MarkerSequence.tsx
        QuestionCard.tsx
        HintDisplay.tsx
        ScoreTracker.tsx
    /hooks
      useAuth.ts
      useGameProgress.ts
      useCampaigns.ts
    /lib
      gameUtils.ts
```

## Testing the API

You can test the API endpoints using curl or Postman:

```bash
# Register a user
curl -X POST http://localhost:5001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"player1","password":"password123"}'

# Login
curl -X POST http://localhost:5001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"player1","password":"password123"}'

# Create a campaign (as admin)
curl -X POST http://localhost:5001/api/campaigns \
  -H "Content-Type: application/json" \
  -d '{"name":"Heritage Quest","description":"Explore Chinatown","createdBy":"admin-user-id","difficulty":"medium"}'
```
