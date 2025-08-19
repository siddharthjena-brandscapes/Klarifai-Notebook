# chat/urls.py
from django.urls import path
from . import views
from .views import (LoginView, SignupView, DocumentUploadView, GenerateIdeaContextView,
    ChatView, 
    GetChatHistoryView,
    GetConversationView,
    DeleteConversationView,
    GetUserDocumentsView,
    SetActiveDocumentView,
    UserProfileView,
    DeleteDocumentView,
    ManageConversationView,
    ChangePasswordView,
    GenerateDocumentSummaryView,
    ConsolidatedSummaryView,
    AdminUserManagementView,
    AdminUserModuleView,
    OriginalDocumentView,
    DocumentViewLogView,
    DocumentContentSearchView,
    AdminUserProjectsView,
    AdminUserUploadPermissionsView,
    CheckUploadPermissionsView,
    ProcessCitationsView,
     ChatExportView,
     AdminUserStatsView,
     MicrosoftSSOView,
     MicrosoftSSOCallbackView,
     DocumentProcessingStatusView,
     DeleteMessagePairView
    
)

urlpatterns = [
     path('generate-document-summary/', GenerateDocumentSummaryView.as_view(), name='generate-document-summary'),
    path('login/', LoginView.as_view(), name='login'),
    path('signup/', SignupView.as_view(), name='signup'),  # New signup endpoint

   path('user/profile/', UserProfileView.as_view(), name='user-profile'),
    # ... other URL patterns
    path('user/change-password/', ChangePasswordView.as_view(), name='change-password'),
    path('user/update-profile-picture/', UserProfileView.as_view(), name='update-profile-picture'),

    # Document handling
    path('upload-documents/', DocumentUploadView.as_view(), name='upload-documents'),
    path('generate-idea-context/', GenerateIdeaContextView.as_view(), name='generate-idea-context'),
    
    # Chat functionality
    path('chat/', ChatView.as_view(), name='chat'),

    # # Citation processing endpoint
    path('process-citations/', ProcessCitationsView.as_view(), name='process-citations'),
    
    # Chat history endpoints
    path('chat-history/', GetChatHistoryView.as_view(), name='chat-history'),
    path('conversations/', GetConversationView.as_view(), name='get_conversations'),
    path('conversations/<str:conversation_id>/', GetConversationView.as_view(), name='get_conversation'),
    path('conversations/<str:conversation_id>/delete/', DeleteConversationView.as_view(), name='delete_conversation'),
    path('user-documents/', GetUserDocumentsView.as_view(), name='user-documents'),
    path('set-active-document/', SetActiveDocumentView.as_view(), name='set_active_document'),
    path('documents/<int:document_id>/delete/', DeleteDocumentView.as_view(), name='delete_document'),
    path('conversations/<str:conversation_id>/', 
         ManageConversationView.as_view(), 
         name='update_conversation'),

    path('consolidated_summary/', ConsolidatedSummaryView.as_view(), name='consolidated_summary'),
    path('api/admin/users/', AdminUserManagementView.as_view(), name='admin-user-management'),
    path('admin/users/<int:user_id>/modules/', AdminUserModuleView.as_view(), name='admin-user-module-permissions'),

     path('documents/<int:document_id>/original/', OriginalDocumentView.as_view(), name='get_original_document'),
    path('documents/<int:document_id>/view-log/', DocumentViewLogView.as_view(), name='log_document_view'),

     path('search-document-content/', DocumentContentSearchView.as_view(), name='search-document-content'),

    path('api/check-upload-permissions/', CheckUploadPermissionsView.as_view(), name='check-upload-permissions'),
    path('admin/users/<int:user_id>/projects/', AdminUserProjectsView.as_view()),
    path('admin/users/<int:user_id>/upload-permissions/', AdminUserUploadPermissionsView.as_view(), name='admin_user_upload_permissions'),
    path('api/check-upload-permissions/', CheckUploadPermissionsView.as_view(), name='check_upload_permissions'),
    path('export-chat/', ChatExportView.as_view(), name='export-chat'), # for pdf chat export
    path('documents/<int:document_id>/original/', OriginalDocumentView.as_view(), name='original_document'),
    path('user/profile/', UserProfileView.as_view(), name='user_profile'),
    path('check-upload-permissions/', CheckUploadPermissionsView.as_view(), name='check_upload_permissions'),
#     path('transcripts/', views.TranscriptView.as_view(), name='list_transcripts'),
#     path('transcripts/<int:document_id>/', views.TranscriptView.as_view(), name='get_transcript'),
#     path('transcripts/<int:document_id>/delete/', views.TranscriptView.as_view(), name='delete_transcript'),
    path('api/admin/user-stats/', AdminUserStatsView.as_view(), name='admin-user-stats'),
     # Microsoft SSO endpoints
    path('microsoft-sso/', MicrosoftSSOView.as_view(), name='microsoft_sso'),
    path('get_token/', MicrosoftSSOCallbackView.as_view(), name='microsoft_sso_callback'),
    path('document-processing-status/', DocumentProcessingStatusView.as_view(), name='document-processing-status'),
    path('delete-message-pair/', DeleteMessagePairView.as_view(), name='delete_message_pair'),
]   
