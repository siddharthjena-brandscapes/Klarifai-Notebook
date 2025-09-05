
# core/models.py
from django.db import models
from django.contrib.auth.models import User
from django.utils import timezone
from chat.models import Document, ChatHistory
from ideaGen.models import ProductIdea2

class Project(models.Model):
    

    MODULE_CHOICES = (
        ('document-qa', 'Document Q&A'),
        ('idea-generator', 'Idea Generator'),
        ('topic-modeling', 'Topic Modeling'),
        ('structured-data-query', 'Structured Data Query'),
    )

    name = models.CharField(max_length=255)
    description = models.TextField()
    category = models.JSONField(default=list)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='projects')
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)
    
    # Store selected modules as a JSON array
    selected_modules = models.JSONField(default=list)
    
    # Status flag
    is_active = models.BooleanField(default=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.name} - {self.user.username}"

class ProjectModule(models.Model):
    project = models.ForeignKey(Project, on_delete=models.CASCADE, related_name='modules')
    module_type = models.CharField(max_length=50)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        unique_together = ['project', 'module_type']

class DocumentQAModule(models.Model):
    project_module = models.OneToOneField(
        ProjectModule, 
        on_delete=models.CASCADE,
        related_name='document_qa'
    )
    documents = models.ManyToManyField(Document, related_name='project_modules')
    chat_histories = models.ManyToManyField(ChatHistory, related_name='project_modules')

    def __str__(self):
        return f"Document QA Module - {self.project_module.project.name}"

class IdeaGeneratorModule(models.Model):
    project_module = models.OneToOneField(
        ProjectModule, 
        on_delete=models.CASCADE,
        related_name='idea_generator'
    )
    product_ideas = models.ManyToManyField(ProductIdea2, related_name='project_modules')

    def __str__(self):
        return f"Idea Generator Module - {self.project_module.project.name}"


# New Category model for user-specific categories
class Category(models.Model):
    name = models.CharField(max_length=100)
    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='categories',
        null=True,  # ✅ Allow global categories
        blank=True
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    is_active = models.BooleanField(default=True)
 
    class Meta:
        ordering = ['name']
        unique_together = ['name', 'user']  # ✅ Ensures user can't create duplicate names
        verbose_name_plural = "Categories"
 
    def __str__(self):
        return f"{self.name} - {self.user.username if self.user else 'Global'}"

class UserFeaturePermissions(models.Model):
    """Track RIGHT PANEL feature permissions for users only"""
    user = models.OneToOneField(
        User, 
        on_delete=models.CASCADE, 
        related_name='feature_permissions'
    )
    
    # RIGHT PANEL FEATURES ONLY
    right_panel_access = models.BooleanField(default=True, help_text="Enable/disable entire right panel")
    mindmap_generation = models.BooleanField(default=True, help_text="Generate new mindmaps from documents")
    mindmap_history = models.BooleanField(default=True, help_text="View previously generated mindmaps")
    notes_panel = models.BooleanField(default=True, help_text="Access to notes functionality")
    
    # Metadata
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    created_by = models.ForeignKey(
        User, 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True, 
        related_name='created_feature_permissions',
        help_text="Admin who created/modified these permissions"
    )
    
    class Meta:
        verbose_name = "User Feature Permission"
        verbose_name_plural = "User Feature Permissions"
        
    def __str__(self):
        return f"Right Panel permissions for {self.user.username}"
    
    @classmethod
    def get_or_create_for_user(cls, user):
        """Get or create feature permissions for a user with default values"""
        permissions, created = cls.objects.get_or_create(
            user=user,
            defaults={
                'right_panel_access': True,
                'mindmap_generation': True,
                'mindmap_history': True,
                'notes_panel': True,
            }
        )
        return permissions
    
    def to_disabled_dict(self):
        """Convert permissions to dictionary format for frontend (True means disabled)"""
        return {
            'right-panel-access': not self.right_panel_access,
            'mindmap-generation': not self.mindmap_generation,
            'mindmap-history': not self.mindmap_history,
            'notes-panel': not self.notes_panel,
        }
    
    def update_from_disabled_dict(self, disabled_features_dict):
        """Update permissions from frontend dictionary (where True means disabled)"""
        self.right_panel_access = not disabled_features_dict.get('right-panel-access', False)
        self.mindmap_generation = not disabled_features_dict.get('mindmap-generation', False)
        self.mindmap_history = not disabled_features_dict.get('mindmap-history', False)
        self.notes_panel = not disabled_features_dict.get('notes-panel', False)
        self.save()