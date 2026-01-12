# Uma Racing Web - Stat System Design

## Core Principle
**Stats are INPUT ONLY. No training. No progression. No formulas.**

## Stat Sources
- Google Sheets
- Excel
- External calculators
- Manual input

The app **validates and stores** stats. It does NOT calculate them.

---

## Stat Schema

```json
{
  "Speed": 1200,      // Integer, 0-9999
  "Stamina": 1000,    // Integer, 0-9999
  "Power": 800,       // Integer, 0-9999
  "Guts": 600,        // Integer, 0-9999
  "Wit": 900          // Integer, 0-9999
}
```

---

## Validation Rules

### 1. Data Type
- **Integers only** (no decimals)
- **No negatives**

### 2. Stat Limits (Per-Stat)
- Minimum: `0`
- Maximum: `9999` (configurable via admin)

### 3. Total Stat Cap
- Default: **No cap** (unless admin sets one)
- Admin can enforce: `total_cap = Speed + Stamina + Power + Guts + Wit <= X`

### 4. Required Fields
All 5 stats must be provided.

---

## Stat Submission Flow

### Trainee Submits Own Stats
```
POST /api/stats/submit
{
  "trainee_id": 123,
  "stats": { Speed: 1200, Stamina: 1000, ... }
}
```

**Authorization**: Trainee can only submit for themselves.

### Trainer Submits for Trainee
```
POST /api/stats/submit
{
  "trainee_id": 456,  // Must be owned by this trainer
  "stats": { ... }
}
```

**Authorization**: Trainer can only submit for their trainees.

### Admin Override
```
POST /api/admin/stats/override
{
  "trainee_id": 789,
  "stats": { ... },
  "bypass_validation": true  // Optional: skip limits
}
```

**Authorization**: Admin can modify ANY trainee, bypass validation if needed.

---

## Stat History & Auditing

Every stat submission is logged:

```sql
CREATE TABLE trainee_stats (
  id SERIAL PRIMARY KEY,
  trainee_id INT NOT NULL,
  speed INT NOT NULL,
  stamina INT NOT NULL,
  power INT NOT NULL,
  guts INT NOT NULL,
  wit INT NOT NULL,
  submitted_by INT NOT NULL,  -- User ID
  submitted_role VARCHAR(20),  -- 'trainee' | 'trainer' | 'admin'
  bypass_validation BOOLEAN DEFAULT FALSE,
  timestamp TIMESTAMPTZ DEFAULT NOW()
);
```

Only the **latest** stat entry is used for races.

---

## Spreadsheet Integration (Future)

1. User uploads spreadsheet or provides Google Sheets link
2. Backend parses and extracts final stat values
3. Stats are validated and stored
4. No formulas are executed server-side

**Spreadsheet is source of truth for calculation logic.**
**Backend only validates and stores final numbers.**

---

## Race Usage

When a race starts:
1. Fetch latest `trainee_stats` for each participant
2. Use those stats in race simulation
3. Stats are **immutable** during the race
4. No stat changes, no decay, no progression

---

## Admin Tools

Admins can:
- Set global stat caps
- View stat submission history for any trainee
- Override any stat value
- Bypass validation limits
- Audit who submitted what and when

All admin actions are logged to `admin_audit_log`.

---

## Anti-Patterns (DO NOT IMPLEMENT)

❌ Stat training system  
❌ Stat progression over time  
❌ Stamina decay  
❌ Hidden stat calculations  
❌ RPG-style leveling  
❌ Stat grinding mechanics  

✅ Treat stats as **authoritative data**  
✅ Validate inputs  
✅ Store history  
✅ Use in races  

---

## Next Steps

1. ✅ Document stat system design
2. ⏳ Design database schema
3. ⏳ Implement stat validation service
4. ⏳ Build stat submission API
5. ⏳ Create admin override endpoints
