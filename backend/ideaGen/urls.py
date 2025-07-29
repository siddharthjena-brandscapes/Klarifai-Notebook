
# idea_generator/urls.py
from django.urls import path
from . import views

urlpatterns = [
    path('generate_ideas/', views.generate_ideas, name='generate_ideas'),
    path('generate_product_image/', views.generate_product_image, name='generate_product_image'),
    path('regenerate_product_image/', views.regenerate_product_image, name='regenerate_product_image'),
    path('update_idea/', views.update_idea, name='update_idea'),
    path('delete_idea/', views.delete_idea, name='delete_idea'),

    # New history-related URLs
    path('idea-history/<int:idea_id>/', views.get_idea_history, name='get_idea_history'),
    path('restore-idea-version/', views.restore_idea_version, name='restore_idea_version'),

    path('projects/', views.project_operations, name='project_operations'),
    path('projects/<int:project_id>/', views.project_operations, name='project_detail'),
    path('projects/<int:project_id>/details/', views.get_project, name='get_project'),
    path('api/ideas/<int:idea_id>/details/', views.get_idea_details, name='idea-details'), # endpoint to fetch the prompts for advanced regeneration (Sourav/ 11-02-25)
    path('admin/user-stats/', views.AdminIdeaUserStatsView.as_view(), name='admin-user-stats'),


     # New URL patterns for document integration
    path('generate-ideas-from-document/', 
         views.generate_ideas_from_document, 
         name='generate_ideas_from_document'),
    

]