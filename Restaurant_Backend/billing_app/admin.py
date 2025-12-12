from django.contrib import admin
from .models import Invoice

@admin.register(Invoice)
class InvoiceAdmin(admin.ModelAdmin):
    list_display = ("id", "session", "subtotal", "discount", "service_charge", "tax", "total", "paid", "created_at", "paid_at")
    list_filter = ("paid",)
    search_fields = ("id", "session__id", "session__table__number")
