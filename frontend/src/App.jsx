import React, { useState, useRef } from 'react';
import './App.css';

function CopiableAnalysis({ analysisResults }) {
  const textAreaRef = useRef(null);
  const data = analysisResults.data || analysisResults.analysis || {};

  // Format the analysis as a readable string
  const formatAnalysis = (data) => {
    if (!data) return '';
    let formatted = '';
    if (data.screenOverview) {
      formatted += `Screen Name: ${data.screenOverview.screenName}\n`;
      formatted += `Screen Type: ${data.screenOverview.screenType}\n`;
      formatted += `Primary Purpose: ${data.screenOverview.primaryPurpose}\n`;
      formatted += `User Role: ${data.screenOverview.userRole}\n`;
      formatted += `Relationship To Previous Screens: ${data.screenOverview.relationshipToPreviousScreens}\n\n`;
    }

    if (data.functionalRequirements && data.functionalRequirements.length) {
      formatted += 'Functional Requirements:\n';
      data.functionalRequirements.forEach((f, i) => {
        formatted += `  ${i + 1}. ${f}\n`;
      });
      formatted += '\n';
    }
    if (data.nonFunctionalRequirements && data.nonFunctionalRequirements.length) {
      formatted += 'Non-Functional Requirements:\n';
      data.nonFunctionalRequirements.forEach((n, i) => {
        formatted += `  ${i + 1}. ${n}\n`;
      });
      formatted += '\n';
    }
    if (data.businessRules && data.businessRules.length) {
      formatted += 'Business Rules:\n';
      data.businessRules.forEach((b, i) => {
        formatted += `  ${i + 1}. ${b}\n`;
      });
      formatted += '\n';
    }
    if (data.assumptionsMade && data.assumptionsMade.length) {
      formatted += 'Assumptions Made:\n';
      data.assumptionsMade.forEach((a, i) => {
        formatted += `  ${i + 1}. ${a}\n`;
      });
      formatted += '\n';
    }
    return formatted;
  };

  const handleCopy = () => {
    if (textAreaRef.current) {
      // Try to copy as HTML table for requirementsMatrix, otherwise fallback to text
      let html = '';
      // Screen Overview as pre
      if (data.screenOverview) {
        html += `<pre>`;
        html += `Screen Name: ${data.screenOverview.screenName}\n`;
        html += `Screen Type: ${data.screenOverview.screenType}\n`;
        html += `Primary Purpose: ${data.screenOverview.primaryPurpose}\n`;
        html += `User Role: ${data.screenOverview.userRole}\n`;
        html += `Relationship To Previous Screens: ${data.screenOverview.relationshipToPreviousScreens}\n\n`;
        html += `</pre>`;
      }
      // Requirements Matrix as HTML table (after screenOverview)
      if (data.requirementsMatrix && data.requirementsMatrix.length > 0) {
        html += '<h3>Requirements Matrix</h3>';
        html += '<table border="1" cellpadding="6" cellspacing="0" style="border-collapse:collapse;font-family:monospace;font-size:1em;width:100%">';
        html += '<thead><tr style="background:#f5f5f5"><th>#</th><th>Element</th><th>Type</th><th>Behavior</th><th>Data Source</th><th>Vaildation Rules</th><th>Error Hanlding</th><th>Business Rules</th><th>Notes</th></tr></thead><tbody>';
        data.requirementsMatrix.forEach((r, i) => {
          html += `<tr><td>${i + 1}</td><td>${r.uiElement}</td><td>${r.elementType}</td><td>${r.behavior}</td><td>${r.dataSource}</td><td>${r.validationRules}</td><td>${r.errorHandling}</td><td>${r.businessRules}</td><td>${r.notes}</td></tr>`;
        });
        html += '</tbody></table><br/>';
      }
      // The rest as preformatted text
      let rest = '';
      if (data.functionalRequirements && data.functionalRequirements.length) {
        rest += 'Functional Requirements:\n';
        data.functionalRequirements.forEach((f, i) => {
          rest += `  ${i + 1}. ${f}\n`;
        });
        rest += '\n';
      }
      if (data.nonFunctionalRequirements && data.nonFunctionalRequirements.length) {
        rest += 'Non-Functional Requirements:\n';
        data.nonFunctionalRequirements.forEach((n, i) => {
          rest += `  ${i + 1}. ${n}\n`;
        });
        rest += '\n';
      }
      if (data.businessRules && data.businessRules.length) {
        rest += 'Business Rules:\n';
        data.businessRules.forEach((b, i) => {
          rest += `  ${i + 1}. ${b}\n`;
        });
        rest += '\n';
      }
      if (data.assumptionsMade && data.assumptionsMade.length) {
        rest += 'Assumptions Made:\n';
        data.assumptionsMade.forEach((a, i) => {
          rest += `  ${i + 1}. ${a}\n`;
        });
        rest += '\n';
      }
      if (rest) html += `<pre>${rest}</pre>`;
      // Use Clipboard API for HTML
      navigator.clipboard.write([
        new window.ClipboardItem({
          'text/html': new Blob([html], { type: 'text/html' }),
          'text/plain': new Blob([formatAnalysis(data)], { type: 'text/plain' })
        })
      ]).then(() => {
        alert('Analysis (including table) copied to clipboard! You can paste into Word or Google Docs.');
      }).catch((err) => {
        console.error('Failed to copy as HTML, falling back to text:', err);
        navigator.clipboard.writeText(formatAnalysis(data))
          .then(() => alert('Analysis copied as plain text.'))
          .catch(() => alert('Failed to copy text. Please copy manually.'));
      });
    }
  };

  const formattedText = formatAnalysis(data);

  return (
    <div className="copiable-analysis">
      <textarea
        ref={textAreaRef}
        value={formattedText}
        readOnly
        rows={25}
        cols={80}
        style={{ width: '100%', padding: '15px', fontSize: '1.05em', lineHeight: '1.6', border: '1px solid #ccc', borderRadius: '8px', fontFamily: 'monospace', whiteSpace: 'pre-wrap' }}
      />
            {data.requirementsMatrix && data.requirementsMatrix.length > 0 && (
        <div style={{ marginTop: '2em' }}>
          <h3>Requirements Matrix</h3>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '1em' }}>
            <thead>
              <tr style={{ background: '#f5f5f5' }}>
                <th style={{ border: '1px solid #ccc', padding: '8px' }}>#</th>
                <th style={{ border: '1px solid #ccc', padding: '8px' }}>Element</th>
                <th style={{ border: '1px solid #ccc', padding: '8px' }}>Type</th>
                <th style={{ border: '1px solid #ccc', padding: '8px' }}>Behavior</th>
                <th style={{ border: '1px solid #ccc', padding: '8px' }}>Data Source</th>
                <th style={{ border: '1px solid #ccc', padding: '8px' }}>Validation Rules</th>
                <th style={{ border: '1px solid #ccc', padding: '8px' }}>Error Hanlding</th>
                <th style={{ border: '1px solid #ccc', padding: '8px' }}>Business Rules</th>
                <th style={{ border: '1px solid #ccc', padding: '8px' }}>Notes</th>
              </tr>
            </thead>
            <tbody>
              {data.requirementsMatrix.map((r, i) => (
                <tr key={i}>
                  <td style={{ border: '1px solid #ccc', padding: '8px' }}>{i + 1}</td>
                  <td style={{ border: '1px solid #ccc', padding: '8px' }}>{r.uiElement}</td>
                  <td style={{ border: '1px solid #ccc', padding: '8px' }}>{r.elementType}</td>
                  <td style={{ border: '1px solid #ccc', padding: '8px' }}>{r.behavior}</td>
                  <td style={{ border: '1px solid #ccc', padding: '8px' }}>{r.dataSource}</td>
                  <td style={{ border: '1px solid #ccc', padding: '8px' }}>{r.validationRules}</td>
                  <td style={{ border: '1px solid #ccc', padding: '8px' }}>{r.errorHandling}</td>
                  <td style={{ border: '1px solid #ccc', padding: '8px' }}>{r.businessRules}</td>
                  <td style={{ border: '1px solid #ccc', padding: '8px' }}>{r.notes}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <button onClick={handleCopy} style={{ marginTop: '15px', backgroundColor: '#28a745', color: 'white' }}>
        Copy to Clipboard
      </button>
    </div>
  );
}

function App() {
  const [selectedFile, setSelectedFile] = useState(null);
  const [analysisResults, setAnalysisResults] = useState(null);
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showAnalysis, setShowAnalysis] = useState(false);

  const handleFileChange = (event) => {
    setSelectedFile(event.target.files[0]);
    setMessage('');
    setError('');
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      setError('Please select an image file first.');
      return;
    }

    setIsLoading(true);
    setError('');
    setMessage('Uploading and analyzing...');

    const formData = new FormData();
    formData.append('screenshot', selectedFile); // 'screenshot' must match the field name in multer setup

    try {
      const response = await fetch('http://localhost:3000/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Network response was not ok.');
      }

      const result = await response.json();
      setMessage(result.message || 'Analysis complete!');
      setAnalysisResults(result);
      setShowAnalysis(true);

    } catch (err) {
      console.error('Error uploading or analyzing:', err);
      setError(`Failed to analyze image: ${err.message}`);
      setMessage('');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="App">
      <header className="App-header">
        <h1>Requirement Analysis Generator</h1>
        <p>Upload a UI screenshot to get a detailed text analysis for your documentation.</p>
      </header>

      <main>
        {!showAnalysis && (
          <div className="upload-section">
            <input type="file" accept="image/*" onChange={handleFileChange} />
            <button onClick={handleUpload} disabled={isLoading || !selectedFile}>
              {isLoading ? 'Analyzing...' : 'Upload & Analyze'}
            </button>
          </div>
        )}
        {message && <p className="status-message">{message}</p>}
        {error && <p className="error-message">{error}</p>}
        {showAnalysis && analysisResults && (
          <div className="results-section">
            <h2>Analysis Results</h2>
            <CopiableAnalysis analysisResults={analysisResults} />
            <button onClick={() => setShowAnalysis(false)} style={{ marginTop: '15px', backgroundColor: '#007bff', color: 'white' }}>
              Back to Upload
            </button>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;