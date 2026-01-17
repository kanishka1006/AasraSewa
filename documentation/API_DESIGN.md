# AasraSewa - REST API Design & Security Specification
## 1. Security & Authentication Strategy
*   **Protocol**: HTTPS (TLS 1.3) enforced.
*   **Authentication**: Stateless **JWT (JSON Web Tokens)**.
    *   `Access-Token`: Short-lived (15 mins). Sent in `Authorization: Bearer <token>` header.
    *   `Refresh-Token`: Long-lived (7 days). Stored in `httpOnly`, `secure` cookies to prevent XSS.
*   **RBAC (Role-Based Access Control)**:
    *   Middleware checks user `role` claim in JWT against allowed roles for the route.
    *   **Roles**: `ADMIN`, `SHELTER_MANAGER`, `RESCUER`, `CITIZEN`.

---

## 2. API Endpoints

### A. Authentication Module

#### 1. Register User
*   **Route**: `POST /api/v1/auth/register`
*   **Public**: Yes
*   **Description**: Registers a new citizen. Roles higher than `CITIZEN` must be promoted by an Admin separate API to prevent privilege escalation attacks.

**Request Body:**
```json
{
  "fullName": "Aarav Sharma",
  "phoneNumber": "+919876543210",
  "password": "secure_password_123", 
  "deviceToken": "fcm_token_xyz" // For Push Notifications
}
```

**Response (201 Created):**
```json
{
  "status": "success",
  "data": {
    "user": {
      "id": "a0eebc99-9c0b-...",
      "fullName": "Aarav Sharma",
      "role": "CITIZEN"
    }
  }
}
```

#### 2. Login
*   **Route**: `POST /api/v1/auth/login`
*   **Public**: Yes

**Request Body:**
```json
{
  "phoneNumber": "+919876543210",
  "password": "secure_password_123"
}
```

**Response (200 OK):**
```json
{
  "status": "success",
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1Ni...",
    "user": {
      "id": "a0eebc99-9c0b-...",
      "role": "CITIZEN",
      "group_id": null
    }
  }
}
```

**Error (401 Unauthorized):**
```json
{
  "status": "error",
  "code": "AUTH_INVALID_CREDENTIALS",
  "message": "Incorrect phone number or password."
}
```

---

### B. Smart Band Operations (Inventory)

#### 1. Assign Band (Check-out)
*   **Route**: `POST /api/v1/bands/assign`
*   **Security**: Protected
*   **Allowed Roles**: `ADMIN`, `SHELTER_MANAGER`
*   **Description**: Links a physical band to a user and records a deposit.

**Request Body:**
```json
{
  "userPhoneNumber": "+919876543210",
  "macAddress": "00:1B:44:11:3A:B7", // Scanned from QR code
  "depositAmount": 500.00
}
```

**Response (200 OK):**
```json
{
  "status": "success",
  "data": {
    "rentalId": "Rent-UUID-1234",
    "assignedAt": "2024-01-20T10:00:00Z",
    "bandStatus": "RENTED"
  }
}
```

**Error (409 Conflict):**
```json
{
  "status": "error",
  "message": "Band 00:1B:44... is already assigned to another user."
}
```

#### 2. Unassign Band (Return/Check-in)
*   **Route**: `POST /api/v1/bands/unassign`
*   **Security**: Protected
*   **Allowed Roles**: `ADMIN`, `SHELTER_MANAGER`
*   **Description**: Marks a rental as complete and calculates refund status.

**Request Body:**
```json
{
  "macAddress": "00:1B:44:11:3A:B7",
  "condition": "GOOD" // or "DAMAGED"
}
```

**Response (200 OK):**
```json
{
  "status": "success",
  "data": {
    "rentalDurationHours": 48,
    "depositRefundStatus": "REFUNDED",
    "amountRefunded": 500.00
  }
}
```

---

### C. Standard Error Handling
All APIs follow a standard error envelope to make frontend debugging easier.

| HTTP Code | Error Type | Description |
| :--- | :--- | :--- |
| **400** | `VALIDATION_ERROR` | Schema validation failed (e.g., missing phone number). |
| **401** | `UNAUTHORIZED` | Token missing, expired, or invalid signature. |
| **403** | `FORBIDDEN` | User is authenticated but lacks permission (e.g., Citizen trying to assign bands). |
| **404** | `NOT_FOUND` | Resource (User/Band) does not exist. |
| **500** | `INTERNAL_SERVER_ERROR` | Unhandled exception or database failure. |

**Example Validation Error (400):**
```json
{
  "status": "fail",
  "code": "VALIDATION_ERROR",
  "errors": [
    { "field": "macAddress", "message": "Invalid MAC address format." }
  ]
}
```
