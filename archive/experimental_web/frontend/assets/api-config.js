(function(){
  // Determine API base URL
  var inferredLocal = (location.hostname === 'localhost' || location.hostname === '127.0.0.1');
  var fallback = inferredLocal ? 'http://localhost:5000/api' : (localStorage.getItem('api_base') || 'http://localhost:5000/api');
  // Allow global override via window.__API_BASE__ or localStorage('api_base')
  window.API_BASE = window.__API_BASE__ || localStorage.getItem('api_base') || fallback;
  // Helper to set API base at runtime
  window.setApiBase = function(url){
    localStorage.setItem('api_base', url);
    window.API_BASE = url;
    console.log('API_BASE set to', url);
  };
})();
