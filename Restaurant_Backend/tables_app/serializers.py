from rest_framework import serializers
from .models import Table, TableSession


class TableSerializer(serializers.ModelSerializer):
    class Meta:
        model = Table
        fields = ("id", "number", "status")


class TableSessionSerializer(serializers.ModelSerializer):
    table = TableSerializer(read_only=True)
    table_id = serializers.PrimaryKeyRelatedField(queryset=Table.objects.all(), write_only=True, source="table")

    class Meta:
        model = TableSession
        fields = ("id", "table", "table_id", "started_at", "ended_at", "status", "bill_requested", "bill_requested_at")
        read_only_fields = ("started_at", "ended_at", "status", "bill_requested", "bill_requested_at")
