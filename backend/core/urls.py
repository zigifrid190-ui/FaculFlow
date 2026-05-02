from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from .views import (
    RegisterView, LoginView, UserListView,
    UserProfileView, PostListCreateView, CommunityListView,
)

urlpatterns = [
    # Auth
    path('register/', RegisterView.as_view(), name='register'),
    path('login/', LoginView.as_view(), name='login'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),

    # Users
    path('users/', UserListView.as_view(), name='user-list'),
    path('users/me/', UserProfileView.as_view(), name='user-profile'),

    # Posts (Feed)
    path('posts/', PostListCreateView.as_view(), name='post-list'),

    # Communities
    path('communities/', CommunityListView.as_view(), name='community-list'),
]