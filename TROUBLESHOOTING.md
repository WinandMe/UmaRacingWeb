# Uma Racing Web - Troubleshooting Guide

## Installation Issues

### Error: "pydantic-core" requires Rust compilation

**Problem:** 
```
error: metadata-generation-failed
× Encountered error while generating package metadata.
╰─> pydantic-core
```

This occurs when installing Pydantic v2 on Windows without build tools, especially on Python 3.14+.

**Solutions (try in order):**

#### Solution 1: Install Pre-built Wheels (Recommended)
```bash
cd backend
pip install --upgrade pip
pip install --only-binary :all: fastapi uvicorn pydantic python-multipart
```

#### Solution 2: Install Microsoft C++ Build Tools
1. Download: https://visualstudio.microsoft.com/visual-cpp-build-tools/
2. Run installer
3. Select "Desktop development with C++"
4. Install (requires ~7GB)
5. Restart your computer
6. Run `first_init.bat` again

#### Solution 3: Use Python 3.11 or 3.12
Python 3.14 may have compatibility issues:
1. Download Python 3.11: https://www.python.org/downloads/release/python-3118/
2. Install with "Add to PATH" checked
3. Uninstall current packages: `pip uninstall -y fastapi uvicorn pydantic`
4. Run `first_init.bat` again

#### Solution 4: Manual Installation
```bash
cd backend
pip install --upgrade pip setuptools wheel
pip install fastapi==0.104.1
pip install "uvicorn[standard]==0.24.0"
pip install pydantic==2.5.0
pip install python-multipart aiofiles websockets python-dotenv
```

#### Solution 5: Use Virtual Environment
```bash
# Create virtual environment
python -m venv venv

# Activate (Windows)
venv\Scripts\activate

# Install dependencies
cd backend
pip install -r requirements.txt
```

### Error: Node.js not found

**Problem:** `node --version` fails

**Solution:**
1. Download Node.js 14+: https://nodejs.org/
2. Install with default settings
3. Restart Command Prompt
4. Run `first_init.bat` again

### Error: `npm install` fails

**Problem:** Network issues or corrupted cache

**Solution:**
```bash
cd frontend
npm cache clean --force
npm install --legacy-peer-deps
```

### Frontend won't start

**Problem:** Port 3000 already in use

**Solution:**
```bash
# Find process using port 3000
netstat -ano | findstr :3000

# Kill the process (replace PID with actual number)
taskkill /PID [PID] /F

# Or use different port
set PORT=3001 && npm start
```

### Backend won't start

**Problem:** Port 5000 already in use

**Solution:**
Edit `backend/main.py` line 382:
```python
uvicorn.run(app, host="0.0.0.0", port=5001)  # Change to 5001
```

Then update frontend API URLs to `http://localhost:5001`

## Common Questions

### Q: Do I need administrator privileges?
A: No, but you'll need them to install Microsoft C++ Build Tools if required.

### Q: Can I use Python 3.13 or 3.14?
A: Yes, but you may need Microsoft C++ Build Tools. Python 3.11-3.12 is more stable.

### Q: What if `start.bat` doesn't open a new window?
A: Run manually:
```bash
# Terminal 1
cd backend
python main.py

# Terminal 2 (new window)
cd frontend
npm start
```

### Q: Verification screen shows "Code verification failed"
A: This is intentional if authentication signatures are missing. See README.md "Code Protection" section.

## Still Having Issues?

1. Check Python version: `python --version` (should be 3.8+)
2. Check Node.js version: `node --version` (should be 14+)
3. Check pip version: `pip --version`
4. Try installing packages individually
5. Check antivirus isn't blocking installations
6. Try running Command Prompt as Administrator

## Contact

If none of these solutions work, please:
- Check the GitHub Issues: https://github.com/WinandMe/UmaRacingWeb/issues
- Provide error message and Python version
- Mention your OS and installation method
