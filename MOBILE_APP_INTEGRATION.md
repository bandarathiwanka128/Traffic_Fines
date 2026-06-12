# Mobile App Integration Guide

This document is the handoff contract for an Android, Flutter, or React Native
mobile application that uses the deployed Traffic Fine REST API.

## Production URLs

```text
API_BASE_URL=https://trafficfines.vercel.app/api
WEB_BASE_URL=https://trafficfines.vercel.app
```

Do not append another `/api` when calling endpoints. For example:

```text
https://trafficfines.vercel.app/api/auth/login
```

## Recommended Mobile Scope

The simplest app can have two entry points:

1. **Driver payment**
   - No account is required.
   - Scan the QR code or enter the fine reference and category ID.
   - Verify the fine.
   - Open Stripe Checkout.
   - Recheck the fine status when the user returns.

2. **Police officer**
   - Officer signs in with an account created by the web administrator.
   - Officer selects a fine category and enters driver/vehicle details.
   - Backend generates the unique reference and payment URL.
   - App displays a QR code containing that payment URL.
   - Officer can check whether the fine is `PENDING` or `PAID`.

The mobile application must call the REST API. It must not connect directly to
Supabase or Stripe using server credentials.

## Mobile Environment File

Only public configuration belongs in the mobile application:

```env
API_BASE_URL=https://trafficfines.vercel.app/api
WEB_BASE_URL=https://trafficfines.vercel.app
```

Examples by framework:

```text
Flutter: --dart-define=API_BASE_URL=...
React Native: API_BASE_URL=...
Native Android: BuildConfig.API_BASE_URL
```

The following values are backend-only and must never be sent to the mobile
developer or included in the APK:

```text
SUPABASE_SERVICE_ROLE_KEY
STRIPE_SECRET_KEY
STRIPE_WEBHOOK_SECRET
JWT_SECRET
```

`SUPABASE_URL` and `SUPABASE_ANON_KEY` are also unnecessary because this app
uses the REST API instead of direct Supabase access.

## Driver Payment Flow

### Option A: Scan QR

The QR value is an HTTPS URL:

```text
https://trafficfines.vercel.app/pay?reference=SLTF-2026-ABC123&category=1
```

The mobile scanner should:

1. Accept only HTTPS links for `trafficfines.vercel.app`.
2. Read `reference` and `category`.
3. Call the fine lookup endpoint.
4. Display the verified result.

The app may also open the URL directly in the system browser. This uses the
existing responsive payment web portal and requires almost no mobile payment
code.

### Option B: Manual Entry

First load categories:

```http
GET /api/public/categories
```

Example response:

```json
[
  {
    "id": 1,
    "category_name": "Speeding",
    "amount": 3000
  }
]
```

Then verify the reference and category together:

```http
POST /api/public/fines/lookup
Content-Type: application/json

{
  "fine_reference": "SLTF-2026-ABC123",
  "category_id": 1
}
```

Example response:

```json
{
  "id": 42,
  "fine_reference": "SLTF-2026-ABC123",
  "vehicle_number": "WP CAB-1234",
  "driver_name": "Example Driver",
  "district": "Colombo",
  "status": "PENDING",
  "issued_date": "2026-06-12T08:00:00.000Z",
  "category_id": 1,
  "fine_categories": {
    "category_name": "Speeding",
    "amount": 3000,
    "description": "Exceeding the permitted speed limit"
  },
  "users": {
    "full_name": "Police Officer"
  }
}
```

Do not display the full driving licence number or police phone number on public
screens.

### Start Stripe Payment

```http
POST /api/public/payments/checkout
Content-Type: application/json

{
  "fine_reference": "SLTF-2026-ABC123",
  "category_id": 1
}
```

Response:

```json
{
  "url": "https://checkout.stripe.com/..."
}
```

Open `url` using the system browser, Chrome Custom Tabs, or the platform URL
launcher. Do not place Stripe card forms in an ordinary WebView.

After payment, Stripe redirects to:

```text
https://trafficfines.vercel.app/payment/success?session_id=...
```

The Stripe webhook is the authority that records the payment. The app must not
mark the fine as paid locally.

When the app resumes, call `/api/public/fines/lookup` again. Show success only
when the returned status is `PAID`. A short delay can occur while Stripe sends
the webhook, so retry every 2 seconds for up to approximately 20 seconds.

## Police Officer Flow

### Login

```http
POST /api/auth/login
Content-Type: application/json

{
  "identifier": "officer@example.lk",
  "password": "officer-password"
}
```

Response:

```json
{
  "token": "JWT_TOKEN",
  "user": {
    "id": 2,
    "full_name": "Police Officer",
    "email": "officer@example.lk",
    "role": "POLICE",
    "district": "Colombo",
    "phone": "+94770000000"
  }
}
```

Store the JWT in Android Keystore-backed secure storage. Do not store officer
passwords. Send the token with protected requests:

```http
Authorization: Bearer JWT_TOKEN
```

The token expires after seven days. On `401`, remove it and return to login.

### Load Fine Categories

```http
GET /api/categories
Authorization: Bearer JWT_TOKEN
```

### Issue Fine

```http
POST /api/fines
Authorization: Bearer JWT_TOKEN
Content-Type: application/json

{
  "vehicle_number": "WP CAB-1234",
  "driver_name": "Example Driver",
  "driver_license": "B1234567",
  "category_id": 1,
  "district": "Colombo"
}
```

Do not generate the official reference in the mobile app. The backend generates
it to prevent collisions.

Example response:

```json
{
  "id": 42,
  "fine_reference": "SLTF-2026-ABC123",
  "vehicle_number": "WP CAB-1234",
  "driver_name": "Example Driver",
  "driver_license": "B1234567",
  "category_id": 1,
  "district": "Colombo",
  "status": "PENDING",
  "payment_url": "https://trafficfines.vercel.app/pay?reference=SLTF-2026-ABC123&category=1"
}
```

Generate a QR bitmap in the mobile app from the exact `payment_url` returned by
the server. Display these values below it as a fallback:

```text
Fine reference: SLTF-2026-ABC123
Category ID: 1
Amount: LKR 3,000.00
```

The QR must contain the payment URL only. Do not encode driver licence data,
phone numbers, passwords, JWTs, or payment secrets into it.

### Officer Fine List

```http
GET /api/fines?page=1&limit=20&status=PENDING
Authorization: Bearer JWT_TOKEN
```

Police users receive only fines issued by their own account.

Optional filters:

```text
status=PENDING|PAID
vehicle_number=WP
district=Colombo
page=1
limit=20
```

### Fine Details and Payment Status

```http
GET /api/fines/42
Authorization: Bearer JWT_TOKEN
```

Refresh this endpoint after the driver pays. When `status` becomes `PAID`, show
that the payment was confirmed and the licence may be released according to
department procedure.

## Complete Sequence

```text
ADMIN WEB
  -> creates police officer account

POLICE MOBILE
  -> POST /auth/login
  -> GET /categories
  -> POST /fines
  <- receives fine_reference and payment_url
  -> displays QR

DRIVER MOBILE OR CAMERA
  -> scans payment_url
  -> POST /public/fines/lookup
  -> POST /public/payments/checkout
  <- receives Stripe Checkout URL
  -> opens Stripe-hosted checkout

STRIPE
  -> POST /payments/webhook

BACKEND
  -> verifies Stripe signature
  -> inserts payment
  -> changes fine PENDING to PAID
  -> writes pending SMS log for officer

POLICE MOBILE
  -> refreshes GET /fines/:id
  <- sees PAID
```

## Error Handling

```text
400  Missing or invalid request data
401  Login failed, JWT missing, or JWT expired
403  Authenticated user does not have the required role
404  Fine/reference/category combination not found
409  Fine is already paid
500  Backend/database error
503  Stripe is not configured
```

Always show the API `message` field when it is safe and useful. Do not retry
`400`, `401`, `403`, or `404` automatically. Network failures and payment-status
checks may be retried with a short delay.

## Required Mobile Screens

1. Role selection or landing screen
2. Driver QR scanner/manual lookup
3. Verified fine summary
4. Stripe browser launch/loading screen
5. Payment result/status screen
6. Police login
7. Police fine list
8. Issue-fine form
9. Generated fine reference and QR
10. Fine detail/payment-status screen

## Validation Rules

- Vehicle number: required; uppercase before display.
- Driving licence: required on police issue screen.
- Category: must come from the API.
- Reference: trim whitespace; treat case-insensitively.
- Amount: read-only; always supplied by the category stored on the backend.
- Payment status: read-only; only the webhook/backend may change it.
- Fine edits: allowed only while status is `PENDING`.

## Test Checklist

1. Officer can log in and securely retain a JWT.
2. Officer cannot see another officer's fines.
3. Fine creation returns a unique reference and payment URL.
4. QR opens the correct fine.
5. Wrong category ID does not reveal a fine.
6. Driver cannot change the amount.
7. Stripe cancellation leaves the fine `PENDING`.
8. Successful Stripe webhook changes the fine to `PAID`.
9. A repeated webhook does not create a duplicate payment.
10. Paid fines cannot start another checkout.
11. Expired JWT returns the officer to login.
12. No backend secret appears in source code, logs, APK, or screenshots.

## Future Enhancements

- Android App Links for opening QR URLs directly inside the app.
- Driver phone/email and receipt delivery.
- Real SMS provider integration.
- Offline fine drafting with server submission when connectivity returns.
- Device registration and officer account revocation.
- Audit logs for fine changes and licence release.

