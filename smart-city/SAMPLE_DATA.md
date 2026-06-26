# 📝 Sample Data & Test Cases

## Sample Officers Data

Use this data to quickly populate your database with test officers.

### API Command to Create Officers

```bash
# Base URL: http://localhost:5000/api/officers
# Headers: Authorization: Bearer YOUR_ADMIN_TOKEN

# Police Officer - Ward 1-3
{
  "name": "Officer Rajesh Kumar",
  "email": "rajesh.kumar@police.smartcity.gov",
  "phone": "+91-9876543210",
  "designation": "police",
  "department": "roads",
  "station": "Central Police Station",
  "jurisdiction": {
    "wards": ["Ward-1", "Ward-2", "Ward-3"]
  },
  "bio": "10 years experience in traffic management"
}

# Traffic Officer - Ward 2-4
{
  "name": "Officer Priya Singh",
  "email": "priya.singh@traffic.smartcity.gov",
  "phone": "+91-9876543211",
  "designation": "traffic_officer",
  "department": "roads",
  "station": "Traffic Control Room",
  "jurisdiction": {
    "wards": ["Ward-2", "Ward-3", "Ward-4"]
  },
  "bio": "5 years experience, specialized in accident response"
}

# Water Manager
{
  "name": "Vikram Patel",
  "email": "vikram.patel@water.smartcity.gov",
  "phone": "+91-9876543212",
  "designation": "water_manager",
  "department": "water",
  "station": "Water Supply Department",
  "jurisdiction": {
    "wards": ["Ward-1", "Ward-2", "Ward-3", "Ward-4", "Ward-5"]
  },
  "bio": "15 years in water infrastructure management"
}

# Electricity Manager
{
  "name": "Arun Sharma",
  "email": "arun.sharma@electricity.smartcity.gov",
  "phone": "+91-9876543213",
  "designation": "electricity_manager",
  "department": "electricity",
  "station": "Power Distribution Center",
  "jurisdiction": {
    "wards": ["Ward-1", "Ward-2", "Ward-3", "Ward-4"]
  },
  "bio": "12 years in power distribution and maintenance"
}

# Sanitation Officer
{
  "name": "Meena Verma",
  "email": "meena.verma@sanitation.smartcity.gov",
  "phone": "+91-9876543214",
  "designation": "sanitation_officer",
  "department": "sanitation",
  "station": "Sanitation Department",
  "jurisdiction": {
    "wards": ["Ward-1", "Ward-2", "Ward-3"]
  },
  "bio": "8 years in waste management and sanitation"
}

# Health Inspector
{
  "name": "Dr. Neha Gupta",
  "email": "neha.gupta@health.smartcity.gov",
  "phone": "+91-9876543215",
  "designation": "health_inspector",
  "department": "health",
  "station": "Health Department",
  "jurisdiction": {
    "wards": ["Ward-1", "Ward-2", "Ward-3", "Ward-4", "Ward-5"]
  },
  "bio": "7 years as health inspector, MBBS qualified"
}

# Parks Manager
{
  "name": "Suraj Kumar",
  "email": "suraj.kumar@parks.smartcity.gov",
  "phone": "+91-9876543216",
  "designation": "parks_manager",
  "department": "parks",
  "station": "Parks & Gardens Department",
  "jurisdiction": {
    "wards": ["Ward-1", "Ward-2", "Ward-3", "Ward-4"]
  },
  "bio": "6 years managing city parks and public spaces"
}

# General Officer
{
  "name": "Amit Joshi",
  "email": "amit.joshi@smartcity.gov",
  "phone": "+91-9876543217",
  "designation": "general_officer",
  "department": "general",
  "station": "General Services",
  "jurisdiction": {
    "wards": ["Ward-1", "Ward-2", "Ward-3", "Ward-4", "Ward-5"]
  },
  "bio": "Handles miscellaneous complaints"
}
```

---

## Sample Complaints for Testing

Create these complaints to test auto-assignment:

### Test Case 1: Road Complaint (High Priority)
```json
{
  "title": "Deep pothole on Main Street",
  "description": "Large pothole near the market causing accidents",
  "category": "roads",
  "subCategory": "potholes",
  "priority": "high",
  "location": {
    "address": "Main Street, near Central Market",
    "ward": "Ward-1",
    "city": "Smart City",
    "pincode": "100001",
    "coordinates": { "lat": 28.7041, "lng": 77.1025 }
  },
  "isAnonymous": false
}
```

### Test Case 2: Water Supply Complaint
```json
{
  "title": "No water supply since morning",
  "description": "Complete water cut-off in residential area for 8 hours",
  "category": "water",
  "priority": "critical",
  "location": {
    "address": "Residential Complex, North Avenue",
    "ward": "Ward-2",
    "city": "Smart City",
    "pincode": "100002"
  }
}
```

### Test Case 3: Electricity Complaint
```json
{
  "title": "Power outage affecting 50+ households",
  "description": "Entire block without electricity since 2 PM",
  "category": "electricity",
  "priority": "high",
  "location": {
    "address": "Sector 5, Colony Area",
    "ward": "Ward-3",
    "city": "Smart City",
    "pincode": "100003"
  }
}
```

### Test Case 4: Sanitation Complaint
```json
{
  "title": "Garbage not collected for 3 days",
  "description": "Overflowing garbage bins causing foul smell",
  "category": "sanitation",
  "priority": "medium",
  "location": {
    "address": "Market Street, Sector 2",
    "ward": "Ward-1",
    "city": "Smart City"
  }
}
```

### Test Case 5: Health Complaint
```json
{
  "title": "Unhygienic food vendor near school",
  "description": "Food vendor without proper licenses and hygiene",
  "category": "health",
  "priority": "high",
  "location": {
    "address": "Near Government School",
    "ward": "Ward-4",
    "city": "Smart City"
  }
}
```

### Test Case 6: Parks Complaint
```json
{
  "title": "Broken playground equipment",
  "description": "Swing set damaged, poses safety risk to children",
  "category": "parks",
  "priority": "medium",
  "location": {
    "address": "Central Park, South End",
    "ward": "Ward-2",
    "city": "Smart City"
  }
}
```

---

## Test Workflow

### 🧪 Step-by-Step Testing Guide

#### Step 1: Setup Database with Officers
```bash
# Create all sample officers above
# Or run this script in MongoDB:

db.officers.insertMany([
  {
    name: "Officer Rajesh Kumar",
    email: "rajesh.kumar@police.smartcity.gov",
    phone: "+91-9876543210",
    designation: "police",
    department: "roads",
    station: "Central Police Station",
    jurisdiction: { wards: ["Ward-1", "Ward-2", "Ward-3"], city: "Smart City" },
    assignedComplaints: [],
    assignedCount: 0,
    resolvedCount: 0,
    averageResolutionTime: 0,
    performanceRating: 0,
    isAvailable: true,
    isActive: true,
    createdAt: new Date()
  },
  // ... add others similarly
])
```

#### Step 2: Verify Officers Created
```bash
curl http://localhost:5000/api/officers \
  -H "Authorization: Bearer YOUR_TOKEN"
```

Expected: Should return array of 7 officers

#### Step 3: Submit Test Complaints
- Using admin panel or direct API calls
- Submit one complaint for each category
- Ensure different wards for testing

#### Step 4: Verify Pending Complaints
```bash
curl http://localhost:5000/api/complaints \
  -H "Authorization: Bearer YOUR_TOKEN"
```

Expected: Should show all complaints with status "pending"

#### Step 5: Trigger Auto-Assignment (Manual)
```bash
curl -X POST http://localhost:5000/api/officers/bulk-assign \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

Expected Response:
```json
{
  "success": true,
  "message": "6 complaints assigned successfully",
  "assignedCount": 6,
  "totalPending": 6,
  "results": [
    {
      "complaintId": "SC-2024-00001",
      "officer": "Officer Rajesh Kumar",
      "status": "assigned"
    },
    // ... more results
  ]
}
```

#### Step 6: Verify Assignments
```bash
# Check specific complaint
curl http://localhost:5000/api/complaints/:complaintId \
  -H "Authorization: Bearer YOUR_TOKEN"
```

Expected: Should show `assignedOfficer` and status "under_review"

#### Step 7: Check Officer's Complaints
```bash
curl http://localhost:5000/api/officers/:officerId/complaints \
  -H "Authorization: Bearer YOUR_TOKEN"
```

Expected: Should list assigned complaints

#### Step 8: Update Complaint Status (Officer Action)
```bash
curl -X PUT http://localhost:5000/api/officers/:officerId/complaints/:complaintId \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "in_progress",
    "notes": "Issue identified, repair in progress",
    "resolutionDetails": "Filling pothole with asphalt"
  }'
```

#### Step 9: Check Performance Metrics
```bash
curl http://localhost:5000/api/officers/:officerId/performance \
  -H "Authorization: Bearer YOUR_TOKEN"
```

Expected:
```json
{
  "success": true,
  "data": {
    "totalAssigned": 3,
    "resolved": 0,
    "pending": 2,
    "inProgress": 1,
    "resolutionRate": "0.00",
    "averageResolutionTime": 0,
    "performanceRating": 0
  }
}
```

#### Step 10: Verify Email Notifications
- Check officer email for assignment notification
- Check citizen email for officer assignment notification
- Should contain officer details and next steps

---

## 📊 Performance Testing

### Bulk Assignment Performance
```bash
# Submit 50 complaints at once
# Then run bulk assign
# Monitor response time and ensure all assigned

# Expected: < 5 seconds for 50 assignments
```

### Metric Calculation
```bash
# Create 10 complaints for one officer
# Resolve 5-7 manually
# Check performance metrics update

# Expected:
# - Resolution rate: 50-70%
# - Average time calculated
# - Rating updated
```

---

## 🐛 Debugging Tips

### Check Bot Execution
```bash
# Look for these logs in server console:
# "Running complaint routing bot..."
# "Found X pending complaints to route"
# "Successfully routed X complaints"
```

### Verify Email Sending
```bash
# Check for these in server logs:
# "Notifications sent for complaint SC-2024-XXXXX"
# or error: "Error sending email:"
```

### Database Queries
```javascript
// In MongoDB console
db.complaints.find({ assignedOfficer: { $ne: null } })
db.complaints.find({ status: "pending", assignedOfficer: null })
db.officers.find({ assignedCount: { $gt: 0 } })
db.complainttransfers.find({ transferReason: "auto_routing" })
```

---

## ✅ Test Results Checklist

- [ ] Officers created successfully (7 total)
- [ ] Complaints submitted in pending state
- [ ] Auto-assignment runs and assigns all complaints
- [ ] Officer email notifications received
- [ ] Citizen email notifications received
- [ ] Officer complaint list shows assignments
- [ ] Status update by officer works
- [ ] Performance metrics calculated correctly
- [ ] Complaints marked as resolved
- [ ] Auto-close after 7 days works
- [ ] Escalation for overdue complaints works

---

## 📋 Sample Test Results Log

```
TEST: Officer Creation
✅ 7 officers created
✅ All fields stored correctly
✅ Email notifications sent

TEST: Auto-Assignment
✅ 6 complaints processed
✅ All assigned to appropriate officers
✅ Transfer records created
✅ Status updated to "under_review"

TEST: Email Notifications  
✅ Officers notified (6 emails)
✅ Citizens notified (6 emails)
✅ Email content includes correct details

TEST: Officer Actions
✅ Status update by officer works
✅ Resolution details stored
✅ Status history updated

TEST: Performance Metrics
✅ Assignment count tracking
✅ Resolution rate calculated
✅ Average time calculated
✅ Rating computed

TEST: Escalation & Auto-close
✅ Old complaints escalated
✅ Resolved complaints auto-closed
```

---

**Good luck with your testing! 🎉**
