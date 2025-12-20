#!/bin/bash

# Face Recognition Setup Script for SweetHub
# This script installs the required dependencies for face recognition functionality

echo "🔧 SweetHub Face Recognition Setup"
echo "=================================="
echo "This script will install the required dependencies for face recognition."
echo "The installation may take 10-15 minutes due to compilation requirements."
echo ""

# Check if running on macOS
if [[ "$OSTYPE" != "darwin"* ]]; then
    echo "❌ This script is designed for macOS. Please install dependencies manually."
    exit 1
fi

# Check if Python 3 is available
if ! command -v python3 &> /dev/null; then
    echo "❌ Python 3 is not installed. Please install Python 3 first."
    echo "   Download from: https://www.python.org/downloads/"
    exit 1
fi

echo "✅ Python 3 found: $(python3 --version)"

# Check if Homebrew is available
if ! command -v brew &> /dev/null; then
    echo "📦 Installing Homebrew..."
    /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
    
    # Add Homebrew to PATH for this session
    echo 'eval "$(/opt/homebrew/bin/brew shellenv)"' >> ~/.zprofile
    eval "$(/opt/homebrew/bin/brew shellenv)"
fi

echo "✅ Homebrew available"

# Install cmake using Homebrew
echo "📦 Installing cmake..."
brew install cmake

# Verify cmake installation
if ! command -v cmake &> /dev/null; then
    echo "❌ cmake installation failed. Please install manually from https://cmake.org/"
    exit 1
fi

echo "✅ cmake installed: $(cmake --version | head -n1)"

# Install Python dependencies
echo "📦 Installing Python dependencies..."
echo "   This may take several minutes as dlib needs to compile..."

pip3 install --user numpy
pip3 install --user dlib
pip3 install --user face_recognition

# Test the installation
echo "🧪 Testing face recognition installation..."
if python3 -c "import face_recognition; print('✅ Face recognition is working!')" 2>/dev/null; then
    echo ""
    echo "🎉 Setup completed successfully!"
    echo ""
    echo "📋 Next Steps:"
    echo "1. Restart the SweetHub backend server"
    echo "2. The face recognition service should now be available"
    echo "3. You can enroll worker faces and use face attendance"
    echo ""
    echo "🔧 To restart the backend:"
    echo "   cd backend"
    echo "   npm start"
else
    echo ""
    echo "❌ Setup completed but face recognition test failed."
    echo "   Please check the installation manually or contact support."
    echo ""
    echo "🔍 Manual test command:"
    echo "   python3 -c \"import face_recognition\""
fi

echo ""
echo "📖 For troubleshooting, see the setup documentation in the project."