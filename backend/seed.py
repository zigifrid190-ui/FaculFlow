"""
Seed script to populate the database with initial data.
Run with: python manage.py shell < seed.py
"""
from core.models import User, Community

# Create communities if none exist
if not Community.objects.exists():
    communities = [
        Community(name='Direito - Estácio', description='Grupo de estudantes de Direito', icon='⚖️', color='#3B5CC6'),
        Community(name='Psicologia', description='Grupo de estudantes de Psicologia', icon='🧠', color='#8B5CF6'),
        Community(name='Engenharia', description='Grupo de estudantes de Engenharia', icon='⚙️', color='#F59E0B'),
        Community(name='Dicas de Estudo', description='Compartilhe técnicas de estudo', icon='📚', color='#00BFA5'),
        Community(name='Administração', description='Grupo de estudantes de Administração', icon='📊', color='#EF4444'),
        Community(name='TI e Computação', description='Tecnologia e Programação', icon='💻', color='#06B6D4'),
    ]
    Community.objects.bulk_create(communities)
    print(f'✅ {len(communities)} comunidades criadas!')
else:
    print('ℹ️ Comunidades já existem, pulando...')

# Create a test user if none exist
if not User.objects.filter(email='teste@faculflow.com').exists():
    User.objects.create_user(
        username='Testador',
        email='teste@faculflow.com',
        password='123',
        curso='Teste',
        semestre=1,
        is_calouro=True,
    )
    print('✅ Usuário de teste criado (teste@faculflow.com / 123)')
else:
    print('ℹ️ Usuário de teste já existe, pulando...')

print('🎉 Seed concluído!')
