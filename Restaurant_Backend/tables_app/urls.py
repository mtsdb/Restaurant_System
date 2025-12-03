from django.urls import path
from . import views

urlpatterns = [
    path("", views.TableListCreateAPIView.as_view(), name="table-list-create"),
    path("<int:pk>/open-session/", views.OpenSessionAPIView.as_view(), name="table-open-session"),
    path("<int:pk>/close-session/", views.CloseSessionAPIView.as_view(), name="table-close-session"),
    path("sessions/<int:pk>/", views.SessionRetrieveAPIView.as_view(), name="session-detail"),
]
