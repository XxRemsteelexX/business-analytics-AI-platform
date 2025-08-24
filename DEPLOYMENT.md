# Thompson PMC Analytics - Deployment Guide

## Option 1: Hugging Face Spaces with Bamboo LLM (Free AI Hosting)

### Step 1: Create Hugging Face Account
1. Go to [huggingface.co](https://huggingface.co) and create an account
2. Navigate to "Spaces" and click "Create new Space"
3. Choose:
   - **Name**: `thompson-pmc-analytics` (or your preferred name)
   - **License**: Apache-2.0
   - **Space SDK**: Docker
   - **Visibility**: Public or Private (your choice)

### Step 2: Upload Files
1. Upload all files from this directory to your Hugging Face Space
2. Make sure these key files are included:
   - `Dockerfile`
   - `package.json`
   - All source files
   - `.dockerignore`
   - `README.md`

### Step 3: Configure Environment Variables
In your Hugging Face Space settings, add these environment variables:
```
NEXTAUTH_SECRET=T4ylXwBKslWZHAzFTKXOyd8tdFqDEFuo
USE_BAMBOO_LLM=true
NEXTAUTH_URL=https://YOUR-USERNAME-thompson-pmc-analytics.hf.space
NODE_ENV=production
```

### Step 4: Build and Deploy
Hugging Face will automatically build and deploy your app. The process takes 5-10 minutes.

**Your app will be live at**: `https://YOUR-USERNAME-thompson-pmc-analytics.hf.space`

---

## Option 2: Vercel (Fastest for Next.js)

### Step 1: Install Vercel CLI
```bash
npm install -g vercel
```

### Step 2: Login to Vercel
```bash
vercel login
```

### Step 3: Deploy
```bash
vercel --prod
```

### Step 4: Configure Environment Variables
In Vercel dashboard, add:
- `NEXTAUTH_SECRET`: `T4ylXwBKslWZHAzFTKXOyd8tdFqDEFuo`
- `USE_BAMBOO_LLM`: `true`

---

## Option 3: Other Platforms

### Railway, Render, or DigitalOcean
1. Connect your GitHub repository
2. Set environment variables:
   - `NEXTAUTH_SECRET=T4ylXwBKslWZHAzFTKXOyd8tdFqDEFuo`
   - `USE_BAMBOO_LLM=true`
   - `NODE_ENV=production`
3. Deploy with build command: `npm run build`
4. Start command: `npm start`

---

## Database Setup

The app uses SQLite with Prisma, which will automatically:
1. Create the database file on first run
2. Run migrations
3. Set up all tables

No additional database configuration needed!

---

## Testing Your Deployment

1. Visit your deployed URL
2. Sign up for a new account
3. Upload an Excel file
4. Test the AI analysis features
5. Verify charts and visualizations work

---

## Troubleshooting

### Build Failures
- Check that all dependencies are properly installed
- Ensure environment variables are set correctly
- Check logs for specific error messages

### Runtime Issues
- Verify the database is being created properly
- Check that file uploads work
- Test AI API connection

### Performance
- The app may take 20-30 seconds to start up (cold start)
- File processing can take 10-60 seconds depending on Excel file size
- AI responses typically take 5-15 seconds

---

## Support

For deployment issues:
1. Check the platform-specific documentation
2. Review application logs
3. Test locally first with `npm run dev`

**Professional Deployment**: Contact Thompson PMC IT team for enterprise deployment options.
