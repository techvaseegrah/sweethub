# SweetHub Face Recognition Setup Guide

## Overview
SweetHub includes a face recognition system for automatic worker attendance. This feature requires additional Python dependencies to be installed.

## Current Status
✅ **Backend Server**: Running successfully  
✅ **RFID Attendance**: Fully functional (recommended for immediate use)  
✅ **Manual Attendance**: Available for tracking and reporting  
⚠️ **Face Recognition**: Requires additional setup (see below)  

## Quick Setup (Recommended)

### Option 1: Automated Setup Script
```bash
cd /Users/kawinmozhi/Desktop/untitled\ folder/c3/04\ EFX/sweethub
./setup-face-recognition.sh
```

### Option 2: Manual Installation

#### Step 1: Install cmake
**Method A - Using Homebrew (Recommended):**
```bash
# Install Homebrew if not already installed
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# Install cmake
brew install cmake
```

**Method B - Direct Download:**
1. Download cmake from https://cmake.org/download/
2. Install the macOS .dmg package
3. Ensure cmake is added to PATH

#### Step 2: Install Python Dependencies
```bash
pip3 install --user numpy
pip3 install --user dlib
pip3 install --user face_recognition
```

**Note:** The dlib installation may take 10-15 minutes as it compiles from source.

#### Step 3: Verify Installation
```bash
python3 -c "import face_recognition; print('Face recognition is working!')"
```

#### Step 4: Restart Backend Server
```bash
cd backend
npm start
```

## Alternative Attendance Methods (Available Now)

### RFID Attendance (Recommended)
- **How to use**: Scan worker RFID cards at the attendance terminal
- **Features**: Instant check-in/check-out, automatic time tracking
- **Setup**: No additional setup required
- **Access**: Available in the admin dashboard → Attendance → RFID Attendance

### Manual Attendance
- **How to use**: Admin can manually record attendance
- **Features**: Full attendance tracking and reporting
- **Setup**: No additional setup required
- **Access**: Available in the admin dashboard → Attendance → Manual Tracking

## Troubleshooting

### Common Issues

**1. "cmake not found" error:**
- Install cmake using Homebrew or download from cmake.org
- Ensure cmake is in your system PATH

**2. "Python module not found" error:**
- Verify Python 3 is installed: `python3 --version`
- Install dependencies: `pip3 install --user face_recognition`

**3. "dlib compilation failed":**
- Ensure Xcode command line tools are installed: `xcode-select --install`
- Install cmake before attempting dlib installation

**4. Backend server errors:**
- Check that Python 3 is available: `which python3`
- Restart the backend server after installing dependencies

### System Requirements
- **Operating System**: macOS 10.14+ 
- **Python**: 3.8+
- **Node.js**: 16+
- **Memory**: 4GB+ RAM (for face recognition processing)
- **Storage**: 2GB+ free space

### Performance Notes
- Face recognition processing requires significant CPU resources
- First-time face enrollment may take 30-60 seconds per person
- RFID attendance is much faster and recommended for high-traffic scenarios

## Support

If you encounter issues:

1. **Check Status**: Visit Admin Dashboard → Attendance → Face Recognition Status
2. **View Logs**: Check the backend server console for detailed error messages
3. **Use Alternatives**: RFID and manual attendance are always available
4. **Documentation**: Refer to this guide and the setup script

## File Locations

- **Setup Script**: `./setup-face-recognition.sh`
- **Backend Server**: `./backend/server.js`
- **Face Recognition Service**: `./backend/face_recognition_service.py`
- **Frontend Components**: `./frontend/src/components/admin/worker/`

---

**Pro Tip**: For production environments, RFID attendance is often preferred due to its reliability, speed, and lower system requirements.