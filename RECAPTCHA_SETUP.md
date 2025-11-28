# reCAPTCHA Setup Instructions

## Get Your reCAPTCHA Keys

1. Go to [Google reCAPTCHA Admin Console](https://www.google.com/recaptcha/admin)
2. Sign in with your Google account
3. Click "Create" or "+" to register a new site
4. Fill in the form:
   - **Label**: KLSB Timesheet System (or any name you prefer)
   - **reCAPTCHA type**: Select **reCAPTCHA v2** → **"I'm not a robot" Checkbox**
   - **Domains**: Add your domain(s):
     - `localhost` (for development)
     - `127.0.0.1` (for development)
     - `app.kemuncaklanai.com.my` (for production)
   - Accept the reCAPTCHA Terms of Service
5. Click **Submit**
6. You'll receive:
   - **Site Key** (public key - used in frontend)
   - **Secret Key** (private key - used in backend)

## Configure Backend

1. Open or create `backend/.env` file
2. Add your secret key:
   ```
   RECAPTCHA_SECRET_KEY=your-secret-key-from-google
   ```

## Configure Frontend

1. Open or create `frontend/.env` file
2. Add your site key:
   ```
   VITE_RECAPTCHA_SITE_KEY=your-site-key-from-google
   ```

## Important Notes

- **Never commit** your `.env` files to version control
- The **Site Key** is public and safe to expose in frontend code
- The **Secret Key** must be kept private and only used in backend
- For development without captcha: simply don't add the keys (captcha will be skipped)
- For production: always use captcha for security

## Testing

1. Restart backend server: `cd backend && node src/server.js`
2. Restart frontend dev server: `cd frontend && npm run dev`
3. Go to login page - you should see the reCAPTCHA widget
4. Complete the captcha and login

## Troubleshooting

- **Captcha not showing**: Check if `VITE_RECAPTCHA_SITE_KEY` is set correctly in `frontend/.env`
- **"Invalid captcha" error**: Check if `RECAPTCHA_SECRET_KEY` is set correctly in `backend/.env`
- **Domain not allowed**: Add your domain in reCAPTCHA admin console
- **Still not working**: Clear browser cache and restart servers
