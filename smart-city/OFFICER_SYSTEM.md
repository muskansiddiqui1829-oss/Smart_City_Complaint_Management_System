# 🚔 Officer Assignment & Smart Routing Bot

## Overview

The Smart City Complaint Management Platform now includes an intelligent complaint routing system that automatically assigns complaints to field officers (police, health inspectors, sanitation workers, etc.) for faster resolution.

---

## 🎯 Key Features

### 1. **Officer Management**
- Register different types of officers (police, health inspectors, traffic officers, etc.)
- Assign officers to specific departments and ward jurisdictions
- Track officer performance metrics (resolved complaints, average resolution time, rating)
- Manage officer availability status

### 2. **Smart Routing Bot**
Automatically assigns pending complaints to the best available officer based on:
- **Department Match** (40% weight) - Ensures relevant expertise
- **Ward Jurisdiction** (30% weight) - Officers assigned to specific wards
- **Workload Balance** (30% weight) - Distributes complaints evenly
- **Specialization** (bonus) - Specialists get priority for their category

### 3. **Manual Assignment**
- Admins can manually assign complaints to specific officers
- Add assignment notes for context
- Reassign if needed

### 4. **Automatic Enhancements**
- Escalate overdue complaints to higher priority
- Auto-close resolved complaints after 7 days
- Update officer performance metrics periodically

### 5. **Email Notifications**
- Officers notified when complaint assigned
- Citizens notified when officer assigned
- Status updates shared with both parties

---

## 🏗️ Data Models

### Officer Model
```javascript
{
  name,              // Officer name
  email,             // Contact email
  phone,             // Contact phone
  designation,       // police, health_inspector, traffic_officer, etc.
  department,        // roads, water, electricity, sanitation, parks, health, general
  station,           // Office/station location
  jurisdiction: {
    wards: [],       // Array of ward numbers they handle
    city: 'Smart City'
  },
  assignedComplaints: [],  // Array of complaint IDs
  assignedCount,           // Number of current assignments
  resolvedCount,           // Number of resolved complaints
  averageResolutionTime,   // In days
  performanceRating,       // 0-5 stars
  isAvailable,             // Current availability status
  isActive                 // Account status
}
```

### ComplaintTransfer Model
```javascript
{
  complaint,         // Complaint ID
  fromDepartment,    // Original department
  toDepartment,      // Receiving department
  toOfficer,         // Officer ID receiving complaint
  transferredBy,     // Admin/Department head who made transfer
  transferReason,    // auto_routing, manual_assignment, escalation, reassignment, expertise
  notes,             // Transfer notes
  status,            // pending, accepted, rejected, completed
  acceptedAt,        // When officer accepted
  completedAt,       // When work completed
  transferredAt      // When transfer initiated
}
```

### Updated Complaint Model
```javascript
{
  // ... existing fields ...
  assignedOfficer,      // NEW: Officer handling complaint
  officerAssignedAt,    // NEW: When assigned
  transfers: []         // NEW: Array of transfer records
}
```

---

## 🔄 API Endpoints

### Officer Management

```bash
# Create officer (admin only)
POST /api/officers
{
  "name": "John Police",
  "email": "john@police.gov",
  "phone": "+1234567890",
  "designation": "police",
  "department": "roads",
  "station": "Central Police Station",
  "jurisdiction": {
    "wards": ["W1", "W2", "W3"]
  },
  "bio": "10 years experience"
}

# Get all officers (with filters)
GET /api/officers?department=roads&isAvailable=true&ward=W1

# Get single officer
GET /api/officers/:id

# Update officer
PUT /api/officers/:id

# Delete officer
DELETE /api/officers/:id

# Get officer's assigned complaints
GET /api/officers/:id/complaints?status=in_progress

# Get officer's performance metrics
GET /api/officers/:id/performance

# Assign complaint to officer (manual)
POST /api/officers/:id/assign-complaint
{
  "complaintId": "...",
  "notes": "Priority - high pedestrian traffic area"
}

# Update complaint status (officer action)
PUT /api/officers/:id/complaints/:complaintId
{
  "status": "in_progress",
  "notes": "Investigating the issue",
  "resolutionDetails": "Found faulty water pipe"
}

# Bulk auto-assign pending complaints (bot)
POST /api/officers/bulk-assign
```

---

## 🤖 Bot Scheduling

The complaint routing bot runs automatically every **5 minutes** and performs:

1. **Route Pending Complaints** (25 per cycle)
   - Finds best available officer for each complaint
   - Creates transfer record
   - Updates complaint status to "under_review"
   - Sends email notifications

2. **Escalate Overdue Complaints**
   - Complaints pending > 48 hours get priority bump
   - E.g., "low" → "medium", "medium" → "high"

3. **Update Officer Metrics**
   - Calculate resolution rate
   - Update average resolution time
   - Compute performance rating

4. **Auto-close Resolved Complaints**
   - Complaints resolved > 7 days ago auto-close
   - Reduces clutter, maintains data hygiene

### Custom Bot Configuration

Edit `server.js` to change bot interval:
```javascript
// Change from 5 minutes to your desired interval
setInterval(async () => {
  await ComplaintRoutingBot.routePendingComplaints(25);
  await ComplaintRoutingBot.escalateOverdueComplaints();
  await ComplaintRoutingBot.updateOfficerMetrics();
  await ComplaintRoutingBot.autoCloseResolvedComplaints(7);
}, 5 * 60 * 1000); // In milliseconds
```

---

## 👨‍💼 Admin Interface

### Managing Officers

Access via: **Admin Dashboard → Officers Management**

Features:
- ✅ Create new officers with department assignment
- ✅ Filter by department, designation, availability
- ✅ View officer performance metrics
- ✅ See assigned complaints per officer
- ✅ One-click bulk auto-assign pending complaints
- ✅ Edit/update officer details
- ✅ Delete officers (auto-unassigns their complaints)

### Assigning Complaints

**Method 1: Manual Assignment**
1. Go to complaint detail page
2. Scroll to "Field Officer Assignment" section
3. Click "Assign Officer"
4. Select officer from dropdown (filtered by department/ward)
5. Add optional notes
6. Confirm

**Method 2: Auto-Assignment**
- Click "Auto-Assign Complaints" button on Officers page
- System automatically routes up to 25 pending complaints
- View assignment results

---

## 📊 Officer Performance Metrics

Each officer has:

- **Total Assigned**: Number of complaints assigned
- **Resolved**: Number completed
- **Pending**: Currently working on
- **Resolution Rate**: % of assigned complaints resolved
- **Avg Resolution Time**: Average days to resolve
- **Performance Rating**: 0-5 stars based on:
  - Resolution rate (60% weight)
  - Speed of resolution (40% weight)

---

## 🔐 Access Control

| Role | Can... |
|------|--------|
| **Citizen** | View assigned officer details on complaint |
| **Department Head** | View officers in their dept, manually assign, update status |
| **Admin** | Create/edit/delete officers, view all, manual assign, auto-assign |

---

## 📧 Email Notifications

### For Officers
**Subject**: 🚨 New Complaint Assigned: [COMPLAINT_ID]

Contains:
- Complaint ID and title
- Category and priority
- Location and ward
- Evidence (number of images)
- Urgency note

### For Citizens
**Subject**: ✅ Your Complaint has been Assigned: [COMPLAINT_ID]

Contains:
- Officer name and designation
- Department and station
- Officer contact info
- Current status
- Timeline expectations

---

## 🚀 Implementation Guide

### Backend Setup
1. Models already created:
   - `Officer.model.js`
   - `ComplaintTransfer.model.js`
   - Updated `Complaint.model.js`

2. Controllers created:
   - `officer.controller.js` with full CRUD operations

3. Routes created:
   - `officer.routes.js` with all endpoints

4. Bot service created:
   - `utils/bot.js` with scheduling logic

5. Server integration:
   - Routes added to `server.js`
   - Bot scheduled and running

### Frontend Setup
1. Components created:
   - `OfficerCard.jsx` - Display officer info
   - `OfficerSelector.jsx` - Dropdown to select officers
   - `AssignOfficerPanel.jsx` - Assignment UI
   - `ManageOfficersPage.jsx` - Full admin page

2. Routes added:
   - `/admin/officers` - Officer management

3. Integration points ready:
   - Can add AssignOfficerPanel to complaint detail pages
   - Add link to officers page in admin sidebar

---

## 🔧 Customization

### Change Officer Designations
Edit `Officer.model.js`:
```javascript
designation: {
  enum: ['police', 'health_inspector', 'traffic_officer', /* add yours */]
}
```

### Change Scoring Algorithm
Edit `bot.js` → `findBestOfficer()`:
```javascript
// Adjust weights (must total 100)
score += 40;  // Department match
score += 30;  // Ward jurisdiction
score += 25;  // Workload
score += 5;   // Specialization
```

### Change Escalation Threshold
Edit `bot.js` → `escalateOverdueComplaints()`:
```javascript
const escalationThreshold = 48; // Change from 48 hours
```

### Change Auto-close Period
Edit `server.js`:
```javascript
await ComplaintRoutingBot.autoCloseResolvedComplaints(7); // Change from 7 days
```

---

## 📋 Testing Checklist

- [ ] Create sample officers with different departments
- [ ] Submit test complaint and verify auto-assignment
- [ ] Check officer's email notification received
- [ ] Check citizen's notification email
- [ ] Manually assign complaint to different officer
- [ ] Update complaint status from officer action
- [ ] Verify performance metrics calculated
- [ ] Check escalation logic for old complaints
- [ ] Verify auto-close after 7 days
- [ ] Test with multiple complaints (bulk assign)

---

## 🐛 Troubleshooting

### Bot not assigning complaints?
- Check if officers exist and are `isActive: true` and `isAvailable: true`
- Verify officers have matching department
- Check server logs for errors

### Officers not receiving emails?
- Verify email configuration in `.env`
- Check complaint citizen email is valid
- Review email service logs

### Complaints not routing to specific ward?
- Ensure officer has that ward in `jurisdiction.wards`
- Check complaint's `location.ward` is set correctly
- Falls back to department-level officers if no ward match

---

## 📞 Support

For issues or questions about the officer assignment system:
1. Check server logs for error messages
2. Verify database connections
3. Ensure all email credentials are correct
4. Review bot execution in server console

---

**Happy Complaint Resolving! 🎉**
