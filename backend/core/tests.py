from django.test import TestCase
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from rest_framework import status

User = get_user_model()

class SecurityTest(TestCase):
    def setUp(self):
        self.client = APIClient()

    def test_password_validation_weak(self):
        """Teste se o registro falha com senha fraca (curta)."""
        data = {
            'email': 'test@estacio.br',
            'username': 'testuser',
            'password': '123',
            'matricula_estacio': '123456',
            'curso': 'Direito',
            'is_calouro': True
        }
        response = self.client.post('/api/auth/register/', data)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('password', response.data)

    def test_password_validation_strong(self):
        """Teste se o registro funciona com senha forte."""
        data = {
            'email': 'strong@estacio.br',
            'username': 'stronguser',
            'password': 'Password123!',
            'matricula_estacio': '654321',
            'curso': 'Engenharia',
            'is_calouro': False
        }
        response = self.client.post('/api/auth/register/', data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

    def test_password_validation_no_uppercase(self):
        """Teste se o registro falha com senha sem letras maiúsculas."""
        data = {
            'email': 'noupper@estacio.br',
            'username': 'noupper',
            'password': 'password123!',
            'matricula_estacio': '112233',
            'curso': 'Computação',
            'is_calouro': True
        }
        response = self.client.post('/api/auth/register/', data)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('password', response.data)

    def test_password_validation_no_lowercase(self):
        """Teste se o registro falha com senha sem letras minúsculas."""
        data = {
            'email': 'nolower@estacio.br',
            'username': 'nolower',
            'password': 'PASSWORD123!',
            'matricula_estacio': '445566',
            'curso': 'Computação',
            'is_calouro': True
        }
        response = self.client.post('/api/auth/register/', data)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('password', response.data)

    def test_password_validation_no_digit(self):
        """Teste se o registro falha com senha sem números."""
        data = {
            'email': 'nodigit@estacio.br',
            'username': 'nodigit',
            'password': 'Password!',
            'matricula_estacio': '778899',
            'curso': 'Computação',
            'is_calouro': True
        }
        response = self.client.post('/api/auth/register/', data)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('password', response.data)

    def test_xss_sanitization_post(self):
        """Teste se o conteúdo do post é sanitizado contra XSS (expurgando tags HTML)."""
        # Cria um usuário e autentica
        user = User.objects.create_user(
            email='author@estacio.br',
            username='authoruser',
            password='StrongPassword123'
        )
        self.client.force_authenticate(user=user)

        data = {
            'content': "<script>alert('xss')</script>Olá Mundo!"
        }
        response = self.client.post('/api/posts/', data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['content'], "Olá Mundo!")

    def test_xss_sanitization_community_message(self):
        """Teste se as mensagens enviadas em comunidades são sanitizadas contra XSS."""
        user = User.objects.create_user(
            email='member@estacio.br',
            username='memberuser',
            password='StrongPassword123'
        )
        self.client.force_authenticate(user=user)

        # Cria uma comunidade para enviar a mensagem
        from .models import Community
        community = Community.objects.create(
            name="Comunidade Teste",
            description="Descrição",
            creator=user
        )

        data = {
            'content': "<b>Mensagem Importante</b>"
        }
        response = self.client.post(f'/api/communities/{community.id}/messages/', data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['content'], "Mensagem Importante")


class PerformanceAndPaginationTest(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(
            email='perf@estacio.br',
            username='perfuser',
            password='StrongPassword123'
        )
        self.client.force_authenticate(user=self.user)

    def test_post_cursor_pagination(self):
        """Teste se a paginação de posts do feed usa cursores."""
        from .models import Post
        for i in range(5):
            Post.objects.create(author=self.user, content=f"Post de teste {i}")

        response = self.client.get('/api/posts/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        # CursorPagination returns a dictionary with 'results', 'next', 'previous'
        self.assertIn('results', response.data)
        self.assertIn('next', response.data)
        self.assertIn('previous', response.data)
        # Results size should match the posts count (5)
        self.assertEqual(len(response.data['results']), 5)

    def test_community_annotations_performance(self):
        """Teste se as comunidades retornam member_count e is_member corretamente."""
        from .models import Community
        # Crie 2 comunidades
        c1 = Community.objects.create(name="Comunidade 1", description="Desc 1", creator=self.user)
        c2 = Community.objects.create(name="Comunidade 2", description="Desc 2", creator=self.user)

        # Adiciona o usuário em c1, mas não em c2
        c1.members.add(self.user)

        response = self.client.get('/api/communities/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Como usamos paginação padrão do DRF, response.data tem key 'results'
        communities = response.data
        if isinstance(communities, dict):
            communities = communities['results']
        
        # Encontra as comunidades na lista
        community_dict = {c['id']: c for c in communities}
        
        self.assertIn(c1.id, community_dict)
        self.assertIn(c2.id, community_dict)
        
        # c1 deve ter is_member True e member_count 1
        self.assertTrue(community_dict[c1.id]['is_member'])
        self.assertEqual(community_dict[c1.id]['member_count'], 1)
        
        # c2 deve ter is_member False e member_count 0
        self.assertFalse(community_dict[c2.id]['is_member'])
        self.assertEqual(community_dict[c2.id]['member_count'], 0)


class SocialAndMessagingTest(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user_a = User.objects.create_user(
            email='usera@estacio.br',
            username='usera',
            password='StrongPassword123!',
            is_calouro=True
        )
        self.user_b = User.objects.create_user(
            email='userb@estacio.br',
            username='userb',
            password='StrongPassword123!',
            is_calouro=False
        )

    def test_like_and_bookmark_post(self):
        self.client.force_authenticate(user=self.user_a)
        from .models import Post, Notification
        post = Post.objects.create(author=self.user_b, content="Meu primeiro post!")

        # Like the post
        response = self.client.post(f'/api/posts/{post.id}/like/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data['liked'])
        self.assertEqual(response.data['likes_count'], 1)

        # Notification should be sent to user_b
        notif = Notification.objects.filter(recipient=self.user_b, notification_type='like').first()
        self.assertIsNotNone(notif)
        self.assertEqual(notif.sender, self.user_a)

        # Bookmark the post
        response = self.client.post(f'/api/posts/{post.id}/bookmark/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data['bookmarked'])

        # Unlike the post
        response = self.client.post(f'/api/posts/{post.id}/like/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertFalse(response.data['liked'])
        self.assertEqual(response.data['likes_count'], 0)

    def test_comment_creation_and_nesting(self):
        self.client.force_authenticate(user=self.user_a)
        from .models import Post, Comment
        post = Post.objects.create(author=self.user_b, content="Meu primeiro post!")

        # Create root comment
        response = self.client.post(f'/api/posts/{post.id}/comments/', {'content': 'Comentário da raiz'})
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        root_comment_id = response.data['id']

        # Create nested reply
        response = self.client.post(f'/api/posts/{post.id}/comments/', {'content': 'Resposta aninhada', 'parent': root_comment_id})
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        
        # Verify nesting in list view
        response = self.client.get(f'/api/posts/{post.id}/comments/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        comments = response.data['results']
        # Should only list 1 top-level comment
        self.assertEqual(len(comments), 1)
        # Top-level comment should have 1 reply
        self.assertEqual(len(comments[0]['replies']), 1)
        self.assertEqual(comments[0]['replies'][0]['content'], 'Resposta aninhada')

    def test_reciprocal_matching_and_chat(self):
        from .models import ConnectionRequest, ChatMessage, Notification
        
        # User A connects to User B
        self.client.force_authenticate(user=self.user_a)
        response = self.client.post('/api/match/action/', {'target_user_id': self.user_b.id, 'action': 'connect'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['status'], 'pending')

        # User B connects back to User A -> should auto-match (accepted)
        self.client.force_authenticate(user=self.user_b)
        response = self.client.post('/api/match/action/', {'target_user_id': self.user_a.id, 'action': 'connect'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['status'], 'accepted')

        # Check reciprocal status
        conn_a = ConnectionRequest.objects.get(sender=self.user_a, receiver=self.user_b)
        conn_b = ConnectionRequest.objects.get(sender=self.user_b, receiver=self.user_a)
        self.assertEqual(conn_a.status, 'accepted')
        self.assertEqual(conn_b.status, 'accepted')

        # Check match notifications
        notif_a = Notification.objects.filter(recipient=self.user_a, notification_type='match').first()
        notif_b = Notification.objects.filter(recipient=self.user_b, notification_type='match').first()
        self.assertIsNotNone(notif_a)
        self.assertIsNotNone(notif_b)

        # Active conversations should list User A for User B
        response = self.client.get('/api/chat/conversations/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]['username'], 'usera')

        # User B sends message to User A
        response = self.client.post('/api/chat/messages/', {'receiver': self.user_a.id, 'content': 'Olá, sou seu mentor!'})
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

        # User A reads history
        self.client.force_authenticate(user=self.user_a)
        response = self.client.get(f'/api/chat/messages/?receiver_id={self.user_b.id}')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        messages = response.data['results']
        self.assertEqual(len(messages), 1)
        self.assertEqual(messages[0]['content'], 'Olá, sou seu mentor!')
        
        # Verify read count
        unread = ChatMessage.objects.filter(sender=self.user_b, receiver=self.user_a, is_read=False).count()
        self.assertEqual(unread, 0)


class GamificationAndBattlePassTest(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user_a = User.objects.create_user(
            email='gamify_a@estacio.br',
            username='gamifya',
            password='StrongPassword123!',
            is_calouro=True
        )
        self.user_b = User.objects.create_user(
            email='gamify_b@estacio.br',
            username='gamifyb',
            password='StrongPassword123!',
            is_calouro=False
        )

    def test_grant_xp_calculations(self):
        """Teste se a engine de XP adiciona XP e calcula níveis de forma correta."""
        from core.xp_engine import grant_xp
        self.assertEqual(self.user_a.xp, 0)
        self.assertEqual(self.user_a.level, 1)

        # Ganha 50 XP
        leveled_up = grant_xp(self.user_a, 50)
        self.assertFalse(leveled_up)
        self.assertEqual(self.user_a.xp, 50)
        self.assertEqual(self.user_a.level, 1)

        # Ganha mais 60 XP -> Total 110 XP (Level 2)
        leveled_up = grant_xp(self.user_a, 60)
        self.assertTrue(leveled_up)
        self.assertEqual(self.user_a.xp, 110)
        self.assertEqual(self.user_a.level, 2)

    def test_streak_freeze_protection(self):
        """Teste se a Ofensiva (streak) é mantida usando a proteção do Streak Freeze."""
        from django.utils import timezone
        from datetime import timedelta
        from core.xp_engine import grant_xp

        # Configura atividade de 3 dias atrás e Ofensiva ativa = 5
        self.user_a.last_activity = timezone.now() - timedelta(days=3)
        self.user_a.streak = 5
        self.user_a.streak_freeze_count = 1
        self.user_a.save()

        # Ao receber XP hoje, a Ofensiva deve ser protegida pelo Streak Freeze e subir para 6!
        grant_xp(self.user_a, 10)
        self.assertEqual(self.user_a.streak, 6)
        self.assertEqual(self.user_a.streak_freeze_count, 0) # Freeze usado!

        # Atividade com gap e sem freeze -> Reseta Ofensiva para 1!
        self.user_a.last_activity = timezone.now() - timedelta(days=3)
        self.user_a.save()
        grant_xp(self.user_a, 10)
        self.assertEqual(self.user_a.streak, 1)

    def test_xp_triggers_post_and_comment(self):
        """Teste se postagem e comentários geram XP respeitando os limites diários."""
        self.client.force_authenticate(user=self.user_a)

        # Criar 1º Post -> +20 XP
        response = self.client.post('/api/posts/', {'content': 'Post número 1'})
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.user_a.refresh_from_db()
        self.assertEqual(self.user_a.xp, 20)

        # Criar 2º Post no mesmo dia -> Sem XP adicional!
        response = self.client.post('/api/posts/', {'content': 'Post número 2'})
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.user_a.refresh_from_db()
        self.assertEqual(self.user_a.xp, 20)

        # Comentário 1 -> +5 XP
        post_id = response.data['id']
        response = self.client.post(f'/api/posts/{post_id}/comments/', {'content': 'Comentário 1'})
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.user_a.refresh_from_db()
        self.assertEqual(self.user_a.xp, 25)

        # Comentário 2 -> +5 XP
        response = self.client.post(f'/api/posts/{post_id}/comments/', {'content': 'Comentário 2'})
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.user_a.refresh_from_db()
        self.assertEqual(self.user_a.xp, 30)

        # Comentário 3 no mesmo dia -> Limite atingido! Sem XP adicional.
        response = self.client.post(f'/api/posts/{post_id}/comments/', {'content': 'Comentário 3'})
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.user_a.refresh_from_db()
        self.assertEqual(self.user_a.xp, 30)

    def test_xp_triggers_message_and_match(self):
        """Teste se chats e match de mentoria dão XP respeitando limites."""
        from .models import ConnectionRequest
        
        # Cria relação de match aceito entre A e B
        self.client.force_authenticate(user=self.user_a)
        ConnectionRequest.objects.create(sender=self.user_b, receiver=self.user_a, status='pending')
        
        # Aceita match -> +50 XP para A e +50 XP para B
        response = self.client.post('/api/match/action/', {'target_user_id': self.user_b.id, 'action': 'connect'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        self.user_a.refresh_from_db()
        self.user_b.refresh_from_db()
        self.assertEqual(self.user_a.xp, 50)
        self.assertEqual(self.user_b.xp, 50)

        # Envia mensagem no chat -> +10 XP
        response = self.client.post('/api/chat/messages/', {'receiver': self.user_b.id, 'content': 'Olá!'})
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.user_a.refresh_from_db()
        self.assertEqual(self.user_a.xp, 60)

        # Segunda mensagem no mesmo chat no mesmo dia -> Sem XP adicional!
        response = self.client.post('/api/chat/messages/', {'receiver': self.user_b.id, 'content': 'Tudo bem?'})
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.user_a.refresh_from_db()
        self.assertEqual(self.user_a.xp, 60)

    def test_battle_pass_rewards_claim(self):
        """Teste da listagem de recompensas e do endpoint de resgate."""
        self.client.force_authenticate(user=self.user_a)

        # Listagem do Passe de Batalha (lazily inicializa as 5 recompensas)
        response = self.client.get('/api/user/battle-pass/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['rewards']), 5)

        # Nível 1 está desbloqueado (User.level = 1)
        r1 = response.data['rewards'][0]
        self.assertTrue(r1['unlocked'])
        self.assertFalse(r1['claimed'])

        # Nível 2 está bloqueado
        r2 = response.data['rewards'][1]
        self.assertFalse(r2['unlocked'])

        # Tenta resgatar Nível 2 (bloqueado) -> HTTP 400
        response_claim = self.client.post('/api/user/battle-pass/claim/', {'reward_id': r2['id']})
        self.assertEqual(response_claim.status_code, status.HTTP_400_BAD_REQUEST)

        # Resgata Nível 1 (desbloqueado) -> HTTP 200
        response_claim = self.client.post('/api/user/battle-pass/claim/', {'reward_id': r1['id']})
        self.assertEqual(response_claim.status_code, status.HTTP_200_OK)
        self.assertTrue(response_claim.data['success'])

        # Tenta resgatar Nível 1 novamente -> HTTP 400
        response_claim = self.client.post('/api/user/battle-pass/claim/', {'reward_id': r1['id']})
        self.assertEqual(response_claim.status_code, status.HTTP_400_BAD_REQUEST)
