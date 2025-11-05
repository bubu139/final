Write-Host "🚀 Setting up Firebase..." -ForegroundColor Green

# Check if Node.js is installed
try {
    $nodeVersion = node --version
    Write-Host "✅ Node.js version: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Node.js is not installed. Please install Node.js first." -ForegroundColor Red
    exit 1
}

# Install Firebase CLI
Write-Host "📦 Installing Firebase CLI..." -ForegroundColor Yellow
npm install -g firebase-tools

# Verify installation
try {
    $firebaseVersion = firebase --version
    Write-Host "✅ Firebase CLI version: $firebaseVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Firebase CLI installation failed." -ForegroundColor Red
    exit 1
}

Write-Host "🎉 Firebase setup completed! Run 'firebase login' to authenticate." -ForegroundColor Green