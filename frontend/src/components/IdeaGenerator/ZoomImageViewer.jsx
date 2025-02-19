import React, { useState, useEffect, useCallback, useRef } from 'react';
import { X, ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';

const ZoomImageViewer = ({ 
  isOpen, 
  onClose, 
  imageUrl, 
  altText = "Image" 
}) => {
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const containerRef = useRef(null);
  const imageRef = useRef(null);

  // Prevent browser zoom when modal is open
  useEffect(() => {
    const preventBrowserZoom = (e) => {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
      }
    };

    if (isOpen) {
      // Prevent browser zoom
      document.addEventListener('wheel', preventBrowserZoom, { passive: false });
      // Prevent scrolling on body
      document.body.style.overflow = 'hidden';
      // Prevent touch move on body
      document.body.style.touchAction = 'none';
      // Add padding right to prevent layout shift
      const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
      document.body.style.paddingRight = `${scrollbarWidth}px`;
    }

    return () => {
      document.removeEventListener('wheel', preventBrowserZoom);
      document.body.style.overflow = '';
      document.body.style.touchAction = '';
      document.body.style.paddingRight = '';
    };
  }, [isOpen]);

  // Handle zoom
  const handleZoom = useCallback((zoomIn) => {
    setScale(prevScale => {
      const newScale = zoomIn ? prevScale * 1.2 : prevScale / 1.2;
      return Math.min(Math.max(0.5, newScale), 4);
    });
  }, []);

  // Handle wheel zoom and scroll
  const handleWheel = useCallback((e) => {
    e.preventDefault(); // Prevent any default scroll behavior
    
    if (e.ctrlKey || e.metaKey) {
      handleZoom(e.deltaY < 0);
    } else {
      setPosition(prev => ({
        x: prev.x - e.deltaX,
        y: prev.y - e.deltaY
      }));
    }
  }, [handleZoom]);

  // Handle drag
  const handleDragStart = useCallback((e) => {
    e.preventDefault();
    const clientX = e.type.includes('mouse') ? e.clientX : e.touches[0].clientX;
    const clientY = e.type.includes('mouse') ? e.clientY : e.touches[0].clientY;
    
    setIsDragging(true);
    setDragStart({
      x: clientX - position.x,
      y: clientY - position.y
    });
  }, [position]);

  const handleDragMove = useCallback((e) => {
    if (!isDragging) return;
    e.preventDefault();
    
    const clientX = e.type.includes('mouse') ? e.clientX : e.touches[0].clientX;
    const clientY = e.type.includes('mouse') ? e.clientY : e.touches[0].clientY;
    
    setPosition({
      x: clientX - dragStart.x,
      y: clientY - dragStart.y
    });
  }, [isDragging, dragStart]);

  const handleDragEnd = useCallback(() => {
    setIsDragging(false);
  }, []);

  // Reset zoom and position
  const handleReset = useCallback(() => {
    setScale(1);
    setPosition({ x: 0, y: 0 });
  }, []);

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen, onClose]);

  // Handle backdrop click
  const handleBackdropClick = (e) => {
    if (e.target === containerRef.current) {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div 
      ref={containerRef}
      className="fixed inset-0 z-[9999] bg-black/90 backdrop-blur-md"
      onClick={handleBackdropClick}
    >
      {/* Close button */}
      <button
        onClick={onClose}
        className="absolute top-6 right-6 z-50 p-3 bg-gray-800 hover:bg-gray-700 rounded-lg text-white transition-colors group"
      >
        <X size={24} className="group-hover:scale-110 transition-transform" />
      </button>

      {/* Controls */}
      <div className="absolute top-6 left-6 z-50 flex items-center gap-2 bg-gray-800 rounded-lg p-2">
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleZoom(false);
          }}
          className="p-2 hover:bg-gray-700 rounded-lg text-white transition-colors group"
          title="Zoom Out"
        >
          <ZoomOut size={20} className="group-hover:scale-110 transition-transform" />
        </button>
        <div className="w-px h-6 bg-gray-600" />
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleReset();
          }}
          className="p-2 hover:bg-gray-700 rounded-lg text-white transition-colors group"
          title="Reset Zoom"
        >
          <RotateCcw size={20} className="group-hover:scale-110 transition-transform" />
        </button>
        <div className="w-px h-6 bg-gray-600" />
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleZoom(true);
          }}
          className="p-2 hover:bg-gray-700 rounded-lg text-white transition-colors group"
          title="Zoom In"
        >
          <ZoomIn size={20} className="group-hover:scale-110 transition-transform" />
        </button>
        <div className="ml-2 px-3 py-2 bg-gray-700 rounded-lg text-white text-sm">
          {Math.round(scale * 100)}%
        </div>
      </div>

      {/* Image container */}
      <div 
        className="w-full h-full flex items-center justify-center cursor-grab active:cursor-grabbing overflow-hidden"
        onWheel={handleWheel}
        onMouseDown={handleDragStart}
        onMouseMove={handleDragMove}
        onMouseUp={handleDragEnd}
        onMouseLeave={handleDragEnd}
        onTouchStart={handleDragStart}
        onTouchMove={handleDragMove}
        onTouchEnd={handleDragEnd}
        onClick={(e) => e.stopPropagation()}
      >
        <img
          ref={imageRef}
          src={imageUrl}
          alt={altText}
          className="max-h-[90vh] max-w-[90vw] object-contain select-none transition-transform duration-200"
          style={{
            transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
          }}
          draggable="false"
          onClick={(e) => e.stopPropagation()}
        />
      </div>

      {/* Desktop instructions */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-gray-800 rounded-lg px-4 py-2 text-gray-300 text-sm">
        <span className="mr-4">🖱️ Scroll or drag to pan</span>
        <span>Ctrl + Scroll to zoom</span>
      </div>
    </div>
  );
};

export default ZoomImageViewer;