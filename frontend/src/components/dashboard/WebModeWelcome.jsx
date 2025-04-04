import { Globe} from "lucide-react";
import PropTypes from "prop-types";

// WebModeWelcome component
const WebModeWelcome = ({ className = "" }) => {
  return (
    <div className={`web-mode-welcome ${className}`}>
      <div className="flex items-center justify-center mb-2">
        <Globe className="h-5 w-5 text-blue-400 mr-2" />
        <h3>Web Search Mode Active</h3>
      </div>
      <p>
        No documents are selected. I will use my knowledge and search the web to answer your questions.
        Upload or select documents to enable document-specific responses.
      </p>
    </div>
  );
};

WebModeWelcome.propTypes = {
  className: PropTypes.string
};

export default WebModeWelcome;