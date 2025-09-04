import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

// Enhanced base query with timeout and retry logic for cold starts
const baseQueryWithRetry = fetchBaseQuery({
  baseUrl: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/',
  timeout: 70000, // 70 seconds to handle cold starts
  prepareHeaders: (headers) => {
    headers.set('Content-Type', 'application/json');
    return headers;
  },
});

// Wrapper to handle retries and provide better error messages
const baseQueryWithColdStartHandling = async (args, api, extraOptions) => {
  const maxRetries = 2;
  let attempt = 0;
  
  while (attempt <= maxRetries) {
    try {
      const result = await baseQueryWithRetry(args, api, extraOptions);
      
      // If successful, return result
      if (!result.error) {
        return result;
      }
      
      // Handle specific error cases
      if (result.error.status === 'TIMEOUT_ERROR' || 
          result.error.status === 'FETCH_ERROR' ||
          (result.error.status >= 500 && result.error.status < 600)) {
        
        if (attempt < maxRetries) {
          attempt++;
          console.log(`API call failed (attempt ${attempt}/${maxRetries + 1}). Retrying in ${attempt * 2} seconds...`);
          await new Promise(resolve => setTimeout(resolve, attempt * 2000));
          continue;
        }
      }
      
      return result;
    } catch (error) {
      if (attempt < maxRetries) {
        attempt++;
        console.log(`API call failed (attempt ${attempt}/${maxRetries + 1}). Retrying...`);
        await new Promise(resolve => setTimeout(resolve, attempt * 2000));
        continue;
      }
      
      return {
        error: {
          status: 'FETCH_ERROR',
          error: 'Network request failed after retries. Backend might be cold starting.',
        }
      };
    }
  }
};

export const projectApi = createApi({
  reducerPath: 'projectApi',
  baseQuery: baseQueryWithColdStartHandling,
  tagTypes: ['Project', 'Screen'],
  endpoints: (builder) => ({
    // Health check endpoint to warm up the server
    healthCheck: builder.query({
      query: () => 'health',
      keepUnusedDataFor: 0, // Don't cache health checks
    }),
    
    getProjects: builder.query({
      query: () => 'projects',
      providesTags: ['Project'],
      // Add polling to keep connection warm (optional)
      // pollingInterval: 300000, // 5 minutes
    }),
    
    getProject: builder.query({
      query: (id) => `projects/${id}`,
      providesTags: (result, error, id) => [{ type: 'Project', id }],
    }),
    
    addProject: builder.mutation({
      query: ({ name, description }) => ({
        url: 'projects',
        method: 'POST',
        body: { name, description },
      }),
      invalidatesTags: ['Project'],
    }),
    
    addScreen: builder.mutation({
      query: ({ screenshot, projectId, screenDescription }) => {
        const formData = new FormData();
        formData.append('screenshot', screenshot);
        formData.append('projectId', projectId);
        if (screenDescription) {
          formData.append('screenDescription', screenDescription);
        }
        
        return {
          url: 'upload',
          method: 'POST',
          body: formData,
          // Don't set Content-Type header for FormData
          formData: true,
        };
      },
      invalidatesTags: (result, error, { projectId }) => [
        { type: 'Project', id: projectId },
        'Screen'
      ],
    }),
    
    deleteScreen: builder.mutation({
      query: (id) => ({
        url: `projects/screen/${id}`,
        method: 'DELETE'
      }),
      invalidatesTags: ['Project', 'Screen'],
    }),
  }),
});

export const {
  useHealthCheckQuery,
  useGetProjectsQuery,
  useGetProjectQuery,
  useAddProjectMutation,
  useAddScreenMutation,
  useDeleteScreenMutation,
} = projectApi;

// Helper hook for warming up the backend
export const useWarmupBackend = () => {
  const [healthCheck] = projectApi.useLazyHealthCheckQuery();
  
  const warmup = async () => {
    console.log('Warming up backend...');
    try {
      await healthCheck().unwrap();
      console.log('Backend is warmed up');
    } catch (error) {
      console.log('Warmup failed, but backend should be starting');
    }
  };
  
  return warmup;
};