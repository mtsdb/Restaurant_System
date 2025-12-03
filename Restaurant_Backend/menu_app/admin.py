from django.contrib import admin
from .models import Category, Item


@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
	list_display = ("id", "name")
	search_fields = ("name",)


@admin.register(Item)
class ItemAdmin(admin.ModelAdmin):
	list_display = ("id", "name", "category", "price", "available", "type")
	list_filter = ("available", "type", "category")
	search_fields = ("name", "category__name")
