// NotePad.jsx - Updated version without React Quill + Custom Scrollbar
import { useState, useEffect, useRef } from "react";
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
  PanelRight,
  History,
  ScrollText,
  Notebook
} from "lucide-react";
import { toast } from "react-toastify";
import { noteServiceNB } from "../../utils/axiosConfig";
import PropTypes from "prop-types";
import { useUser } from "../../context/UserContext";

const NotePad = ({
  mainProjectId,
  isOpen,
  onToggle,
  onOpenEditor,
  onOpenViewer,
  onShowConfirmation,
  onGenerateMindmap,
  isMindmapGenerating,
  selectedDocuments,
  onViewMindmapHistory,
}) => {
  const [notes, setNotes] = useState([]);
  const [selectedNote, setSelectedNote] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [noteTitle, setNoteTitle] = useState("");
  const [noteContent, setNoteContent] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [convertingNoteId, setConvertingNoteId] = useState(null);
  const editorRef = useRef(null);

  const { rightPanelPermissions, loading: permissionsLoading } = useUser();
  const isNotesPanelDisabled = rightPanelPermissions?.["notes-panel"];
// Add this function after your state declarations and before your other functions
const dispatchRefreshEvent = () => {
  document.dispatchEvent(new CustomEvent('queryComplete'));
};
  const stripHtml = (html) => {
    if (!html) return "";
    const tmp = document.createElement("div");
    tmp.innerHTML = html;
    return tmp.textContent || tmp.innerText || "";
  };

  const getFirstLine = (html) => {
    const text = stripHtml(html || "");
    return text.split("\n").find((line) => line.trim()) || "Untitled Note";
  };

  // Fetch notes on component mount
  useEffect(() => {
    if (mainProjectId && isOpen) {
      fetchNotes();
    }
  }, [mainProjectId, isOpen]);

  // Initialize editor content when editing starts
  useEffect(() => {
    if (isEditing && editorRef.current && noteContent !== undefined) {
      if (editorRef.current.innerHTML !== noteContent) {
        editorRef.current.innerHTML = noteContent || "";
      }
    }
  }, [isEditing, noteContent]);

  useEffect(() => {
    const handleRefresh = () => {
      fetchNotes();
    };

    // Handle note deletion from external components
    const handleNoteDeleted = (event) => {
      const deletedNoteId = event.detail?.noteId;
      if (deletedNoteId) {
        setNotes((prevNotes) =>
          prevNotes.filter((note) => note.id !== deletedNoteId)
        );

        // Clear selected note if it was deleted
        if (selectedNote?.id === deletedNoteId) {
          setSelectedNote(null);
          setNoteTitle("");
          setNoteContent("");
          setIsEditing(false);
        }
      }
    };

    // NEW: Add auto-expand functionality
    const handleExpand = () => {
      if (!isOpen) {
        onToggle(); // This will open the NotePad
        // Optional: Show a brief notification
        setTimeout(() => {
          toast.info(
            "NotePad expanded - your pinned response has been saved!",
            {
              autoClose: 3000,
              position: "bottom-right",
            }
          );
        }, 500);
      }
    };

    document.addEventListener("refreshNotePad", handleRefresh);
    document.addEventListener("expandNotePad", handleExpand);
    document.addEventListener("noteDeleted", handleNoteDeleted);

    return () => {
      document.removeEventListener("refreshNotePad", handleRefresh);
      document.removeEventListener("expandNotePad", handleExpand);
      document.removeEventListener("noteDeleted", handleNoteDeleted);
    };
  }, [mainProjectId, isOpen, onToggle, selectedNote]);

  const fetchNotes = async () => {
    setIsLoading(true);
    try {
      console.log("Fetching notes for project:", mainProjectId);
      const response = await noteServiceNB.getNotes(mainProjectId);
      console.log("Notes fetch response:", response.data);

      if (response.data) {
        const notesData =
          response.data.notes || response.data.data || response.data || [];
        setNotes(Array.isArray(notesData) ? notesData : []);
        console.log("Notes loaded:", notesData.length);
      } else {
        setNotes([]);
      }
    } catch (error) {
      console.error("Failed to fetch notes:", error);
      toast.error("Failed to fetch notes");
      setNotes([]);
    } finally {
      setIsLoading(false);
    }
  };

  const refreshNotesQuietly = async () => {
    try {
      console.log("Quietly refreshing notes for project:", mainProjectId);
      const response = await noteServiceNB.getNotes(mainProjectId);
      console.log("Quiet notes fetch response:", response.data);

      if (response.data) {
        const notesData =
          response.data.notes || response.data.data || response.data || [];
        setNotes(Array.isArray(notesData) ? notesData : []);
        console.log("Notes quietly updated:", notesData.length);
      }
    } catch (error) {
      console.error("Failed to quietly refresh notes:", error);
    }
  };

  const handleCreateNote = () => {
    setSelectedNote(null);
    setNoteTitle("");
    setNoteContent("");
    setIsEditing(true);
  };

  const handleSelectNote = (note) => {
    if (
      isEditing &&
      (noteTitle !== (selectedNote?.title || "") ||
        noteContent !== (selectedNote?.content || ""))
    ) {
      if (
        window.confirm(
          "You have unsaved changes. Are you sure you want to switch notes?"
        )
      ) {
        setSelectedNote(note);
        setNoteTitle(note.title || "");
        setNoteContent(note.content || "");
        setIsEditing(false);
      }
      if (note.is_converted_to_document) {
        setIsEditing(false); // Force read-only mode for documents
      }
    } else {
      setSelectedNote(note);
      setNoteTitle(note.title || "");
      setNoteContent(note.content || "");
      setIsEditing(false);
    }
  };

  const handleEditorInput = (e) => {
    setNoteContent(e.target.innerHTML);
  };

  const handleSaveNote = async () => {
    if (!noteContent.trim()) {
      toast.warning("Note content cannot be empty");
      return;
    }

    setIsSaving(true);
    try {
      const finalTitle = (noteTitle.trim() || getFirstLine(noteContent)).slice(
        0,
        40
      );
      console.log("Saving note:", {
        title: noteTitle.trim() || "Untitled Note",
        content: noteContent.trim(),
        mainProjectId,
        noteId: selectedNote?.id,
      });

      const response = await noteServiceNB.saveNote(
        finalTitle,
        noteContent.trim(),
        mainProjectId,
        {},
        null,
        selectedNote?.id || null
      );

      console.log("Save note response:", response.data);

      if (response.data) {
        const isUpdate = selectedNote?.id;
        toast.success(
          isUpdate ? "Note updated successfully" : "Note created successfully"
        );

        const savedNote = response.data.note;
        if (savedNote) {
          if (isUpdate) {
            setNotes((prevNotes) =>
              prevNotes.map((note) =>
                note.id === savedNote.id ? savedNote : note
              )
            );
          } else {
            setNotes((prevNotes) => [savedNote, ...prevNotes]);
          }

          setSelectedNote(savedNote);
          setNoteTitle(savedNote.title || "");
          setNoteContent(savedNote.content || "");
        }

        setIsEditing(false);

        setTimeout(() => {
          refreshNotesQuietly();
        }, 1000);
      } else {
        throw new Error("No response data received");
      }
    } catch (error) {
      console.error("Failed to save note:", error);
      const errorMessage =
        error.response?.data?.error ||
        error.response?.data?.detail ||
        "Failed to save note";
      toast.error(errorMessage);
    } finally {
      setIsSaving(false);
    }
  };

  const handleShowDeleteConfirmation = (note) => {
    // Close note editor if the note being deleted is currently selected
    if (selectedNote?.id === note.id) {
      handleCloseNoteEditor();
    }

    if (onShowConfirmation) {
      onShowConfirmation({
        isOpen: true,
        type: "delete",
        data: note,
        isLoading: false,
      });
    }
  };

  const handleShowConvertConfirmation = (note) => {
    if (onShowConfirmation) {
      onShowConfirmation({
        isOpen: true,
        type: "convert",
        data: note,
        isLoading: false,
      });
        setTimeout(() => {
      dispatchRefreshEvent();
    }, 1000); 
    }
  };

  const handleCloseNoteEditor = () => {
    setSelectedNote(null);
    setNoteTitle("");
    setNoteContent("");
    setIsEditing(false);
  };

  const filteredNotes = notes.filter((note) => {
    if (!searchTerm.trim()) return true;
    const searchLower = searchTerm.toLowerCase();
    const titleMatch = (note.title || "").toLowerCase().includes(searchLower);
    const contentMatch = (note.content || "")
      .toLowerCase()
      .includes(searchLower);
    return titleMatch || contentMatch;
  });

  const formatDate = (dateString) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch (error) {
      return "Invalid date";
    }
  };

  if (!isOpen) {
    return (
      <button
        onClick={isNotesPanelDisabled ? undefined : onToggle}
        disabled={isNotesPanelDisabled}
        className={`fixed right-4 top-1/2 transform -translate-y-1/2 z-30 
                   p-3 rounded-l-xl shadow-lg
                   transition-all duration-300 border-l border-t border-b
                   ${
                     isNotesPanelDisabled
                       ? "bg-gray-200 dark:bg-gray-700 text-gray-400 cursor-not-allowed opacity-50 border-gray-300 dark:border-gray-600"
                       : "bg-[#f5e6d8] dark:bg-gray-800/90 text-[#5e4636] dark:text-white hover:bg-[#e8d5c4] dark:hover:bg-gray-700/90 border-[#d6cbbf] dark:border-blue-500/20"
                   }`}
        title={
          isNotesPanelDisabled
            ? "Notes access disabled by administrator"
            : "Open Notes"
        }
      >
        <StickyNote className="h-5 w-5" />
      </button>
    );
  }

  return (
    <div
      className="fixed right-0 top-16 bottom-0 w-80 z-30 rounded-md
                    bg-[#f9f7f4] dark:bg-gray-900/95 
                    border-l border-[#e3d5c8] dark:border-blue-500/20 
                    shadow-2xl backdrop-blur-md
                    flex flex-col overflow-hidden"
    >
      {/* Add permission check overlay */}
      {isNotesPanelDisabled && (
        <div className="absolute top-16 left-0 right-0 bottom-0 bg-black/50 z-40 flex items-center justify-center">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-xl text-center max-w-xs">
            <StickyNote className="h-12 w-12 mx-auto mb-4 text-gray-400" />
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-2">
              Access Restricted
            </h3>
            <p className="text-gray-600 dark:text-gray-300 text-sm">
              Notes access has been disabled by your administrator.
            </p>
          </div>
        </div>
      )}

      {/* Header */}
      <div
        className="p-2 border-b border-[#e3d5c8] dark:border-blue-500/20 
                      bg-[#f0eee5] dark:bg-gray-800/80"
      >
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center space-x-2">
            <BookOpen className="h-5 w-5 text-[#a55233] dark:text-blue-400" />
            <h2 className="text-lg font-semibold text-[#5e4636] dark:text-white">
              Notes
            </h2>
          </div>

          <div className="flex items-center space-x-2">
            {/* History Button */}
            {onViewMindmapHistory && (
              <button
                onClick={onViewMindmapHistory}
                className="p-2 rounded-lg transition-colors
                           bg-gradient-to-r from-green-600 to-teal-600 hover:from-green-700 hover:to-teal-700 text-white"
                title="View MindMap History"
              >
                <History className="h-4 w-4" />
              </button>
            )}
            {/* Mindmap Button */}
            {onGenerateMindmap && (
              <button
                onClick={() => onGenerateMindmap()}
                disabled={
                  isMindmapGenerating ||
                  (selectedDocuments && selectedDocuments.length === 0)
                }
                className={`p-2 rounded-lg transition-colors flex items-center space-x-1
                           ${
                             isMindmapGenerating ||
                             (selectedDocuments &&
                               selectedDocuments.length === 0)
                               ? "bg-gray-100 dark:bg-gray-800/50 text-gray-500 cursor-not-allowed"
                               : "bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white"
                           }`}
                title={
                  !selectedDocuments || selectedDocuments.length === 0
                    ? "Select documents to generate mindmap"
                    : isMindmapGenerating
                    ? "Generating mindmap..."
                    : `Generate Mindmap (${
                        selectedDocuments?.length || 0
                      } docs)`
                }
              >
                <Brain
                  className={`h-4 w-4 ${
                    isMindmapGenerating ? "animate-pulse" : ""
                  }`}
                />
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
            {selectedDocuments.length} document
            {selectedDocuments.length !== 1 ? "s" : ""} selected
          </div>
        )}

        {/* Search and Create */}
        <div className="flex space-x-2">
          <div className="relative flex-1">
            <Search
              className="absolute left-3 top-1/2 transform -translate-y-1/2 
                             h-4 w-4 text-[#8c715f] dark:text-gray-400"
            />
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
            <Loader className="h-5 w-5 animate-spin mx-auto mb-1" />
            Loading notes...
          </div>
        ) : filteredNotes.length === 0 ? (
          <div className="p-4 text-center text-[#8c715f] dark:text-gray-400">
            {searchTerm
              ? "No notes found matching your search"
              : "No notes yet. Create your first note!"}
          </div>
        ) : (
          <div className="p-2 space-y-2">
            {filteredNotes.map((note) => (
              <div
                key={note.id}
                onClick={() => handleSelectNote(note)}
                className={`p-3 rounded-lg cursor-pointer transition-all duration-200
                           border hover:shadow-md
                           ${
                             selectedNote?.id === note.id
                               ? "bg-[#a55233]/10 dark:bg-blue-600/20 border-[#a55233]/30 dark:border-blue-500/40"
                               : "bg-white dark:bg-gray-800/50 border-[#e3d5c8] dark:border-gray-700/50 hover:bg-[#f5e6d8] dark:hover:bg-gray-700/50"
                           }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-[#5e4636] dark:text-white truncate text-sm">
                      {note.title?.trim()
                        ? note.title
                        : getFirstLine(note.content)}
                    </h3>
                    <p className="text-xs text-[#8c715f] dark:text-gray-400 mt-1 line-clamp-2">
                      {note.content
                        ? stripHtml(note.content).substring(0, 100) +
                          (stripHtml(note.content).length > 100 ? "..." : "")
                        : "No content"}
                    </p>
                    <div className="flex items-center space-x-2 mt-2">
                      <Calendar className="h-3 w-3 text-[#8c715f] dark:text-gray-500" />
                      <span className="text-xs text-[#8c715f] dark:text-gray-500">
                        {formatDate(note.updated_at || note.created_at)}
                      </span>
                      {note.is_converted_to_document && (
                        <span
                          className="inline-flex items-center px-1.5 py-0.5 rounded-full text-xs
                                       bg-green-100 dark:bg-green-900/30 
                                       text-green-800 dark:text-green-400"
                        >
                          Document
                        </span>
                      )}
                    </div>
                  </div>
                  <div
                    className="flex space-x-1 ml-2"
                    onClick={(e) => e.stopPropagation()}
                  >
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

      {/* Note Editor */}
      {(selectedNote || isEditing) && (
        <div
          className="p-1 border-t border-[#e3d5c8] dark:border-blue-500/20 
                bg-white dark:bg-gray-800/50 flex flex-col"
        >
          {/* Editor Header */}
          <div className="p-2 border-b border-[#e3d5c8] dark:border-blue-500/20">
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center space-x-2">
                {isEditing ? (
                  <Edit3 className="h-4 w-4 text-[#a55233] dark:text-blue-400" />
                ) : (
                  <Notebook className="h-4 w-4 text-[#a55233] dark:text-blue-400" />
                )}
                <span className="text-sm font-medium text-[#5e4636] dark:text-white">
                  {isEditing ? "Editing Note" : "Viewing Note"}
                </span>
              </div>
              <div className="flex space-x-1">
                {isEditing && onOpenEditor && (
                  <button
                    onClick={() => {
                      onOpenEditor({
                        id: selectedNote?.id,
                        title: noteTitle,
                        content: noteContent,
                      });
                      handleCloseNoteEditor();
                    }}
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
                      handleCloseNoteEditor(); // Add this line
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

                {!isEditing && !selectedNote?.is_converted_to_document && (
                  <button
                    onClick={() => {
                      setIsEditing(true);
                    }}
                    className="p-1.5 text-[#8c715f] dark:text-gray-400 
                               hover:text-[#a55233] dark:hover:text-blue-400
                               hover:bg-[#f5e6d8] dark:hover:bg-gray-600/50 
                               rounded transition-colors"
                    title="Edit Note"
                  >
                    <Edit3 className="h-3 w-3" />
                  </button>
                )}

                {!isEditing && (
                  <button
                    onClick={handleCloseNoteEditor}
                    className="p-1.5 text-[#8c715f] dark:text-gray-400 
                               hover:text-red-600 dark:hover:text-red-400
                               hover:bg-red-50 dark:hover:bg-red-900/20 
                               rounded transition-colors"
                    title="Close Note"
                  >
                    <X className="h-3 w-3" />
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
                          setNoteTitle(selectedNote.title || "");
                          setNoteContent(selectedNote.content || "");
                        } else {
                          setSelectedNote(null);
                          setNoteTitle("");
                          setNoteContent("");
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
              <div
                className="text-sm font-medium text-[#5e4636] dark:text-white 
                            p-2 bg-[#f9f7f4] dark:bg-gray-700/50
                            border border-[#d6cbbf] dark:border-blue-500/20 rounded-lg"
              >
                {noteTitle?.trim() ? noteTitle : getFirstLine(noteContent)}
              </div>
            )}
          </div>

          {/* Content Editor */}
          <div className="p-3 flex-1 overflow-hidden">
            {isEditing ? (
              <div
                ref={editorRef}
                contentEditable
                className="w-full h-48 p-2 overflow-y-auto focus:outline-none
                           text-[#5e4636] dark:text-white text-sm leading-relaxed
                           bg-[#f9f7f4] dark:bg-gray-700/50
                           border border-[#d6cbbf] dark:border-blue-500/20 rounded-lg
                           custom-scrollbar"
                style={{
                  minHeight: "200px",
                  wordWrap: "break-word",
                  overflowWrap: "break-word",
                }}
                onInput={handleEditorInput}
                placeholder="Start writing your note..."
                suppressContentEditableWarning={true}
              />
            ) : (
              <div
                className="notepad-content-viewer custom-scrollbar overflow-y-auto h-48 p-2
                           text-[#5e4636] dark:text-white text-sm leading-relaxed
                           bg-[#f9f7f4] dark:bg-gray-700/50
                           border border-[#d6cbbf] dark:border-blue-500/20 rounded-lg"
                dangerouslySetInnerHTML={{
                  __html:
                    noteContent ||
                    '<p style="color: #8c715f; font-style: italic;">No content</p>',
                }}
              />
            )}
          </div>
        </div>
      )}

      {/* Custom Styles */}
      <style>{`
        [contenteditable]:empty:before {
          content: attr(placeholder);
          color: #8c715f;
          font-style: italic;
          pointer-events: none;
        }
        
        .dark [contenteditable]:empty:before {
          color: rgba(156, 163, 175, 0.7);
        }

        [contenteditable] {
          outline: none;
        }

        [contenteditable] h1,
        [contenteditable] h2,
        [contenteditable] h3,
        [contenteditable] h4,
        [contenteditable] h5,
        [contenteditable] h6 {
          margin-top: 1.5em;
          margin-bottom: 0.5em;
          font-weight: bold;
          line-height: 1.3;
          color: inherit;
        }

        .dark [contenteditable] h1,
        .dark [contenteditable] h2,
        .dark [contenteditable] h3,
        .dark [contenteditable] h4,
        .dark [contenteditable] h5,
        .dark [contenteditable] h6 {
          color: #ffffff;
        }

        [contenteditable] h1 { font-size: 2em; }
        [contenteditable] h2 { font-size: 1.5em; }
        [contenteditable] h3 { font-size: 1.3em; }

        [contenteditable] p {
          margin-bottom: 1em;
          line-height: 1.3;
        }

        [contenteditable] ul,
        [contenteditable] ol {
          margin-left: 2em;
          margin-bottom: 1em;
          padding-left: 0;
        }

        [contenteditable] li {
          margin-bottom: 0.5em;
          list-style-position: outside;
        }

        [contenteditable] ul li {
          list-style-type: disc;
        }

        [contenteditable] ol li {
          list-style-type: decimal;
        }

        [contenteditable] blockquote {
          margin: 1em 0;
          padding-left: 1em;
          border-left: 4px solid #e3d5c8;
          color: #8c715f;
          font-style: italic;
        }

        .dark [contenteditable] blockquote {
          border-left-color: rgba(59, 130, 246, 0.5);
          color: rgba(156, 163, 175, 0.8);
        }

        [contenteditable] table {
          border-collapse: collapse;
          margin: 1em 0;
          width: 100%;
        }

        [contenteditable] table td,
        [contenteditable] table th {
          border: 1px solid #ddd;
          padding: 8px;
          text-align: left;
        }

        [contenteditable] table th {
          background-color: #f5f5f5;
          font-weight: bold;
        }

        .dark [contenteditable] table td,
        .dark [contenteditable] table th {
          border-color: rgba(59, 130, 246, 0.2);
        }

        .dark [contenteditable] table th {
          background-color: rgba(59, 130, 246, 0.1);
        }

        [contenteditable] a {
          color: #a55233;
          text-decoration: underline;
        }

        .dark [contenteditable] a {
          color: #3b82f6;
        }

        /* Custom scrollbar - matching NoteEditorModal style */
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
           height: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(214, 203, 191, 0.1);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(165, 82, 51, 0.2);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(165, 82, 51, 0.3);
        }
        
        .dark .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(59, 130, 246, 0.1);
        }
        .dark .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(59, 130, 246, 0.2);
        }
        .dark .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(59, 130, 246, 0.3);
        }

        .line-clamp-2 {
          overflow: hidden;
          display: -webkit-box;
          -webkit-box-orient: vertical;
          -webkit-line-clamp: 2;
        }

        /* Ensure proper cursor positioning */
        [contenteditable] * {
          cursor: text;
        }

        [contenteditable]:focus {
          outline: none;
        }

        /* Viewer content styling to match editor */
        .notepad-content-viewer h1,
        .notepad-content-viewer h2,
        .notepad-content-viewer h3,
        .notepad-content-viewer h4,
        .notepad-content-viewer h5,
        .notepad-content-viewer h6 {
          margin-top: 1.5em;
          margin-bottom: 0.5em;
          font-weight: bold;
          line-height: 1.3;
          color: inherit;
        }

        .dark .notepad-content-viewer h1,
        .dark .notepad-content-viewer h2,
        .dark .notepad-content-viewer h3,
        .dark .notepad-content-viewer h4,
        .dark .notepad-content-viewer h5,
        .dark .notepad-content-viewer h6 {
          color: #ffffff;
        }

        .notepad-content-viewer h1 { font-size: 2em; }
        .notepad-content-viewer h2 { font-size: 1.5em; }
        .notepad-content-viewer h3 { font-size: 1.3em; }

        .notepad-content-viewer p {
          margin-bottom: 1em;
          line-height: 1.3;
        }

        .notepad-content-viewer ul,
        .notepad-content-viewer ol {
          margin-left: 2em;
          margin-bottom: 1em;
          padding-left: 0;
        }

        .notepad-content-viewer li {
          margin-bottom: 0.5em;
          list-style-position: outside;
        }

        .notepad-content-viewer ul li {
          list-style-type: disc;
        }

        .notepad-content-viewer ol li {
          list-style-type: decimal;
        }

        .notepad-content-viewer blockquote {
          margin: 1em 0;
          padding-left: 1em;
          border-left: 4px solid #e3d5c8;
          color: #8c715f;
          font-style: italic;
        }

        .dark .notepad-content-viewer blockquote {
          border-left-color: rgba(59, 130, 246, 0.5);
          color: rgba(156, 163, 175, 0.8);
        }

        .notepad-content-viewer table {
          border-collapse: collapse;
          margin: 1em 0;
          width: 100%;
        }

        .notepad-content-viewer table td,
        .notepad-content-viewer table th {
          border: 1px solid #ddd;
          padding: 8px;
          text-align: left;
        }

        .notepad-content-viewer table th {
          background-color: #f5f5f5;
          font-weight: bold;
        }

        .dark .notepad-content-viewer table td,
        .dark .notepad-content-viewer table th {
          border-color: rgba(59, 130, 246, 0.2);
        }

        .dark .notepad-content-viewer table th {
          background-color: rgba(59, 130, 246, 0.1);
        }

        .notepad-content-viewer a {
          color: #a55233;
          text-decoration: underline;
        }

        .dark .notepad-content-viewer a {
          color: #3b82f6;
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
  selectedDocuments: PropTypes.array,
  onViewMindmapHistory: PropTypes.func,
};

export default NotePad;
