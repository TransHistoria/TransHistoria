from django.urls import path
from .views import views
from .views import submit_views as submit
from .views import node_views as node
from .views import martor
from django.contrib.auth import views as auth_views
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    path("index_A/", views.index_A),
    path("history/timeline_A/", views.timeline_A),
    path("", views.index),
    path("history/", views.history),
    path("history/timeline", views.timeline),
    path('detail/<str:uuid>/<str:mkdoc_path>/', views.timepoint, name='timepoint'),
    path("people/", views.people),
    path("theory/", views.theory),
    path("gallery/", views.gallery),
    path("archives/", views.archives),
    path("about_us/", views.about_us),
    path("about_submission/", views.about_submission),
    path("dlog/", views.dlog),
    path("submit/", submit.submit, name="submit"),
    path("api/", submit.post, name="post"),
    path("api/images_uploader/", martor.images_uploader, name="images_uploader"),
    path('api/historynode/<int:pk>/', node.historynode_api, name='historynode_api'),
    path('api/get_historynodes/', node.get_historynodes, name='search_historynodes_api'),
    path('api/get_timeline/', node.get_timeline, name='get_timeline_api'),
    path("login/", auth_views.LoginView.as_view(), name="login"),
    path("logout/", auth_views.LogoutView.as_view(), name="logout"),
] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)