import React, { useState } from 'react';
import { Download } from 'lucide-react';
import pptxgen from 'pptxgenjs';
import { format } from 'date-fns';
import { ideaService } from '../utils/axiosConfig';
// Import the logo directly
import logoImage from '../assets/Logo1.png';

const PowerPointExport = ({ ideas = [], generatedImages = {}, ideaMetadata = {} }) => {
  const [isExporting, setIsExporting] = useState(false);

  const THEME = {
    colors: {
      background: '1A2333',    
      primary: '4A90E2',      
      secondary: '2D5A9E',    
      text: 'FFFFFF',        
      textLight: 'B0BEC5',    
      accent: '64B5F6',        // Light blue accent
      version:'21f359'
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

  const addLogoToSlide = (slide) => {
    try {
      slide.addImage({
        path: logoImage, // Use the imported logo directly
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
    
    // Add logo to the title slide
    addLogoToSlide(slide);
    
    // Main title
    slide.addText('Product Ideas Presentation', {
      ...styles.title,
      fontSize: 44,
      align: 'center',
      y: '35%',
      color: THEME.colors.primary
    });
  
    // Subtitle with date
    slide.addText(format(new Date(), 'MMMM d, yyyy'), {
      ...styles.version,
      fontSize: 20,
      align: 'center',
      y: '50%',
      x: '30%',
      w: '40%'
    });
  };

  const processIdeaWithVersions = async (pptx, idea, setNumber) => {
    const ideaId = idea.idea_id;
    if (!ideaId) return;
  
    try {
      const historyResponse = await ideaService.getIdeaHistory(ideaId);
      if (!historyResponse.data.success) return;
  
      const history = historyResponse.data.history;
      let allVersions = [];
  
      // Only process historical versions
      if (history.image_versions?.length > 0) {
        allVersions = history.image_versions
          .filter(v => v && v.image_url)
          .map((v, index) => ({
            image: `data:image/png;base64,${v.image_url}`,
            created_at: v.created_at,
            versionLabel: `Version ${index + 1}`
          }))
          .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
      }
  
      // Create slides for each version
      for (const version of allVersions) {
        const slide = pptx.addSlide();
        slide.background = { color: '1A2333' };  // Dark blue background
        
        // Add logo to slide
        addLogoToSlide(slide);
        
        // Add title
        slide.addText(idea.product_name || 'Untitled Product', {
          fontFace: THEME.fonts.heading,
          fontSize: 20,
          color: THEME.colors.text,
          bold: true,
          align: 'center',
          x: '3%',
          y: '2%',    // Adjusted to avoid overlap with logo
          w: '94%',
          h: '10%'
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
  
        // Add image
        if (version.image) {
          slide.addImage({
            data: version.image,
            x: '54%',
            y: '17%',
            w: '41%',
            h: '63%',
            sizing: { type: 'contain' }
          });
        }
  
        // Version info inside container
        slide.addText(
          `${version.versionLabel} • ${format(new Date(version.created_at), 'MMM d, yyyy')}`, 
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
  
        // Decorative line
        slide.addShape(pptx.ShapeType.line, {
          x: '3%',
          y: '12%',
          w: '94%',
          h: 0,
          line: { color: '3B82F6', width: 1 }
        });
      }
    } catch (error) {
      console.error('Error processing idea versions:', error);
    }
  };

  const generatePowerPoint = async () => {
    setIsExporting(true);
    
    try {
      const pptx = new pptxgen();
      pptx.layout = 'LAYOUT_16x9';
      pptx.background = { color: THEME.colors.background };
      
      await createTitleSlide(pptx);

      const ideasBySet = ideas.reduce((acc, idea) => {
        const metadata = ideaMetadata[idea.idea_id] || {};
        const setNumber = metadata?.baseData?.ideaSet || '1';
        if (!acc[setNumber]) acc[setNumber] = [];
        acc[setNumber].push(idea);
        return acc;
      }, {});

      for (const setNumber of Object.keys(ideasBySet).sort()) {
        const ideasInSet = ideasBySet[setNumber];
        if (!ideasInSet?.length) continue;

        for (const idea of ideasInSet) {
          await processIdeaWithVersions(pptx, idea, setNumber);
        }
      }

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
      title="Download"
      className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 text-white rounded-md transition-colors"
    >
      <Download size={16} className={isExporting ? 'animate-bounce' : ''} />
      {isExporting ? 'Exporting...' : 'Export Ideas'}
    </button>
  );
};

export default PowerPointExport;
