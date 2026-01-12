# UmalinkedIn - Professional Network Guide

## Overview
**UmalinkedIn** is a LinkedIn-like professional networking platform where trainees and trainers can connect, scout talent, and build partnerships.

## How It Works

### For Trainees:
1. **Create Your Profile**
   - Set headline (e.g., "Passionate young racer looking for experienced trainer")
   - Write bio about your experience and goals
   - Set what you're looking for: "trainer"
   - Choose experience level: beginner, intermediate, advanced, professional
   - Set visibility: public (discoverable), private, or friends_only

2. **Browse Trainers**
   - Filter by experience level
   - View trainer profiles with their bios and stats
   - Send scout requests to trainers you're interested in

3. **Manage Requests**
   - View incoming requests from trainers
   - Accept requests to start a trainee-trainer relationship
   - Reject requests with optional message

### For Trainers:
1. **Create Your Profile**
   - Set headline (e.g., "Champion trainer with 10+ race wins")
   - Write bio about your training philosophy and achievements
   - Set what you're looking for: "trainee"
   - Showcase your achievements and experience level

2. **Scout Trainees**
   - Browse public trainee profiles
   - Filter by experience level
   - Send recruitment requests to promising trainees

3. **Manage Requests**
   - Review incoming trainee requests
   - Accept to officially become their trainer
   - Reject with optional message

## How to Access

1. **From Dashboard:**
   - Click "UmalinkedIn" button in the navbar

2. **Direct URL:**
   - Open `http://localhost:5500/umalinkedin.html`

## Demo Accounts

**Trainee Account:**
- Username: `trainee_demo`
- Password: `password123`
- Setup: Open UmalinkedIn, browse trainers, send requests

**Trainer Account:**
- Username: `trainer_demo`
- Password: `password123`
- Setup: Open UmalinkedIn, browse trainees, send scout requests

## Features

### Browse Tab
- **Real-time Profile Discovery**
  - Filters by role (trainer/trainee) and experience level
  - View profile cards with key information
  - Profile view counter (tracks who views your profile)
  - Beautiful card design with animations

### Requests Tab
- **Incoming Scout Requests**
  - Shows all pending recruitment offers
  - Accept to start partnership (auto-assigns trainer)
  - Reject with optional message
  - Pending count badge

### Sent Requests Tab
- **Outgoing Recruitment Requests**
  - Track all requests you've sent
  - View response status
  - Cancel pending requests
  - See response messages from rejections

## Request Types

- **Recruit Trainee**: Trainer recruiting a trainee (trainer sends, trainee receives)
- **Recruit Trainer**: Trainee recruiting a trainer (trainee sends, trainer receives)

## Profile Visibility

- **Public**: Visible to all users in browse results
- **Private**: Only visible to the user themselves
- **Friends Only**: Only visible to accepted connections (future feature)

## API Endpoints (Backend)

### Profile Management
- `POST /api/umalinkedin/profile` - Create/update profile
- `GET /api/umalinkedin/profile/{user_id}` - Get profile
- `GET /api/umalinkedin/browse` - Browse public profiles

### Scout Requests
- `POST /api/umalinkedin/scout-request` - Send request
- `GET /api/umalinkedin/scout-requests/received` - Get incoming requests
- `GET /api/umalinkedin/scout-requests/sent` - Get sent requests
- `POST /api/umalinkedin/scout-requests/{id}/accept` - Accept request
- `POST /api/umalinkedin/scout-requests/{id}/reject` - Reject request
- `POST /api/umalinkedin/scout-requests/{id}/cancel` - Cancel request

## Database Schema

### UmaLinkedInProfile Table
- `id` - Primary key
- `user_id` - Link to user (unique)
- `headline` - Professional headline
- `bio` - Biography/description
- `avatar_url` - Profile picture
- `looking_for` - "trainer" or "trainee"
- `experience_level` - Skill level
- `visibility` - "public", "private", or "friends_only"
- `views_count` - Profile view counter
- `created_at`, `updated_at` - Timestamps

### ScoutRequest Table
- `id` - Primary key
- `requester_user_id` - Who sent the request
- `target_user_id` - Who received the request
- `request_type` - "recruit_trainer" or "recruit_trainee"
- `message` - Optional custom message
- `status` - "pending", "accepted", "rejected", "cancelled"
- `responded_at` - When recipient responded
- `response_message` - Optional rejection reason
- `created_at` - Request timestamp

## Automatic Trainer Assignment

When a scout request is **accepted**:
- If recruiting trainee: The trainer (requester) is assigned to trainee's profile
- If recruiting trainer: The trainer (requester) is assigned to trainee's (target) profile
- This happens automatically - no manual assignment needed!

## Example Workflow

### Scenario 1: Trainer Scouts Trainee
1. Trainer views UmalinkedIn
2. Browses trainees, filters by "beginner"
3. Finds trainee_demo's profile
4. Clicks "Send Request" → "Recruit as Trainee"
5. Adds message: "I think you have great potential!"
6. Trainee_demo sees request in "Requests" tab
7. Trainee accepts → trainer_demo automatically becomes assigned trainer
8. Both can now work together in races

### Scenario 2: Trainee Recruits Trainer
1. Trainee opens UmalinkedIn
2. Browses trainers, filters by "professional"
3. Finds trainer_demo's profile
4. Clicks "Send Request" → "Recruit as Trainer"
5. Adds message: "I'd love to learn from your experience!"
6. Trainer sees request in "Requests" tab
7. Trainer accepts → trainee automatically gets assigned to trainer
8. Partnership begins!

## Future Features
- Private messaging between connected users
- Endorsements and skill validations
- Public achievement showcase
- Trainer performance ratings from trainees
- Filtered search by trainer specialties
- Trainee performance benchmarking
- Group training sessions
- Trainer-student testimonials

---

**Tip:** Make sure to set up your profile first! Your profile determines who can find and recruit you.
