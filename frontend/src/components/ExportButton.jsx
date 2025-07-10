import { exportAnalysisToDocx } from '../utils/generateGenerateDocx';

const ExportButton = ({ screens }) => {
  return (
    <button onClick={() => exportAnalysisToDocx(screens)}>
      Export to DOCX
    </button>
  );
};

export default ExportButton;
