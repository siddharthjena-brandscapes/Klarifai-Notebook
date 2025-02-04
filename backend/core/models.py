
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
    category = models.CharField(max_length=50)
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

class ProjectActivity(models.Model):
    ACTIVITY_TYPES = (
        ('created', 'Created'),
        ('updated', 'Updated'),
        ('deleted', 'Deleted'),
        ('document_added', 'Document Added'),
        ('chat_started', 'Chat Started'),
        ('idea_generated', 'Idea Generated'),
    )

    project = models.ForeignKey(Project, on_delete=models.CASCADE, related_name='activities')
    activity_type = models.CharField(max_length=20, choices=ACTIVITY_TYPES)
    description = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    
    # Optional reference to related objects
    content_type = models.ForeignKey('contenttypes.ContentType', on_delete=models.CASCADE, null=True)
    object_id = models.PositiveIntegerField(null=True)

    class Meta:
        ordering = ['-created_at']
        verbose_name_plural = 'Project Activities'

    def __str__(self):
        return f"{self.activity_type} - {self.project.name}"