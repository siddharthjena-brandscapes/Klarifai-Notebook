
#ideagen\models.py
from django.db import models
from django.utils import timezone
from django.contrib.auth import get_user_model
from django.core.files.storage import FileSystemStorage
import os
import uuid

User = get_user_model()

class OverwriteStorage(FileSystemStorage):
    def get_available_name(self, name, max_length=None):
        if self.exists(name):
            os.remove(os.path.join(self.location, name))
        return name
    
    class Meta:
        app_label = 'ideaGen'

def generate_unique_filename(instance, filename):
    ext = filename.split('.')[-1]
    filename = f"{uuid.uuid4()}.{ext}"
    return os.path.join('generated_images', filename)

class Project(models.Model):
    name = models.CharField(max_length=255)
    created_at = models.DateTimeField(default=timezone.now)
    last_modified = models.DateTimeField(auto_now=True)
    # Add user field
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='ideagen_projects', null=True, blank=True)
    main_project = models.ForeignKey('core.Project', on_delete=models.CASCADE, related_name='ideagen_projects', null=True)
    def __str__(self):
        return f"{self.name} - {self.user.username}"
    
    class Meta:
        # app_label = 'ideaGen'
        ordering = ['-last_modified']

class ProductIdea2(models.Model):
    project = models.ForeignKey(Project, related_name='product_ideas', on_delete=models.CASCADE)
    product = models.CharField(max_length=255)
    brand = models.CharField(max_length=255)
    category = models.CharField(max_length=255)
    dynamic_fields = models.JSONField(default=dict)
    description_length = models.IntegerField(default=70)   #added for lengh of the ideas (by sourav @ 12-03-2025)
    number_of_ideas = models.IntegerField(default=1)
    created_at = models.DateTimeField(default=timezone.now)
    negative_prompt = models.TextField(null=True, blank=True)

     # New fields for document source tracking
    source_document_id = models.CharField(max_length=255, blank=True, null=True)
    source_document_name = models.CharField(max_length=255, blank=True, null=True)

    # Add user field for direct access
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='product_ideas', null=True, blank=True)

    def __str__(self):
        return f"{self.brand} - {self.product} - {self.user.username}"
    
    class Meta:
        app_label = 'ideaGen'
        ordering = ['-created_at']


class Idea(models.Model):
    product_idea = models.ForeignKey(ProductIdea2, related_name='ideas', on_delete=models.CASCADE)
    
    product_name = models.CharField(max_length=255)
    description = models.TextField()
    decomposed_aspects = models.JSONField(null=True, blank=True)        #stores the decomposed version of the product description
    enhanced_description = models.TextField(null=True, blank=True)     #stores the enhanced version of the product description
    visualization_prompt = models.TextField(null=True, blank=True)    #stores the visualization_prompt of the product description (SOURAV @06/02/2025)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    original_idea_id = models.IntegerField(null=True, blank=True)
    idea_set = models.IntegerField(default=1)
    idea_set_label = models.CharField(max_length=50, default="Set 1-1")
    def __str__(self):
        return self.product_name
    class Meta:
        app_label = 'ideaGen'

class GeneratedImage2(models.Model):
    idea = models.ForeignKey(Idea, related_name='images', on_delete=models.CASCADE, null=True)
    prompt = models.TextField()
    image = models.ImageField(
        upload_to=generate_unique_filename, 
        storage=OverwriteStorage(),
        null=True, 
        blank=True
    )
    created_at = models.DateTimeField(auto_now_add=True)
    parameters = models.JSONField(null=True, blank=True)
    generation_status = models.CharField(
        max_length=20,
        choices=[
            ('success', 'Success'),
            ('failed', 'Failed'),
            ('retried', 'Retried'),
            ('pending', 'Pending')
        ],
        default='success'
    )
    retry_count = models.IntegerField(default=0)
    original_parameters = models.JSONField(null=True, blank=True)
    final_parameters = models.JSONField(null=True, blank=True)

    class Meta:
        ordering = ['-created_at']
        app_label = 'ideaGen'

    def __str__(self):
        return f"Image for {self.idea.product_name if self.idea else 'Unknown'}"
    
    def delete(self, *args, **kwargs):
        # Delete the file when the model is deleted
        if self.image:
            storage, path = self.image.storage, self.image.path
            super().delete(*args, **kwargs)
            storage.delete(path)
        else:
            super().delete(*args, **kwargs)



# Add after the existing models

class UserActivityLog(models.Model):
    ACTIVITY_TYPES = [
        ('project_create', 'Project Created'),
        ('project_update', 'Project Updated'),
        ('idea_generate', 'Ideas Generated'),
        ('image_generate', 'Image Generated'),
        ('idea_edit', 'Idea Edited'),
        ('image_regenerate', 'Image Regenerated')
    ]

    user = models.ForeignKey(User, on_delete=models.PROTECT)  # Use PROTECT to prevent user deletion
    timestamp = models.DateTimeField(auto_now_add=True)
    activity_type = models.CharField(max_length=20, choices=ACTIVITY_TYPES)
    
    # Reference fields (nullable since not all activities will have all references)
    project_id = models.IntegerField(null=True)
    idea_id = models.IntegerField(null=True)
    image_id = models.IntegerField(null=True)
    
    # Store complete metadata as JSON
    metadata = models.JSONField(default=dict)
    
    class Meta:
        app_label = 'ideaGen'
        ordering = ['-timestamp']
        default_permissions = ('add', 'view')