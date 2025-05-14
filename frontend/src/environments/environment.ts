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
// const VERCEL_API = 'https://user-management-eight-kappa.vercel.app/accounts';
const DEFAULT_REMOTE_API = RENDER_API; // Default for other hosting platforms

// This will automatically choose the correct API endpoint based on where the frontend is running
export const environment = {
    production: false,
    // Use fake backend instead of real API
    useFakeBackend: true,
    // Only use real API URL when not using fake backend
    apiUrl: 'http://localhost:4000', // This URL won't be used when fake backend is enabled
    wsUrl: isLocalhost ? 'ws://localhost:4000' : 'wss://user-management-full-stack-application.onrender.com',
    // For debugging - shows which environment was detected
    detectedEnvironment: isLocalhost 
        ? 'Local' 
        : isRender 
            ? 'Render' 
            : isVercel 
                ? 'Vercel' 
                : 'Other'
};

