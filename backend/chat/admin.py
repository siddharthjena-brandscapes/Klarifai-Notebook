from django.contrib import admin
from .models import ChatMessage

@admin.register(ChatMessage)
class ChatMessageAdmin(admin.ModelAdmin):
    list_display = ('role', 'chat_history', 'created_at')
    list_filter = ('role', 'created_at')
    search_fields = ('content',)
# Register your models here.
