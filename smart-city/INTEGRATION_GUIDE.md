# 🚀 Quick Integration Guide

## Backend Integration

### 1. Verify Models are in Place
```
backend/models/
├── Officer.model.js ✅ (newly created)
├── ComplaintTransfer.model.js ✅ (newly created)
├── Complaint.model.js ✅ (updated with officer fields)
└── ...
```

### 2. Verify Controllers are in Place
```
backend/controllers/
├── officer.controller.js ✅ (newly created)
└── ...
```

### 3. Verify Routes are in Place
```
backend/routes/
├── officer.routes.js ✅ (newly created)
└── ...
```

### 4. Verify Server Integration
- ✅ Officer routes imported in `server.js`
- ✅ Officer routes registered as `/api/officers`
- ✅ Bot service imported
- ✅ Bot scheduler initialized (runs every 5 minutes)

### 5. Test Backend Endpoints
```bash
# Create an officer
curl -X POST http://localhost:5000/api/officers \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Police Officer",
    "email": "john.police@smartcity.gov",
    "phone": "+91-9876543210",
    "designation": "police",
    "department": "roads",
    "station": "Central Police Station",
    "jurisdiction": {
      "wards": ["Ward-1", "Ward-2", "Ward-3"]
    }
  }'

# Get all officers
curl http://localhost:5000/api/officers \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"

# Auto-assign pending complaints
curl -X POST http://localhost:5000/api/officers/bulk-assign \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

---

## Frontend Integration

### 1. Verify Components are in Place
```
frontend/src/
├── components/ui/
│   ├── OfficerCard.jsx ✅ (newly created)
│   ├── OfficerSelector.jsx ✅ (newly created)
│   └── AssignOfficerPanel.jsx ✅ (newly created)
├── pages/admin/
│   └── ManageOfficersPage.jsx ✅ (newly created)
├── App.jsx ✅ (updated with new route)
└── ...
```

### 2. Add Officer Link to Admin Sidebar

Find your admin navigation (usually in `AdminLayout.jsx` or similar):

```jsx
<nav className="space-y-2">
  <Link to="/admin" className="...">Dashboard</Link>
  <Link to="/admin/complaints" className="...">Complaints</Link>
  <Link to="/admin/users" className="...">Users</Link>
  
  {/* ADD THIS */}
  <Link to="/admin/officers" className="...">
    🚔 Officers
  </Link>
</nav>
```

### 3. Add Officer Panel to Complaint Detail Page

In your `ComplaintDetailPage.jsx` or similar, add the assignment panel:

```jsx
import AssignOfficerPanel from '../components/ui/AssignOfficerPanel';

export default function ComplaintDetailPage() {
  // ... existing code ...

  return (
    <div className="grid grid-cols-3 gap-6">
      <div className="col-span-2">
        {/* Existing complaint details */}
      </div>

      <div className="col-span-1 space-y-6">
        {/* ADD THIS */}
        {(user?.role === 'admin' || user?.role === 'department_head') && (
          <AssignOfficerPanel 
            complaint={complaint} 
            onAssignmentSuccess={() => {
              // Refresh complaint data
              fetchComplaintDetails();
            }}
          />
        )}

        {/* Existing sidebar content */}
      </div>
    </div>
  );
}
```

### 4. Display Officer Info on Complaint

Add officer display component (optional - create if needed):

```jsx
{complaint.assignedOfficer && (
  <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
    <h4 className="font-semibold text-green-800 mb-2">🚔 Assigned Officer</h4>
    <p className="text-gray-700 font-medium">{complaint.assignedOfficer?.name}</p>
    <p className="text-sm text-gray-600">{complaint.assignedOfficer?.designation?.replace(/_/g, ' ')}</p>
    <p className="text-sm text-gray-600">📧 {complaint.assignedOfficer?.email}</p>
    <p className="text-sm text-gray-600">📍 {complaint.assignedOfficer?.station}</p>
  </div>
)}
```

---

## 🧪 Testing Steps

### Test 1: Create Officer
1. Login as admin
2. Go to `/admin/officers`
3. Click "Add Officer"
4. Fill form and create officer
5. Verify officer appears in list
6. Check officer email received welcome email

### Test 2: Auto-Assign
1. Create at least 2-3 officers in "roads" department
2. Go to `/admin/officers`
3. Submit a new complaint (category: roads)
4. Click "Auto-Assign Complaints" button
5. Verify pending complaints assigned to officers
6. Check both officer and citizen emails received notifications

### Test 3: Manual Assignment
1. Go to specific complaint detail page
2. Scroll to "Field Officer Assignment" panel
3. Click "Assign Officer"
4. Select an officer
5. Add notes and confirm
6. Verify complaint now shows assigned officer
7. Verify emails sent

### Test 4: Officer Updates
1. Login as admin
2. Get specific officer's details via `/api/officers/:id`
3. View their assigned complaints via `/api/officers/:id/complaints`
4. Verify performance metrics via `/api/officers/:id/performance`

---

## ⚙️ Environment Variables

No new environment variables required! Uses existing:
- `MONGODB_URI` - For new models
- `SMTP_USER`, `SMTP_PASS` - For email notifications
- `NODE_ENV` - To control bot scheduling

---

## 📱 API Response Examples

### Get All Officers
```json
{
  "success": true,
  "count": 5,
  "data": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "name": "John Police Officer",
      "email": "john@police.gov",
      "phone": "+1234567890",
      "designation": "police",
      "department": "roads",
      "station": "Central Station",
      "jurisdiction": {
        "wards": ["W1", "W2", "W3"],
        "city": "Smart City"
      },
      "assignedCount": 12,
      "resolvedCount": 8,
      "performanceRating": 4.2,
      "isAvailable": true,
      "isActive": true,
      "createdAt": "2024-01-15T10:30:00Z"
    }
  ]
}
```

### Assign Complaint
```json
{
  "success": true,
  "message": "Complaint assigned to officer successfully",
  "data": {
    "complaint": { /* complaint data */ },
    "transfer": {
      "_id": "507f1f77bcf86cd799439012",
      "complaint": "...",
      "toOfficer": "507f1f77bcf86cd799439011",
      "transferReason": "manual_assignment",
      "status": "pending",
      "transferredAt": "2024-01-20T14:25:00Z"
    },
    "officer": { /* officer data */ }
  }
}
```

---

## 🐛 Common Issues & Solutions

### Issue: Bot not auto-assigning
**Solution**: 
- Verify officers exist: GET `/api/officers`
- Check officers are `isActive: true` and `isAvailable: true`
- Check server logs for bot execution
- Look for matching department and ward

### Issue: Emails not sent
**Solution**:
- Verify email credentials in `.env` file
- Check complaint citizen email is valid
- Look for SMTP errors in server logs

### Issue: Can't see officers in dropdown
**Solution**:
- Ensure complaint has `department` set
- Ensure officers exist with that department
- Officers must have `isActive: true`

### Issue: Performance metrics not updating
**Solution**:
- Check if complaints have `resolvedAt` date
- Bot needs to run (check server logs)
- Manual trigger: GET `/api/officers/:id/performance`

---

## 📊 Admin Dashboard Enhancements (Optional)

Add officer stats widget to admin dashboard:

```jsx
// In AdminDashboard.jsx
const OfficerStatsWidget = () => {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    axios.get(`${API_URL}/officers`, {
      headers: { Authorization: `Bearer ${token}` }
    }).then(res => {
      setStats({
        total: res.data.count,
        active: res.data.data.filter(o => o.isActive).length,
        available: res.data.data.filter(o => o.isAvailable).length,
        totalAssigned: res.data.data.reduce((sum, o) => sum + o.assignedCount, 0),
      });
    });
  }, []);

  return (
    <div className="grid grid-cols-4 gap-4 mb-6">
      <StatCard title="Total Officers" value={stats?.total} icon="👤" />
      <StatCard title="Active" value={stats?.active} icon="✅" />
      <StatCard title="Available" value={stats?.available} icon="🟢" />
      <StatCard title="Assigned" value={stats?.totalAssigned} icon="📋" />
    </div>
  );
};
```

---

## ✅ Deployment Checklist

- [ ] All models created and indexed
- [ ] Controllers created with proper error handling
- [ ] Routes registered and tested
- [ ] Bot service integrated and scheduling
- [ ] Frontend components created
- [ ] Admin page created and routed
- [ ] Email templates verified
- [ ] Database migrations (if using migration tool)
- [ ] Environment variables set
- [ ] All endpoints tested with Postman/curl
- [ ] Email notifications tested
- [ ] Frontend UI tested
- [ ] Error handling verified

---

## 📞 Need Help?

1. Check `OFFICER_SYSTEM.md` for detailed documentation
2. Review code comments for implementation details
3. Check server logs: `logs/` directory
4. Test individual endpoints with curl/Postman

Happy deploying! 🎉
