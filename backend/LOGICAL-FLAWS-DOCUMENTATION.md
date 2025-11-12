# Backend Logical Flaws Documentation

## Critical Logical Flaws & Required Fixes

---

### 1. **Race Condition in Event Registration (CRITICAL)**
**Location:** `registration.controller.js` - `registerForEvent()`

**Flaw:**
```javascript
const event = await Event.findById(eventId);
if (event.capacity && event.registeredCount >= event.capacity) {
  return res.status(400).json({ message: "Event is full" });
}
// ... later ...
await Event.findByIdAndUpdate(eventId, { $inc: { registeredCount: 1 } });
```

**Problem:** 
- Two users can register simultaneously for the last spot
- The check and increment are NOT atomic operations
- Example: Event has capacity=100, registeredCount=99
  - User A checks: 99 < 100 ✓ (passes)
  - User B checks: 99 < 100 ✓ (passes)
  - Both register, final count = 101 (over capacity!)

**Impact:** Overbooking of events

**Fix Required:**
Use MongoDB atomic operations with `$inc` and conditionals:
```javascript
const result = await Event.findOneAndUpdate(
  { 
    _id: eventId,
    $expr: {
      $or: [
        { $eq: ['$capacity', null] },
        { $lt: ['$registeredCount', '$capacity'] }
      ]
    }
  },
  { $inc: { registeredCount: 1 } },
  { new: true }
);

if (!result) {
  return res.status(400).json({ message: "Event is full or not found" });
}
```

---

### 2. **Inconsistent Registration Count on Cancellation**
**Location:** `registration.controller.js` - `cancelRegistration()`

**Flaw:**
```javascript
const registration = await Registration.findOneAndDelete({
  event: eventId,
  user: userId,
});
if (!registration) return res.status(404).json({ message: "Registration not found" });
await Event.findByIdAndUpdate(eventId, { $inc: { registeredCount: -1 } });
```

**Problem:**
- If registration deletion succeeds but event update fails (network/DB issues)
- Registration is deleted but count is not decremented
- Count becomes permanently inaccurate

**Impact:** Incorrect capacity calculations, blocking future registrations

**Fix Required:**
Use MongoDB transactions or check deletion success:
```javascript
const session = await mongoose.startSession();
session.startTransaction();
try {
  const registration = await Registration.findOneAndDelete({
    event: eventId,
    user: userId,
  }, { session });
  
  if (!registration) {
    await session.abortTransaction();
    return res.status(404).json({ message: "Registration not found" });
  }
  
  await Event.findByIdAndUpdate(
    eventId, 
    { $inc: { registeredCount: -1 } },
    { session }
  );
  
  await session.commitTransaction();
  res.json({ message: "Registration cancelled successfully" });
} catch (err) {
  await session.abortTransaction();
  throw err;
} finally {
  session.endSession();
}
```

---

### 3. **Permanent Increment on Failed Registration**
**Location:** `registration.controller.js` - `registerForEvent()`

**Flaw:**
```javascript
const registration = await Registration.create({
  event: eventId,
  user: userId,
  status,
  payment_transaction_id: payment_transaction_id || undefined,
});

await Event.findByIdAndUpdate(eventId, { $inc: { registeredCount: 1 } });
```

**Problem:**
- If `Registration.create()` succeeds but event increment fails
- Registration exists but count is not incremented
- If registration creation fails AFTER increment, count is wrong

**Impact:** Data inconsistency between registrations and event counts

**Fix Required:**
Use transactions or reverse order with verification:
```javascript
const session = await mongoose.startSession();
session.startTransaction();
try {
  const registration = await Registration.create([{
    event: eventId,
    user: userId,
    status,
    payment_transaction_id: payment_transaction_id || undefined,
  }], { session });

  await Event.findByIdAndUpdate(
    eventId, 
    { $inc: { registeredCount: 1 } },
    { session }
  );
  
  await session.commitTransaction();
  res.status(201).json({ message: "Registration successful", registration: registration[0] });
} catch (err) {
  await session.abortTransaction();
  throw err;
} finally {
  session.endSession();
}
```

---

### 4. **Missing Capacity Validation on Event Update**
**Location:** `event.controller.js` - `updateEvent()`

**Flaw:**
```javascript
if (capacity !== undefined) event.capacity = capacity;
await event.save();
```

**Problem:**
- Admin can reduce capacity below current registeredCount
- Example: Event has 50 registrations, admin sets capacity to 30
- Creates impossible state: 50 registered but capacity is 30
- New users see "event full" even though capacity shows 30/30

**Impact:** Data integrity violation, confusing user experience

**Fix Required:**
```javascript
if (capacity !== undefined) {
  if (capacity < event.registeredCount) {
    return res.status(400).json({ 
      message: `Cannot reduce capacity below current registrations (${event.registeredCount})` 
    });
  }
  event.capacity = capacity;
}
```

---

### 5. **TEMP_ADMIN Authorization Check Timing Issue**
**Location:** `event.controller.js` - `createEvent()`, `updateEvent()`, `deleteEvent()`

**Flaw:**
```javascript
if (!(
  organizer.role === "SUPER_ADMIN" ||
  (organizer.role === "TEMP_ADMIN" && organizer.promotedUntil > new Date())
)) {
  return res.status(403).json({ message: "Unauthorized to create event" });
}
```

**Problem:**
- Check happens at request start
- For long-running operations (file uploads), TEMP_ADMIN privilege might expire DURING execution
- User authorized at start, but not when action completes
- The middleware auto-demotes expired TEMP_ADMIN, but controller still uses old cached value

**Impact:** Expired TEMP_ADMIN can create events if they start before expiry

**Fix Required:**
Re-fetch user after file uploads or use the middleware-updated `req.user`:
```javascript
// After file uploads, before authorization check
const currentUser = await User.findById(req.user._id);
if (!(
  currentUser.role === "SUPER_ADMIN" ||
  (currentUser.role === "TEMP_ADMIN" && currentUser.promotedUntil > new Date())
)) {
  // Cleanup uploaded files
  if (req.files?.thumbnail) fs.unlinkSync(req.files.thumbnail[0].path);
  if (req.files?.qrCode) fs.unlinkSync(req.files.qrCode[0].path);
  return res.status(403).json({ message: "Unauthorized to create event" });
}
```

---

### 6. **Event Deletion Without Capacity Restoration Logic**
**Location:** `event.controller.js` - `deleteEvent()`

**Flaw:**
```javascript
await Registration.deleteMany({ event: eventId });
await Event.findByIdAndDelete(eventId);
```

**Problem:**
- While registrations are deleted, this is correct for deletion
- However, if there's any business logic that tracks "total registrations processed" or refunds needed, this doesn't handle it
- No notification to registered users about event cancellation

**Impact:** Users not informed, potential refund issues

**Fix Required:**
Add notification logic before deletion:
```javascript
// Get all registrations before deletion for notifications
const registrations = await Registration.find({ event: eventId }).populate('user', 'email name');

// Send cancellation emails/notifications
for (const reg of registrations) {
  // await sendCancellationEmail(reg.user.email, event);
  // Log for refund processing if payment was made
  if (reg.payment_transaction_id) {
    // Log for manual refund processing
    console.log(`Refund needed for user ${reg.user._id}, transaction: ${reg.payment_transaction_id}`);
  }
}

await Registration.deleteMany({ event: eventId });
await Event.findByIdAndDelete(eventId);
```

---

### 7. **Duplicate Registration Check After Capacity Check**
**Location:** `registration.controller.js` - `registerForEvent()`

**Flaw:**
```javascript
if (event.capacity && event.registeredCount >= event.capacity) {
  return res.status(400).json({ message: "Event is full" });
}

const existing = await Registration.findOne({ event: eventId, user: userId });
if (existing) return res.status(400).json({ message: "Already registered" });
```

**Problem:**
- Capacity check happens BEFORE duplicate check
- If user already registered, they see "Event is full" instead of "Already registered"
- Wastes a DB query checking capacity when user can't register anyway
- Misleading error message

**Impact:** Poor UX, wrong error messages

**Fix Required:**
Reorder checks - duplicate check should be first:
```javascript
const existing = await Registration.findOne({ event: eventId, user: userId });
if (existing) return res.status(400).json({ message: "Already registered" });

const event = await Event.findById(eventId);
if (!event) return res.status(404).json({ message: "Event not found" });

if (event.capacity && event.registeredCount >= event.capacity) {
  return res.status(400).json({ message: "Event is full" });
}
```

---

### 8. **JWT Token Contains Mutable User Data**
**Location:** `userAuth.controller.js` - `loginUser()`

**Flaw:**
```javascript
const { password: _, ...userWithoutPassword } = user.toObject();
const token = jwt.sign({ user: userWithoutPassword }, process.env.JWT_SECRET)
```

**Problem:**
- Token contains role, isIEEE, promotedUntil, etc.
- If user is promoted/demoted, old tokens still have old roles
- TEMP_ADMIN who expires still has valid token with TEMP_ADMIN role
- User must logout and login to reflect changes
- Security risk: Expired TEMP_ADMIN can still act as admin with old token

**Impact:** Authorization bypass, stale permissions

**Fix Required:**
Store only user ID in token, fetch user data on each request (already done in middleware, but needs consistency):
```javascript
// In loginUser
const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
  expiresIn: '5d'
});

// Middleware already fetches fresh user data - this is correct
// But need to update checkAuth controller to not return decoded user from token
```

---

### 9. **Registration Status Can Be Changed to Lower Priority**
**Location:** `registration.controller.js` - `updateRegistrationStatus()`

**Flaw:**
```javascript
const valid = ["REGISTERED", "AWAITING_CONFIRMATION"];
if (!valid.includes(status)) {
  return res.status(400).json({ message: "Invalid status" });
}

const registration = await Registration.findByIdAndUpdate(
  regId,
  { status },
  { new: true }
);
```

**Problem:**
- Admin can change status from "REGISTERED" back to "AWAITING_CONFIRMATION"
- No validation of state transitions
- Can be used to invalidate legitimate registrations
- No audit trail of who changed status

**Impact:** Status manipulation, no accountability

**Fix Required:**
Add status transition validation and audit logging:
```javascript
const registration = await Registration.findById(regId);
if (!registration) {
  return res.status(404).json({ message: "Registration not found" });
}

// Only allow AWAITING_CONFIRMATION -> REGISTERED transition
if (registration.status === "REGISTERED" && status === "AWAITING_CONFIRMATION") {
  return res.status(400).json({ 
    message: "Cannot revert registered status to awaiting confirmation" 
  });
}

registration.status = status;
registration.statusUpdatedBy = req.user._id; // Add this field to schema
registration.statusUpdatedAt = new Date(); // Add this field to schema
await registration.save();
```

---

### 10. **Event Start Date Validation Only on Create, Not Update**
**Location:** `event.controller.js` - `updateEvent()`

**Flaw:**
```javascript
if (startDate && endDate) {
  const start = new Date(startDate);
  const end = new Date(endDate);
  // ... validates end > start ...
  event.startDate = start;
  event.endDate = end;
}
// MISSING: No check if start < new Date()
```

**Problem:**
- On create, validates: `if (start < new Date()) return error`
- On update, this validation is MISSING
- Admin can update event to have past start date
- Creates confusion about event status

**Impact:** Events with invalid past dates

**Fix Required:**
```javascript
if (startDate && endDate) {
  const start = new Date(startDate);
  const end = new Date(endDate);
  
  if (isNaN(start.getTime()) || isNaN(end.getTime())) {
    return res.status(400).json({ message: "Invalid date format" });
  }
  if (end <= start) {
    return res.status(400).json({ message: "endDate must be after startDate" });
  }
  
  // Add this validation
  if (start < new Date()) {
    return res.status(400).json({ message: "Start date cannot be in the past" });
  }
  
  event.startDate = start;
  event.endDate = end;
}
```

---

### 11. **File Upload Memory Leak on Error**
**Location:** `event.controller.js` - `createEvent()`, `updateEvent()`

**Flaw:**
```javascript
if (req.files && req.files.thumbnail) {
  const thumbnailFile = req.files.thumbnail[0];
  const thumbnailResult = await cloudinary.uploader.upload(thumbnailFile.path, { folder: "event_thumbnails" });
  thumbnailUrl = thumbnailResult.secure_url;
  fs.unlinkSync(thumbnailFile.path);
}
// ... validation happens AFTER upload ...
if (!title || title.trim().length < 3) {
  return res.status(400).json({ message: "Title is required..." });
  // Files are NOT deleted!
}
```

**Problem:**
- Files uploaded to Cloudinary and local files deleted
- But if validation fails AFTER upload, Cloudinary files remain
- Memory leak on Cloudinary
- Cost implications

**Impact:** Storage waste, cost increase

**Fix Required:**
Validate BEFORE uploading or cleanup on error:
```javascript
// Validate ALL inputs FIRST
if (!title || title.trim().length < 3) {
  return res.status(400).json({ message: "Title is required..." });
}
// ... all other validations ...

// THEN upload files
if (req.files && req.files.thumbnail) {
  const thumbnailFile = req.files.thumbnail[0];
  try {
    const thumbnailResult = await cloudinary.uploader.upload(thumbnailFile.path, { folder: "event_thumbnails" });
    thumbnailUrl = thumbnailResult.secure_url;
    fs.unlinkSync(thumbnailFile.path);
  } catch (uploadError) {
    fs.unlinkSync(thumbnailFile.path); // Cleanup local file on error
    throw uploadError;
  }
}
```

---

### 12. **Authorization Check in Wrong Place for Role-Based Actions**
**Location:** Routes use middleware but controllers re-check

**Flaw:**
```javascript
// In routes: authorizeRoles("SUPER_ADMIN", "TEMP_ADMIN")
// In controller: checks again with different logic
if (!(user.role === "SUPER_ADMIN" || (user.role === "TEMP_ADMIN" && user.promotedUntil > new Date()))) {
  return res.status(403).json({ message: "Unauthorized" });
}
```

**Problem:**
- Duplicate authorization logic
- Route middleware doesn't check `promotedUntil`
- Controller checks it differently
- Inconsistent authorization

**Impact:** Potential authorization bypass if middleware is bypassed

**Fix Required:**
Move all authorization logic to middleware or remove from routes:
```javascript
// Update middleware to handle TEMP_ADMIN expiry check
const authorizeRoles = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    
    // Check if user's current role is allowed
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ message: "Forbidden" });
    }
    
    // Additional check for TEMP_ADMIN expiry (already done in AuthMiddleware)
    // No need to re-check in controller
    next();
  };
};
```

---

## Summary of Required Changes

1. **Implement atomic operations** for registration count management
2. **Use MongoDB transactions** for multi-document operations
3. **Add capacity validation** when updating events
4. **Reorder validation logic** (duplicate check before capacity)
5. **Validate state transitions** for registration status
6. **Add past date validation** on event updates
7. **Cleanup uploaded files** on validation failures
8. **Consolidate authorization** logic in middleware
9. **Store only user ID in JWT** tokens
10. **Add audit trails** for critical actions (status changes, event deletions)

## Priority

- **P0 (Critical):** #1, #2, #3, #8 - Data integrity and security
- **P1 (High):** #4, #5, #9, #11 - Business logic and resource management
- **P2 (Medium):** #6, #7, #10, #12 - UX and consistency improvements
