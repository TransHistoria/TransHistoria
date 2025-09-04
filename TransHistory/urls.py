from django.urls import path
from . import views
from django.contrib.auth import views as auth_views

urlpatterns = [
    path("", views.index),
    path('History/timepoint/<int:year>/', views.timepoint, name='timepoint'),
    path("submit/", views.submit, name="submit"),
    path("api/", views.post, name="post"),
    path("login/", auth_views.LoginView.as_view(), name="login"),
    path("logout/", auth_views.LogoutView.as_view(), name="logout"),
]