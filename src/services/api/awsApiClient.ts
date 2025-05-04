
import axios, { AxiosInstance } from 'axios';
import { toast } from "sonner";

// Extend AxiosInstance with our custom method
interface CustomAxiosInstance extends AxiosInstance {
  isServerReachable: () => Promise<boolean>;
}

// AWS backend URL - Adicionando configuração para failover
const AWS_BACKEND_URLS = [
  'http://gamepathai-dev-lb-1728469102.us-east-1.elb.amazonaws.com',
  'http://gamepathai-dev-backup.us-east-1.elb.amazonaws.com', // URL de backup
];

const isDev = process.env.NODE_ENV === 'development';

// Create axios instance with appropriate configuration
const axiosInstance = axios.create({
  baseURL: isDev ? '/api' : `${AWS_BACKEND_URLS[0]}/api`,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
    'X-Client-Source': 'gamepathai-client',
    'X-No-Redirect': '1'
  }
}) as CustomAxiosInstance;

// Request interceptor for auth tokens
axiosInstance.interceptors.request.use(
  async (config) => {
    const token = localStorage.getItem('auth_token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor with error handling and fallback support
axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    // Handle network errors with AWS fallback
    if (!error.response) {
      console.error('Network error:', error);
      
      // Try fallback AWS endpoint if the primary one fails
      if (isDev && error.config && !error.config.__isRetry) {
        console.log('Attempting to use backup AWS endpoint');
        const originalRequest = error.config;
        originalRequest.__isRetry = true;
        originalRequest.baseURL = `${AWS_BACKEND_URLS[1]}/api`;
        
        try {
          return await axiosInstance(originalRequest);
        } catch (fallbackError) {
          console.error('Fallback request also failed:', fallbackError);
        }
      }
      
      // Only show error toast if not a ping/health check
      if (!error.config?.url?.includes('/health') && 
          !error.config?.url?.includes('/ping')) {
        toast.error("AWS Backend Unreachable", {
          description: "Could not connect to AWS services. Check your connection."
        });
      }
      
      return Promise.reject({
        message: 'AWS connectivity error - please check your connection',
        original: error,
        isNetworkError: true
      });
    }
    
    // Handle authentication errors
    if (error.response?.status === 401) {
      console.error('Authentication error:', error);
      
      toast.error("AWS Authentication error", {
        description: "Your AWS session has expired. Please log in again."
      });
    }
    
    // Handle server errors
    if (error.response?.status >= 500) {
      console.error('AWS Server error:', error);
      
      toast.error("AWS Server error", {
        description: "The AWS server encountered an error. Please try again later."
      });
    }
    
    return Promise.reject({
      status: error.response?.status,
      message: error.response?.data?.message || error.message,
      original: error,
      isHtmlResponse: error.response?.headers?.['content-type']?.includes('text/html')
    });
  }
);

// Improved utility function to check if server is reachable with retries
axiosInstance.isServerReachable = async (): Promise<boolean> => {
  // Try all endpoints
  for (const backendUrl of AWS_BACKEND_URLS) {
    try {
      await axios.head(`${backendUrl}/api/health`, { 
        timeout: 3000,
        headers: { 'X-No-Redirect': '1' }
      });
      console.log(`Successfully connected to AWS endpoint: ${backendUrl}`);
      return true;
    } catch (error) {
      console.log(`AWS endpoint not reachable: ${backendUrl}`, error);
      // Continue to the next endpoint
    }
  }
  return false;
};

const awsApiClient = axiosInstance;
export default awsApiClient;
