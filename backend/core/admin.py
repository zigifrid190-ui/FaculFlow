from django.contrib import admin
from .models import User, Post, Community

@admin.register(User)
class UserAdmin(admin.ModelAdmin):
    list_display = ['email', 'username', 'curso', 'semestre', 'is_calouro', 'is_active']
    list_filter = ['is_calouro', 'curso']
    search_fields = ['email', 'username', 'curso']

@admin.register(Post)
class PostAdmin(admin.ModelAdmin):
    list_display = ['author', 'content_preview', 'created_at']
    list_filter = ['created_at']
    search_fields = ['content', 'author__username']

    def content_preview(self, obj):
        return obj.content[:80] + '...' if len(obj.content) > 80 else obj.content
    content_preview.short_description = 'Conteúdo'

@admin.register(Community)
class CommunityAdmin(admin.ModelAdmin):
    list_display = ['name', 'icon', 'member_count', 'created_at']
    search_fields = ['name']

    def member_count(self, obj):
        return obj.members.count()
    member_count.short_description = 'Membros'
