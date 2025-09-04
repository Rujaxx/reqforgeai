import { useState, useEffect } from 'react';
import '../styles/Home.css';
import ProjectModal from '../components/ProjectModal';
import { useGetProjectsQuery, useAddProjectMutation, useWarmupBackend } from '../api/projectApi';
import { useNavigate } from 'react-router-dom';

// Cold Start Loading Component
const ColdStartLoader = ({ progress, onRetry }) => (
  <div className="cold-start-loader">
    <div className="spinner"></div>
    <h3>Backend Starting Up...</h3>
    <p>Our server is hosted on Render's free tier and needs a moment to wake up. This usually takes 30-60 seconds.</p>
    {progress > 0 && (
      <div className="progress-container">
        <div className="progress-bar">
          <div 
            className="progress-fill"
            style={{ width: `${Math.min(progress, 100)}%` }}
          ></div>
        </div>
        <span className="progress-text">{Math.min(progress, 100)}%</span>
      </div>
    )}
    <button className="retry-btn" onClick={onRetry}>
      Skip Wait & Try Now
    </button>
  </div>
);

// Error Component with Retry
const ErrorDisplay = ({ error, onRetry, isRetrying }) => {
  const isNetworkError = error?.status === 'FETCH_ERROR' || 
                         error?.status === 'TIMEOUT_ERROR' || 
                         error?.originalStatus >= 500;

  return (
    <div className="error-display">
      <div className="error-icon">⚠️</div>
      <h3>{isNetworkError ? 'Connection Problem' : 'Something went wrong'}</h3>
      <p>
        {isNetworkError 
          ? 'Unable to connect to the server. It might be starting up or experiencing issues.'
          : 'There was an error loading your projects. Please try again.'
        }
      </p>
      <button 
        className="retry-btn"
        onClick={onRetry}
        disabled={isRetrying}
      >
        {isRetrying ? 'Retrying...' : 'Try Again'}
      </button>
    </div>
  );
};

function Home() {
  const [showProjectModal, setShowProjectModal] = useState(false);
  const [project, setProject] = useState(null);
  const [error, setError] = useState('');
  const [coldStartDetected, setColdStartDetected] = useState(false);
  const [warmupProgress, setWarmupProgress] = useState(0);
  const [isRetrying, setIsRetrying] = useState(false);
  
  const navigate = useNavigate();
  const warmupBackend = useWarmupBackend();
  
  const { 
    data: projects = [], 
    isLoading, 
    isError, 
    error: queryError,
    refetch 
  } = useGetProjectsQuery(undefined, {
    skip: coldStartDetected, // Skip query during warmup
  });
  
  const [addProject, { isLoading: isAdding }] = useAddProjectMutation();

  // Cold start detection and handling
  useEffect(() => {
    if (!isLoading || coldStartDetected) return;

    const coldStartTimer = setTimeout(() => {
      console.log('Cold start detected - warming up backend...');
      setColdStartDetected(true);
      
      // Start progress animation
      let progress = 0;
      const progressInterval = setInterval(() => {
        progress += 2; // Increment by 2% every second
        setWarmupProgress(progress);
        
        if (progress >= 100) {
          clearInterval(progressInterval);
        }
      }, 1000);

      // Attempt to warm up the backend
      warmupBackend()
        .then(() => {
          console.log('Backend warmed up successfully');
          clearInterval(progressInterval);
          setColdStartDetected(false);
          setWarmupProgress(0);
          refetch();
        })
        .catch((err) => {
          console.log('Warmup failed, but will retry with main query');
          clearInterval(progressInterval);
          setColdStartDetected(false);
          setWarmupProgress(0);
          refetch();
        });

      return () => {
        clearTimeout(coldStartTimer);
        clearInterval(progressInterval);
      };
    }, 5000); // Consider cold start after 5 seconds

    return () => clearTimeout(coldStartTimer);
  }, [isLoading, coldStartDetected, warmupBackend, refetch]);

  // Proactive warmup on component mount
  useEffect(() => {
    // Warm up backend when component mounts (optional)
    warmupBackend().catch(() => {
      // Ignore warmup failures, main query will handle it
    });
  }, [warmupBackend]);

  // Handler to open modal
  const handleOpenProjectModal = () => setShowProjectModal(true);

  // Handler to select/open a project from the list
  const handleSelectProject = (proj) => {
    setProject(proj);
    navigate(`/project/${proj._id}`);
  };

  // Handler for project creation
  const handleCreateProject = async (projectData) => {
    try {
      await addProject(projectData).unwrap();
      setShowProjectModal(false);
      setError('');
      refetch();
    } catch (err) {
      const errorMessage = err?.data?.message || err?.message || 'Failed to create project';
      setError(errorMessage);
      
      // If it's a network error, suggest trying again
      if (err?.status === 'FETCH_ERROR' || err?.status === 'TIMEOUT_ERROR') {
        setError('Network error. The server might be starting up. Please try again in a moment.');
      }
    }
  };

  // Manual retry handler
  const handleRetry = async () => {
    setIsRetrying(true);
    setColdStartDetected(false);
    setWarmupProgress(0);
    
    try {
      await refetch();
    } catch (err) {
      console.log('Retry failed:', err);
    } finally {
      setIsRetrying(false);
    }
  };

  return (
    <div className="landing-section">
      <ProjectModal
        show={showProjectModal}
        onClose={() => {
          setShowProjectModal(false);
          setError(''); // Clear errors when closing modal
        }}
        onCreate={handleCreateProject}
      />
      
      <h1 className="home-title">Requirement Analysis Generator</h1>
      <p className="home-desc">
        Create a new project to start analyzing your UI screenshots and generate structured requirements documentation with the help of AI.
      </p>
      
      <button
        className="create-project-btn"
        onClick={handleOpenProjectModal}
        disabled={isAdding || coldStartDetected}
      >
        {isAdding ? 'Creating...' : coldStartDetected ? 'Starting Up...' : 'Create Project'}
      </button>

      <div className="project-list">
        <h2 className="project-list-title">Your Projects</h2>
        
        {/* Cold start loading */}
        {coldStartDetected && (
          <ColdStartLoader 
            progress={warmupProgress}
            onRetry={handleRetry}
          />
        )}
        
        {/* Regular loading */}
        {!coldStartDetected && isLoading && (
          <div className="loading-spinner">
            <div className="spinner-small"></div>
            <span>Loading projects...</span>
          </div>
        )}
        
        {/* Error state */}
        {!coldStartDetected && !isLoading && isError && (
          <ErrorDisplay 
            error={queryError}
            onRetry={handleRetry}
            isRetrying={isRetrying}
          />
        )}
        
        {/* Empty state */}
        {!coldStartDetected && !isLoading && !isError && projects.length === 0 && (
          <div className="no-projects">
            No projects yet. Create your first project above.
          </div>
        )}
        
        {/* Projects list */}
        {!coldStartDetected && !isLoading && !isError && projects.length > 0 && (
          <ul className="project-list-ul">
            {projects.map((proj, idx) => (
              <li
                key={proj._id || idx}
                className="project-list-item"
                onClick={() => handleSelectProject(proj)}
              >
                <div>
                  <div className="project-name">{proj.name}</div>
                  <div className="project-desc">{proj.description}</div>
                </div>
                <span className="project-open">Open</span>
              </li>
            ))}
          </ul>
        )}
        
        {/* Error message for project creation */}
        {error && (
          <div className="error-message">
            {error}
            <button 
              onClick={() => setError('')}
              className="error-dismiss"
            >
              ✕
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default Home;