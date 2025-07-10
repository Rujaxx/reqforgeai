import { useState } from 'react';
import '../styles/Home.css';
import ProjectModal from '../components/ProjectModal';
import { useGetProjectsQuery, useAddProjectMutation } from '../api/projectApi';
import { useNavigate } from 'react-router-dom';

function Home() {
  const [showProjectModal, setShowProjectModal] = useState(false);
  const [project, setProject] = useState(null);
  const { data: projects = [], isLoading, isError, refetch } = useGetProjectsQuery();
  const [addProject, { isLoading: isAdding }] = useAddProjectMutation();
  const [error, setError] = useState('');
  const navigate = useNavigate();

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
      setError(err.message || 'Failed to create project');
    }
  };

  return (
    <div className="landing-section">
      <ProjectModal
        show={showProjectModal}
        onClose={() => setShowProjectModal(false)}
        onCreate={handleCreateProject}
      />
      <h1 className="home-title">Requirement Analysis Generator</h1>
      <p className="home-desc">
        Create a new project to start analyzing your UI screenshots and generate structured requirements documentation with the help of AI.
      </p>
      <button
        className="create-project-btn"
        onClick={handleOpenProjectModal}
        disabled={isAdding}
      >
        {isAdding ? 'Creating...' : 'Create Project'}
      </button>
      <div className="project-list">
        <h2 className="project-list-title">Your Projects</h2>
        {isLoading ? (
          <div className="no-projects">Loading...</div>
        ) : isError ? (
          <div className="no-projects">Failed to load projects.</div>
        ) : projects.length === 0 ? (
          <div className="no-projects">No projects yet. Create your first project above.</div>
        ) : (
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
        {error && <div className="no-projects" style={{ color: 'red' }}>{error}</div>}
      </div>
    </div>
  );
}

export default Home;
