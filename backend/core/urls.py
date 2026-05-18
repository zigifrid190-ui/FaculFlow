from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from .views import (
    RegisterView, LoginView, UserListView,
    UserProfileView, PostListCreateView,
    CommunityListCreateView, CommunityDetailView,
    CommunityJoinView, CommunityMessageListView, CommunityReportView,
    MentorMatchFeedView, ConnectionActionView, ConnectionRequestListView,
    PostLikeToggleView, PostBookmarkToggleView, PostCommentListCreateView,
    ActiveConversationsListView, ChatMessageListCreateView,
    NotificationListView, NotificationUnreadCountView, NotificationMarkReadView,
    BattlePassView, BattlePassClaimRewardView, TagListView,
)

urlpatterns = [
    # Auth
    path('register/', RegisterView.as_view(), name='register'),
    path('login/', LoginView.as_view(), name='login'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),

    # Users
    path('users/', UserListView.as_view(), name='user-list'),
    path('users/me/', UserProfileView.as_view(), name='user-profile'),
    path('tags/', TagListView.as_view(), name='tag-list'),

    # Posts (Feed)
    path('posts/', PostListCreateView.as_view(), name='post-list'),

    # Social (Likes, Bookmarks, Comments)
    path('posts/<int:pk>/like/', PostLikeToggleView.as_view(), name='post-like'),
    path('posts/<int:pk>/bookmark/', PostBookmarkToggleView.as_view(), name='post-bookmark'),
    path('posts/<int:post_id>/comments/', PostCommentListCreateView.as_view(), name='post-comments'),

    # Communities
    path('communities/', CommunityListCreateView.as_view(), name='community-list'),
    path('communities/<int:pk>/', CommunityDetailView.as_view(), name='community-detail'),
    path('communities/<int:pk>/join/', CommunityJoinView.as_view(), name='community-join'),
    path('communities/<int:pk>/messages/', CommunityMessageListView.as_view(), name='community-messages'),
    path('communities/<int:pk>/report/', CommunityReportView.as_view(), name='community-report'),

    # Matching
    path('match/feed/', MentorMatchFeedView.as_view(), name='match-feed'),
    path('match/action/', ConnectionActionView.as_view(), name='match-action'),
    path('match/requests/', ConnectionRequestListView.as_view(), name='match-requests'),

    # Chat & Connections
    path('chat/conversations/', ActiveConversationsListView.as_view(), name='chat-conversations'),
    path('chat/messages/', ChatMessageListCreateView.as_view(), name='chat-messages'),

    # Notifications
    path('notifications/', NotificationListView.as_view(), name='notifications-list'),
    path('notifications/unread-count/', NotificationUnreadCountView.as_view(), name='notifications-unread'),
    path('notifications/<int:pk>/read/', NotificationMarkReadView.as_view(), name='notification-read'),

    # Battle Pass & Gamification
    path('user/battle-pass/', BattlePassView.as_view(), name='user-battle-pass'),
    path('user/battle-pass/claim/', BattlePassClaimRewardView.as_view(), name='user-battle-pass-claim'),
]