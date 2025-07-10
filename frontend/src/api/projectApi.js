// Project API abstraction for CRUD operations
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

export const projectApi = createApi({
  reducerPath: 'projectApi',
  baseQuery: fetchBaseQuery({ baseUrl: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/' }),
  endpoints: (builder) => ({
    getProjects: builder.query({
      query: () => 'projects',
    }),
    getProject: builder.query({
      query: (id) => `projects/${id}`,
    }),
    addProject: builder.mutation({
      query: ({ name, description }) => ({
        url: 'projects',
        method: 'POST',
        body: { name, description },
      }),
    }),
    addScreen: builder.mutation({
      query: ({ screenshot, projectId , screenDescription}) => {
        const formData = new FormData();
        formData.append('screenshot', screenshot); // File object
        formData.append('projectId', projectId);
        if(screenDescription) 
          formData.append('screenDescription', screenDescription);
        
        return {
          url: 'upload',
          method: 'POST',
          body: formData,
        };
      },
    }),
  }),
});

export const {
  useGetProjectsQuery,
  useGetProjectQuery,
  useAddProjectMutation,
  useAddScreenMutation
} = projectApi;
