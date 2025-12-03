"""
URL configuration for Restaurant_Backend project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/4.2/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""

from django.contrib import admin
from django.urls import path, include
from tables_app.views import SessionRetrieveAPIView

urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/", include("accounts_app.urls")),
    path("api/rbac/", include("rbac_app.urls")),
    path("api/tables/", include("tables_app.urls")),
    path("api/menu/", include("menu_app.urls")),
    # session detail endpoint accessible at /api/sessions/<id>/ per spec
    path("api/sessions/<int:pk>/", SessionRetrieveAPIView.as_view(), name="session-detail-root"),
]
