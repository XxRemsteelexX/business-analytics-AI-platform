#!/bin/bash

echo "Thompson PMC Analytics - Railway Deployment"
echo "========================================="

# Install Railway CLI
echo "Installing Railway CLI..."
npm install -g @railway/cli

# Login to Railway
echo "Please login to Railway..."
railway login

# Deploy
echo "Deploying to Railway..."
railway up

echo ""
echo "Deployment complete!"
echo ""
echo "Next steps:"
echo "1. Go to your Railway dashboard"
echo "2. Add environment variables:"
echo "   - NEXTAUTH_SECRET: T4ylXwBKslWZHAzFTKXOyd8tdFqDEFuo"
echo "   - GROQ_API_KEY: your_groq_api_key"
echo "   - NODE_ENV: production"
echo "3. Your app will be live at: https://your-app.up.railway.app"
echo ""
echo "Thompson PMC Analytics is ready!"
