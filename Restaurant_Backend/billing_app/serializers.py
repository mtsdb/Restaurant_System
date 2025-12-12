from rest_framework import serializers
from .models import Invoice


class InvoiceSerializer(serializers.ModelSerializer):
    class Meta:
        model = Invoice
        fields = ("id", "session", "subtotal", "discount", "service_charge", "tax", "total", "paid", "created_at", "paid_at")
        read_only_fields = ("id", "subtotal", "discount", "service_charge", "tax", "total", "paid", "created_at", "paid_at")
