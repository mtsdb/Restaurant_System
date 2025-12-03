from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import LoginAPIView, MeAPIView, UserViewSet

router = DefaultRouter()
router.register(r"users", UserViewSet, basename="user")

urlpatterns = [
    path("auth/login/", LoginAPIView.as_view(), name="login"),
    path("auth/me/", MeAPIView.as_view(), name="me"),
    path("", include(router.urls)),
]
