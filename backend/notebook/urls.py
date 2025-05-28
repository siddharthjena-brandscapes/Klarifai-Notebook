# chat/urls.py
from django.urls import path
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
    
    OriginalDocumentView,
    DocumentViewLogView,
    ProcessCitationsView,
    DocumentContentSearchView,
    ChatExportView,



    # LoginView, 
    # SignupView,
    # ChangePasswordView,
    # AdminUserManagementView,
    # AdminUserModuleView,
    # AdminUserProjectsView,
    # AdminUserUploadPermissionsView,
    # CheckUploadPermissionsView,
     
    #GenerateIdeaContextView,
    
    
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
    path('documents/<int:document_id>/original/', OriginalDocumentView.as_view(), name='get_original_document'),
    path('documents/<int:document_id>/view-log/', DocumentViewLogView.as_view(), name='log_document_view'),
    path('export-chat/', ChatExportView.as_view(), name='export-chat'),
    path('search-document-content/', DocumentContentSearchView.as_view(), name='search-document-content'),
    path('process-citations/', ProcessCitationsView.as_view(), name='process-citations'),






#    path('user/profile-NB/', UserProfileView.as_view(), name='user-profile'),
#     # ... other URL patterns
#     path('user/update-profile-picture-NB/', UserProfileView.as_view(), name='update-profile-picture'),
    # path('user/change-password/', ChangePasswordView.as_view(), name='change-password'),
    # path('login/', LoginView.as_view(), name='login'),
    # path('signup/', SignupView.as_view(), name='signup'),
    # path('api/admin/users/', AdminUserManagementView.as_view(), name='admin-user-management'),
    # path('admin/users/<int:user_id>/modules/', AdminUserModuleView.as_view(), name='admin-user-module-permissions'),



  

     
    # path('admin/users/<int:user_id>/projects/', AdminUserProjectsView.as_view()),
    # path('admin/users/<int:user_id>/upload-permissions/', AdminUserUploadPermissionsView.as_view(), name='admin_user_upload_permissions'),
    # path('api/check-upload-permissions/', CheckUploadPermissionsView.as_view(), name='check_upload_permissions'),
 # for pdf chat export
    
   
    
]   
