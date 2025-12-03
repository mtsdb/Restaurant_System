from django.contrib import admin
from .models import Table, TableSession


@admin.register(Table)
class TableAdmin(admin.ModelAdmin):
	list_display = ("id", "number", "status")
	list_filter = ("status",)
	search_fields = ("number",)


@admin.register(TableSession)
class TableSessionAdmin(admin.ModelAdmin):
	list_display = ("id", "table", "status", "started_at", "ended_at")
	list_filter = ("status",)
	search_fields = ("table__number",)
