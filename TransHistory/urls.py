from django.contrib import admin
from django.urls import path
from . import views

urlpatterns = [
    path('admin/', admin.site.urls),
    path("", views.index_A),
    path('History/timepoint/<int:year>/', views.timepoint, name='timepoint')
]