from django.urls import path
from . import views

urlpatterns = [
    path("sessions/<int:pk>/orders/", views.CreateOrderForSessionAPIView.as_view(), name="create-order-for-session"),
    path("orders/<int:pk>/", views.OrderRetrieveAPIView.as_view(), name="order-detail"),
    path("orders/<int:pk>/add-item/", views.AddItemToOrderAPIView.as_view(), name="order-add-item"),
    path("orders/items/<int:pk>/status/", views.OrderItemStatusUpdateAPIView.as_view(), name="order-item-status"),
    path("orders/items/<int:pk>/", views.OrderItemDeleteAPIView.as_view(), name="order-item-delete"),
    path("kitchen/items/", views.KitchenOrderItemListAPIView.as_view(), name="kitchen-items"),
    path("kitchen/dashboard/", views.KitchenDashboardAPIView.as_view(), name="kitchen-dashboard"),
]
