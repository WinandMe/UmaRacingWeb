"""WSGI configuration for PythonAnywhere deployment."""

import os
import sys
from asgiref.wsgi import ASGItoWSGI

# Add your project directory to the sys.path
project_home = '/home/YOUR_USERNAME/UmaRacingWeb/backend'
if project_home not in sys.path:
    sys.path.insert(0, project_home)

# Set environment variables (override in PythonAnywhere web app settings)
os.environ.setdefault('DATABASE_URL', 'sqlite:////home/YOUR_USERNAME/UmaRacingWeb/backend/uma_racing.db')
os.environ.setdefault('ENVIRONMENT', 'production')

# Import your FastAPI app (ASGI)
from main import app

# Wrap ASGI app for WSGI server
application = ASGItoWSGI(app)
