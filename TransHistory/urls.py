from django.urls import path
from . import views
from django.contrib.auth import views as auth_views

urlpatterns = [
    path("index_A/", views.index_A),
    path("", views.index),
    path("history/", views.history),
    path("history/timeline", views.timeline),
    path('history/timepoint/<int:year>/', views.timepoint, name='timepoint'),
    path("people/", views.people),
    path("theory/", views.theory),
    path("gallery/", views.gallery),
    path("archives/", views.archives),
    path("about_us/", views.about_us),
    path("about_submission/", views.about_submission),
    path("dlog/", views.dlog),
    path("submit/", views.submit, name="submit"),
    path("api/", views.post, name="post"),
    path('api/historynode/<int:pk>/', views.historynode_api, name='historynode_api'),
    path("login/", auth_views.LoginView.as_view(), name="login"),
    path("logout/", auth_views.LogoutView.as_view(), name="logout"),
]