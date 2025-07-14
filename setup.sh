#!/bin/bash

# HelperHive Setup Script
# This script automates the initial setup of the HelperHive platform

echo "🏠 HelperHive Platform Setup"
echo "=========================="
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js v16 or higher."
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node -v | cut -c 2-)
REQUIRED_VERSION="16.0.0"

if [ "$(printf '%s\n' "$REQUIRED_VERSION" "$NODE_VERSION" | sort -V | head -n1)" != "$REQUIRED_VERSION" ]; then
    echo "❌ Node.js version $NODE_VERSION is too old. Please install Node.js v16 or higher."
    exit 1
fi

echo "✅ Node.js version $NODE_VERSION detected"

# Check if MongoDB is accessible
echo ""
echo "🔍 Checking MongoDB connection..."
if ! command -v mongosh &> /dev/null && ! command -v mongo &> /dev/null; then
    echo "⚠️  MongoDB client not found. Make sure MongoDB is installed or use MongoDB Atlas."
    echo "   You can continue with MongoDB Atlas by configuring MONGODB_URI in .env"
else
    echo "✅ MongoDB client found"
fi

# Install backend dependencies
echo ""
echo "📦 Installing backend dependencies..."
npm install

if [ $? -ne 0 ]; then
    echo "❌ Failed to install backend dependencies"
    exit 1
fi

echo "✅ Backend dependencies installed"

# Install frontend dependencies
echo ""
echo "📦 Installing frontend dependencies..."
cd client && npm install

if [ $? -ne 0 ]; then
    echo "❌ Failed to install frontend dependencies"
    cd ..
    exit 1
fi

cd ..
echo "✅ Frontend dependencies installed"

# Copy environment file
echo ""
echo "⚙️  Setting up environment variables..."
if [ ! -f .env ]; then
    cp .env.example .env
    echo "✅ Created .env file from template"
    echo "📝 Please edit .env file with your configuration:"
    echo "   - Database connection (MONGODB_URI)"
    echo "   - JWT secret (JWT_SECRET)"
    echo "   - Stripe keys (STRIPE_SECRET_KEY, STRIPE_PUBLISHABLE_KEY)"
    echo ""
else
    echo "✅ .env file already exists"
fi

# Create uploads directory
echo "📁 Creating uploads directory..."
mkdir -p uploads
echo "✅ Uploads directory created"

# Seed database
echo ""
echo "🌱 Seeding database with services..."
read -p "Do you want to seed the database with South African services? (y/N): " seed_db

if [[ $seed_db =~ ^[Yy]$ ]]; then
    node server/seeders/services.js
    if [ $? -eq 0 ]; then
        echo "✅ Database seeded successfully"
    else
        echo "⚠️  Database seeding failed. You may need to configure MongoDB connection first."
    fi
else
    echo "⏭️  Skipping database seeding"
fi

# Check if all required packages are installed
echo ""
echo "🔍 Verifying installation..."

# Check backend packages
if [ -d "node_modules" ]; then
    echo "✅ Backend packages installed"
else
    echo "❌ Backend packages missing"
fi

# Check frontend packages
if [ -d "client/node_modules" ]; then
    echo "✅ Frontend packages installed"
else
    echo "❌ Frontend packages missing"
fi

# Setup completion
echo ""
echo "🎉 HelperHive setup completed!"
echo ""
echo "📋 Next Steps:"
echo "1. Edit .env file with your configuration"
echo "2. Start the development servers:"
echo "   npm run dev     # Start both frontend and backend"
echo "   # OR"
echo "   npm run server  # Backend only (port 5000)"
echo "   npm run client  # Frontend only (port 3000)"
echo ""
echo "3. Access the application:"
echo "   Frontend: http://localhost:3000"
echo "   Backend:  http://localhost:5000"
echo ""
echo "📚 Documentation:"
echo "   README.md       # Complete setup and usage guide"
echo "   DELIVERABLES.md # Feature overview and deliverables"
echo ""
echo "🆘 Support: support@helperhive.com"
echo ""
echo "🇿🇦 Ready to serve South Africa's home service market!"

# Make the script executable
chmod +x setup.sh