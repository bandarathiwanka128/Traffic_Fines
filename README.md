# Sri Lanka Traffic Fine Collection

Separate Node/Express REST API and React single-page web application for:

- Public traffic fine lookup and Stripe payment
- Police fine issuance with generated references and QR payment links
- Admin monitoring by district and fine category
- JWT role-based access for `ADMIN` and `POLICE`
- SMS queue logging after payment confirmation (provider integration can be added later)

## Setup

1. Run `backend/supabase_schema.sql` in the Supabase SQL Editor.
2. Copy `backend/.env.example` to `backend/.env` and add the real keys.
3. Install from the repository root:

```powershell
npm install
```

4. Start both applications:

```powershell
npm run dev --workspace=backend
npm start --workspace=frontend
```

The API runs at `http://localhost:5001`; the web application runs at
`http://localhost:3000`.

## Admin Login

- Username: `admin`
- Password: `12345678`

The username maps to `admin@trafficfine.gov.lk` in the database.

## Stripe

Set these backend variables:

```env
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
FRONTEND_URL=http://localhost:3000
```

For local webhook testing:

```powershell
stripe listen --forward-to localhost:5001/api/payments/webhook
```

Use the displayed `whsec_...` value as `STRIPE_WEBHOOK_SECRET`. The application
records payments and marks fines paid only after Stripe webhook confirmation.

## Main Routes

- `/pay` public fine payment portal
- `/login` admin/police login
- `/` role-based dashboard
- `/fines/new` police fine issuance and QR generation
- `/users` admin police-account management

## GitHub Automation

The repository includes:

- `.github/workflows/ci.yml`: installs dependencies, checks backend JavaScript,
  and creates the production React build for pushes and pull requests.
- `.github/workflows/deploy-vercel.yml`: deploys `main` to Vercel when the
  required GitHub repository secrets are available.

Add these secrets under **GitHub > Repository Settings > Secrets and variables
> Actions**:

```text
VERCEL_TOKEN
VERCEL_ORG_ID
VERCEL_PROJECT_ID
```

`VERCEL_ORG_ID` and `VERCEL_PROJECT_ID` are available in the `.vercel/project.json`
file after linking the project with the Vercel CLI, or from the Vercel project
settings. Until the secrets are added, the deployment workflow skips cleanly
and CI continues to run.

## Vercel Deployment

1. Import `bandarathiwanka128/Traffic_Fines` into Vercel.
2. Keep the project root as the repository root.
3. Vercel reads `vercel.json`; no manual build or output override is required.
4. Add these production environment variables in Vercel:

```text
SUPABASE_URL
SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
JWT_SECRET
STRIPE_SECRET_KEY
STRIPE_WEBHOOK_SECRET
FRONTEND_URL
```

Set `FRONTEND_URL` to the final HTTPS Vercel domain, for example:

```text
https://traffic-fines.vercel.app
```

In Stripe, create a webhook endpoint using:

```text
https://YOUR-VERCEL-DOMAIN/api/payments/webhook
```

Subscribe it to:

```text
checkout.session.completed
checkout.session.async_payment_succeeded
```

Copy the webhook signing secret into `STRIPE_WEBHOOK_SECRET`, then redeploy.
