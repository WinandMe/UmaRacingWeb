# UmalinkedIn Quick Start

## Access UmalinkedIn

**Option 1: From Dashboard**
1. Login to your account
2. Click "UmalinkedIn" button in the navbar
3. You're in!

**Option 2: Direct URL**
- Open: `http://localhost:5500/umalinkedin.html`

## Demo Accounts

```
Trainee Account:
  Username: trainee_demo
  Password: password123

Trainer Account:
  Username: trainer_demo
  Password: password123
```

## 5-Minute Demo

### Scenario: Trainer Scouts Trainee

1. **Open two browser windows**
   - Window 1: Login as `trainer_demo`
   - Window 2: Login as `trainee_demo`

2. **In Trainer Window (trainer_demo)**
   - Click UmalinkedIn
   - In "Browse Profiles" tab
   - Filter by "Trainee"
   - Find trainee_demo's card
   - Click "Send Request"
   - Select "Recruit as Trainee"
   - Add message: "I think you have great potential!"
   - Click "Send Request"

3. **In Trainee Window (trainee_demo)**
   - Refresh UmalinkedIn page
   - Click "Requests" tab
   - See trainer_demo's request
   - Click "Accept"
   - Connection established!

4. **Verify in Dashboard**
   - Go back to Dashboard
   - trainee_demo should now see trainer_demo as their trainer

## Available Actions

### Browse Tab
- ✅ View all public profiles
- ✅ Filter by trainer/trainee
- ✅ Filter by experience level
- ✅ Send scout requests

### Requests Tab
- ✅ View pending requests you received
- ✅ Accept requests (forms partnership)
- ✅ Reject requests with message
- ✅ See request counter in tab

### Sent Requests Tab
- ✅ View all requests you sent
- ✅ See status: pending/accepted/rejected
- ✅ Cancel pending requests
- ✅ See response messages

## Profile Settings

Your profile is auto-created with:
- Headline: "Experienced [your role]"
- Bio: "I'm looking for amazing..."
- Looking for: opposite role
- Experience: intermediate
- Visibility: public

**To Update Your Profile:**
1. Edit in database (future: add profile editor UI)
2. Currently profiles are read-only via UI

## Tips

🎯 **For Trainees:**
- Look for "professional" or "advanced" trainers
- Send personalized messages
- Accept requests from trainers who match your goals

🎯 **For Trainers:**
- Browse "beginner" and "intermediate" trainees
- Send recruitment requests to promising candidates
- Build your team of trainees

🔒 **Privacy:**
- Public profiles: visible to everyone
- Private profiles: only you can see them
- Friends only: visible to accepted connections (coming soon)

## Troubleshooting

**Q: My profile doesn't show up in browse?**
A: Check visibility setting - must be "public" to be discoverable

**Q: Can't see trainer's profile?**
A: They may have set it to private or haven't created one yet

**Q: Request not accepted?**
A: Make sure they click "Accept" button in their Requests tab

**Q: Still don't have a trainer assigned?**
A: Request must be "accepted" (not just pending). Check request status.

## Next Steps

After forming a partnership:
1. Go to Dashboard
2. Start adding trainee stats
3. Enter races together
4. Watch your team succeed!

---

**Questions?** Check the full guide: `UMALINKEDIN_GUIDE.md`
