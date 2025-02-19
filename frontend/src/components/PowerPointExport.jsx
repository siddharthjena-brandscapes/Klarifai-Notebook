

// import React, { useState } from 'react';
// import { Download } from 'lucide-react';
// import pptxgen from 'pptxgenjs';
// import { format } from 'date-fns';
// import { ideaService } from '../utils/axiosConfig';

// const PowerPointExport = ({ ideas = [], generatedImages = {}, ideaMetadata = {} }) => {
//   const [isExporting, setIsExporting] = useState(false);

//   const THEME = {
//     colors: {
//       background: '1A2333',    // Dark background
//       primary: '4A90E2',      // Bright blue
//       secondary: '2D5A9E',    // Darker blue
//       text: 'FFFFFF',         // White text
//       textLight: 'B0BEC5',    // Light gray text
//       accent: '64B5F6',        // Light blue accent
//       version:'21f359'
//     },
//     fonts: {
//       heading: 'Arial',
//       body: 'Arial'
//     }
//   };

//   const styles = {
//     title: {
//       fontFace: THEME.fonts.heading,
//       fontSize: 32,
//       color: THEME.colors.text,
//       bold: true,
//       align: 'left',
//       x: '5%',
//       y: '5%',
//       w: '90%',
//       h: '15%'
//     },
//     metadata: {
//       fontFace: THEME.fonts.body,
//       fontSize: 16,
//       color: THEME.colors.text,
//       align: 'left',
//       x: '5%',
//       y: '25%',
//       w: '45%',
//       h: '65%'
//     },
//     version: {
//       fontFace: THEME.fonts.body,
//       fontSize: 14,
//       color: THEME.colors.textLight,
//       align: 'right',
//       x: '65%',
//       y: '7%',
//       w: '30%',
//       h: '5%'
//     }
//   };

//   // Function to encode the logo as base64
//   const getLogoBase64 = async () => {
//     try {
//       const response = await fetch('/src/assets/Logo1.png');
//       const blob = await response.blob();
//       return new Promise((resolve) => {
//         const reader = new FileReader();
//         reader.onloadend = () => resolve(reader.result);
//         reader.readAsDataURL(blob);
//       });
//     } catch (error) {
//       console.error('Error loading logo:', error);
//       return null;
//     }
//   };

//   const addLogoToSlide = async (slide) => {
//     try {
//       const logoBase64 = await getLogoBase64();
//       if (logoBase64) {
//         slide.addImage({
//           data: logoBase64,
//           x: '1%',
//           y: '1%',
//           w: '10%',
//           h: '6%',
//           sizing: { type: 'contain' }
//         });
//       }
//     } catch (error) {
//       console.error('Error adding logo to slide:', error);
//     }
//   };

//   const createTitleSlide = async (pptx) => {
//     const slide = pptx.addSlide();
//     slide.background = { color: THEME.colors.background };
    
//     await addLogoToSlide(slide);
    
//     // Main title
//     slide.addText('Product Ideas Presentation', {
//       ...styles.title,
//       fontSize: 44,
//       align: 'center',
//       y: '35%',
//       color: THEME.colors.primary
//     });
  
//     // Subtitle with date
//     slide.addText(format(new Date(), 'MMMM d, yyyy'), {
//       ...styles.version,
//       fontSize: 20,
//       align: 'center',
//       y: '50%',
//       x: '30%',
//       w: '40%'
//     });
//   };

//   const processIdeaWithVersions = async (pptx, idea, setNumber) => {
//     const ideaId = idea.idea_id;
//     if (!ideaId) return;
  
//     try {
//       const historyResponse = await ideaService.getIdeaHistory(ideaId);
//       if (!historyResponse.data.success) return;
  
//       const history = historyResponse.data.history;
//       let allVersions = [];
  
//       // Only process historical versions
//       if (history.image_versions?.length > 0) {
//         allVersions = history.image_versions
//           .filter(v => v && v.image_url)
//           .map((v, index) => ({
//             image: `data:image/png;base64,${v.image_url}`,
//             created_at: v.created_at,
//             versionLabel: `Version ${index + 1}`
//           }))
//           .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
//       }
  
//       // Create slides for each version
//       for (const version of allVersions) {
//         const slide = pptx.addSlide();
//         slide.background = { color: '1A2333' };  // Dark blue background
        
//         // Add logo to slide
//         await addLogoToSlide(slide);
        
//         // Add title
//         slide.addText(idea.product_name || 'Untitled Product', {
//           fontFace: THEME.fonts.heading,
//           fontSize: 20,
//           color: THEME.colors.text,
//           bold: true,
//           align: 'center',
//           x: '3%',
//           y: '2%',    // Adjusted to avoid overlap with logo
//           w: '94%',
//           h: '10%'
//         });
  
//         // Description container
//         slide.addShape(pptx.ShapeType.rect, {
//           x: '3%',
//           y: '15%',
//           w: '45%',
//           h: '80%',
//           fill: { color: '1B2B44' },
//           line: { color: '2A4165', width: 1 }
//         });
  
//         // Description text
//         slide.addText(idea.description || 'No description available', {
//           fontFace: THEME.fonts.body,
//           fontSize: 14,
//           color: THEME.colors.text,
//           align: 'justify',
//           x: '5%',
//           y: '17%',
//           w: '41%',
//           h: '76%',
//           breakLine: true,
//           wrap: true
//         });
  
//         // Image container
//         slide.addShape(pptx.ShapeType.rect, {
//           x: '52%',
//           y: '15%',
//           w: '45%',
//           h: '80%',
//           fill: { color: '1B2B44' },
//           line: { color: '2A4165', width: 1 }
//         });
  
//         // Add image
//         if (version.image) {
//           slide.addImage({
//             data: version.image,
//             x: '54%',
//             y: '17%',
//             w: '41%',
//             h: '63%',
//             sizing: { type: 'contain' }
//           });
//         }
  
//         // Version info inside container
//         slide.addText(
//           `${version.versionLabel} • ${format(new Date(version.created_at), 'MMM d, yyyy')}`, 
//           {
//             fontFace: THEME.fonts.body,
//             fontSize: 14,
//             color: THEME.colors.version,
//             align: 'center',
//             x: '52%',
//             y: '82%',
//             w: '45%',
//             h: '5%'
//           }
//         );
  
//         // Decorative line
//         slide.addShape(pptx.ShapeType.line, {
//           x: '3%',
//           y: '12%',
//           w: '94%',
//           h: 0,
//           line: { color: '3B82F6', width: 1 }
//         });
//       }
//     } catch (error) {
//       console.error('Error processing idea versions:', error);
//     }
//   };

//   const generatePowerPoint = async () => {
//     setIsExporting(true);
    
//     try {
//       const pptx = new pptxgen();
//       pptx.layout = 'LAYOUT_16x9';
//       pptx.background = { color: THEME.colors.background };
      
//       await createTitleSlide(pptx);

//       const ideasBySet = ideas.reduce((acc, idea) => {
//         const metadata = ideaMetadata[idea.idea_id] || {};
//         const setNumber = metadata?.baseData?.ideaSet || '1';
//         if (!acc[setNumber]) acc[setNumber] = [];
//         acc[setNumber].push(idea);
//         return acc;
//       }, {});

//       for (const setNumber of Object.keys(ideasBySet).sort()) {
//         const ideasInSet = ideasBySet[setNumber];
//         if (!ideasInSet?.length) continue;

//         for (const idea of ideasInSet) {
//           await processIdeaWithVersions(pptx, idea, setNumber);
//         }
//       }

//       const fileName = `Product_Ideas_${format(new Date(), 'yyyy-MM-dd_HH-mm')}.pptx`;
//       await pptx.writeFile({ fileName });
      
//     } catch (error) {
//       console.error('PowerPoint generation error:', error);
//     } finally {
//       setIsExporting(false);
//     }
//   };

//   return (
//     <button
//       onClick={generatePowerPoint}
//       disabled={isExporting}
//       title="Download"
//       className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 text-white rounded-md transition-colors"
//     >
//       <Download size={16} className={isExporting ? 'animate-bounce' : ''} />
//       {isExporting ? 'Exporting...' : 'Export Ideas'}
//     </button>
//   );
// };

// export default PowerPointExport;

import React, { useState } from 'react';
import { Download } from 'lucide-react';
import pptxgen from 'pptxgenjs';
import { format } from 'date-fns';
import { ideaService } from '../utils/axiosConfig';

const PowerPointExport = ({ ideas = [], generatedImages = {}, ideaMetadata = {} }) => {
  const [isExporting, setIsExporting] = useState(false);

  const THEME = {
    colors: {
      background: '1A2333',    // Dark background
      primary: '4A90E2',      // Bright blue
      secondary: '2D5A9E',    // Darker blue
      text: 'FFFFFF',         // White text
      textLight: 'B0BEC5',    // Light gray text
      accent: '64B5F6',       // Light blue accent
      version: '21f359'
    },
    fonts: {
      heading: 'Arial',
      body: 'Arial'
    }
  };

  const styles = {
    title: {
      fontFace: THEME.fonts.heading,
      fontSize: 32,
      color: THEME.colors.text,
      bold: true,
      align: 'left',
      x: '5%',
      y: '5%',
      w: '90%',
      h: '15%'
    },
    metadata: {
      fontFace: THEME.fonts.body,
      fontSize: 16,
      color: THEME.colors.text,
      align: 'left',
      x: '5%',
      y: '25%',
      w: '45%',
      h: '65%'
    },
    version: {
      fontFace: THEME.fonts.body,
      fontSize: 14,
      color: THEME.colors.textLight,
      align: 'right',
      x: '65%',
      y: '7%',
      w: '30%',
      h: '5%'
    }
  };

  const addLogoToSlide = async (slide) => {
    try {
      const response = await fetch('/src/assets/Logo1.png');
      const blob = await response.blob();
      const reader = new FileReader();
      const logoBase64 = await new Promise((resolve) => {
        reader.onloadend = () => resolve(reader.result);
        reader.readAsDataURL(blob);
      });

      slide.addImage({
        data: logoBase64,
        x: '1%',
        y: '1%',
        w: '10%',
        h: '6%',
        sizing: { type: 'contain' }
      });
    } catch (error) {
      console.error('Error adding logo to slide:', error);
    }
  };

  const createTitleSlide = async (pptx) => {
    const slide = pptx.addSlide();
    slide.background = { color: THEME.colors.background };
    
    await addLogoToSlide(slide);
    
    slide.addText('Product Ideas Presentation', {
      ...styles.title,
      fontSize: 44,
      align: 'center',
      y: '35%',
      color: THEME.colors.primary
    });
  
    slide.addText(format(new Date(), 'MMMM d, yyyy'), {
      fontSize: 20,
      align: 'center',
      y: '50%',
      x: '30%',
      w: '40%',
      color: THEME.colors.textLight
    });

    // Add decorative line
    slide.addShape(pptx.ShapeType.line, {
      x: '10%',
      y: '60%',
      w: '80%',
      h: 0,
      line: { color: THEME.colors.accent, width: 2 }
    });
  };

  const createSetMetadataSlide = async (pptx, setNumber, setIdeas) => {
    const slide = pptx.addSlide();
    slide.background = { color: THEME.colors.background };
    
    await addLogoToSlide(slide);

    // Get the first idea of the set for metadata
    const firstIdea = setIdeas[0];
    const metadata = firstIdea?.metadata?.baseData || {};
    const dynamicFields = firstIdea?.metadata?.dynamicFields || {};

    // Add title with decorative line
    slide.addText(`Set ${setNumber} - Overview & Metadata`, {
      ...styles.title,
      color: THEME.colors.primary
    });

    slide.addShape(pptx.ShapeType.line, {
      x: '3%',
      y: '12%',
      w: '94%',
      h: 0,
      line: { color: '3B82F6', width: 1 }
    });

    // Add metadata container
    slide.addShape(pptx.ShapeType.rect, {
      x: '3%',
      y: '15%',
      w: '94%',
      h: '80%',
      fill: { color: '1B2B44' },
      line: { color: '2A4165', width: 1 }
    });

    // Left column - Base Information
    const baseMetadataContent = [
      'Base Information:',
      `Product: ${metadata.product || 'N/A'}`,
      `Category: ${metadata.category || 'N/A'}`,
      `Brand: ${metadata.brand || 'N/A'}`,
      `Ideas in Set: ${setIdeas.length}`,
      `Total Generated: ${metadata.number_of_ideas || 'N/A'}`,
      `Project Name: ${metadata.project_name || 'N/A'}`,
      `Project ID: ${metadata.project_id || 'N/A'}`,
      `Set Label: ${firstIdea.idea_set_label || 'N/A'}`,
      `Created: ${format(new Date(metadata.timestamp || new Date()), 'PPpp')}`,
      `Negative Prompt: ${metadata.negative_prompt || 'None'}`
    ].join('\\n');

    slide.addText(baseMetadataContent, {
      ...styles.metadata,
      x: '5%',
      y: '17%',
      w: '43%',
      h: '76%',
      bullet: { type: 'number', color: THEME.colors.accent }
    });

    // Right column - Dynamic Fields
    if (dynamicFields && Object.keys(dynamicFields).length > 0) {
      const dynamicContent = ['Dynamic Fields:'];
      
      // Group fields by type
      const groupedFields = Object.entries(dynamicFields).reduce((acc, [_, field]) => {
        if (field.type && field.value) {
          if (!acc[field.type]) acc[field.type] = [];
          acc[field.type].push(field.value);
        }
        return acc;
      }, {});

      // Add each field type and its values
      Object.entries(groupedFields).forEach(([type, values]) => {
        dynamicContent.push(`${type}:`);
        values.forEach(value => {
          dynamicContent.push(`  • ${value}`);
        });
      });

      slide.addText(dynamicContent.join('\\n'), {
        ...styles.metadata,
        x: '52%',
        y: '17%',
        w: '43%',
        h: '76%'
      });
    }
  };

  const createIdeaSlide = async (pptx, idea, version, versionNumber, totalVersions) => {
    const slide = pptx.addSlide();
    slide.background = { color: THEME.colors.background };
    
    await addLogoToSlide(slide);
    
    // Add title with set information
    slide.addText(
      `${idea.product_name} (Set ${idea.idea_set}-${idea.idea_set_label})${
        totalVersions > 1 ? ` - Version ${versionNumber}/${totalVersions}` : ''
      }`, 
      {
        ...styles.title,
        fontSize: 24
      }
    );

    // Add decorative line
    slide.addShape(pptx.ShapeType.line, {
      x: '3%',
      y: '12%',
      w: '94%',
      h: 0,
      line: { color: '3B82F6', width: 1 }
    });

    // Description container
    slide.addShape(pptx.ShapeType.rect, {
      x: '3%',
      y: '15%',
      w: '45%',
      h: '80%',
      fill: { color: '1B2B44' },
      line: { color: '2A4165', width: 1 }
    });

    // Description text
    slide.addText(idea.description || 'No description available', {
      fontFace: THEME.fonts.body,
      fontSize: 14,
      color: THEME.colors.text,
      align: 'justify',
      x: '5%',
      y: '17%',
      w: '41%',
      h: '76%',
      breakLine: true,
      wrap: true
    });

    // Image container
    slide.addShape(pptx.ShapeType.rect, {
      x: '52%',
      y: '15%',
      w: '45%',
      h: '80%',
      fill: { color: '1B2B44' },
      line: { color: '2A4165', width: 1 }
    });

    // Add image if available
    if (version?.image_url) {
      slide.addImage({
        data: `data:image/png;base64,${version.image_url}`,
        x: '54%',
        y: '17%',
        w: '41%',
        h: '63%',
        sizing: { type: 'contain' }
      });

      // Add version info
      slide.addText(
        `Generated: ${format(new Date(version.created_at), 'PPpp')}`, 
        {
          fontFace: THEME.fonts.body,
          fontSize: 14,
          color: THEME.colors.version,
          align: 'center',
          x: '52%',
          y: '82%',
          w: '45%',
          h: '5%'
        }
      );
    }
  };

  const generatePowerPoint = async () => {
    setIsExporting(true);
    
    try {
      const pptx = new pptxgen();
      pptx.layout = 'LAYOUT_16x9';
      
      // Create title slide
      await createTitleSlide(pptx);

      // Group ideas by set
      const ideasBySet = ideas.reduce((acc, idea) => {
        const setNumber = idea.idea_set || '1';
        if (!acc[setNumber]) {
          acc[setNumber] = [];
        }
        acc[setNumber].push(idea);
        return acc;
      }, {});

      // Process each set
      for (const setNumber of Object.keys(ideasBySet).sort((a, b) => parseInt(a) - parseInt(b))) {
        const setIdeas = ideasBySet[setNumber];
        
        // Create metadata slide for the set
        await createSetMetadataSlide(pptx, setNumber, setIdeas);

        // Process each idea in the set
        for (const idea of setIdeas) {
          try {
            // Get version history for the idea
            const historyResponse = await ideaService.getIdeaHistory(idea.idea_id);
            if (historyResponse.data.success) {
              const history = historyResponse.data.history;
              
              // Get all versions for the idea
              if (history.image_versions?.length > 0) {
                const versions = history.image_versions
                  .filter(v => v && v.image_url)
                  .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

                // Create a slide for each version
                for (const [index, version] of versions.entries()) {
                  await createIdeaSlide(
                    pptx,
                    idea,
                    version,
                    index + 1,
                    versions.length
                  );
                }
              } else {
                // Create a slide without version if no images available
                await createIdeaSlide(pptx, idea, null, 1, 1);
              }
            }
          } catch (error) {
            console.error(`Error processing idea ${idea.idea_id}:`, error);
          }
        }
      }

      // Save the presentation
      const fileName = `Product_Ideas_${format(new Date(), 'yyyy-MM-dd_HH-mm')}.pptx`;
      await pptx.writeFile({ fileName });
      
    } catch (error) {
      console.error('PowerPoint generation error:', error);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <button
      onClick={generatePowerPoint}
      disabled={isExporting}
      className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 text-white rounded-md transition-colors"
    >
      <Download size={16} className={isExporting ? 'animate-bounce' : ''} />
      {isExporting ? 'Exporting...' : 'Export Ideas'}
    </button>
  );
};

export default PowerPointExport;