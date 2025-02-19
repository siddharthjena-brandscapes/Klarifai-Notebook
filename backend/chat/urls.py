# chat/urls.py
from django.urls import path
from .views import (LoginView, SignupView, DocumentUploadView, 
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

    
)

urlpatterns = [
    path('login/', LoginView.as_view(), name='login'),
    path('signup/', SignupView.as_view(), name='signup'),  # New signup endpoint

   path('user/profile/', UserProfileView.as_view(), name='user-profile'),
    # ... other URL patterns
    path('user/change-password/', ChangePasswordView.as_view(), name='change-password'),
    path('user/update-profile-picture/', UserProfileView.as_view(), name='update-profile-picture'),

    # Document handling
    path('upload-documents/', DocumentUploadView.as_view(), name='upload-documents'),
    
    # Chat functionality
    path('chat/', ChatView.as_view(), name='chat'),
    
    # Chat history endpoints
    path('chat-history/', GetChatHistoryView.as_view(), name='chat-history'),
    path('conversations/', GetConversationView.as_view(), name='get_conversations'),
    path('conversations/<str:conversation_id>/', GetConversationView.as_view(), name='get_conversation'),
    path('conversations/<str:conversation_id>/delete/', DeleteConversationView.as_view(), name='delete_conversation'),
    path('user-documents/', GetUserDocumentsView.as_view(), name='user-documents'),
    path('set-active-document/', SetActiveDocumentView.as_view(), name='set_active_document'),
    path('documents/<int:document_id>/delete/', DeleteDocumentView.as_view(), name='delete_document'),
    path('conversations/<str:conversation_id>/update/', 
         ManageConversationView.as_view(), 
         name='update_conversation'),

    
]
