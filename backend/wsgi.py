"""
WSGI configuration for PythonAnywhere deployment
This file is used by PythonAnywhere to serve your FastAPI application
"""

import sys
import os

# Add your project directory to the sys.path
project_home = '/home/YOUR_USERNAME/UmaRacingWeb/backend'
if project_home not in sys.path:
    sys.path.insert(0, project_home)

# Set environment variables (update these in PythonAnywhere web app settings)
os.environ.setdefault('DATABASE_URL', 'sqlite:///./uma_racing.db')
os.environ.setdefault('ENVIRONMENT', 'production')

# Import your FastAPI app
from main import app

# PythonAnywhere uses this 'application' variable
application = app
