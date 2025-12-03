from django.contrib import admin
from .models import Order, OrderItem


@admin.register(Order)
class OrderAdmin(admin.ModelAdmin):
	list_display = ("id", "session", "created_by", "created_at")
	search_fields = ("session__id", "created_by__username")


@admin.register(OrderItem)
class OrderItemAdmin(admin.ModelAdmin):
	list_display = ("id", "order", "item", "quantity", "status", "created_at")
	list_filter = ("status",)
	search_fields = ("item__name",)
