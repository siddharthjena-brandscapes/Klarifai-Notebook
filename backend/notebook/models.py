#chat\ models.py
from django.db import models
from django.contrib.auth.models import User
import uuid
import google.generativeai as genai
import os
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
    huggingface_token = models.CharField(max_length=255, blank=True, null=True)
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


class UserUploadPermissions(models.Model):
    user = models.OneToOneField(User, related_name='upload_permissions_NB', on_delete=models.CASCADE)
    can_upload = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return f"{self.user.username} - Can Upload: {self.can_upload}"
from django.db import models
import json

class ProcessedIndex(models.Model):
    # Existing fields
    document = models.OneToOneField('Document', on_delete=models.CASCADE)
    faiss_index = models.CharField(max_length=255, help_text="Path to saved FAISS index file")
    metadata = models.CharField(max_length=255, help_text="Path to saved metadata file")
    summary = models.TextField(help_text="Generated summary of the document")
    idea_parameters = models.JSONField(null=True, blank=True)  # by sourav for idea gen integration
    markdown_path = models.CharField(max_length=255, help_text="Path to saved Markdown file with key terms")
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
    
    follow_up_questions = models.JSONField(blank=True, null=True)
    main_project = models.ForeignKey('core.Project', on_delete=models.CASCADE, related_name='chat_histories_NB', null=True)
    


    def __str__(self):
        return f"{self.user.username} - {self.title or 'Untitled Chat'}"
    
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
