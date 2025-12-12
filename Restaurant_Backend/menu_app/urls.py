from django.urls import path
from . import views

urlpatterns = [
    path("categories/", views.CategoryListCreateAPIView.as_view(), name="menu-categories"),
    path("categories/<int:pk>/", views.CategoryRetrieveUpdateDestroyAPIView.as_view(), name="menu-category-detail"),
    path("items/", views.ItemListCreateAPIView.as_view(), name="menu-items"),
    path("items/<int:pk>/", views.ItemRetrieveUpdateDestroyAPIView.as_view(), name="menu-item-detail"),
]
