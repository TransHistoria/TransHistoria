from django.contrib import admin
from .models import HistoryNode, Contributor

@admin.register(HistoryNode)
class HistoryNodeAdmin(admin.ModelAdmin):
    list_display = ('id', 'title', 'time', 'field', 'theme', 'region', 'tag', 'created_at')
    search_fields = ('title', 'con', 'field', 'theme', 'region', 'tag')
    list_filter = ('field', 'theme', 'region', 'tag', 'created_at')
    ordering = ('-created_at',)
    readonly_fields = ('created_at',)

@admin.register(Contributor)
class ContributorAdmin(admin.ModelAdmin):
    list_display = ('name', 'email', 'title', 'node', 'created_at')
    search_fields = ('name', 'email', 'title')
    list_filter = ('created_at', 'node')
    ordering = ('created_at',)
    readonly_fields = ('name', 'email', 'title', 'node', 'created_at')
