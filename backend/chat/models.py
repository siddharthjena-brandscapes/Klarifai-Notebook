#chat\ models.py
from django.db import models
from django.contrib.auth.models import User
import uuid
import google.generativeai as genai
import os
from django.db.models.signals import post_save
from django.dispatch import receiver
from django.db.models.signals import pre_delete
from django.utils import timezone

# Ensure you have the GENERATIVE_MODEL configured at the top of your views.py or in a separate configuration file
GENERATIVE_MODEL = genai.GenerativeModel('gemini-1.5-flash', 
    generation_config={
        'temperature': 0.7,
        'max_output_tokens': 1024
    },
    safety_settings={
        genai.types.HarmCategory.HARM_CATEGORY_HATE_SPEECH: genai.types.HarmBlockThreshold.BLOCK_NONE,
        genai.types.HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT: genai.types.HarmBlockThreshold.BLOCK_NONE,
        genai.types.HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT: genai.types.HarmBlockThreshold.BLOCK_NONE,
        genai.types.HarmCategory.HARM_CATEGORY_HARASSMENT: genai.types.HarmBlockThreshold.BLOCK_NONE
    }
)

# In your models.py or signals.py
from django.db import models
from django.contrib.auth.models import User
from django.db.models.signals import post_save
from django.dispatch import receiver
 
class UserAPITokens(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='api_tokens')
    huggingface_token = models.CharField(
        max_length=255,
        blank=True,
        null=True,
        default='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'
    )
    gemini_token = models.CharField(
        max_length=255,
        blank=True,
        null=True,
        default='AIzaSyC5Dqjx0DLbkRXH9YWqWZ1SPTK0w0C4oFY'
    )
    llama_token = models.CharField(
        max_length=255,
        blank=True,
        null=True,
        default='sk-vZTTKgcY3z9idJLCBaTHT3BlbkFJL9axkgC5FdoKyRIcx2B'
    )
    nebius_token = models.CharField(max_length=1024, blank=True, null=True, default='eyJhbGciOiJIUzI1NiIsImtpZCI6IlV6SXJWd1h0dnprLVRvdzlLZWstc0M1akptWXBvX1VaVkxUZlpnMDRlOFUiLCJ0eXAiOiJKV1QifQ.eyJzdWIiOiJnb29nbGUtb2F1dGgyfDEwNDA3NjM1MTQxNjY5Mzc1MzgxNiIsInNjb3BlIjoib3BlbmlkIG9mZmxpbmVfYWNjZXNzIiwiaXNzIjoiYXBpX2tleV9pc3N1ZXIiLCJhdWQiOlsiaHR0cHM6Ly9uZWJpdXMtaW5mZXJlbmNlLmV1LmF1dGgwLmNvbS9hcGkvdjIvIl0sImV4cCI6MTkwODA5OTQyNywidXVpZCI6IjY5N2ExOGI1LTVmMjMtNDM4YS1iYmVmLTdhNmYwZGUxYzY2MyIsIm5hbWUiOiJpbWdfZ2VuIiwiZXhwaXJlc19hdCI6IjIwMzAtMDYtMTlUMTE6Mzc6MDcrMDAwMCJ9.X_f-n1ginmJkWBmbkhMt12L-k-fapnoo8ws4WXFWC4E')
   
    def __str__(self):
        return f"{self.user.username}'s API Tokens"
 
# Signal to automatically create UserAPITokens when a User is created
@receiver(post_save, sender=User)
def create_user_api_tokens(sender, instance, created, **kwargs):
    if created:
        UserAPITokens.objects.create(user=instance)
        print(f"Created API tokens for user: {instance.username}")  # Debug log


 
 


class SSOAllowedUser(models.Model):
    email = models.EmailField(unique=True)
 
    def __str__(self):
        return self.email
 
@receiver(post_save, sender=User)
def save_user_api_tokens(sender, instance, **kwargs):
    # This ensures existing users get tokens if they don't have them
    if not hasattr(instance, 'api_tokens'):
        UserAPITokens.objects.create(user=instance)
        print(f"Created missing API tokens for user: {instance.username}")

class Document(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    file = models.FileField(upload_to='documents/')
    filename = models.CharField(max_length=255)
    uploaded_at = models.DateTimeField(auto_now_add=True)
    main_project = models.ForeignKey('core.Project', on_delete=models.CASCADE, related_name='chat_documents', null=True)
     # Add these new fields
    view_count = models.PositiveIntegerField(default=0)
    last_viewed_at = models.DateTimeField(null=True, blank=True)
    def __str__(self):
        return self.filename
    class Meta:
        app_label = 'chat'


class DocumentProcessingStatus(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='document_processing_statuses')
    document_name = models.CharField(max_length=255)
    document_id = models.IntegerField(null=True, blank=True)
    status = models.CharField(max_length=50, default="waiting")  # waiting, uploading, uploaded, parsing, indexing, complete, error
    progress = models.IntegerField(default=0)  # 0-100
    message = models.TextField(blank=True, default="")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.document_name} - {self.status}"

class UserUploadPermissions(models.Model):
    user = models.OneToOneField(User, related_name='upload_permissions', on_delete=models.CASCADE)
    can_upload = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return f"{self.user.username} - Can Upload: {self.can_upload}"
class ProcessedIndex(models.Model):
    document = models.OneToOneField(Document, on_delete=models.CASCADE)
    faiss_index = models.CharField(max_length=255, help_text="Path to saved FAISS index file")
    metadata = models.CharField(max_length=255, help_text="Path to saved metadata file")
    summary = models.TextField(help_text="Generated summary of the document")
    idea_parameters = models.JSONField(null=True, blank=True)  # by sourav for idea gen integration
    markdown_path = models.CharField(max_length=255, help_text="Path to saved Markdown file with key terms")
    follow_up_question_1 = models.TextField(blank=True, null=True, help_text="First follow-up question")
    follow_up_question_2 = models.TextField(blank=True, null=True, help_text="Second follow-up question")
    follow_up_question_3 = models.TextField(blank=True, null=True, help_text="Third follow-up question")
    processed_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Processed Index for {self.document.filename}"
    class Meta:
        app_label = 'chat'

class ChatMessage(models.Model):
    ROLE_CHOICES = (
        ('user', 'User'),
        ('assistant', 'Assistant'),
        ('system', 'System')
    )
    
    chat_history = models.ForeignKey('ChatHistory', related_name='messages', on_delete=models.CASCADE)
    role = models.CharField(max_length=20, choices=ROLE_CHOICES)
    content = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    citations = models.JSONField(blank=True, null=True)
    sources = models.TextField(blank=True, null=True)
    
    # New fields for message properties
    use_web_knowledge = models.BooleanField(default=False)
    response_length = models.CharField(max_length=20, default="comprehensive", null=True, blank=True)
    response_format = models.CharField(max_length=50, default="natural", null=True, blank=True)
    
    class Meta:
        ordering = ['created_at']
        app_label = 'chat'
    
    def __str__(self):
        return f"{self.role}: {self.content[:50]}"

class ChatHistory(models.Model):
    conversation_id = models.UUIDField(default=uuid.uuid4, editable=False)
    
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='chat_histories')
    
    documents = models.ManyToManyField(Document, blank=True, related_name='chat_histories')
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    title = models.CharField(max_length=255, blank=True, null=True)
    is_active = models.BooleanField(default=True)
    
    follow_up_questions = models.JSONField(blank=True, null=True)
    main_project = models.ForeignKey('core.Project', on_delete=models.CASCADE, related_name='chat_histories', null=True)
    
    class Meta:
        ordering = ['-created_at']
        verbose_name_plural = 'Chat Histories'
        app_label = 'chat'

    def __str__(self):
        return f"{self.user.username} - {self.title or 'Untitled Chat'}"
    
class ConversationMemoryBuffer(models.Model):
    conversation = models.OneToOneField(
        'ChatHistory', 
        on_delete=models.CASCADE, 
        related_name='memory_buffer'
    )
    key_entities = models.JSONField(blank=True, null=True)
    context_summary = models.TextField(blank=True, null=True)
    last_updated = models.DateTimeField(auto_now=True)

    def update_memory(self, messages):
        """
        Update memory buffer with conversation insights
        """
        # Extract key entities and summarize context
        key_entities = self.extract_key_entities(messages)
        context_summary = self.summarize_context(messages)

        self.key_entities = key_entities
        self.context_summary = context_summary
        self.save()

    def extract_key_entities(self, messages):
        """
        Extract key named entities and important concepts
        """
        # Use NLP techniques to extract entities
        entities = {}
        try:
            # You might want to use spaCy or another NLP library here
            context_text = " ".join([msg.content for msg in messages])
            
            # Use Gemini to extract key entities
            entity_prompt = f"""
            Extract key entities and important concepts from this text:
            {context_text}
            
            Return as a JSON object with categories like 'people', 'organizations', 'topics', etc.
            """
            
            response = GENERATIVE_MODEL.generate_content(entity_prompt)
            
            # Try to parse the response as JSON
            try:
                import json
                entities = json.loads(response.text)
            except:
                # Fallback to text parsing if JSON parsing fails
                entities = {"extracted_concepts": response.text.split(',')}
            
        except Exception as e:
            print(f"Error extracting entities: {str(e)}")
        
        return entities

    def summarize_context(self, messages):
        """
        Generate a concise summary of conversation context
        """
        try:
            context_text = " ".join([msg.content for msg in messages])
            summary_prompt = f"""
            Provide a concise summary of the key points and context of this conversation:
            {context_text}
            
            Focus on:
            - Main topics discussed
            - Key insights
            - Important context
            """
            
            response = GENERATIVE_MODEL.generate_content(summary_prompt)
            return response.text
        
        except Exception as e:
            print(f"Error generating context summary: {str(e)}")
            return "Unable to generate conversation summary"


    class Meta:
        app_label = 'chat'
        
def profile_picture_path(instance, filename):
    # Get the file extension
    ext = filename.split('.')[-1]
    # Generate a unique filename
    filename = f"{instance.user.username}_{uuid.uuid4().hex[:8]}.{ext}"
    # Return the upload path
    return os.path.join('profile_pictures', filename)

class UserProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
    profile_picture = models.ImageField(upload_to=profile_picture_path, null=True, blank=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.user.username}'s profile"
    
    def save(self, *args, **kwargs):
        # Delete old file when replacing with a new file
        try:
            if self.pk:
                old_profile = UserProfile.objects.get(pk=self.pk)
                if old_profile.profile_picture and old_profile.profile_picture != self.profile_picture:
                    old_profile.profile_picture.delete(save=False)
        except:
            pass  # When new photo
        super().save(*args, **kwargs)

    class Meta:
        app_label = 'chat'


class UserModulePermissions(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='module_permissions')
    disabled_modules = models.JSONField(default=dict, blank=True)
    
    def __str__(self):
        return f"{self.user.username}'s module permissions"
    
    class Meta:
        app_label = 'chat'

# Create the UserModulePermissions when a User is created
@receiver(post_save, sender=User)
def create_user_module_permissions(sender, instance, created, **kwargs):
    if created:
        UserModulePermissions.objects.create(user=instance)

@receiver(post_save, sender=User)
def save_user_module_permissions(sender, instance, **kwargs):
    try:
        instance.module_permissions.save()
    except UserModulePermissions.DoesNotExist:
        UserModulePermissions.objects.create(user=instance)



class TransactionType(models.TextChoices):
    DOCUMENT_UPLOAD = 'document_upload', 'Document Upload'
    CONVERSATION_CREATE = 'conversation_create', 'Conversation Create'
    CHAT_MESSAGE = 'chat_message', 'Chat Message'
    DOCUMENT_DELETE = 'document_delete', 'Document Delete'
    CONVERSATION_DELETE = 'conversation_delete', 'Conversation Delete'
 
class UserTransaction(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='transactions')
    transaction_type = models.CharField(max_length=50, choices=TransactionType.choices)
   
    # Reference fields - store original names/IDs even after deletion
    document_name = models.CharField(max_length=255, null=True, blank=True)
    document_id = models.IntegerField(null=True, blank=True)  # Store original ID
    conversation_title = models.CharField(max_length=255, null=True, blank=True)
    conversation_id = models.UUIDField(null=True, blank=True)  # Store original UUID
   
    # Project reference
    main_project = models.ForeignKey('core.Project', on_delete=models.CASCADE, related_name='transactions')
   
    # Transaction metadata
    metadata = models.JSONField(default=dict, blank=True)  # Store additional info
    created_at = models.DateTimeField(auto_now_add=True)
   
    # Status tracking
    is_active = models.BooleanField(default=True)  # False when referenced item is deleted
   
    class Meta:
        ordering = ['-created_at']
        app_label = 'chat'
   
    def __str__(self):
        return f"{self.user.username} - {self.get_transaction_type_display()} - {self.created_at.strftime('%Y-%m-%d %H:%M')}"
 
class DocumentTransaction(models.Model):
    """Specific tracking for document operations"""
    user_transaction = models.OneToOneField(UserTransaction, on_delete=models.CASCADE, related_name='document_details')
    original_filename = models.CharField(max_length=255)
    file_size = models.BigIntegerField(null=True, blank=True)
    file_type = models.CharField(max_length=50, null=True, blank=True)
    processing_status = models.CharField(max_length=50, default='completed')
    upload_method = models.CharField(max_length=50, default='regular')  # 'regular', 'audio_transcript', 'video_transcript'
   
    class Meta:
        app_label = 'chat'
 
class ConversationTransaction(models.Model):
    """Specific tracking for conversation operations"""
    user_transaction = models.OneToOneField(UserTransaction, on_delete=models.CASCADE, related_name='conversation_details')
    message_count = models.PositiveIntegerField(default=0)
   
    input_api_tokens = models.PositiveIntegerField(default=0)
    output_api_tokens = models.PositiveIntegerField(default=0)
   
    total_tokens_used = models.PositiveIntegerField(default=0)  # optional: keep it updated via save()
 
    web_knowledge_used = models.BooleanField(default=False)
    response_format = models.CharField(max_length=50, default='natural')
    response_length = models.CharField(max_length=20, default='comprehensive')
 
    class Meta:
        app_label = 'chat'
 
    def save(self, *args, **kwargs):
        # Automatically update total_tokens_used
        self.total_tokens_used = self.input_api_tokens + self.output_api_tokens
        super().save(*args, **kwargs)
 
 
 
# Add these signal handlers to your models.py
 
@receiver(pre_delete, sender=Document)
def track_document_deletion(sender, instance, **kwargs):
    """Track when a document is deleted"""
    try:
        # Mark the transaction as inactive
        UserTransaction.objects.filter(
            document_id=instance.id,
            transaction_type=TransactionType.DOCUMENT_UPLOAD,
            is_active=True
        ).update(
            is_active=False,
            metadata=models.F('metadata') | {'deletion_timestamp': timezone.now().isoformat()}
        )
       
        # Create a deletion transaction record
        if instance.main_project:
            UserTransaction.objects.create(
                user=instance.user,
                transaction_type=TransactionType.DOCUMENT_DELETE,
                document_name=instance.filename,
                document_id=instance.id,
                main_project=instance.main_project,
                metadata={
                    'deletion_timestamp': timezone.now().isoformat(),
                    'original_upload_date': instance.uploaded_at.isoformat() if instance.uploaded_at else None
                }
            )
       
        print(f"Document deletion tracked: {instance.filename}")
       
    except Exception as e:
        print(f"Error tracking document deletion: {str(e)}")
 
@receiver(pre_delete, sender=ChatHistory)
def track_conversation_deletion(sender, instance, **kwargs):
    """Track when a conversation is deleted"""
    try:
        # Mark the transaction as inactive
        UserTransaction.objects.filter(
            conversation_id=instance.conversation_id,
            transaction_type=TransactionType.CONVERSATION_CREATE,
            is_active=True
        ).update(
            is_active=False,
            metadata=models.F('metadata') | {'deletion_timestamp': timezone.now().isoformat()}
        )
       
        # Create a deletion transaction record
        if instance.main_project:
            UserTransaction.objects.create(
                user=instance.user,
                transaction_type=TransactionType.CONVERSATION_DELETE,
                conversation_title=instance.title,
                conversation_id=instance.conversation_id,
                main_project=instance.main_project,
                metadata={
                    'deletion_timestamp': timezone.now().isoformat(),
                    'original_creation_date': instance.created_at.isoformat() if instance.created_at else None,
                    'message_count': instance.messages.count()
                }
            )
       
        print(f"Conversation deletion tracked: {instance.title}")
       
    except Exception as e:
        print(f"Error tracking conversation deletion: {str(e)}")