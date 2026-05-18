from datetime import timedelta

from rest_framework import status, generics, filters
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.pagination import CursorPagination
from rest_framework_simplejwt.tokens import RefreshToken
from django.db.models import Count, Q, Exists, OuterRef
from django.utils import timezone

from .serializers import (
    UserSerializer, UserPublicSerializer, LoginSerializer,
    PostSerializer, CommunitySerializer, CommunityCreateSerializer,
    CommunityMessageSerializer, CommunityReportSerializer,
    CommentSerializer, ChatMessageSerializer, NotificationSerializer,
    TagSerializer,
)
from .models import User, Post, Community, ConnectionRequest, CommunityMessage, Comment, ChatMessage, Notification, Tag


class RegisterView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = UserSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()
            refresh = RefreshToken.for_user(user)
            return Response({
                'message': 'Usuário cadastrado com sucesso!',
                'user': UserSerializer(user).data,
                'tokens': {
                    'refresh': str(refresh),
                    'access': str(refresh.access_token),
                }
            }, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class LoginView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        if serializer.is_valid():
            user = User.objects.filter(email=serializer.validated_data['email']).first()
            if user and user.check_password(serializer.validated_data['password']):
                refresh = RefreshToken.for_user(user)
                return Response({
                    'message': 'Login realizado com sucesso!',
                    'user': UserSerializer(user).data,
                    'tokens': {
                        'refresh': str(refresh),
                        'access': str(refresh.access_token),
                    }
                })
            return Response(
                {'error': 'Email ou senha incorretos'},
                status=status.HTTP_401_UNAUTHORIZED,
            )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class UserListView(generics.ListAPIView):
    """List all users with search by name/course."""
    serializer_class = UserPublicSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [filters.SearchFilter]
    search_fields = ['username', 'curso']

    def get_queryset(self):
        return User.objects.exclude(id=self.request.user.id)


class UserProfileView(generics.RetrieveUpdateAPIView):
    """Get or update the current user's profile."""
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated]

    def get_object(self):
        return self.request.user


class PostFeedCursorPagination(CursorPagination):
    page_size = 15
    ordering = '-created_at'

class MessageFeedCursorPagination(CursorPagination):
    page_size = 30
    ordering = 'created_at'


class PostListCreateView(generics.ListCreateAPIView):
    """List feed posts or create a new one."""
    serializer_class = PostSerializer
    permission_classes = [IsAuthenticated]
    queryset = Post.objects.all()
    pagination_class = PostFeedCursorPagination

    def perform_create(self, serializer):
        user = self.request.user
        serializer.save(author=user)
        
        # Grant XP for the first feed post of the day
        today = timezone.now().date()
        posts_today = Post.objects.filter(author=user, created_at__date=today).exclude(id=serializer.instance.id).exists()
        if not posts_today:
            from core.xp_engine import grant_xp
            grant_xp(user, 20)


# ==================== COMMUNITY ====================

class CommunityListCreateView(generics.ListCreateAPIView):
    """
    GET: List communities ordered by hot score (messages in last 24h).
    POST: Create a new community board (max 3 per user).
    Filters: ?category=curso|ano|tema  ?ordering=membros
    """
    permission_classes = [IsAuthenticated]

    def get_serializer_class(self):
        if self.request.method == 'POST':
            return CommunityCreateSerializer
        return CommunitySerializer

    def get_queryset(self):
        hot_threshold = timezone.now() - timedelta(hours=24)
        user = self.request.user
        
        # Base annotated queryset
        qs = Community.objects.annotate(
            hot_score=Count('messages', filter=Q(messages__created_at__gte=hot_threshold)),
            total_members=Count('members', distinct=True)
        )

        if user and user.is_authenticated:
            qs = qs.annotate(
                is_member_annotated=Exists(
                    Community.members.through.objects.filter(
                        community_id=OuterRef('pk'),
                        user_id=user.id
                    )
                )
            )

        # Filters
        category = self.request.query_params.get('category')
        if category:
            qs = qs.filter(category=category)

        # Ordering
        ordering = self.request.query_params.get('ordering', 'hot')
        if ordering == 'membros':
            qs = qs.order_by('-total_members')
        else:
            qs = qs.order_by('-hot_score', '-created_at')

        return qs


class CommunityDetailView(generics.RetrieveAPIView):
    """Get detail of a single community board."""
    serializer_class = CommunitySerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        hot_threshold = timezone.now() - timedelta(hours=24)
        user = self.request.user
        
        qs = Community.objects.annotate(
            hot_score=Count('messages', filter=Q(messages__created_at__gte=hot_threshold)),
            total_members=Count('members', distinct=True)
        )

        if user and user.is_authenticated:
            qs = qs.annotate(
                is_member_annotated=Exists(
                    Community.members.through.objects.filter(
                        community_id=OuterRef('pk'),
                        user_id=user.id
                    )
                )
            )
        return qs


class CommunityJoinView(APIView):
    """POST: Toggle join/leave a community."""
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        try:
            community = Community.objects.get(pk=pk)
        except Community.DoesNotExist:
            return Response({'error': 'Comunidade não encontrada.'}, status=status.HTTP_404_NOT_FOUND)

        user = request.user
        if community.members.filter(id=user.id).exists():
            community.members.remove(user)
            return Response({'message': 'Você saiu da comunidade.', 'is_member': False})
        else:
            community.members.add(user)
            return Response({'message': 'Você entrou na comunidade!', 'is_member': True})


class CommunityMessageListView(generics.ListCreateAPIView):
    """GET: List messages for a community. POST: Send a message."""
    serializer_class = CommunityMessageSerializer
    permission_classes = [IsAuthenticated]
    pagination_class = MessageFeedCursorPagination

    def get_queryset(self):
        return CommunityMessage.objects.filter(community_id=self.kwargs['pk'])

    def perform_create(self, serializer):
        community = Community.objects.get(pk=self.kwargs['pk'])
        # Auto-join if not a member yet
        if not community.members.filter(id=self.request.user.id).exists():
            community.members.add(self.request.user)
        serializer.save(author=self.request.user, community=community)


class CommunityReportView(APIView):
    """POST: Report a community for irregularities."""
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        try:
            community = Community.objects.get(pk=pk)
        except Community.DoesNotExist:
            return Response({'error': 'Comunidade não encontrada.'}, status=status.HTTP_404_NOT_FOUND)

        serializer = CommunityReportSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(community=community, reporter=request.user)
            return Response({'message': 'Denúncia registrada com sucesso.'}, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


# ==================== MATCHING ====================

class MentorMatchFeedView(generics.ListAPIView):
    """Retorna perfis para o sistema de match (Mentores vs Calouros)."""
    serializer_class = UserPublicSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        
        # Filtra pelo oposto (se calouro -> busca veteranos, se veterano -> busca calouros)
        target_role_is_calouro = not user.is_calouro
        
        # Encontra IDs de usuários com quem já houve interação
        interacted_users = ConnectionRequest.objects.filter(
            Q(sender=user) | Q(receiver=user)
        ).values_list('sender_id', 'receiver_id')
        
        # Flatten and filter out the current user id
        interacted_ids = set()
        for s_id, r_id in interacted_users:
            if s_id != user.id:
                interacted_ids.add(s_id)
            if r_id != user.id:
                interacted_ids.add(r_id)
                
        # Exclui si mesmo e os que já interagiu
        return User.objects.filter(is_calouro=target_role_is_calouro).exclude(id=user.id).exclude(id__in=interacted_ids)

class ConnectionActionView(APIView):
    """Registra a ação do usuário no match (conectar ou pular)."""
    permission_classes = [IsAuthenticated]

    def post(self, request):
        target_user_id = request.data.get('target_user_id')
        action = request.data.get('action') # 'connect' ou 'skip'

        if not target_user_id or action not in ['connect', 'skip']:
            return Response({'error': 'target_user_id e action (connect/skip) são obrigatórios.'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            target_user = User.objects.get(id=target_user_id)
        except User.DoesNotExist:
            return Response({'error': 'Usuário alvo não encontrado.'}, status=status.HTTP_404_NOT_FOUND)

        if target_user == request.user:
            return Response({'error': 'Não pode interagir com si mesmo.'}, status=status.HTTP_400_BAD_REQUEST)

        # Check if the opposite connection exists and is pending
        opposite = ConnectionRequest.objects.filter(sender=target_user, receiver=request.user, status='pending').first()
        if action == 'connect' and opposite:
            # We have a Match! Both want to connect!
            opposite.status = 'accepted'
            opposite.save()
            
            connection, created = ConnectionRequest.objects.update_or_create(
                sender=request.user,
                receiver=target_user,
                defaults={'status': 'accepted'}
            )
            
            # Send Notification!
            Notification.objects.create(
                recipient=target_user,
                sender=request.user,
                notification_type='match',
                content=f"Você deu match de mentoria com {request.user.username}!"
            )
            Notification.objects.create(
                recipient=request.user,
                sender=target_user,
                notification_type='match',
                content=f"Você deu match de mentoria com {target_user.username}!"
            )
            
            # Grant Gamification XP
            from core.xp_engine import grant_xp
            grant_xp(request.user, 50)
            grant_xp(target_user, 50)
            
            req_status = 'accepted'
        else:
            # Regular creation
            req_status = 'pending' if action == 'connect' else 'skipped'
            connection, created = ConnectionRequest.objects.update_or_create(
                sender=request.user,
                receiver=target_user,
                defaults={'status': req_status}
            )

        return Response({'message': 'Ação registrada com sucesso', 'status': req_status}, status=status.HTTP_200_OK)


# ==================== SOCIAL & COMMENTS ====================

class PostLikeToggleView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        try:
            post = Post.objects.get(pk=pk)
        except Post.DoesNotExist:
            return Response({'error': 'Post não encontrado.'}, status=status.HTTP_404_NOT_FOUND)
        
        user = request.user
        if post.likes.filter(id=user.id).exists():
            post.likes.remove(user)
            liked = False
            message = "Descurtido com sucesso."
        else:
            post.likes.add(user)
            liked = True
            message = "Curtido com sucesso."
            
            # Send notification
            if post.author != user:
                Notification.objects.create(
                    recipient=post.author,
                    sender=user,
                    notification_type='like',
                    post=post,
                    content=f"{user.username} curtiu o seu post."
                )
                
        return Response({
            'liked': liked,
            'likes_count': post.likes.count(),
            'message': message
        }, status=status.HTTP_200_OK)


class PostBookmarkToggleView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        try:
            post = Post.objects.get(pk=pk)
        except Post.DoesNotExist:
            return Response({'error': 'Post não encontrado.'}, status=status.HTTP_404_NOT_FOUND)
        
        user = request.user
        if post.bookmarks.filter(id=user.id).exists():
            post.bookmarks.remove(user)
            bookmarked = False
            message = "Removido dos salvos."
        else:
            post.bookmarks.add(user)
            bookmarked = True
            message = "Salvo com sucesso."
            
        return Response({
            'bookmarked': bookmarked,
            'message': message
        }, status=status.HTTP_200_OK)


class PostCommentListCreateView(generics.ListCreateAPIView):
    serializer_class = CommentSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        # Only list top-level comments; replies are serialized recursively
        return Comment.objects.filter(post_id=self.kwargs['post_id'], parent=None)

    def perform_create(self, serializer):
        try:
            post = Post.objects.get(pk=self.kwargs['post_id'])
        except Post.DoesNotExist:
            from rest_framework.exceptions import NotFound
            raise NotFound("Post não encontrado.")
            
        parent_id = self.request.data.get('parent')
        parent = None
        if parent_id:
            try:
                parent = Comment.objects.get(pk=parent_id)
            except Comment.DoesNotExist:
                from rest_framework.exceptions import ValidationError
                raise ValidationError("Comentário pai não encontrado.")
        
        comment = serializer.save(author=self.request.user, post=post, parent=parent)
        
        # Grant XP for comment, max 2 times per day
        user = self.request.user
        today = timezone.now().date()
        comments_count_today = Comment.objects.filter(author=user, created_at__date=today).exclude(id=comment.id).count()
        if comments_count_today < 2:
            from core.xp_engine import grant_xp
            grant_xp(user, 5)
            
        # Notify post author if not the same
        if post.author != self.request.user:
            Notification.objects.create(
                recipient=post.author,
                sender=self.request.user,
                notification_type='comment',
                post=post,
                content=f"{self.request.user.username} comentou no seu post."
            )
        # Notify parent comment author if replying to a comment
        if parent and parent.author != self.request.user:
            Notification.objects.create(
                recipient=parent.author,
                sender=self.request.user,
                notification_type='comment',
                post=post,
                content=f"{self.request.user.username} respondeu ao seu comentário."
            )


# ==================== MESSAGING CORE ====================

class ActiveConversationsListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        # Accepted connections where the current user is either sender or receiver
        connections = ConnectionRequest.objects.filter(
            Q(sender=user) | Q(receiver=user),
            status='accepted'
        )
        
        conversations = []
        seen_user_ids = set()
        for conn in connections:
            other_user = conn.receiver if conn.sender == user else conn.sender
            if other_user.id in seen_user_ids:
                continue
            seen_user_ids.add(other_user.id)
            
            # Get latest message
            latest_msg = ChatMessage.objects.filter(
                Q(sender=user, receiver=other_user) | Q(sender=other_user, receiver=user)
            ).order_by('-created_at').first()
            
            conversations.append({
                'id': other_user.id,
                'username': other_user.username,
                'curso': other_user.curso,
                'semestre': other_user.semestre,
                'is_calouro': other_user.is_calouro,
                'bio': other_user.bio,
                'latest_message': latest_msg.content if latest_msg else None,
                'latest_message_date': latest_msg.created_at if latest_msg else None,
                'is_unread': latest_msg.is_read == False and latest_msg.sender == other_user if latest_msg else False
            })
            
        # Order by latest message date or username
        conversations.sort(key=lambda x: x['latest_message_date'] or timezone.now(), reverse=True)
        return Response(conversations, status=status.HTTP_200_OK)


class ChatMessageListCreateView(generics.ListCreateAPIView):
    serializer_class = ChatMessageSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        receiver_id = self.request.query_params.get('receiver_id')
        if not receiver_id:
            return ChatMessage.objects.none()
        
        # Mark received messages from this user as read
        ChatMessage.objects.filter(sender_id=receiver_id, receiver=user, is_read=False).update(is_read=True)
        
        return ChatMessage.objects.filter(
            Q(sender=user, receiver_id=receiver_id) | Q(sender_id=receiver_id, receiver=user)
        )

    def perform_create(self, serializer):
        receiver_id = self.request.data.get('receiver')
        if not receiver_id:
            from rest_framework.exceptions import ValidationError
            raise ValidationError("O receiver_id é obrigatório.")
        
        try:
            receiver = User.objects.get(pk=receiver_id)
        except User.DoesNotExist:
            from rest_framework.exceptions import ValidationError
            raise ValidationError("Destinatário não encontrado.")
            
        message = serializer.save(sender=self.request.user, receiver=receiver)
        
        # Grant XP for message, max 1 time per day per receiver
        user = self.request.user
        today = timezone.now().date()
        msg_exists_today = ChatMessage.objects.filter(sender=user, receiver=receiver, created_at__date=today).exclude(id=message.id).exists()
        if not msg_exists_today:
            from core.xp_engine import grant_xp
            grant_xp(user, 10)
            
        # Send Chat Notification
        Notification.objects.create(
            recipient=receiver,
            sender=self.request.user,
            notification_type='message',
            content=f"{self.request.user.username}: {message.content[:50]}"
        )


# ==================== NOTIFICATIONS ====================

class NotificationListView(generics.ListAPIView):
    serializer_class = NotificationSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Notification.objects.filter(recipient=self.request.user)


class NotificationUnreadCountView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        count = Notification.objects.filter(recipient=request.user, is_read=False).count()
        return Response({'unread_count': count}, status=status.HTTP_200_OK)


class NotificationMarkReadView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        try:
            notif = Notification.objects.get(pk=pk, recipient=request.user)
            notif.is_read = True
            notif.save()
            return Response({'success': True, 'message': 'Notificação marcada como lida.'}, status=status.HTTP_200_OK)
        except Notification.DoesNotExist:
            return Response({'error': 'Notificação não encontrada.'}, status=status.HTTP_404_NOT_FOUND)


# ==================== BATTLE PASS & GAMIFICATION ====================

class BattlePassView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        
        # Lazy populate default rewards if they don't exist
        from core.models import BattlePassReward
        if not BattlePassReward.objects.exists():
            BattlePassReward.objects.create(
                level_required=1,
                title="Acesso Inicial",
                description="Você desbloqueou o ecossistema do FaculFlow!",
                reward_type="horas",
                icon="🎓"
            )
            BattlePassReward.objects.create(
                level_required=2,
                title="Copo Personalizado FaculFlow",
                description="Resgate seu copo ecológico exclusivo da Estácio.",
                reward_type="brinde",
                icon="🥤"
            )
            BattlePassReward.objects.create(
                level_required=3,
                title="5 Horas Extracurriculares",
                description="Ganhe 5 horas complementares em seu histórico acadêmico.",
                reward_type="horas",
                icon="⚡"
            )
            BattlePassReward.objects.create(
                level_required=4,
                title="Camiseta Oficial FaculFlow",
                description="Vista a camisa oficial do maior ecossistema de mentoria!",
                reward_type="brinde",
                icon="👕"
            )
            BattlePassReward.objects.create(
                level_required=5,
                title="15% de Desconto na Mensalidade",
                description="Garanta um super desconto de 15% na sua mensalidade Estácio.",
                reward_type="desconto",
                icon="💰"
            )

        # Gamification progress calculations
        xp_within_level = user.xp % 100
        xp_threshold = 100

        rewards_qs = BattlePassReward.objects.all()
        rewards_list = []
        for r in rewards_qs:
            rewards_list.append({
                'id': r.id,
                'level_required': r.level_required,
                'title': r.title,
                'description': r.description,
                'reward_type': r.reward_type,
                'icon': r.icon,
                'claimed': r.claimed_by.filter(id=user.id).exists(),
                'unlocked': user.level >= r.level_required
            })

        data = {
            'xp': user.xp,
            'level': user.level,
            'streak': user.streak,
            'streak_freeze_count': user.streak_freeze_count,
            'xp_within_level': xp_within_level,
            'xp_threshold': xp_threshold,
            'is_calouro': user.is_calouro,
            'rewards': rewards_list
        }
        return Response(data, status=status.HTTP_200_OK)


class BattlePassClaimRewardView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        reward_id = request.data.get('reward_id')
        if not reward_id:
            from rest_framework.exceptions import ValidationError
            raise ValidationError("O campo reward_id é obrigatório.")
            
        from core.models import BattlePassReward
        try:
            reward = BattlePassReward.objects.get(pk=reward_id)
        except BattlePassReward.DoesNotExist:
            from rest_framework.exceptions import NotFound
            raise NotFound("Recompensa não encontrada.")

        user = request.user
        
        # Validation checks
        if user.level < reward.level_required:
            from rest_framework.exceptions import ValidationError
            raise ValidationError("Esta recompensa está bloqueada. Alcance o nível necessário primeiro.")

        if reward.claimed_by.filter(id=user.id).exists():
            from rest_framework.exceptions import ValidationError
            raise ValidationError("Você já resgatou esta recompensa.")

        # Claim the reward!
        reward.claimed_by.add(user)
        return Response({
            'success': True,
            'message': f"Recompensa '{reward.title}' resgatada com sucesso!"
        }, status=status.HTTP_200_OK)


class TagListView(generics.ListAPIView):
    """List all available tags for profile customization."""
    serializer_class = TagSerializer
    permission_classes = [IsAuthenticated]
    queryset = Tag.objects.all()


class ConnectionRequestListView(APIView):
    """Retorna os convites de mentoria pendentes enviados e recebidos pelo usuário atual."""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        from .serializers import ConnectionRequestSerializer
        user = request.user
        
        # Convites recebidos pendentes
        received_requests = ConnectionRequest.objects.filter(receiver=user, status='pending')
        # Convites enviados pendentes
        sent_requests = ConnectionRequest.objects.filter(sender=user, status='pending')
        
        received_serializer = ConnectionRequestSerializer(received_requests, many=True)
        sent_serializer = ConnectionRequestSerializer(sent_requests, many=True)
        
        return Response({
            'received': received_serializer.data,
            'sent': sent_serializer.data
        }, status=status.HTTP_200_OK)