

import React, { useState } from 'react';
import { PlusCircle, X, Edit2, Check, ChevronRight, ChevronDown } from 'lucide-react';

const FieldManager = ({ 
  predefinedFieldTypes,
  customFieldTypes, 
  setCustomFieldTypes, 
  addField,
  newCustomField, 
  setNewCustomField,
  dynamicFields,
  setDynamicFields,
  currentProject,
  saveProject
}) => {
  const [editingField, setEditingField] = useState(null);
  const [editValue, setEditValue] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);
  const [expandedSections, setExpandedSections] = useState({
    predefined: true,
    custom: true
  });

  // Get all unique field types currently in use
 

  const handleEditStart = (fieldType, e) => {
    e.preventDefault();
    setEditingField(fieldType);
    setEditValue(fieldType);
  };

  const handleEditSave = (oldValue, e) => {
    e.preventDefault();
    if (editValue.trim() !== '' && editValue !== oldValue) {
      setCustomFieldTypes(prev => 
        prev.map(type => type === oldValue ? editValue : type)
      );
      
      // Update field types in dynamic fields
      setDynamicFields(prev => {
        const updated = { ...prev };
        Object.entries(updated).forEach(([key, field]) => {
          if (field.type === oldValue) {
            updated[key] = { ...field, type: editValue };
          }
        });
        return updated;
      });
    }
    setEditingField(null);
    setEditValue('');
  };

  const handleDelete = (fieldType, e) => {
    e.preventDefault();
    setCustomFieldTypes(prev => prev.filter(type => type !== fieldType));
  
    // Update currentProject.customFieldTypes
    if (currentProject && saveProject) {
      const updatedCustomFieldTypes = (currentProject.customFieldTypes || [])
        .filter(type => type !== fieldType);
      saveProject({ ...currentProject, customFieldTypes: updatedCustomFieldTypes });
    }
      
    // Remove fields of this type from dynamic fields
    setDynamicFields(prev => {
      const updated = { ...prev };
      Object.entries(updated).forEach(([key, field]) => {
        if (field.type === fieldType) {
          delete updated[key];
        }
      });
      return updated;
    });
    
    setShowDeleteConfirm(null);
  };

  const addCustomFieldType = (e) => {
    e.preventDefault();
    const trimmedField = newCustomField.trim();
    if (trimmedField && !customFieldTypes.includes(trimmedField)) {
      const updatedCustomFieldTypes = [...customFieldTypes, trimmedField];
      
      // Update local state
      setCustomFieldTypes(updatedCustomFieldTypes);
      setNewCustomField('');
  
      // Update project data if possible
      if (currentProject && saveProject) {
        saveProject({
          ...currentProject,
          customFieldTypes: updatedCustomFieldTypes
        });
      }
    }
  };

  const handleAddField = (type, e) => {
    e.preventDefault();
    addField(type);
  };

  const toggleSection = (section, e) => {
    e.preventDefault();
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  // Helper function to get existing fields of a type
  const getExistingFieldsOfType = (type) => {
    return Object.values(dynamicFields).filter(field => field.type === type);
  };

  const renderFieldButton = (type, isPredefined = false) => {
    const existingFields = getExistingFieldsOfType(type);
    const isActive = existingFields.length > 0;

    return (
      <div key={type} className="relative group">
        {editingField === type ? (
          <div className="flex items-center gap-2 bg-white dark:bg-gray-800 rounded-lg border border-[#a55233] dark:border-blue-500 p-1">
            <input
              type="text"
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              className="px-2 py-1 bg-transparent text-[#5e4636] dark:text-white focus:outline-none w-32"
              autoFocus
            />
            <button
              type="button"
              onClick={(e) => handleEditSave(type, e)}
              className="p-1 text-[#556052] hover:text-[#425142] dark:hover:text-green-500 transition-colors"
            >
              <Check size={16} />
            </button>
          </div>
        ) : showDeleteConfirm === type ? (
          <div className="flex items-center gap-2 bg-white dark:bg-gray-800 rounded-lg border border-red-500 p-2">
            <span className="text-sm text-[#5e4636] dark:text-white">Delete?</span>
            <button
              type="button"
              onClick={(e) => handleDelete(type, e)}
              className="text-red-600 hover:text-red-700 dark:text-red-500 dark:hover:text-red-400 px-2"
            >
              Yes
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                setShowDeleteConfirm(null);
              }}
              className="text-[#5a544a] hover:text-[#5e4636] dark:text-gray-400 dark:hover:text-white px-2"
            >
              No
            </button>
          </div>
        ) : (
          <div className={`flex items-center justify-between gap-2 rounded-lg p-2 transition-colors ${
            isActive 
              ? 'bg-[#a44704] dark:bg-gradient-to-r dark:from-blue-600 dark:to-emerald-600' 
              : 'bg-[#a55233] dark:bg-gradient-to-r dark:from-blue-500 dark:to-emerald-500'
          } group-hover:opacity-90`}>
            <button
              type="button"
              onClick={(e) => handleAddField(type, e)}
              className="text-white flex items-center justify-center gap-2 flex-grow"
            >
              <PlusCircle size={16} />
              <span className="truncate">{type}</span>
              {isActive && (
                <span className="text-xs bg-white/20 px-2 py-0.5 rounded-full ml-2">
                  {existingFields.length}
                </span>
              )}
            </button>
            {!isPredefined && (
              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  type="button"
                  onClick={(e) => handleEditStart(type, e)}
                  className="p-1 text-white/80 hover:text-white dark:hover:text-blue-500 transition-colors"
                  title="Edit field name"
                >
                  <Edit2 size={14} />
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    setShowDeleteConfirm(type);
                  }}
                  className="p-1 text-white/80 hover:text-white dark:hover:text-red-500 transition-colors"
                  title="Delete field"
                >
                  <X size={14} />
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6 bg-[#e9dcc9]/50 dark:bg-gray-800/50 p-6 rounded-lg border border-[#d6cbbf] dark:border-gray-700">
      {/* Predefined Fields Section */}
      <div className="space-y-3">
        <button
          type="button"
          onClick={(e) => toggleSection('predefined', e)}
          className="flex items-center gap-2 text-lg font-medium text-[#0a3b25] dark:text-white w-full"
        >
          {expandedSections.predefined ? 
            <ChevronDown size={20} className="text-[#a55233] dark:text-white" /> : 
            <ChevronRight size={20} className="text-[#a55233] dark:text-white" />
          }
          Predefined Fields
        </button>
        
        {expandedSections.predefined && (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
            {predefinedFieldTypes.map(type => renderFieldButton(type, true))}
          </div>
        )}
      </div>

      {/* Custom Fields Section */}
      <div className="space-y-3 border-t border-[#e3d5c8] dark:border-gray-700 pt-4">
        <button
          type="button"
          onClick={(e) => toggleSection('custom', e)}
          className="flex items-center gap-2 text-lg font-medium text-[#0a3b25] dark:text-white w-full"
        >
          {expandedSections.custom ? 
            <ChevronDown size={20} className="text-[#a55233] dark:text-white" /> : 
            <ChevronRight size={20} className="text-[#a55233] dark:text-white" />
          }
          Custom Fields
        </button>
        
        {expandedSections.custom && (
          <div className="space-y-4">
            {/* Input for new custom field */}
            <div className="flex gap-2">
              <input
                type="text"
                value={newCustomField}
                onChange={(e) => setNewCustomField(e.target.value)}
                placeholder="Create a new custom field..."
                className="flex-1 px-4 py-2 bg-white/80 dark:bg-gray-700 border border-[#d6cbbf] dark:border-gray-600 rounded-lg text-[#5e4636] dark:text-white focus:ring-2 focus:ring-[#a55233]/50 dark:focus:ring-blue-500 focus:border-[#a55233] dark:focus:border-blue-500"
              />
              <button
                type="button"
                onClick={addCustomFieldType}
                className="px-4 py-2  bg-[#556052] dark:bg-gradient-to-r dark:from-blue-500 dark:to-emerald-500 text-white rounded-lg hover:bg-[#425142] dark:hover:from-blue-600 dark:hover:to-emerald-600 transition-all flex items-center gap-2"
              >
                <PlusCircle size={16} />
                Add Field
              </button>
            </div>

            {/* Custom fields grid */}
            {customFieldTypes && customFieldTypes.length > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                {customFieldTypes.map(type => renderFieldButton(type, false))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default FieldManager;