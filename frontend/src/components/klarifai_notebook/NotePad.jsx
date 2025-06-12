
// // NotePad.jsx - Add mindmap props and button
// import  { useState, useEffect, useRef } from 'react';
// import { 
//   Plus, 
//   Save, 
//   Trash2, 
//   Edit3, 
//   X, 
//   Search,
//   StickyNote,
//   BookOpen,
//   Calendar,
//   FileUp,
//   Loader,
//   Expand,
//   Eye,
//   Brain,  // Add Brain icon
//   PanelRight
// } from 'lucide-react';
// import { toast } from 'react-toastify';
// import { noteServiceNB } from '../../utils/axiosConfig';
// import NoteEditorModal from './NoteEditorModal';  
// import PropTypes from 'prop-types';

// // Add mindmap props to component
// const NotePad = ({ 
//   mainProjectId, 
//   isOpen, 
//   onToggle, 
//   onOpenEditor, 
//   onOpenViewer, 
//   onShowConfirmation,
//   // Add mindmap props
//   onGenerateMindmap,
//   isMindmapGenerating,
//   selectedDocuments
// }) => {
//   const [notes, setNotes] = useState([]);
//   const [selectedNote, setSelectedNote] = useState(null);
//   const [isEditing, setIsEditing] = useState(false);
//   const [noteTitle, setNoteTitle] = useState('');
//   const [noteContent, setNoteContent] = useState('');
//   const [searchTerm, setSearchTerm] = useState('');
//   const [isLoading, setIsLoading] = useState(false);
//   const [isSaving, setIsSaving] = useState(false);
//   const [isConverting, setIsConverting] = useState(false);
//   const [convertingNoteId, setConvertingNoteId] = useState(null);
//   const textareaRef = useRef(null);
//   const [isModalOpen, setIsModalOpen] = useState(false);

//   // ... keep all your existing useEffects and functions exactly the same ...

//   // Fetch notes on component mount
//   useEffect(() => {
//     if (mainProjectId && isOpen) {
//       fetchNotes();
//     }
//   }, [mainProjectId, isOpen]);

//   // Auto-resize textarea - disabled to maintain consistent height
//   useEffect(() => {
//     if (textareaRef.current) {
//       textareaRef.current.style.height = '200px';
//     }
//   }, [noteContent]);

//   useEffect(() => {
//     const handleRefresh = () => {
//       fetchNotes();
//     };

//     document.addEventListener('refreshNotePad', handleRefresh);
    
//     return () => {
//       document.removeEventListener('refreshNotePad', handleRefresh);
//     };
//   }, [mainProjectId]); 

//   const fetchNotes = async () => {
//     setIsLoading(true);
//     try {
//       console.log('Fetching notes for project:', mainProjectId);
//       const response = await noteServiceNB.getNotes(mainProjectId);
//       console.log('Notes fetch response:', response.data);
      
//       if (response.data) {
//         const notesData = response.data.notes || response.data.data || response.data || [];
//         setNotes(Array.isArray(notesData) ? notesData : []);
//         console.log('Notes loaded:', notesData.length);
//       } else {
//         setNotes([]);
//       }
//     } catch (error) {
//       console.error('Failed to fetch notes:', error);
//       toast.error('Failed to fetch notes');
//       setNotes([]);
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   const refreshNotesQuietly = async () => {
//     try {
//       console.log('Quietly refreshing notes for project:', mainProjectId);
//       const response = await noteServiceNB.getNotes(mainProjectId);
//       console.log('Quiet notes fetch response:', response.data);
      
//       if (response.data) {
//         const notesData = response.data.notes || response.data.data || response.data || [];
//         setNotes(Array.isArray(notesData) ? notesData : []);
//         console.log('Notes quietly updated:', notesData.length);
//       }
//     } catch (error) {
//       console.error('Failed to quietly refresh notes:', error);
//     }
//   };

//   const handleCreateNote = () => {
//     setSelectedNote(null);
//     setNoteTitle('');
//     setNoteContent('');
//     setIsEditing(true);
//   };

//   const handleSelectNote = (note) => {
//     if (isEditing && (noteTitle !== (selectedNote?.title || '') || noteContent !== (selectedNote?.content || ''))) {
//       if (window.confirm('You have unsaved changes. Are you sure you want to switch notes?')) {
//         setSelectedNote(note);
//         setNoteTitle(note.title || '');
//         setNoteContent(note.content || '');
//         setIsEditing(false);
//       }
//     } else {
//       setSelectedNote(note);
//       setNoteTitle(note.title || '');
//       setNoteContent(note.content || '');
//       setIsEditing(false);
//     }
//   };

//   const handleSaveNote = async () => {
//     if (!noteContent.trim()) {
//       toast.warning('Note content cannot be empty');
//       return;
//     }

//     setIsSaving(true);
//     try {
//       console.log('Saving note:', {
//         title: noteTitle.trim() || 'Untitled Note',
//         content: noteContent.trim(),
//         mainProjectId,
//         noteId: selectedNote?.id
//       });

//       const response = await noteServiceNB.saveNote(
//         noteTitle.trim() || 'Untitled Note',
//         noteContent.trim(),
//         mainProjectId,
//         {},
//         null,
//         selectedNote?.id || null
//       );

//       console.log('Save note response:', response.data);

//       if (response.data) {
//         const isUpdate = selectedNote?.id;
//         toast.success(isUpdate ? 'Note updated successfully' : 'Note created successfully');
        
//         const savedNote = response.data.note;
//         if (savedNote) {
//           if (isUpdate) {
//             setNotes(prevNotes => 
//               prevNotes.map(note => 
//                 note.id === savedNote.id ? savedNote : note
//               )
//             );
//           } else {
//             setNotes(prevNotes => [savedNote, ...prevNotes]);
//           }
          
//           setSelectedNote(savedNote);
//           setNoteTitle(savedNote.title || '');
//           setNoteContent(savedNote.content || '');
//         }
        
//         setIsEditing(false);
        
//         setTimeout(() => {
//           refreshNotesQuietly();
//         }, 1000);
//       } else {
//         throw new Error('No response data received');
//       }
//     } catch (error) {
//       console.error('Failed to save note:', error);
//       const errorMessage = error.response?.data?.error || error.response?.data?.detail || 'Failed to save note';
//       toast.error(errorMessage);
//     } finally {
//       setIsSaving(false);
//     }
//   };

//   const handleShowDeleteConfirmation = (note) => {
//     if (onShowConfirmation) {
//       onShowConfirmation({
//         isOpen: true,
//         type: 'delete',
//         data: note,
//         isLoading: false
//       });
//     }
//   };

//   const handleShowConvertConfirmation = (note) => {
//     if (onShowConfirmation) {
//       onShowConfirmation({
//         isOpen: true,
//         type: 'convert',
//         data: note,
//         isLoading: false
//       });
//     }
//   };

//   const filteredNotes = notes.filter(note => {
//     if (!searchTerm.trim()) return true;
//     const searchLower = searchTerm.toLowerCase();
//     const titleMatch = (note.title || '').toLowerCase().includes(searchLower);
//     const contentMatch = (note.content || '').toLowerCase().includes(searchLower);
//     return titleMatch || contentMatch;
//   });

//   const formatDate = (dateString) => {
//     try {
//       const date = new Date(dateString);
//       return date.toLocaleDateString('en-US', { 
//         month: 'short', 
//         day: 'numeric',
//         hour: '2-digit',
//         minute: '2-digit'
//       });
//     } catch (error) {
//       return 'Invalid date';
//     }
//   };

//   if (!isOpen) {
//     return (
//       <button
//         onClick={onToggle}
//         className="fixed right-4 top-1/2 transform -translate-y-1/2 z-30 
//                    bg-[#f5e6d8] dark:bg-gray-800/90 
//                    text-[#5e4636] dark:text-white
//                    p-3 rounded-l-xl shadow-lg
//                    hover:bg-[#e8d5c4] dark:hover:bg-gray-700/90
//                    transition-all duration-300 border-l border-t border-b
//                    border-[#d6cbbf] dark:border-blue-500/20"
//         title="Open Notes"
//       >
//         <StickyNote className="h-5 w-5" />
//       </button>
//     );
//   }

//   return (
//     <div className="fixed right-0 top-16 bottom-0 w-80 z-30  rounded-md
//                     bg-[#f9f7f4] dark:bg-gray-900/95 
//                     border-l border-[#e3d5c8] dark:border-blue-500/20 
//                     shadow-2xl backdrop-blur-md
//                     flex flex-col overflow-hidden">
      
//       {/* Header - ONLY CHANGE IS HERE */}
//       <div className="p-4 border-b border-[#e3d5c8] dark:border-blue-500/20 
//                       bg-[#f0eee5] dark:bg-gray-800/80">
//         <div className="flex items-center justify-between mb-3">
//           <div className="flex items-center space-x-2">
//             <BookOpen className="h-5 w-5 text-[#a55233] dark:text-blue-400" />
//             <h2 className="text-lg font-semibold text-[#5e4636] dark:text-white">
//               Notes
//             </h2>
//           </div>
          
//           {/* ADD MINDMAP BUTTON AND CLOSE BUTTON CONTAINER */}
//           <div className="flex items-center space-x-2">
//             {/* Mindmap Button - Added here */}
//             {onGenerateMindmap && (
//               <button
//                 onClick={onGenerateMindmap}
//                 disabled={isMindmapGenerating || (selectedDocuments && selectedDocuments.length === 0)}
//                 className={`p-2 rounded-lg transition-colors flex items-center space-x-1
//                            ${(isMindmapGenerating || (selectedDocuments && selectedDocuments.length === 0))
//                              ? 'bg-gray-100 dark:bg-gray-800/50 text-gray-500 cursor-not-allowed'
//                              : 'bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white'
//                            }`}
//                 title={
//                   (!selectedDocuments || selectedDocuments.length === 0)
//                     ? "Select documents to generate mindmap" 
//                     : isMindmapGenerating 
//                       ? "Generating mindmap..." 
//                       : `Generate Mindmap (${selectedDocuments?.length || 0} docs)`
//                 }
//               >
//                 <Brain className={`h-4 w-4 ${isMindmapGenerating ? 'animate-pulse' : ''}`} />
//                 <span className="text-xs hidden lg:inline">
//                   {isMindmapGenerating ? 'Generating...' : 'Mindmap'}
//                 </span>
//               </button>
//             )}

//             {/* Close Button */}
//             <button
//               onClick={onToggle}
//               className="text-[#8c715f] dark:text-gray-400 hover:text-[#5e4636] dark:hover:text-white
//                          p-1 rounded-full hover:bg-[#e8d5c4] dark:hover:bg-gray-700/50
//                          transition-colors"
//             >
//               <PanelRight className="h-5 w-5" />
//             </button>
//           </div>
//         </div>

//         {/* Document count display - Add this if mindmap props are available */}
//         {selectedDocuments && selectedDocuments.length > 0 && (
//           <div className="text-xs text-[#8c715f] dark:text-gray-400 mb-3">
//             {selectedDocuments.length} document{selectedDocuments.length !== 1 ? 's' : ''} selected
//           </div>
//         )}

//         {/* Search and Create - Keep exactly the same */}
//         <div className="flex space-x-2">
//           <div className="relative flex-1">
//             <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 
//                              h-4 w-4 text-[#8c715f] dark:text-gray-400" />
//             <input
//               type="text"
//               placeholder="Search notes..."
//               value={searchTerm}
//               onChange={(e) => setSearchTerm(e.target.value)}
//               className="w-full pl-9 pr-3 py-2 text-sm rounded-lg
//                          bg-white dark:bg-gray-700/50
//                          border border-[#d6cbbf] dark:border-blue-500/20
//                          text-[#5e4636] dark:text-white
//                          placeholder:text-[#8c715f] dark:placeholder:text-gray-400
//                          focus:outline-none focus:ring-2 focus:ring-[#a55233] dark:focus:ring-blue-400
//                          focus:border-transparent"
//             />
//           </div>
//           <button
//             onClick={handleCreateNote}
//             disabled={isSaving}
//             className="p-2 bg-[#a55233] dark:bg-blue-600 
//                        hover:bg-[#8b4513] dark:hover:bg-blue-700
//                        text-white rounded-lg transition-colors
//                        disabled:opacity-50 disabled:cursor-not-allowed"
//             title="Create New Note"
//           >
//             <Plus className="h-4 w-4" />
//           </button>
//         </div>
//       </div>

//       {/* Keep everything else exactly the same */}
//       {/* Notes List */}
//       <div className="flex-1 overflow-y-auto custom-scrollbar">
//         {isLoading ? (
//           <div className="p-4 text-center text-[#8c715f] dark:text-gray-400">
//             <Loader className="h-5 w-5 animate-spin mx-auto mb-2" />
//             Loading notes...
//           </div>
//         ) : filteredNotes.length === 0 ? (
//           <div className="p-4 text-center text-[#8c715f] dark:text-gray-400">
//             {searchTerm ? 'No notes found matching your search' : 'No notes yet. Create your first note!'}
//           </div>
//         ) : (
//           <div className="p-2 space-y-2">
//             {filteredNotes.map((note) => (
//               <div
//                 key={note.id}
//                 onClick={() => handleSelectNote(note)}
//                 className={`p-3 rounded-lg cursor-pointer transition-all duration-200
//                            border hover:shadow-md
//                            ${selectedNote?.id === note.id
//                              ? 'bg-[#a55233]/10 dark:bg-blue-600/20 border-[#a55233]/30 dark:border-blue-500/40'
//                              : 'bg-white dark:bg-gray-800/50 border-[#e3d5c8] dark:border-gray-700/50 hover:bg-[#f5e6d8] dark:hover:bg-gray-700/50'
//                            }`}
//               >
//                 <div className="flex items-start justify-between">
//                   <div className="flex-1 min-w-0">
//                     <h3 className="font-medium text-[#5e4636] dark:text-white truncate text-sm">
//                       {note.title || 'Untitled Note'}
//                     </h3>
//                     <p className="text-xs text-[#8c715f] dark:text-gray-400 mt-1 line-clamp-2">
//                       {note.content ? note.content.substring(0, 100) + (note.content.length > 100 ? '...' : '') : 'No content'}
//                     </p>
//                     <div className="flex items-center space-x-2 mt-2">
//                       <Calendar className="h-3 w-3 text-[#8c715f] dark:text-gray-500" />
//                       <span className="text-xs text-[#8c715f] dark:text-gray-500">
//                         {formatDate(note.updated_at || note.created_at)}
//                       </span>
//                       {note.is_converted_to_document && (
//                         <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-xs
//                                        bg-green-100 dark:bg-green-900/30 
//                                        text-green-800 dark:text-green-400">
//                           Document
//                         </span>
//                       )}
//                     </div>
//                   </div>
//                   <div className="flex space-x-1 ml-2" onClick={(e) => e.stopPropagation()}>
//                     {!note.is_converted_to_document && (
//                       <button
//                         onClick={(e) => {
//                           e.stopPropagation();
//                           handleShowConvertConfirmation(note);
//                         }}
//                         disabled={convertingNoteId === note.id}
//                         className="p-1 text-[#8c715f] dark:text-gray-400 
//                                    hover:text-green-600 dark:hover:text-green-400
//                                    hover:bg-green-50 dark:hover:bg-green-900/20 
//                                    rounded transition-colors
//                                    disabled:opacity-50 disabled:cursor-not-allowed"
//                         title="Convert to Document Source"
//                       >
//                         {convertingNoteId === note.id ? (
//                           <Loader className="h-3 w-3 animate-spin" />
//                         ) : (
//                           <FileUp className="h-3 w-3" />
//                         )}
//                       </button>
//                     )}
//                     <button
//                       onClick={(e) => {
//                         e.stopPropagation();
//                         handleShowDeleteConfirmation(note);
//                       }}
//                       className="p-1 text-[#8c715f] dark:text-gray-400 
//                                  hover:text-red-600 dark:hover:text-red-400
//                                  hover:bg-red-50 dark:hover:bg-red-900/20 
//                                  rounded transition-colors"
//                       title="Delete Note"
//                     >
//                       <Trash2 className="h-3 w-3" />
//                     </button>
//                   </div>
//                 </div>
//               </div>
//             ))}
//           </div>
//         )}
//       </div>

//       {/* Note Editor - Keep exactly the same */}
//       {(selectedNote || isEditing) && (
//         <div className="p-1 border-t border-[#e3d5c8] dark:border-blue-500/20 
//                 bg-white dark:bg-gray-800/50 flex flex-col">

//           {/* Editor Header */}
//           <div className="p-2 border-b border-[#e3d5c8] dark:border-blue-500/20">
//             <div className="flex items-center justify-between mb-2">
//               <div className="flex items-center space-x-2">
//                 <Edit3 className="h-4 w-4 text-[#a55233] dark:text-blue-400" />
//                 <span className="text-sm font-medium text-[#5e4636] dark:text-white">
//                   {isEditing ? 'Editing Note' : 'Viewing Note'}
//                 </span>
//               </div>
//               <div className="flex space-x-1">
//                 {isEditing && onOpenEditor && (
//                   <button
//                     onClick={() => onOpenEditor({
//                       id: selectedNote?.id,
//                       title: noteTitle,
//                       content: noteContent
//                     })}
//                     className="p-1.5 text-[#8c715f] dark:text-gray-400 
//                                hover:text-[#a55233] dark:hover:text-blue-400
//                                hover:bg-[#f5e6d8] dark:hover:bg-gray-600/50 
//                                rounded transition-colors"
//                     title="Expand Editor"
//                   >
//                     <Expand className="h-3 w-3" />
//                   </button>
//                 )}
//                {onOpenViewer && (
//                   <button
//                     onClick={(e) => {
//                       e.stopPropagation();
//                       onOpenViewer(selectedNote);
//                     }}
//                     className="p-1 text-[#8c715f] dark:text-gray-400 
//                                hover:text-[#a55233] dark:hover:text-blue-400
//                                hover:bg-[#f5e6d8] dark:hover:bg-gray-600/50 
//                                rounded transition-colors"
//                     title="View Note"
//                   >
//                     <Eye className="h-3 w-3" />
//                   </button>
//                 )}

//                 {!isEditing && (
//                   <button
//                     onClick={() => setIsEditing(true)}
//                     className="p-1.5 text-[#8c715f] dark:text-gray-400 
//                                hover:text-[#a55233] dark:hover:text-blue-400
//                                hover:bg-[#f5e6d8] dark:hover:bg-gray-600/50 
//                                rounded transition-colors"
//                     title="Edit Note"
//                   >
//                     <Edit3 className="h-3 w-3" />
//                   </button>
//                 )}
//                 {isEditing && (
//                   <>
//                     <button
//                       onClick={handleSaveNote}
//                       disabled={isSaving}
//                       className="p-1.5 text-white bg-[#a55233] dark:bg-blue-600 
//                                  hover:bg-[#8b4513] dark:hover:bg-blue-700
//                                  rounded transition-colors disabled:opacity-50
//                                  disabled:cursor-not-allowed"
//                       title="Save Note"
//                     >
//                       {isSaving ? (
//                         <Loader className="h-3 w-3 animate-spin" />
//                       ) : (
//                         <Save className="h-3 w-3" />
//                       )}
//                     </button>
//                     <button
//                       onClick={() => {
//                         setIsEditing(false);
//                         if (selectedNote) {
//                           setNoteTitle(selectedNote.title || '');
//                           setNoteContent(selectedNote.content || '');
//                         } else {
//                           setSelectedNote(null);
//                           setNoteTitle('');
//                           setNoteContent('');
//                         }
//                       }}
//                       className="p-1.5 text-[#8c715f] dark:text-gray-400 
//                                  hover:text-red-600 dark:hover:text-red-400
//                                  hover:bg-red-50 dark:hover:bg-red-900/20 
//                                  rounded transition-colors"
//                       title="Cancel"
//                     >
//                       <X className="h-3 w-3" />
//                     </button>
//                   </>
//                 )}
//               </div>
//             </div>
//           </div>

//           {/* Title Input */}
//           <div className="p-3 border-b border-[#e3d5c8] dark:border-blue-500/20">
//             {isEditing ? (
//               <input
//                 type="text"
//                 value={noteTitle}
//                 onChange={(e) => setNoteTitle(e.target.value)}
//                 placeholder="Note title..."
//                 className="w-full p-2 text-sm font-medium rounded-lg
//                            bg-[#f9f7f4] dark:bg-gray-700/50
//                            border border-[#d6cbbf] dark:border-blue-500/20
//                            text-[#5e4636] dark:text-white
//                            placeholder:text-[#8c715f] dark:placeholder:text-gray-400
//                            focus:outline-none focus:ring-2 focus:ring-[#a55233] dark:focus:ring-blue-400
//                            focus:border-transparent"
//               />
//             ) : (
//               <div className="text-sm font-medium text-[#5e4636] dark:text-white 
//                             p-2 bg-[#f9f7f4] dark:bg-gray-700/50
//                             border border-[#d6cbbf] dark:border-blue-500/20 rounded-lg">
//                 {noteTitle || 'Untitled Note'}
//               </div>
//             )}
//           </div>

//           {/* Content Editor */}
//           <div className=" p-3 ">
//             {isEditing ? (
//               <textarea
//                 ref={textareaRef}
//                 value={noteContent}
//                 onChange={(e) => setNoteContent(e.target.value)}
//                 placeholder="Start writing your note..."
//                 className="w-full text-sm rounded-lg resize-none
//                            bg-[#f9f7f4] dark:bg-gray-700/50
//                            border border-[#d6cbbf] dark:border-blue-500/20
//                            text-[#5e4636] dark:text-white
//                            placeholder:text-[#8c715f] dark:placeholder:text-gray-400
//                            focus:outline-none focus:ring-2 focus:ring-[#a55233] dark:focus:ring-blue-400
//                            focus:border-transparent custom-scrollbar overflow-y-auto"
//                 style={{ height: '200px', padding: '8px', boxSizing: 'border-box' }}
//               />
//             ) : (
//               <div className="text-sm text-[#5e4636] dark:text-white 
//                   overflow-y-auto custom-scrollbar
//                   whitespace-pre-wrap bg-[#f9f7f4] dark:bg-gray-700/50
//                   border border-[#d6cbbf] dark:border-blue-500/20 rounded-lg"
//                   style={{ height: '200px', padding: '8px', boxSizing: 'border-box' }}>
//                 {noteContent || 'No content'}
//               </div>
//             )}
//           </div>
//         </div>
//       )}

//       {/* Custom Scrollbar Styles */}
//       <style >{`
//         .custom-scrollbar::-webkit-scrollbar {
//           width: 2px;
//           height: 2px;
//         }
//         .custom-scrollbar::-webkit-scrollbar-track {
//           background: rgba(214, 203, 191, 0.1);
//           border-radius: 10px;
//         }
//         .custom-scrollbar::-webkit-scrollbar-thumb {
//           background: rgba(165, 82, 51, 0.3);
//           border-radius: 10px;
//         }
//         .custom-scrollbar::-webkit-scrollbar-thumb:hover {
//           background: rgba(165, 82, 51, 0.5);
//         }
        
//         .dark .custom-scrollbar::-webkit-scrollbar-track {
//           background: rgba(59, 130, 246, 0.1);
//         }
//         .dark .custom-scrollbar::-webkit-scrollbar-thumb {
//           background: rgba(59, 130, 246, 0.3);
//         }
//         .dark .custom-scrollbar::-webkit-scrollbar-thumb:hover {
//           background: rgba(59, 130, 246, 0.5);
//         }

//         .line-clamp-2 {
//           overflow: hidden;
//           display: -webkit-box;
//           -webkit-box-orient: vertical;
//           -webkit-line-clamp: 2;
//         }
//       `}</style>
//     </div>
//   );
// };

// // Update PropTypes to include mindmap props
// NotePad.propTypes = {
//   mainProjectId: PropTypes.string.isRequired,
//   isOpen: PropTypes.bool.isRequired,
//   onToggle: PropTypes.func.isRequired,
//   onOpenEditor: PropTypes.func,
//   onOpenViewer: PropTypes.func,
//   onShowConfirmation: PropTypes.func.isRequired,
//   // Add mindmap prop types
//   onGenerateMindmap: PropTypes.func,
//   isMindmapGenerating: PropTypes.bool,
//   selectedDocuments: PropTypes.array
// };

// export default NotePad;

// NotePad.jsx - Add auto-expand functionality
import { useState, useEffect, useRef } from 'react';
import { 
  Plus, 
  Save, 
  Trash2, 
  Edit3, 
  X, 
  Search,
  StickyNote,
  BookOpen,
  Calendar,
  FileUp,
  Loader,
  Expand,
  Eye,
  Brain,  
  PanelRight
} from 'lucide-react';
import { toast } from 'react-toastify';
import { noteServiceNB } from '../../utils/axiosConfig';
import NoteEditorModal from './NoteEditorModal';  
import PropTypes from 'prop-types';

const NotePad = ({ 
  mainProjectId, 
  isOpen, 
  onToggle, 
  onOpenEditor, 
  onOpenViewer, 
  onShowConfirmation,
  onGenerateMindmap,
  isMindmapGenerating,
  selectedDocuments
}) => {
  const [notes, setNotes] = useState([]);
  const [selectedNote, setSelectedNote] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [noteTitle, setNoteTitle] = useState('');
  const [noteContent, setNoteContent] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isConverting, setIsConverting] = useState(false);
  const [convertingNoteId, setConvertingNoteId] = useState(null);
  const textareaRef = useRef(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Fetch notes on component mount
  useEffect(() => {
    if (mainProjectId && isOpen) {
      fetchNotes();
    }
  }, [mainProjectId, isOpen]);

  // Auto-resize textarea - disabled to maintain consistent height
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = '200px';
    }
  }, [noteContent]);

  useEffect(() => {
    const handleRefresh = () => {
      fetchNotes();
    };

    // NEW: Add auto-expand functionality
    const handleExpand = () => {
      if (!isOpen) {
        onToggle(); // This will open the NotePad
        // Optional: Show a brief notification
        setTimeout(() => {
          toast.info('NotePad expanded - your pinned response has been saved!', {
            autoClose: 3000,
            position: 'bottom-right'
          });
        }, 500);
      }
    };

    document.addEventListener('refreshNotePad', handleRefresh);
    document.addEventListener('expandNotePad', handleExpand);
    
    return () => {
      document.removeEventListener('refreshNotePad', handleRefresh);
      document.removeEventListener('expandNotePad', handleExpand);
    };
  }, [mainProjectId, isOpen, onToggle]); 

  // ... rest of your existing functions remain the same ...

  const fetchNotes = async () => {
    setIsLoading(true);
    try {
      console.log('Fetching notes for project:', mainProjectId);
      const response = await noteServiceNB.getNotes(mainProjectId);
      console.log('Notes fetch response:', response.data);
      
      if (response.data) {
        const notesData = response.data.notes || response.data.data || response.data || [];
        setNotes(Array.isArray(notesData) ? notesData : []);
        console.log('Notes loaded:', notesData.length);
      } else {
        setNotes([]);
      }
    } catch (error) {
      console.error('Failed to fetch notes:', error);
      toast.error('Failed to fetch notes');
      setNotes([]);
    } finally {
      setIsLoading(false);
    }
  };

  const refreshNotesQuietly = async () => {
    try {
      console.log('Quietly refreshing notes for project:', mainProjectId);
      const response = await noteServiceNB.getNotes(mainProjectId);
      console.log('Quiet notes fetch response:', response.data);
      
      if (response.data) {
        const notesData = response.data.notes || response.data.data || response.data || [];
        setNotes(Array.isArray(notesData) ? notesData : []);
        console.log('Notes quietly updated:', notesData.length);
      }
    } catch (error) {
      console.error('Failed to quietly refresh notes:', error);
    }
  };

  const handleCreateNote = () => {
    setSelectedNote(null);
    setNoteTitle('');
    setNoteContent('');
    setIsEditing(true);
  };

  const handleSelectNote = (note) => {
    if (isEditing && (noteTitle !== (selectedNote?.title || '') || noteContent !== (selectedNote?.content || ''))) {
      if (window.confirm('You have unsaved changes. Are you sure you want to switch notes?')) {
        setSelectedNote(note);
        setNoteTitle(note.title || '');
        setNoteContent(note.content || '');
        setIsEditing(false);
      }
    } else {
      setSelectedNote(note);
      setNoteTitle(note.title || '');
      setNoteContent(note.content || '');
      setIsEditing(false);
    }
  };

  const handleSaveNote = async () => {
    if (!noteContent.trim()) {
      toast.warning('Note content cannot be empty');
      return;
    }

    setIsSaving(true);
    try {
      console.log('Saving note:', {
        title: noteTitle.trim() || 'Untitled Note',
        content: noteContent.trim(),
        mainProjectId,
        noteId: selectedNote?.id
      });

      const response = await noteServiceNB.saveNote(
        noteTitle.trim() || 'Untitled Note',
        noteContent.trim(),
        mainProjectId,
        {},
        null,
        selectedNote?.id || null
      );

      console.log('Save note response:', response.data);

      if (response.data) {
        const isUpdate = selectedNote?.id;
        toast.success(isUpdate ? 'Note updated successfully' : 'Note created successfully');
        
        const savedNote = response.data.note;
        if (savedNote) {
          if (isUpdate) {
            setNotes(prevNotes => 
              prevNotes.map(note => 
                note.id === savedNote.id ? savedNote : note
              )
            );
          } else {
            setNotes(prevNotes => [savedNote, ...prevNotes]);
          }
          
          setSelectedNote(savedNote);
          setNoteTitle(savedNote.title || '');
          setNoteContent(savedNote.content || '');
        }
        
        setIsEditing(false);
        
        setTimeout(() => {
          refreshNotesQuietly();
        }, 1000);
      } else {
        throw new Error('No response data received');
      }
    } catch (error) {
      console.error('Failed to save note:', error);
      const errorMessage = error.response?.data?.error || error.response?.data?.detail || 'Failed to save note';
      toast.error(errorMessage);
    } finally {
      setIsSaving(false);
    }
  };

  const handleShowDeleteConfirmation = (note) => {
    if (onShowConfirmation) {
      onShowConfirmation({
        isOpen: true,
        type: 'delete',
        data: note,
        isLoading: false
      });
    }
  };

  const handleShowConvertConfirmation = (note) => {
    if (onShowConfirmation) {
      onShowConfirmation({
        isOpen: true,
        type: 'convert',
        data: note,
        isLoading: false
      });
    }
  };

  const filteredNotes = notes.filter(note => {
    if (!searchTerm.trim()) return true;
    const searchLower = searchTerm.toLowerCase();
    const titleMatch = (note.title || '').toLowerCase().includes(searchLower);
    const contentMatch = (note.content || '').toLowerCase().includes(searchLower);
    return titleMatch || contentMatch;
  });

  const formatDate = (dateString) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      return 'Invalid date';
    }
  };

  if (!isOpen) {
    return (
      <button
        onClick={onToggle}
        className="fixed right-4 top-1/2 transform -translate-y-1/2 z-30 
                   bg-[#f5e6d8] dark:bg-gray-800/90 
                   text-[#5e4636] dark:text-white
                   p-3 rounded-l-xl shadow-lg
                   hover:bg-[#e8d5c4] dark:hover:bg-gray-700/90
                   transition-all duration-300 border-l border-t border-b
                   border-[#d6cbbf] dark:border-blue-500/20"
        title="Open Notes"
      >
        <StickyNote className="h-5 w-5" />
      </button>
    );
  }

  return (
    <div className="fixed right-0 top-16 bottom-0 w-80 z-30 rounded-md
                    bg-[#f9f7f4] dark:bg-gray-900/95 
                    border-l border-[#e3d5c8] dark:border-blue-500/20 
                    shadow-2xl backdrop-blur-md
                    flex flex-col overflow-hidden">
      
      {/* Header */}
      <div className="p-4 border-b border-[#e3d5c8] dark:border-blue-500/20 
                      bg-[#f0eee5] dark:bg-gray-800/80">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            <BookOpen className="h-5 w-5 text-[#a55233] dark:text-blue-400" />
            <h2 className="text-lg font-semibold text-[#5e4636] dark:text-white">
              Notes
            </h2>
          </div>
          
          <div className="flex items-center space-x-2">
            {/* Mindmap Button */}
            {onGenerateMindmap && (
              <button
                onClick={onGenerateMindmap}
                disabled={isMindmapGenerating || (selectedDocuments && selectedDocuments.length === 0)}
                className={`p-2 rounded-lg transition-colors flex items-center space-x-1
                           ${(isMindmapGenerating || (selectedDocuments && selectedDocuments.length === 0))
                             ? 'bg-gray-100 dark:bg-gray-800/50 text-gray-500 cursor-not-allowed'
                             : 'bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white'
                           }`}
                title={
                  (!selectedDocuments || selectedDocuments.length === 0)
                    ? "Select documents to generate mindmap" 
                    : isMindmapGenerating 
                      ? "Generating mindmap..." 
                      : `Generate Mindmap (${selectedDocuments?.length || 0} docs)`
                }
              >
                <Brain className={`h-4 w-4 ${isMindmapGenerating ? 'animate-pulse' : ''}`} />
                <span className="text-xs hidden lg:inline">
                  {isMindmapGenerating ? 'Generating...' : 'Mindmap'}
                </span>
              </button>
            )}

            {/* Close Button */}
            <button
              onClick={onToggle}
              className="text-[#8c715f] dark:text-gray-400 hover:text-[#5e4636] dark:hover:text-white
                         p-1 rounded-full hover:bg-[#e8d5c4] dark:hover:bg-gray-700/50
                         transition-colors"
            >
              <PanelRight className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Document count display */}
        {selectedDocuments && selectedDocuments.length > 0 && (
          <div className="text-xs text-[#8c715f] dark:text-gray-400 mb-3">
            {selectedDocuments.length} document{selectedDocuments.length !== 1 ? 's' : ''} selected
          </div>
        )}

        {/* Search and Create */}
        <div className="flex space-x-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 
                             h-4 w-4 text-[#8c715f] dark:text-gray-400" />
            <input
              type="text"
              placeholder="Search notes..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-sm rounded-lg
                         bg-white dark:bg-gray-700/50
                         border border-[#d6cbbf] dark:border-blue-500/20
                         text-[#5e4636] dark:text-white
                         placeholder:text-[#8c715f] dark:placeholder:text-gray-400
                         focus:outline-none focus:ring-2 focus:ring-[#a55233] dark:focus:ring-blue-400
                         focus:border-transparent"
            />
          </div>
          <button
            onClick={handleCreateNote}
            disabled={isSaving}
            className="p-2 bg-[#a55233] dark:bg-blue-600 
                       hover:bg-[#8b4513] dark:hover:bg-blue-700
                       text-white rounded-lg transition-colors
                       disabled:opacity-50 disabled:cursor-not-allowed"
            title="Create New Note"
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Notes List */}
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        {isLoading ? (
          <div className="p-4 text-center text-[#8c715f] dark:text-gray-400">
            <Loader className="h-5 w-5 animate-spin mx-auto mb-2" />
            Loading notes...
          </div>
        ) : filteredNotes.length === 0 ? (
          <div className="p-4 text-center text-[#8c715f] dark:text-gray-400">
            {searchTerm ? 'No notes found matching your search' : 'No notes yet. Create your first note!'}
          </div>
        ) : (
          <div className="p-2 space-y-2">
            {filteredNotes.map((note) => (
              <div
                key={note.id}
                onClick={() => handleSelectNote(note)}
                className={`p-3 rounded-lg cursor-pointer transition-all duration-200
                           border hover:shadow-md
                           ${selectedNote?.id === note.id
                             ? 'bg-[#a55233]/10 dark:bg-blue-600/20 border-[#a55233]/30 dark:border-blue-500/40'
                             : 'bg-white dark:bg-gray-800/50 border-[#e3d5c8] dark:border-gray-700/50 hover:bg-[#f5e6d8] dark:hover:bg-gray-700/50'
                           }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-[#5e4636] dark:text-white truncate text-sm">
                      {note.title || 'Untitled Note'}
                    </h3>
                    <p className="text-xs text-[#8c715f] dark:text-gray-400 mt-1 line-clamp-2">
                      {note.content ? note.content.substring(0, 100) + (note.content.length > 100 ? '...' : '') : 'No content'}
                    </p>
                    <div className="flex items-center space-x-2 mt-2">
                      <Calendar className="h-3 w-3 text-[#8c715f] dark:text-gray-500" />
                      <span className="text-xs text-[#8c715f] dark:text-gray-500">
                        {formatDate(note.updated_at || note.created_at)}
                      </span>
                      {note.is_converted_to_document && (
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-xs
                                       bg-green-100 dark:bg-green-900/30 
                                       text-green-800 dark:text-green-400">
                          Document
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex space-x-1 ml-2" onClick={(e) => e.stopPropagation()}>
                    {!note.is_converted_to_document && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleShowConvertConfirmation(note);
                        }}
                        disabled={convertingNoteId === note.id}
                        className="p-1 text-[#8c715f] dark:text-gray-400 
                                   hover:text-green-600 dark:hover:text-green-400
                                   hover:bg-green-50 dark:hover:bg-green-900/20 
                                   rounded transition-colors
                                   disabled:opacity-50 disabled:cursor-not-allowed"
                        title="Convert to Document Source"
                      >
                        {convertingNoteId === note.id ? (
                          <Loader className="h-3 w-3 animate-spin" />
                        ) : (
                          <FileUp className="h-3 w-3" />
                        )}
                      </button>
                    )}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleShowDeleteConfirmation(note);
                      }}
                      className="p-1 text-[#8c715f] dark:text-gray-400 
                                 hover:text-red-600 dark:hover:text-red-400
                                 hover:bg-red-50 dark:hover:bg-red-900/20 
                                 rounded transition-colors"
                      title="Delete Note"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Note Editor - Keep exactly the same */}
      {(selectedNote || isEditing) && (
        <div className="p-1 border-t border-[#e3d5c8] dark:border-blue-500/20 
                bg-white dark:bg-gray-800/50 flex flex-col">

          {/* Editor Header */}
          <div className="p-2 border-b border-[#e3d5c8] dark:border-blue-500/20">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-2">
                <Edit3 className="h-4 w-4 text-[#a55233] dark:text-blue-400" />
                <span className="text-sm font-medium text-[#5e4636] dark:text-white">
                  {isEditing ? 'Editing Note' : 'Viewing Note'}
                </span>
              </div>
              <div className="flex space-x-1">
                {isEditing && onOpenEditor && (
                  <button
                    onClick={() => onOpenEditor({
                      id: selectedNote?.id,
                      title: noteTitle,
                      content: noteContent
                    })}
                    className="p-1.5 text-[#8c715f] dark:text-gray-400 
                               hover:text-[#a55233] dark:hover:text-blue-400
                               hover:bg-[#f5e6d8] dark:hover:bg-gray-600/50 
                               rounded transition-colors"
                    title="Expand Editor"
                  >
                    <Expand className="h-3 w-3" />
                  </button>
                )}
               {onOpenViewer && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onOpenViewer(selectedNote);
                    }}
                    className="p-1 text-[#8c715f] dark:text-gray-400 
                               hover:text-[#a55233] dark:hover:text-blue-400
                               hover:bg-[#f5e6d8] dark:hover:bg-gray-600/50 
                               rounded transition-colors"
                    title="View Note"
                  >
                    <Eye className="h-3 w-3" />
                  </button>
                )}

                {!isEditing && (
                  <button
                    onClick={() => setIsEditing(true)}
                    className="p-1.5 text-[#8c715f] dark:text-gray-400 
                               hover:text-[#a55233] dark:hover:text-blue-400
                               hover:bg-[#f5e6d8] dark:hover:bg-gray-600/50 
                               rounded transition-colors"
                    title="Edit Note"
                  >
                    <Edit3 className="h-3 w-3" />
                  </button>
                )}
                {isEditing && (
                  <>
                    <button
                      onClick={handleSaveNote}
                      disabled={isSaving}
                      className="p-1.5 text-white bg-[#a55233] dark:bg-blue-600 
                                 hover:bg-[#8b4513] dark:hover:bg-blue-700
                                 rounded transition-colors disabled:opacity-50
                                 disabled:cursor-not-allowed"
                      title="Save Note"
                    >
                      {isSaving ? (
                        <Loader className="h-3 w-3 animate-spin" />
                      ) : (
                        <Save className="h-3 w-3" />
                      )}
                    </button>
                    <button
                      onClick={() => {
                        setIsEditing(false);
                        if (selectedNote) {
                          setNoteTitle(selectedNote.title || '');
                          setNoteContent(selectedNote.content || '');
                        } else {
                          setSelectedNote(null);
                          setNoteTitle('');
                          setNoteContent('');
                        }
                      }}
                      className="p-1.5 text-[#8c715f] dark:text-gray-400 
                                 hover:text-red-600 dark:hover:text-red-400
                                 hover:bg-red-50 dark:hover:bg-red-900/20 
                                 rounded transition-colors"
                      title="Cancel"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Title Input */}
          <div className="p-3 border-b border-[#e3d5c8] dark:border-blue-500/20">
            {isEditing ? (
              <input
                type="text"
                value={noteTitle}
                onChange={(e) => setNoteTitle(e.target.value)}
                placeholder="Note title..."
                className="w-full p-2 text-sm font-medium rounded-lg
                           bg-[#f9f7f4] dark:bg-gray-700/50
                           border border-[#d6cbbf] dark:border-blue-500/20
                           text-[#5e4636] dark:text-white
                           placeholder:text-[#8c715f] dark:placeholder:text-gray-400
                           focus:outline-none focus:ring-2 focus:ring-[#a55233] dark:focus:ring-blue-400
                           focus:border-transparent"
              />
            ) : (
              <div className="text-sm font-medium text-[#5e4636] dark:text-white 
                            p-2 bg-[#f9f7f4] dark:bg-gray-700/50
                            border border-[#d6cbbf] dark:border-blue-500/20 rounded-lg">
                {noteTitle || 'Untitled Note'}
              </div>
            )}
          </div>

          {/* Content Editor */}
          <div className=" p-3 ">
            {isEditing ? (
              <textarea
                ref={textareaRef}
                value={noteContent}
                onChange={(e) => setNoteContent(e.target.value)}
                placeholder="Start writing your note..."
                className="w-full text-sm rounded-lg resize-none
                           bg-[#f9f7f4] dark:bg-gray-700/50
                           border border-[#d6cbbf] dark:border-blue-500/20
                           text-[#5e4636] dark:text-white
                           placeholder:text-[#8c715f] dark:placeholder:text-gray-400
                           focus:outline-none focus:ring-2 focus:ring-[#a55233] dark:focus:ring-blue-400
                           focus:border-transparent custom-scrollbar overflow-y-auto"
                style={{ height: '200px', padding: '8px', boxSizing: 'border-box' }}
              />
            ) : (
              <div className="text-sm text-[#5e4636] dark:text-white 
                  overflow-y-auto custom-scrollbar
                  whitespace-pre-wrap bg-[#f9f7f4] dark:bg-gray-700/50
                  border border-[#d6cbbf] dark:border-blue-500/20 rounded-lg"
                  style={{ height: '200px', padding: '8px', boxSizing: 'border-box' }}>
                {noteContent || 'No content'}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Custom Scrollbar Styles */}
      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 2px;
          height: 2px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(214, 203, 191, 0.1);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(165, 82, 51, 0.3);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(165, 82, 51, 0.5);
        }
        
        .dark .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(59, 130, 246, 0.1);
        }
        .dark .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(59, 130, 246, 0.3);
        }
        .dark .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(59, 130, 246, 0.5);
        }

        .line-clamp-2 {
          overflow: hidden;
          display: -webkit-box;
          -webkit-box-orient: vertical;
          -webkit-line-clamp: 2;
        }
      `}</style>
    </div>
  );
};

NotePad.propTypes = {
  mainProjectId: PropTypes.string.isRequired,
  isOpen: PropTypes.bool.isRequired,
  onToggle: PropTypes.func.isRequired,
  onOpenEditor: PropTypes.func,
  onOpenViewer: PropTypes.func,
  onShowConfirmation: PropTypes.func.isRequired,
  onGenerateMindmap: PropTypes.func,
  isMindmapGenerating: PropTypes.bool,
  selectedDocuments: PropTypes.array
};

export default NotePad;
