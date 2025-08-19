#chat\ models.py
from django.db import models
from django.contrib.auth.models import User
import uuid
import google.generativeai as genai
import os
from django.db.models.signals import pre_delete
from django.utils import timezone
from django.db.models.signals import post_save
from django.dispatch import receiver
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
 
class UserAPITokens(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='api_tokens_NB')
    nebius_token = models.CharField(max_length=1024, blank=True, null=True)
    gemini_token = models.CharField(max_length=255, blank=True, null=True)
    llama_token = models.CharField(max_length=255, blank=True, null=True)
   
    def __str__(self):
        return f"{self.user.username}'s API Tokens"
 
class Document(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='notebook_documents')
    file = models.FileField(upload_to='documents/')
    filename = models.CharField(max_length=255)
    uploaded_at = models.DateTimeField(auto_now_add=True)
    main_project = models.ForeignKey('core.Project', on_delete=models.CASCADE, related_name='chat_documents_NB', null=True)
     # Add these new fields
    view_count = models.PositiveIntegerField(default=0)
    last_viewed_at = models.DateTimeField(null=True, blank=True)
    def __str__(self):
        return self.filename
 
 
class DocumentProcessingStatus(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='document_processing_statuses_NB')
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
    user = models.OneToOneField(User, related_name='upload_permissions_NB', on_delete=models.CASCADE)
    can_upload = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
   
    def __str__(self):
        return f"{self.user.username} - Can Upload: {self.can_upload}"
   
 
from django.db import models
import json
 
from django.db import models
import json
 
from django.db import models
from django.contrib.postgres.fields import ArrayField
from pgvector.django import VectorField
 
class DocumentEmbedding(models.Model):
    document = models.ForeignKey('Document', on_delete=models.CASCADE, related_name='embeddings')
    content = models.TextField()  # The chunked text
    embedding = VectorField(dimensions=1536)  # pgvector storage
    chunk_id = models.PositiveIntegerField()  # Chunk number
    source = models.CharField(max_length=255, null=True, blank=True)  # Source name or page
    source_file = models.CharField(max_length=255, null=True, blank=True)  # Original file name
    created_at = models.DateTimeField(auto_now_add=True)
   
    class Meta:
        indexes = [
            models.Index(fields=['document', 'chunk_id']),
            models.Index(fields=['source_file']),
        ]
   
    def __str__(self):
        return f"{self.document.filename} - Chunk {self.chunk_id}"
 
class ProcessedIndex(models.Model):
    document = models.OneToOneField('Document', on_delete=models.CASCADE)
   
    # FAISS fields (for backward compatibility)
    faiss_index = models.CharField(max_length=500, null=True, blank=True)
    metadata = models.CharField(max_length=500, null=True, blank=True)
   
    # pgvector fields
    storage_type = models.CharField(max_length=20, default='pgvector', choices=[
        ('faiss', 'FAISS'),
        ('pgvector', 'pgvector')
    ])
    chunks_count = models.PositiveIntegerField(default=0)
   
    summary = models.TextField(blank=True)
    markdown_path = models.CharField(max_length=500, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    idea_parameters = models.JSONField(null=True, blank=True)  # by sourav for idea gen integration
    follow_up_question_1 = models.TextField(blank=True, null=True, help_text="First follow-up question")
    follow_up_question_2 = models.TextField(blank=True, null=True, help_text="Second follow-up question")
    follow_up_question_3 = models.TextField(blank=True, null=True, help_text="Third follow-up question")
    processed_at = models.DateTimeField(auto_now_add=True)
   
    # New field for enhanced summary with key points
    key_points = models.JSONField(default=list, blank=True, help_text="Key points/topics extracted from document")
   
    mindmap_generated = models.BooleanField(default=False, help_text="Whether a mindmap has been generated from this document")
    last_mindmap_generated = models.DateTimeField(null=True, blank=True, help_text="When was the last mindmap generated")
 
    def get_key_points(self):
        """Helper method to get key points as a list"""
        if isinstance(self.key_points, list):
            return self.key_points
        elif isinstance(self.key_points, str):
            try:
                return json.loads(self.key_points)
            except json.JSONDecodeError:
                return []
        return []
   
    def set_key_points(self, key_points_list):
        """Helper method to set key points"""
        self.key_points = key_points_list if isinstance(key_points_list, list) else []
   
    def __str__(self):
        return f"Processed Index for {self.document.filename}"
 
 
class ChatMessage(models.Model):
    ROLE_CHOICES = (
        ('user', 'User'),
        ('assistant', 'Assistant'),
        ('system', 'System')
    )
   
    chat_history = models.ForeignKey('ChatHistory', related_name='messages_NB', on_delete=models.CASCADE)
    role = models.CharField(max_length=20, choices=ROLE_CHOICES)
    content = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    citations = models.JSONField(blank=True, null=True)
    sources = models.TextField(blank=True, null=True)
   
    # New fields for message properties
    use_web_knowledge = models.BooleanField(default=False)
    response_length = models.CharField(max_length=20, default="comprehensive", null=True, blank=True)
    response_format = models.CharField(max_length=50, default="natural", null=True, blank=True)
   
 
   
    def __str__(self):
        return f"{self.role}: {self.content[:50]}"
 
class ChatHistory(models.Model):
    conversation_id = models.UUIDField(default=uuid.uuid4, editable=False)
   
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='chat_histories_NB')
   
    documents = models.ManyToManyField(Document, blank=True, related_name='chat_histories_NB')
   
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
   
    title = models.CharField(max_length=255, blank=True, null=True)
    is_active = models.BooleanField(default=True)
    is_archived = models.BooleanField(default=False)
    
    follow_up_questions = models.JSONField(blank=True, null=True)
    main_project = models.ForeignKey('core.Project', on_delete=models.CASCADE, related_name='chat_histories_NB', null=True)
   
 
 
    def __str__(self):
        return f"{self.user.username} - {self.title or 'Untitled Chat'}"
   
import json
import logging
from django.db import models
from openai import OpenAI
from django.conf import settings
from dotenv import load_dotenv
 
logger = logging.getLogger(__name__)
 
load_dotenv()
 
OPENAI_API_KEY = os.getenv('OPENAI_API_KEY')
 
if not OPENAI_API_KEY:
    raise ValueError("Missing required API keys in environment variables")
 
 
 
client = OpenAI(api_key=OPENAI_API_KEY)
 
class ConversationMemoryBuffer(models.Model):
    conversation = models.OneToOneField(
        'ChatHistory',
        on_delete=models.CASCADE,
        related_name='memory_buffer_NB'
    )
    key_entities = models.JSONField(blank=True, null=True)
    context_summary = models.TextField(blank=True, null=True)
    last_updated = models.DateTimeField(auto_now=True)
 
    def update_memory(self, messages):
        """
        Update memory buffer with conversation insights using OpenAI
        """
        if not messages.exists():
            return
           
        try:
            print(f"🧠 Starting memory buffer update for {messages.count()} messages")
           
            # OPTIMIZATION: Extract entities and summary in ONE API call
            combined_result = self.extract_entities_and_summary(messages)
           
            if combined_result:
                self.key_entities = combined_result.get('entities', {})
                self.context_summary = combined_result.get('summary', 'No summary available')
                self.save()
                print(f"✅ Updated conversation memory buffer successfully")
            else:
                print("⚠️ Failed to update memory buffer - using fallback")
               
        except Exception as e:
            logger.error(f"Error updating conversation memory: {str(e)}")
            print(f"❌ Error updating conversation memory: {str(e)}")
 
    def extract_entities_and_summary(self, messages):
        """
        Extract entities AND generate summary in a single OpenAI API call
        """
        try:
            # Get the last 8 messages for processing (4 complete turns)
            recent_messages = messages.order_by('-created_at')[:8]
            if not recent_messages:
                return None
               
            context_text = ""
            for msg in reversed(recent_messages):
                role = "User" if msg.role == 'user' else "Assistant"
                # Limit individual message length to prevent token overflow
                content = msg.content[:1000] + "..." if len(msg.content) > 1000 else msg.content
                context_text += f"{role}: {content}\n\n"
           
            # Limit total context length
            if len(context_text) > 4000:
                context_text = context_text[:4000] + "..."
           
            # Combined prompt for both entities and summary
            combined_prompt = f"""
            Analyze this conversation and provide both entity extraction and summary.
           
            Conversation:
            {context_text}
           
            Respond with a JSON object containing:
            1. "entities" - key entities and concepts organized by category
            2. "summary" - concise conversation summary (under 200 words)
           
            JSON format:
            {{
                "entities": {{
                    "people": ["names mentioned"],
                    "organizations": ["companies, institutions"],
                    "topics": ["main subjects discussed"],
                    "key_terms": ["important technical terms"],
                    "dates": ["important dates"],
                    "locations": ["places mentioned"]
                }},
                "summary": "Concise summary focusing on main topics, key insights, current context, and user preferences that would help understand future questions."
            }}
            """
           
            response = client.chat.completions.create(
                model="gpt-4o-mini",  # Use cheaper model for memory tasks
                messages=[
                    {"role": "system", "content": "You are a conversation analyzer. Always respond with valid JSON."},
                    {"role": "user", "content": combined_prompt}
                ],
                response_format={"type": "json_object"},
                temperature=0.3,  # Lower temperature for consistent output
                max_tokens=800    # Limit tokens to prevent long responses
            )
           
            result = json.loads(response.choices[0].message.content)
            print(f"🧠 Memory extraction completed successfully")
            return result
           
        except json.JSONDecodeError as e:
            logger.error(f"JSON parsing error in memory extraction: {str(e)}")
            print(f"❌ JSON parsing error in memory extraction")
            return self._fallback_memory_extraction(context_text)
           
        except Exception as e:
            logger.error(f"Error in combined entity extraction and summary: {str(e)}")
            print(f"❌ Error in memory extraction: {str(e)}")
            return self._fallback_memory_extraction(context_text) if 'context_text' in locals() else None
 
    def _fallback_memory_extraction(self, context_text):
        """
        Fallback method for memory extraction without JSON parsing
        """
        try:
            simple_prompt = f"""
            Briefly summarize this conversation in 2-3 sentences:
            {context_text[:2000]}
            """
           
            response = client.chat.completions.create(
                model="gpt-4o-mini",
                messages=[
                    {"role": "system", "content": "Provide a brief conversation summary."},
                    {"role": "user", "content": simple_prompt}
                ],
                temperature=0.3,
                max_tokens=200
            )
           
            return {
                "entities": {"topics": ["General conversation"]},
                "summary": response.choices[0].message.content
            }
           
        except Exception as e:
            logger.error(f"Fallback memory extraction failed: {str(e)}")
            return {
                "entities": {"topics": ["Conversation analysis failed"]},
                "summary": "Unable to generate conversation summary due to processing error."
            }
 
    # OPTIONAL: Add async version for background processing
    def update_memory_async(self, messages):
        """
        Async version for background processing (to be used with threading/celery)
        """
        try:
            import threading
            thread = threading.Thread(target=self.update_memory, args=(messages,))
            thread.daemon = True
            thread.start()
            print("🚀 Started memory update in background thread")
        except Exception as e:
            logger.error(f"Failed to start async memory update: {str(e)}")
            print(f"❌ Failed to start async memory update")
 
    # DEPRECATED: Keep old methods for backward compatibility but mark them
    def extract_key_entities(self, messages):
        """DEPRECATED: Use extract_entities_and_summary() instead"""
        print("⚠️ WARNING: extract_key_entities() is deprecated")
        return {}
 
    def summarize_context(self, messages):
        """DEPRECATED: Use extract_entities_and_summary() instead"""
        print("⚠️ WARNING: summarize_context() is deprecated")
        return "Please update to use the new combined method."
 
 
 
       
 
class UserModulePermissions(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='module_permissions_NB')
    disabled_modules = models.JSONField(default=dict, blank=True)
   
    def __str__(self):
        return f"{self.user.username}'s module permissions"
   
 
 
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
 
 
 
class Note(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='notebook_notes')
    title = models.CharField(max_length=255, blank=True, null=True)
    content = models.TextField()
    main_project = models.ForeignKey('core.Project', on_delete=models.CASCADE, related_name='notes_NB', null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    is_converted_to_document = models.BooleanField(default=False)
    converted_document = models.ForeignKey(Document, on_delete=models.SET_NULL, null=True, blank=True, related_name='source_note')
   
    def __str__(self):
        title = self.title or f"Note {self.id}"
        return f"{self.user.username} - {title}"
   
 
class MindMap(models.Model):
    """Model to store generated mindmaps linked to projects and users"""
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='mindmaps_NB')
    main_project = models.ForeignKey('core.Project', on_delete=models.CASCADE, related_name='mindmaps_NB', null=True)
    data = models.JSONField(help_text="JSON data for the mindmap structure")
    document_sources = models.JSONField(blank=True, null=True, help_text="List of document filenames used to generate this mindmap")
    total_nodes = models.PositiveIntegerField(default=0, help_text="Total number of nodes in the mindmap")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
   
    class Meta:
        ordering = ['-created_at']
   
    def __str__(self):
        return f"MindMap for {self.user.username} - {self.created_at.strftime('%Y-%m-%d %H:%M')}"
   
    def get_document_sources_list(self):
        """Helper method to get document sources as a list"""
        if self.document_sources:
            try:
                return json.loads(self.document_sources) if isinstance(self.document_sources, str) else self.document_sources
            except (json.JSONDecodeError, TypeError):
                return []
        return []
   
    def set_document_sources_list(self, sources_list):
        """Helper method to set document sources"""
        self.document_sources = json.dumps(sources_list) if isinstance(sources_list, list) else sources_list
 
 
class TransactionType(models.TextChoices):
    DOCUMENT_UPLOAD = 'document_upload', 'Document Upload'
    CONVERSATION_CREATE = 'conversation_create', 'Conversation Create'
    CHAT_MESSAGE = 'chat_message', 'Chat Message'
    DOCUMENT_DELETE = 'document_delete', 'Document Delete'
    CONVERSATION_DELETE = 'conversation_delete', 'Conversation Delete'
 
class UserTransaction(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='notebook_transactions')
    transaction_type = models.CharField(max_length=50, choices=TransactionType.choices)
   
    # Reference fields - store original names/IDs even after deletion
    document_name = models.CharField(max_length=255, null=True, blank=True)
    document_id = models.IntegerField(null=True, blank=True)  # Store original ID
    conversation_title = models.CharField(max_length=255, null=True, blank=True)
    conversation_id = models.UUIDField(null=True, blank=True)  # Store original UUID
   
    # Project reference
    main_project = models.ForeignKey('core.Project', on_delete=models.CASCADE, related_name='notebook_transactions')
   
    # Transaction metadata
    metadata = models.JSONField(default=dict, blank=True)  # Store additional info
    created_at = models.DateTimeField(auto_now_add=True)
   
    # Status tracking
    is_active = models.BooleanField(default=True)  # False when referenced item is deleted
   
    class Meta:
        ordering = ['-created_at']
        app_label = 'notebook'
   
    def __str__(self):
        return f"{self.user.username} - {self.get_transaction_type_display()} - {self.created_at.strftime('%Y-%m-%d %H:%M')}"
 
class DocumentTransaction(models.Model):
    """Specific tracking for document operations"""
    user_transaction = models.OneToOneField(UserTransaction, on_delete=models.CASCADE, related_name='notebook_document_details')
    original_filename = models.CharField(max_length=255)
    file_size = models.BigIntegerField(null=True, blank=True)
    file_type = models.CharField(max_length=50, null=True, blank=True)
    processing_status = models.CharField(max_length=50, default='completed')
    upload_method = models.CharField(max_length=50, default='regular')  # 'regular', 'audio_transcript', 'video_transcript'
    no_pages = models.IntegerField(null=True, blank=True)  # Number of pages in the document
   
    class Meta:
        app_label = 'notebook'
 


class ConversationTransaction(models.Model):
    """Specific tracking for conversation operations"""
    user_transaction = models.OneToOneField(UserTransaction, on_delete=models.CASCADE, related_name='notebook_conversation_details')
    message_count = models.PositiveIntegerField(default=0)
    question_count = models.PositiveIntegerField(default=0)  # NEW: Track total questions
   
    input_api_tokens = models.PositiveIntegerField(default=0)
    output_api_tokens = models.PositiveIntegerField(default=0)
   
    total_tokens_used = models.PositiveIntegerField(default=0)  # optional: keep it updated via save()
 
    web_knowledge_used = models.BooleanField(default=False)
    response_format = models.CharField(max_length=50, default='natural')
    response_length = models.CharField(max_length=20, default='comprehensive')
 
    class Meta:
        app_label = 'notebook'
 
    def save(self, *args, **kwargs):
        # Automatically update total_tokens_used
        self.total_tokens_used = self.input_api_tokens + self.output_api_tokens
        super().save(*args, **kwargs)
 
 
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