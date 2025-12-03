
from django.contrib.auth import authenticate
from rest_framework import status, viewsets
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework_simplejwt.tokens import RefreshToken

from .models import User
from .serializers import UserSerializer, UserCreateSerializer, UserUpdateSerializer
from .permissions import IsAdminRole


class LoginAPIView(APIView):
	"""POST /api/auth/login/ - returns token and user info"""

	permission_classes = [AllowAny]

	def post(self, request):
		username = request.data.get("username")
		password = request.data.get("password")
		if not username or not password:
			return Response({"detail": "username and password required"}, status=status.HTTP_400_BAD_REQUEST)
		user = authenticate(request, username=username, password=password)
		if user is None:
			return Response({"detail": "Invalid credentials"}, status=status.HTTP_401_UNAUTHORIZED)
		refresh = RefreshToken.for_user(user)
		data = {
			"refresh": str(refresh),
			"access": str(refresh.access_token),
			"user": UserSerializer(user).data,
		}
		return Response(data)


class MeAPIView(APIView):
	"""GET /api/auth/me/ - returns current authenticated user"""

	permission_classes = [IsAuthenticated]

	def get(self, request):
		serializer = UserSerializer(request.user)
		return Response(serializer.data)


class UserViewSet(viewsets.ModelViewSet):
	"""Admin-only management endpoints for users.

	- GET /api/users/ (list)
	- POST /api/users/ (create)
	- PATCH /api/users/{id}/ (partial_update)
	- DELETE /api/users/{id}/ (destroy)
	"""

	queryset = User.objects.all()
	serializer_class = UserSerializer
	permission_classes = [IsAuthenticated, IsAdminRole]

	def get_serializer_class(self):
		if self.action == "create":
			return UserCreateSerializer
		if self.action in ("partial_update", "update"):
			return UserUpdateSerializer
		return UserSerializer

	def create(self, request, *args, **kwargs):
		serializer = self.get_serializer(data=request.data)
		serializer.is_valid(raise_exception=True)
		user = serializer.save()
		read = UserSerializer(user)
		return Response(read.data, status=status.HTTP_201_CREATED)

	def partial_update(self, request, *args, **kwargs):
		return super().partial_update(request, *args, **kwargs)

