// Dynamic environment configuration based on hostname
const hostname = window.location.hostname;
const isLocalhost = hostname === 'localhost' || hostname === '127.0.0.1';
const isVercel = hostname.includes('vercel.app');
const isRender = hostname.includes('render.com');
const isNetlify = hostname.includes('netlify.app');

// Define the backend endpoints
const LOCAL_API = 'http://localhost:4000';
const RENDER_API = 'https://user-management-full-stack-application.onrender.com';
// Never use Vercel as API endpoint - the backend is only on Render
// const VERCEL_API = 'https://user-management-eight-kappa.vercel.app';
const DEFAULT_REMOTE_API = RENDER_API; // Default for other hosting platforms

// This will automatically choose the correct API endpoint based on where the frontend is running
export const environment = {
    production: true,
    // Always use Render API as requested
    apiUrl: RENDER_API,
    wsUrl: 'wss://user-management-full-stack-application.onrender.com',
    // Domain for cookies - important for cross-domain cookie handling
    cookieDomain: isLocalhost 
        ? undefined 
        : isVercel 
            ? '.vercel.app'
            : isRender
                ? '.render.com'
                : null,
    // For debugging - shows which environment was detected
    detectedEnvironment: isLocalhost 
        ? 'Local' 
        : isRender 
            ? 'Render' 
            : isVercel 
                ? 'Vercel' 
                : 'Other'
};
