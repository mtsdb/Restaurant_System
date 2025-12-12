from rest_framework import serializers
from .models import Setting


class SettingSerializer(serializers.ModelSerializer):
    class Meta:
        model = Setting
        fields = ("id", "tax_rate", "service_charge_rate", "discount_rate")
