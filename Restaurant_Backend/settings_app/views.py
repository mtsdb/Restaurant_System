from rest_framework import status
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.views import APIView

from accounts_app.permissions import IsAdminRole
from .models import Setting
from .serializers import SettingSerializer


class SettingsRetrieveUpdateAPIView(APIView):
    permission_classes = (IsAuthenticated,)

    def get(self, request):
        obj = Setting.objects.first()
        if not obj:
            obj = Setting.objects.create()
        serializer = SettingSerializer(obj)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def patch(self, request):
        if not (getattr(request.user, "is_superuser", False) or IsAdminRole().has_permission(request, self)):
            return Response({"detail": "You do not have permission to update settings."}, status=status.HTTP_403_FORBIDDEN)
        obj = Setting.objects.first()
        if not obj:
            obj = Setting.objects.create()
        serializer = SettingSerializer(obj, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data, status=status.HTTP_200_OK)
