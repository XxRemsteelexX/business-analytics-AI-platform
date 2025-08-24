#!/bin/bash

echo "Thompson PMC Analytics - Vercel Deployment"
echo "=========================================="

# Check if Vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo "Installing Vercel CLI..."
    npm install -g vercel
fi

echo "Please login to Vercel (browser will open)..."
vercel login

echo "Building and deploying to production..."
vercel --prod

echo ""
echo "Deployment complete!"
echo ""
echo "Next steps:"
echo "1. Go to your Vercel dashboard"
echo "2. Add environment variables:"
echo "   - NEXTAUTH_SECRET: T4ylXwBKslWZHAzFTKXOyd8tdFqDEFuo"
echo "   - USE_BAMBOO_LLM: true"
echo "3. Your app should be live and accessible!"
echo ""
echo "Thompson PMC Analytics is ready for business!"
