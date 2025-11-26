# Registration Validation - Cross-Check with StudentList Database

## Current Validation Fields

During voter and candidate registration, the system cross-checks the following fields against the `StudentList` database:

### 1. ✅ Student ID (Primary Check)
- **Field**: `studentId` / `voterId`
- **Validation**: Must exist in StudentList database
- **Status Check**: Must have `status: "active"` in StudentList
- **Message**: "Student ID not found in the authorized student list"

### 2. ✅ Email Address (Secondary Check)
- **Field**: `email`
- **Validation**: Must match the email stored in StudentList for that Student ID
- **Message**: "Email does not match the registered email for this Student ID"

### 3. ✅ Name (Enhanced Security)
- **Field**: `firstName`, `lastName`
- **Validation**: Must match the name stored in StudentList (case-insensitive, flexible matching)
- **Matching**: Handles different name order and spacing
- **Message**: "Name does not match the registered name for this Student ID"

### 4. ⚠️ Department (Warning Only)
- **Field**: `department`
- **Validation**: Logs warning if department doesn't match (not blocking)
- **Status**: Can be made strict/blocking if needed
- **Note**: Currently shows warning but allows registration to proceed

---

## Registration Flow

### Voter Registration (`/createVoter`)
1. Validates Student ID format (WCU + 7 digits)
2. Validates Gmail format
3. **Cross-checks Student ID in StudentList** ✅ (must exist and be active)
4. **Cross-checks Email in StudentList** ✅ (must match exactly)
5. **Cross-checks Name in StudentList** ✅ (must match - flexible)
6. **Cross-checks Department in StudentList** ⚠️ (warning if mismatch)
7. Checks if user already exists in User collection
8. Checks if Student ID already registered
9. Creates new voter

### Candidate Registration (`/createCandidate`)
1. **Cross-checks Student ID in StudentList** (if self-registration) ✅
2. Checks if user is already a candidate
3. Validates authenticated document
4. Creates/updates candidate record

---

## How to Enhance Validation

To add name and department validation, update the registration endpoints to also check these fields against StudentList.
