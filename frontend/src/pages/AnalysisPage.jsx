import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useGetProjectQuery, useAddScreenMutation } from '../api/projectApi';
import { CopiableAnalysis } from '../components/CopiableAnalysis';
import ExportButton from '../components/ExportButton';

// Updated Progress Bar Component using your CSS
const ProgressBar = ({ progress, text, subtext }) => {
  progress = Math.min(Math.max(parseInt(progress), 0), 100); // Ensure progress is between 0 and 100
  return (
    <div >
      <div>
        <h3 >{text}</h3>
        {subtext && <p>{subtext}</p>}
      </div>
      <img
        src="/ImageScanning.gif"
        alt="Analysis Progress"
        className="progress-image"
      />
      {/* Using your custom CSS progress bar */}
      <div className="progressbar">
        <span
          className="progress"
          style={{ width: `${progress}%` }}
        ></span>
      </div>

      <div >
        <span>{progress}%</span>
      </div>
    </div>
  );
};

// AI Analysis Progress Modal
const AIAnalysisModal = ({ isVisible, progress, currentStep }) => {
  const steps = [
    { id: 1, text: "Uploading image...", subtext: "Preparing your screenshot", progress: 0 },
    { id: 2, text: "Processing image...", subtext: "Analyzing visual elements", progress: 25 },
    { id: 3, text: "AI analyzing UI components...", subtext: "Identifying buttons, forms, and navigation", progress: 50 },
    { id: 4, text: "Generating requirements...", subtext: "Creating detailed analysis", progress: 75 },
    { id: 5, text: "Finalizing analysis...", subtext: "Almost done!", progress: 100 }
  ];

  const currentStepData = steps.find(step => step.id === currentStep) || steps[0];
  if (!isVisible) return null;

  return (
    <div className="modal-overlay">
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <header className="modal-header">
          <h2 className="modal-title">AI Analysis Progress</h2>
        </header>
        <div className="modal-body">
          <ProgressBar
            progress={Math.max(currentStepData.progress, progress)}
            text={currentStepData.text}
            subtext={currentStepData.subtext}
          />
        </div>
      </div>
    </div>
  );
};

function AnalysisPage() {
  const { id } = useParams();
  const { data: project, isLoading, isError, refetch } = useGetProjectQuery(id);
  const [showUpload, setShowUpload] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [screenDescription, setScreenDescription] = useState("");
  const [uploadError, setUploadError] = useState('');
  const [addScreen, { isLoading: isUploading }] = useAddScreenMutation();

  // Progress bar states
  const [showProgress, setShowProgress] = useState(false);
  const [progressValue, setProgressValue] = useState(0);
  const [currentStep, setCurrentStep] = useState(1);

  // Cleanup file URLs on unmount
  useEffect(() => {
    return () => {
      if (selectedFile) {
        URL.revokeObjectURL(selectedFile);
      }
    };
  }, [selectedFile]);

  // Progress simulation effect (FIXED VERSION)
  useEffect(() => {
    if (isUploading && showProgress) {
      const interval = setInterval(() => {
        setProgressValue(prev => {
          if (prev < 20) {
            setCurrentStep(1);
            return prev + 3; // Faster start
          } else if (prev < 50) {
            setCurrentStep(2);
            return prev + 2;
          } else if (prev < 80) {
            setCurrentStep(3);
            return prev + 1; // Slow down
          } else if (prev < 90) {
            setCurrentStep(4);
            return prev + 0.3; // Very slow
          } else if (prev < 95) {
            setCurrentStep(5);
            return prev + 0.1; // Crawl until API done
          }
          return prev;
        });
      }, 300); // Adjust interval speed as needed
      return () => clearInterval(interval);
    }
  }, [isUploading, showProgress]);

  // Reset progress when upload completes (FIXED VERSION)
  useEffect(() => {
    if (!isUploading && showProgress) {
      // Complete the progress bar quickly
      setProgressValue(100);
      setCurrentStep(5);

      // Hide progress after a brief delay
      const timeout = setTimeout(() => {
        setShowProgress(false);
        setProgressValue(0);
        setCurrentStep(1);
      }, 500);

      // Clean up timeout if component unmounts
      return () => clearTimeout(timeout);
    }
  }, [isUploading, showProgress]);

  if (isLoading) return <div className="loading-state">Loading...</div>;
  if (isError || !project) return <div className="error-state">Failed to load project.</div>;

  const screens = project.screens || [];

  const validateFile = (file) => {
    const maxSize = 5 * 1024 * 1024; // 5MB
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];

    if (!file) return 'Please select an image file.';
    if (!allowedTypes.includes(file.type)) return 'Please select a valid image file (JPEG, PNG, or WebP).';
    if (file.size > maxSize) return 'File size must be less than 5MB.';
    return null;
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    const error = validateFile(file);

    if (error) {
      setUploadError(error);
      setSelectedFile(null);
      return;
    }

    setSelectedFile(file);
    setUploadError('');
  };

  const handleUpload = async () => {
    const fileError = validateFile(selectedFile);
    if (fileError) {
      setUploadError(fileError);
      return;
    }

    try {
      // Show progress modal and hide upload modal
      setShowUpload(false);
      setShowProgress(true);
      setProgressValue(0);
      setCurrentStep(1);

      await addScreen({
        screenshot: selectedFile,
        projectId: id,
        screenDescription: screenDescription.trim()
      }).unwrap();

      // Reset form state
      setSelectedFile(null);
      setScreenDescription("");
      setUploadError('');

      // Refetch data
      await refetch();
    } catch (err) {
      console.error('Upload failed:', err);
      setUploadError(err?.data?.message || err?.message || 'Upload failed. Please try again.');

      // Hide progress and show upload modal again on error
      setShowProgress(false);
      setShowUpload(true);
      setProgressValue(0);
      setCurrentStep(1);
    }
  };

  const handleCloseModal = () => {
    setShowUpload(false);
    setSelectedFile(null);
    setScreenDescription("");
    setUploadError('');
  };

  const parseAnalysis = (screen) => {
    try {
      return JSON.parse(screen);
    } catch (error) {
      console.error('Failed to parse analysis:', error);
      return { error: 'Invalid analysis data' };
    }
  };

  return (
    <div className="analysis-section">
      <header className="project-header">
        <h1 className="project-title">{project.name}</h1>
        <p className="project-description">{project.description}</p>
      </header>

      {screens.length === 0 ? (
        <div className="empty-state">
          <button
            className="primary-button"
            onClick={() => setShowUpload(true)}
            aria-label="Upload your first screenshot to start creating requirement document"
          >
            Upload Screenshot to Start Requirement Document
          </button>
        </div>
      ) : (
        <>
          <div className="analysis-list">
            {screens.map((screen, idx) => {
              const analysis = parseAnalysis(screen.screen);
              const analysisId = `analysis-${idx}`;

              return (
                <div key={analysisId} className="analysis-item">
                  <h3 className="analysis-title">Analysis #{idx + 1}</h3>
                  <CopiableAnalysis analysisResults={analysis} imageUrl={screen.image?.secure_url} />
                </div>
              );
            })}
          </div>

          <div className="action-buttons">
            <button
              className="secondary-button"
              onClick={() => setShowUpload(true)}
              aria-label="Upload another screenshot"
            >
              Upload Another Screenshot
            </button>
            <ExportButton screens={screens} />
          </div>
        </>
      )}

      {/* Upload Modal */}
      {showUpload && (
        <div className="modal-overlay" onClick={handleCloseModal}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <header className="modal-header">
              <h2>Upload Screenshot</h2>
            </header>

            <div className="modal-body">
              <div className="form-group">
                <label htmlFor="file-input" className="form-label">
                  Select Image File
                </label>
                <input
                  id="file-input"
                  type="file"
                  accept="image/jpeg,image/png"
                  onChange={handleFileChange}
                  className="file-input"
                  aria-describedby="file-help"
                />
                <small id="file-help" className="form-help">
                  Supported formats: JPEG, PNG. Max size: 5MB
                </small>
              </div>

              <div className="form-group">
                <label htmlFor="description-input" className="form-label">
                  Screen Description (optional)
                </label>
                <textarea
                  id="description-input"
                  placeholder="Describe what this screen shows..."
                  value={screenDescription}
                  onChange={(e) => setScreenDescription(e.target.value)}
                  className="description-input"
                  rows="3"
                  maxLength="500"
                />
                <small className="form-help">
                  {screenDescription.length}/500 characters
                </small>
              </div>

              {uploadError && (
                <div className="error-message" role="alert">
                  {uploadError}
                </div>
              )}
            </div>

            <div className="modal-footer">
              <button
                type="button"
                className="secondary-button"
                onClick={handleCloseModal}
              >
                Cancel
              </button>
              <button
                type="button"
                className="primary-button"
                onClick={handleUpload}
                disabled={!selectedFile}
              >
                Upload & Analyze
              </button>
            </div>
          </div>
        </div>
      )}
      <AIAnalysisModal
        isVisible={showProgress}
        progress={progressValue}
        currentStep={currentStep}
      />
    </div>
  );
}

export default AnalysisPage;