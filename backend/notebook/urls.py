# chat/urls.py
from django.urls import path
from .views import MindMapView, MindMapQuestionView, get_user_mindmaps, get_mindmap_data
from .views import ( DocumentUploadView,
    ChatView, 
    GetChatHistoryView,
    GetConversationView,
    DeleteConversationView,
    GetUserDocumentsView,
    SetActiveDocumentView,
    DeleteDocumentView,
    ManageConversationView,
    GenerateDocumentSummaryView,
    ConsolidatedSummaryView,
    GPTImageChatView,
    OriginalDocumentView,
    DocumentViewLogView,
    ProcessCitationsView,
    DocumentContentSearchView,
    ChatExportView,
    YouTubeUploadView,
    NoteManagementView,
    WebsiteLinkUploadView,
    PlainTextUploadView,
    AdminNotebookUserStatsView,
    GenerateIdeaContextView,
    CheckUploadPermissionsView,
    DocumentProcessingStatusView,
    DeleteMessagePairView,
    generate_question_from_topic,
    ArchiveConversationView,
    GenerateTitleView
    
    
)

urlpatterns = [
     path('generate-document-summary-NB/', GenerateDocumentSummaryView.as_view(), name='generate-document-summary'),

    # Document handling
    path('upload-documents-NB/', DocumentUploadView.as_view(), name='upload-documents'),

    
    # Chat functionality
    path('chat-NB/', ChatView.as_view(), name='chat'),

    # # Citation processing endpoint
    
    
    # Chat history endpoints
    path('chat-history-NB/', GetChatHistoryView.as_view(), name='chat-history'),
    path('conversations-NB/', GetConversationView.as_view(), name='get_conversations'),
    path('conversations-NB/<str:conversation_id>/', GetConversationView.as_view(), name='get_conversation'),
    path('conversations-NB/<str:conversation_id>/delete/', DeleteConversationView.as_view(), name='delete_conversation'),
    path('user-documents-NB/', GetUserDocumentsView.as_view(), name='user-documents'),
    path('set-active-document-NB/', SetActiveDocumentView.as_view(), name='set_active_document'),
    path('documents-NB/<int:document_id>/delete/', DeleteDocumentView.as_view(), name='delete_document'),
    path('conversations-NB/<str:conversation_id>/', 
         ManageConversationView.as_view(), 
         name='update_conversation'),

    path('consolidated_summary-NB/', ConsolidatedSummaryView.as_view(), name='consolidated_summary'),
    path('documents-NB/<int:document_id>/original/', OriginalDocumentView.as_view(), name='get_original_document'),
    path('documents-NB/<int:document_id>/view-log/', DocumentViewLogView.as_view(), name='log_document_view'),
    path('export-chat-NB/', ChatExportView.as_view(), name='export-chat'),
    path('search-document-content-NB/', DocumentContentSearchView.as_view(), name='search-document-content'),
    path('process-citations-NB/', ProcessCitationsView.as_view(), name='process-citations'),
    path('upload-youtube-NB/', YouTubeUploadView.as_view(), name='upload-youtube'),
    path('notes-NB/', NoteManagementView.as_view(), name='note-management'),
    path('upload-website-NB/', WebsiteLinkUploadView.as_view(), name='upload-website'),
    path('upload-text-NB/', PlainTextUploadView.as_view(), name='upload-text'),
    path('generate-mindmap/', MindMapView.as_view(), name='generate_mindmap'),
    path('mindmap-question/', MindMapQuestionView.as_view(), name='mindmap_question'),
    path('user-mindmaps/', get_user_mindmaps, name='get_user_mindmaps'),
    path('mindmap/<int:mindmap_id>/', get_mindmap_data, name='get_mindmap_data'),
     path('admin-notebook-user-stats/', AdminNotebookUserStatsView.as_view(), name='admin_notebook_user_stats'),
    path('generate-idea-context-NB/', GenerateIdeaContextView.as_view(), name='generate-idea-context'),

    path('check-upload-permissions-NB/', CheckUploadPermissionsView.as_view(), name='check_upload_permissions'),
    # Add these to your existing urls.py file
    path('document-processing-status/', DocumentProcessingStatusView.as_view(), name='document-processing-status'),
    path('delete-message-pair-NB/', DeleteMessagePairView.as_view(), name='delete_message_pair'),
    path('api/generate-question-from-topic/', generate_question_from_topic, name='generate_question_from_topic'),
    path('chat-image/', GPTImageChatView.as_view(), name='gpt_image_chat'),
    path('conversations-NB/<uuid:conversation_id>/archive/', ArchiveConversationView.as_view()),
    # Add to urls.py
 path('generate-title-NB/', GenerateTitleView.as_view(), name='generate-title'),
]
