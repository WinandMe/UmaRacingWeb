// API Configuration
// This file is used by all frontend HTML files to determine the API base URL

function getApiBaseUrl() {
    // Check if we're in development or production
    const hostname = window.location.hostname;
    const protocol = window.location.protocol;
    
    // For localhost, use port 5000
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
        return `${protocol}//localhost:5000/api`;
    }
    
    // For deployed sites, use the same origin as the frontend
    // This assumes backend is at same domain (e.g., api.yourdomain.com)
    // Or use environment variable if available
    const envApiUrl = window.API_BASE_URL;
    if (envApiUrl) {
        return envApiUrl;
    }
    
    // Default: same origin + /api
    return `${protocol}//${hostname}/api`;
}

// Export for use in HTML files
const API_BASE = getApiBaseUrl();
