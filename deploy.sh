#!/bin/bash
# Auto-deploy script for Render

echo "🚀 Deploying FaceShot-ChopShop to Render..."
echo ""

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: Not in project root directory"
    exit 1
fi

# Check git status
echo "📋 Checking git status..."
git status

# Push to GitHub (this will trigger Render auto-deploy)
echo ""
echo "📤 Pushing to GitHub..."
git push origin main

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Successfully pushed to GitHub!"
    echo ""
    echo "🔄 Render will automatically detect the changes and deploy."
    echo ""
    echo "📊 Monitor deployment at:"
    echo "   https://dashboard.render.com/web/srv-d5c59b6r433s739d276g/deploys"
    echo ""
    echo "⏰ Deployment usually takes 5-10 minutes."
    echo ""
    echo "🧪 After deployment, test with:"
    echo "   curl https://faceshot-chopshop-1.onrender.com/health"
    echo ""
    echo "🌐 Then visit:"
    echo "   https://faceshot-chopshop-1.onrender.com"
else
    echo ""
    echo "❌ Git push failed. You may need to authenticate."
    echo ""
    echo "Run this command manually:"
    echo "   git push origin main"
    echo ""
    echo "Or configure GitHub access with:"
    echo "   gh auth login"
fi
