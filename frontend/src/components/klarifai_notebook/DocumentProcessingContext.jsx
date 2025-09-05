import React, { createContext, useContext, useState } from "react";
 
const DocumentProcessingContext = createContext();
 
export const useDocumentProcessing = () => useContext(DocumentProcessingContext);
 
export const DocumentProcessingProvider = ({ children }) => {
  const [isDocumentProcessing, setIsDocumentProcessing] = useState(false);
 
  return (
    <DocumentProcessingContext.Provider value={{ isDocumentProcessing, setIsDocumentProcessing }}>
      {children}
    </DocumentProcessingContext.Provider>
  );
};
 