// AdvancedRegenControls.jsx
import React, { useState } from 'react';
import { Settings, RotateCw } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Slider } from "@/components/ui/slider";

const AdvancedRegenControls = ({ 
  idea, 
  onRegenerate, 
  isLoading 
}) => {
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [settings, setSettings] = useState({
    prompt: `${idea.product_name}: ${idea.description}`,
    negativePrompt: '', // New field for negative prompting
    size: 768,
    steps: 30,
    guidance_scale: 7.5
  });

  // Random parameter generation within safe bounds
  const handleQuickRegenerate = () => {
    const randomParams = {
      size: 768, // Keep size constant for consistency
      steps: Math.floor(Math.random() * (40 - 20) + 20), // Random steps between 20-40
      guidance_scale: Number((Math.random() * (9 - 6) + 6).toFixed(1)) // Random guidance between 6-9
    };
    onRegenerate({
      description: `${idea.product_name}: ${idea.description}`,
      idea_id: idea.idea_id,
      ...randomParams
    });
  };

  const handleSettingChange = (setting, value) => {
    setSettings(prev => ({
      ...prev,
      [setting]: value
    }));
  };

  const handleAdvancedRegenerate = () => {
    onRegenerate({
      description: settings.prompt,
      negative_prompt: settings.negativePrompt, // Add negative prompt to regeneration
      idea_id: idea.idea_id,
      size: settings.size,
      steps: settings.steps,
      guidance_scale: settings.guidance_scale
    });
    setShowAdvanced(false);
  };

  return (
    <div className="flex gap-2">
      <button
        onClick={handleQuickRegenerate}
        className="btn btn-secondary bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 text-white"
        title='Regenerate Image'
        disabled={isLoading}
      >
        {isLoading ? (
          <div className="flex items-center">
            <div className="loading-spinner mr-2"></div>
            Regenerating...
          </div>
        ) : (
          <>
            <RotateCw size={16} />
          </>
        )}
      </button>
      
      <Dialog open={showAdvanced} onOpenChange={setShowAdvanced}>
        <DialogTrigger asChild>
          <button className="btn btn-secondary bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700" disabled={isLoading} title='Advance Regenerate'>
            <Settings size={16} />
          </button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>Advanced Regeneration Settings</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-6 py-4 overflow-y-auto max-h-[65vh] pr-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-300">
                Generation Prompt
              </label>
              <textarea
                value={settings.prompt}
                onChange={(e) => handleSettingChange('prompt', e.target.value)}
                rows={4}
                className="w-full p-2 bg-gray-800 border border-gray-700 rounded-md text-white"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-300">
                Negative Prompt (Elements to Avoid)
              </label>
              <textarea
                value={settings.negativePrompt}
                onChange={(e) => handleSettingChange('negativePrompt', e.target.value)}
                rows={3}
                placeholder="Enter elements you want to exclude from the image (e.g., blurry, low quality, watermarks)"
                className="w-full p-2 bg-gray-800 border border-gray-700 rounded-md text-white"
              />
              <p className="text-xs text-gray-400 mt-1">
                Specify elements you want to avoid in the generated image. Separate multiple elements with commas.
              </p>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-300">
                Image Size: {settings.size}px
              </label>
              <select
                value={settings.size}
                onChange={(e) => handleSettingChange('size', Number(e.target.value))}
                className="w-full p-2 bg-gray-800 border border-gray-700 rounded-md text-white"
              >
                <option value={512}>512px</option>
                <option value={768}>768px</option>
                <option value={1024}>1024px</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-300">
                Quality Steps: {settings.steps}
              </label>
              <Slider
                value={[settings.steps]}
                onValueChange={([value]) => handleSettingChange('steps', value)}
                min={20}
                max={50}
                step={1}
                className="w-full"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-300">
                Guidance Scale: {settings.guidance_scale}
              </label>
              <Slider
                value={[settings.guidance_scale]}
                onValueChange={([value]) => handleSettingChange('guidance_scale', value)}
                min={1}
                max={20}
                step={0.1}
                className="w-full"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 mt-4">
            <button
              onClick={() => setShowAdvanced(false)}
              className="btn btn-secondary"
            >
              Cancel
            </button>
            <button
              onClick={handleAdvancedRegenerate}
              className="btn btn-primary"
              disabled={isLoading}
            >
              {isLoading ? (
                <div className="flex items-center">
                  <div className="loading-spinner mr-2"></div>
                  Regenerating...
                </div>
              ) : (
                'Regenerate'
              )}
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdvancedRegenControls;