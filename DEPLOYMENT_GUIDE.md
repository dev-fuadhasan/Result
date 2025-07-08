# ResultRaider Deployment Guide

## 🚀 Deploying to Netlify

Your frontend is already deployed at: **https://resultraider.netlify.app/**

But you need to deploy the backend separately. Here are your options:

---

## Option 1: Deploy Backend to Render (Recommended)

### Step 1: Deploy Backend to Render

1. **Go to [Render.com](https://render.com)** and sign up/login
2. **Create a new Web Service**
3. **Connect your GitHub repository**
4. **Configure the service:**
   - **Name**: `resultraider-backend`
   - **Root Directory**: `server`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Environment**: `Node`
   - **Plan**: Free

5. **Add Environment Variables:**
   ```
   NODE_ENV=production
   PORT=10000
   ```

6. **Deploy** and wait for it to be live

### Step 2: Update Frontend Configuration

Once your backend is deployed, you'll get a URL like: `https://resultraider-backend.onrender.com`

1. **In Netlify Dashboard**, go to your site settings
2. **Add Environment Variable:**
   - **Key**: `VITE_API_URL`
   - **Value**: `https://your-backend-url.onrender.com`

3. **Redeploy** your Netlify site

---

## Option 2: Deploy Backend to Railway

### Step 1: Deploy Backend to Railway

1. **Go to [Railway.app](https://railway.app)** and sign up/login
2. **Create a new project**
3. **Deploy from GitHub** and select your repository
4. **Configure the service:**
   - **Root Directory**: `server`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`

5. **Add Environment Variables:**
   ```
   NODE_ENV=production
   PORT=3000
   ```

6. **Deploy** and get your URL

### Step 2: Update Frontend Configuration

Same as Render - add the Railway URL to Netlify environment variables.

---

## Option 3: Deploy Backend to Vercel

### Step 1: Deploy Backend to Vercel

1. **Go to [Vercel.com](https://vercel.com)** and sign up/login
2. **Import your GitHub repository**
3. **Configure the project:**
   - **Root Directory**: `server`
   - **Framework Preset**: `Node.js`
   - **Build Command**: `npm install`
   - **Output Directory**: Leave empty
   - **Install Command**: `npm install`

4. **Add Environment Variables:**
   ```
   NODE_ENV=production
   ```

5. **Deploy**

### Step 2: Update Frontend Configuration

Same as above - add the Vercel URL to Netlify environment variables.

---

## Option 4: Use Netlify Functions (Advanced)

If you want to keep everything on Netlify, you can convert your Express backend to Netlify Functions:

### Step 1: Create Netlify Functions

1. **Create a `netlify/functions` directory**
2. **Convert your Express routes to serverless functions**
3. **Update the frontend to use Netlify Functions**

This is more complex but keeps everything on Netlify.

---

## 🔧 Current Configuration

### Frontend (Netlify)
- **URL**: https://resultraider.netlify.app/
- **Build Command**: `npm run build`
- **Publish Directory**: `dist/public`

### Backend (Need to deploy)
- **Framework**: Express.js
- **Port**: 5000 (development) / Environment variable (production)
- **API Endpoints**: `/api/captcha`, `/api/result/search`, etc.

---

## 🚨 Important Notes

### Environment Variables
Make sure to set these in your backend deployment:

```env
NODE_ENV=production
PORT=3000  # or whatever port your service uses
```

### CORS Configuration
The backend is already configured to accept requests from any origin (`*`). For production, you might want to restrict it to your Netlify domain:

```typescript
res.header('Access-Control-Allow-Origin', 'https://resultraider.netlify.app');
```

### API URL Configuration
Once you deploy the backend, update the `VITE_API_URL` environment variable in Netlify to point to your backend URL.

---

## 🧪 Testing After Deployment

1. **Visit your Netlify site**: https://resultraider.netlify.app/
2. **Open browser console** (F12)
3. **Check if captcha loads** - you should see:
   ```
   [apiRequest] GET https://your-backend-url.com/api/captcha
   [useResultSearch] Fetching captcha...
   [useResultSearch] Captcha response: {...}
   ```

4. **If you see errors**, check:
   - Backend URL is correct in environment variables
   - Backend is running and accessible
   - CORS is properly configured

---

## 🆘 Troubleshooting

### Captcha Not Showing
- Check browser console for API errors
- Verify backend URL in Netlify environment variables
- Ensure backend is deployed and running

### CORS Errors
- Check that backend CORS is configured correctly
- Verify the frontend URL is allowed in CORS settings

### Build Errors
- Check that all dependencies are installed
- Verify Node.js version compatibility

---

## 📞 Need Help?

1. **Check the browser console** for error messages
2. **Verify your backend deployment** is running
3. **Test the backend URL directly** in browser
4. **Check Netlify deployment logs** for build issues

The most common issue is that the backend isn't deployed or the API URL isn't configured correctly in Netlify environment variables. 