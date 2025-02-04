


# models.py
from django.db import models
from django.contrib.auth.models import User
import uuid
import google.generativeai as genai
import os

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

class Document(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    file = models.FileField(upload_to='documents/')
    filename = models.CharField(max_length=255)
    uploaded_at = models.DateTimeField(auto_now_add=True)
    main_project = models.ForeignKey('core.Project', on_delete=models.CASCADE, related_name='chat_documents', null=True)
    def __str__(self):
        return self.filename
    class Meta:
        app_label = 'chat'
class ProcessedIndex(models.Model):
    document = models.OneToOneField(Document, on_delete=models.CASCADE)
    faiss_index = models.CharField(max_length=255, help_text="Path to saved FAISS index file")
    metadata = models.CharField(max_length=255, help_text="Path to saved metadata file")
    summary = models.TextField(help_text="Generated summary of the document")
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