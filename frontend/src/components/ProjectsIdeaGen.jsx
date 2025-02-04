// import React from 'react';
// import { ProjectProvider, ProjectList, useProject } from './ProjectManagement';
// import IdeaForm from './IdeaForm';
// const ProjectsIdeaGen = () => {
//   return (
//     <ProjectProvider>
//       <ProjectManager />
//     </ProjectProvider>
//   )
// };

// const ProjectManager = () => {
//     const { showProjectList, loadProject, startNewProject } = useProject();
  
//     return showProjectList ? (
//       <ProjectList
//         onSelectProject={loadProject}
//         onNewProject={startNewProject}
//       />
//     ) : (
//       <IdeaForm />
//     );
//   };
  

// export default ProjectsIdeaGen

import React from 'react';
import { useParams } from 'react-router-dom';
import { ProjectProvider, ProjectList, useProject } from './ProjectManagement';
import IdeaForm from './IdeaForm';

const ProjectsIdeaGen = () => {
  return (
    <ProjectProvider>
      <ProjectManager />
    </ProjectProvider>
  )
};

const ProjectManager = () => {
  // Extract mainProjectId from URL parameters
  const { mainProjectId } = useParams();
  const { showProjectList, loadProject, startNewProject } = useProject();

  // Add check for mainProjectId
  if (!mainProjectId) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="text-white">No main project selected</div>
      </div>
    );
  }

  return showProjectList ? (
    <ProjectList
      mainProjectId={mainProjectId}
      onSelectProject={loadProject}
      onNewProject={startNewProject}
    />
  ) : (
    <IdeaForm />
  );
};

export default ProjectsIdeaGen;