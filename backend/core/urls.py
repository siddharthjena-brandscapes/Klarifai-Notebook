# core/urls.py
from django.urls import path
from . import views

urlpatterns = [
    path('projects/create/', views.create_project, name='create_project'),
    path('projects/', views.project_list, name='project_list'),
    path('projects/<int:project_id>/', views.project_detail, name='project_detail'),
    path('projects/<int:project_id>/delete/', views.delete_project, name='delete_project'),
    path('projects/<int:project_id>/update/', views.update_project, name='update_project'),
    # New URL pattern for document upload
    path('projects/upload-document-for-prompt/', views.upload_document_for_prompt, name='upload_document_for_prompt'),
    path('projects/enhance-prompt/', views.enhance_prompt_with_ai, name='enhance_prompt_with_ai'),
    path('projects/<int:project_id>/archive/', views.archive_project, name='archive_project'),
    path('projects/<int:project_id>/unarchive/', views.unarchive_project, name='unarchive_project'),
    path('projects/archived/', views.archived_projects, name='archived_projects'),
    # Category management URLs
    path('categories/', views.get_user_categories, name='get_user_categories'),
    path('categories/user/<int:user_id>/', views.get_user_categories, name='get_user_categories_by_id'),
    path('all_categories/', views.get_all_user_categories, name='get_all_categories'),
    path('categories/create/', views.create_category_for_user, name='create_category'),
    path('categories/<int:category_id>/update/', views.update_category, name='update_category'),
    path('categories/<int:category_id>/delete/', views.delete_category, name='delete_category'),
    path('categories/create-user/', views.create_category_by_user, name='create_category_by_user'),
 
     path('admin/users/', views.get_all_users_admin, name='get_all_users_admin'),
   
      path('admin/users/<int:user_id>/right-panel-permissions/', 
         views.update_user_right_panel_permissions, 
         name='update_user_right_panel_permissions'),
    
    path('user/right-panel-permissions/', 
         views.get_current_user_right_panel_permissions, 
         name='get_current_user_right_panel_permissions'),

    path('admin/users/<int:user_id>/upload-permissions/', views.update_user_upload_permissions, name='update_user_upload_permissions'),

    # Add these two lines after the admin/users/ line:
     path('admin/users/<int:user_id>/modules/', views.update_user_module_permissions, name='update_user_module_permissions'),
     path('analytics/first-activities/', views.get_first_activities, name='first-activities'),
     
     path('analytics/all-activities/', views.get_all_activities, name='all-activities'),

]

print("Available URLs:", [str(pattern) for pattern in urlpatterns])