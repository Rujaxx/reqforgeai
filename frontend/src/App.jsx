import React, { useState, useRef } from 'react';
import './App.css';

function App() {
  const [selectedFile, setSelectedFile] = useState(null);
  const [analysisText, setAnalysisText] = useState(''); // Stores the formatted text output
  const [screenId, setScreenId] = useState(''); // Stores the screen ID
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const textAreaRef = useRef(null); // Ref for the textarea to enable copy

  const handleFileChange = (event) => {
    setSelectedFile(event.target.files[0]);
    setAnalysisText(''); // Clear previous results
    setScreenId('');
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

      // Handle new backend response structure
      if (result.data) {
        const {
          screenId,
          layoutDescription,
          overallPurpose,
          detectedElements,
          extractedTextBlocks
        } = result.data;

        let formatted = '';
        if (screenId) formatted += `Screen ID: ${screenId}\n\n`;
        if (overallPurpose) formatted += `Overall Purpose:\n${overallPurpose}\n\n`;
        if (layoutDescription) formatted += `Layout Description:\n${layoutDescription}\n\n`;

        if (detectedElements && detectedElements.length) {
          formatted += `Detected Elements:\n`;
          detectedElements.forEach((el, idx) => {
            formatted += `  ${idx + 1}. [${el.type}] ${el.label}\n     Purpose: ${el.purpose}\n     Position: ${el.position_description}\n`;
          });
          formatted += '\n';
        }

        if (extractedTextBlocks && extractedTextBlocks.length) {
          formatted += `Extracted Text Blocks:\n`;
          extractedTextBlocks.forEach((block, idx) => {
            formatted += `  ${idx + 1}. "${block.text}" (${block.context})\n`;
          });
          formatted += '\n';
        }

        setAnalysisText(formatted);
        setScreenId(screenId || 'N/A');
      } else {
        setError("Analysis data not found in the response.");
        setAnalysisText('');
        setScreenId('');
      }

    } catch (err) {
      console.error('Error uploading or analyzing:', err);
      setError(`Failed to analyze image: ${err.message}`);
      setMessage('');
      setAnalysisText('');
      setScreenId('');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyToClipboard = () => {
    if (textAreaRef.current) {
      textAreaRef.current.select(); // Select the text in the textarea
      navigator.clipboard.writeText(textAreaRef.current.value)
        .then(() => {
          alert('Analysis text copied to clipboard!');
        })
        .catch((err) => {
          console.error('Failed to copy text: ', err);
          alert('Failed to copy text. Please copy manually.');
        });
    }
  };


  return (
    <div className="App">
      <header className="App-header">
        <h1>Requirement Analysis Generator</h1>
        <p>Upload a UI screenshot to get a detailed text analysis for your documentation.</p>
      </header>

      <main>
        <div className="upload-section">
          <input type="file" accept="image/*" onChange={handleFileChange} />
          <button onClick={handleUpload} disabled={isLoading || !selectedFile}>
            {isLoading ? 'Analyzing...' : 'Upload & Analyze'}
          </button>
        </div>

        {message && <p className="status-message">{message}</p>}
        {error && <p className="error-message">{error}</p>}

        {analysisText && (
          <div className="results-section">
            <h2>Analysis for Screen: {screenId}</h2>
            <textarea
              ref={textAreaRef}
              value={analysisText}
              readOnly
              rows={25} // Adjust rows as needed
              cols={80} // Adjust cols as needed
              style={{ width: '100%', padding: '15px', fontSize: '1.05em', lineHeight: '1.6', border: '1px solid #ccc', borderRadius: '8px', fontFamily: 'monospace', whiteSpace: 'pre-wrap' }}
            />
            <button onClick={handleCopyToClipboard} style={{ marginTop: '15px', backgroundColor: '#28a745' }}>
              Copy to Clipboard
            </button>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;