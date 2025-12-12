from django.urls import path
from .views import SettingsRetrieveUpdateAPIView

urlpatterns = [
    path("", SettingsRetrieveUpdateAPIView.as_view(), name="settings-detail"),
]
