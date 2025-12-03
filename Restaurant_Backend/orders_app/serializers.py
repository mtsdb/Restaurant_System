from rest_framework import serializers
from .models import Order, OrderItem
from menu_app.serializers import ItemSerializer

# Import the Item model to provide a queryset for PrimaryKeyRelatedField
from menu_app.models import Item as MenuItem


class OrderItemSerializer(serializers.ModelSerializer):
    item = ItemSerializer(read_only=True)
    item_id = serializers.PrimaryKeyRelatedField(queryset=MenuItem.objects.all(), write_only=True, source="item")

    class Meta:
        model = OrderItem
        fields = ("id", "order", "item", "item_id", "quantity", "note_to_chef", "price_snapshot", "status", "created_at")
        read_only_fields = ("id", "order", "price_snapshot", "status", "created_at")


class OrderSerializer(serializers.ModelSerializer):
    items = OrderItemSerializer(many=True, read_only=True)

    class Meta:
        model = Order
        fields = ("id", "session", "created_by", "created_at", "items")
        read_only_fields = ("id", "created_by", "created_at", "items")