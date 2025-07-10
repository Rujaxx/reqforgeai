import React, { useRef } from 'react';
import '../styles/CopiableAnalysis.css';

export function CopiableAnalysis({ analysisResults,imageUrl }) {
  const textAreaRef = useRef(null);
  const data = analysisResults || {};

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
    <>
    {imageUrl && <img src={imageUrl} alt="Analysis Screenshot" className="analysis-screenshot" />}
      <div className="copiable-analysis">
        <textarea
          ref={textAreaRef}
          value={formattedText}
          readOnly
          rows={30}
          cols={170}
          className='copiable-textarea'
        />
        {data.requirementsMatrix && data.requirementsMatrix.length > 0 && (
          <div >
            <h3>Requirements Matrix</h3>
            <table className='requirements-table'>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Element</th>
                  <th>Type</th>
                  <th>Behavior</th>
                  <th>Data Source</th>
                  <th>Validation Rules</th>
                  <th>Error Hanlding</th>
                  <th>Business Rules</th>
                  <th>Notes</th>
                </tr>
              </thead>
              <tbody>
                {data.requirementsMatrix.map((r, i) => (
                  <tr key={i}>
                    <td>{i + 1}</td>
                    <td>{r.uiElement}</td>
                    <td>{r.elementType}</td>
                    <td>{r.behavior}</td>
                    <td>{r.dataSource}</td>
                    <td>{r.validationRules}</td>
                    <td>{r.errorHandling}</td>
                    <td>{r.businessRules}</td>
                    <td>{r.notes}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <button onClick={handleCopy} className='copy-button'>
          Copy to Clipboard
        </button>
      </div>
    </>
  );
}