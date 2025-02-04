


###############################################################
#PROJECT INTEGRATION
###############################################################

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
    number_of_ideas = models.IntegerField(default=1)
    created_at = models.DateTimeField(default=timezone.now)
    negative_prompt = models.TextField(null=True, blank=True)
    # Add user field for direct access
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='product_ideas', null=True, blank=True)

    def __str__(self):
        return f"{self.brand} - {self.product} - {self.user.username}"
    
    class Meta:
        app_label = 'ideaGen'
        ordering = ['-created_at']

# models.py


class Idea(models.Model):
    product_idea = models.ForeignKey(ProductIdea2, related_name='ideas', on_delete=models.CASCADE)
    
    product_name = models.CharField(max_length=255)
    description = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    # models.py
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
            ('retried', 'Retried')
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