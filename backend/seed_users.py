import os
import django
import random
from django.utils import timezone

# Setup Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'faculflow_backend.settings')
django.setup()

from django.contrib.auth import get_user_model
from core.models import Tag, Community, CommunityMessage, ConnectionRequest

User = get_user_model()

def seed_data():
    print("🚀 Iniciando semeadura de dados do FaculFlow...")

    # 1. Criar ou obter Tags acadêmicas
    tag_names = [
        "Engenharia", "Medicina", "Direito", "Psicologia", "Administração",
        "Design", "Programação", "Carreira", "Estágio", "Dúvidas",
        "Grupo de Estudos", "Dicas", "OAB", "Resumos", "Java", "Python"
    ]
    tags = {}
    for name in tag_names:
        tag, created = Tag.objects.get_or_create(name=name)
        tags[name] = tag
        if created:
            print(f"Tag criada: {name}")

    # 2. Criar Veteranos e Calouros
    # Senha padrão segura para todos
    password = "Password123!"

    # Dicionário com dados dos perfis
    profiles_data = [
        # VETERANOS
        {
            "username": "Mariana Souza",
            "email": "mariana.veterana@estacio.br",
            "curso": "Engenharia de Software",
            "semestre": 7,
            "is_calouro": False,
            "bio": "Apaixonada por desenvolvimento web, React Native e Python. Posso te ajudar com dúvidas de lógica de programação, banco de dados e dar dicas para conseguir o primeiro estágio na área! 💻🚀",
            "matricula_estacio": "EST-202301928",
            "tags_list": ["Engenharia", "Programação", "Estágio", "Dicas", "Python"],
            "level": 5,
            "xp": 450
        },
        {
            "username": "Lucas Andrade",
            "email": "lucas.oab@estacio.br",
            "curso": "Direito",
            "semestre": 9,
            "is_calouro": False,
            "bio": "Veterano de Direito focado em Direito Civil e Constitucional. Já passei na 1ª fase da OAB e posso te ensinar cronogramas de estudos e passar resumos matadores! ⚖️📚",
            "matricula_estacio": "EST-202204812",
            "tags_list": ["Direito", "OAB", "Resumos", "Dicas", "Grupo de Estudos"],
            "level": 4,
            "xp": 320
        },
        {
            "username": "Beatriz Lima",
            "email": "beatriz.psico@estacio.br",
            "curso": "Psicologia",
            "semestre": 8,
            "is_calouro": False,
            "bio": "Estudante do 8º semestre. Atuo na área de Psicologia Organizacional e Clínica. Vamos conversar sobre comportamento humano, resenhas de livros acadêmicos e matérias difíceis. 🧠🌱",
            "matricula_estacio": "EST-202208119",
            "tags_list": ["Psicologia", "Dúvidas", "Dicas", "Resumos"],
            "level": 3,
            "xp": 280
        },
        {
            "username": "Thiago Martins",
            "email": "thiago.adm@estacio.br",
            "curso": "Administração",
            "semestre": 6,
            "is_calouro": False,
            "bio": "Focado em Gestão de Projetos e Marketing Digital. Já estagio na área há 1 ano e posso te ajudar a preparar um currículo premium para conseguir processos seletivos. 📈💼",
            "matricula_estacio": "EST-202305562",
            "tags_list": ["Administração", "Estágio", "Carreira", "Dicas"],
            "level": 4,
            "xp": 380
        },
        
        # CALOUROS
        {
            "username": "Gabriel Costa",
            "email": "gabriel.calouro@estacio.br",
            "curso": "Engenharia de Software",
            "semestre": 1,
            "is_calouro": True,
            "bio": "Acabei de entrar na faculdade e quero aprender tudo sobre programação! Procuro veteranos que possam me dar um norte sobre quais tecnologias estudar e como é o mercado. ☕🔥",
            "matricula_estacio": "EST-202601234",
            "tags_list": ["Engenharia", "Programação", "Dúvidas", "Grupo de Estudos"],
            "level": 1,
            "xp": 30
        },
        {
            "username": "Camila Ribeiro",
            "email": "camila.caloura@estacio.br",
            "curso": "Direito",
            "semestre": 2,
            "is_calouro": True,
            "bio": "Caloura de Direito, animada com as aulas de introdução. Quero dicas de livros, resumos de hermenêutica jurídica e parceiros para formar grupos de estudo para as provas! 🏛️✨",
            "matricula_estacio": "EST-202509876",
            "tags_list": ["Direito", "Dúvidas", "Grupo de Estudos", "Resumos"],
            "level": 1,
            "xp": 50
        },
        {
            "username": "Felipe Neves",
            "email": "felipe.psico@estacio.br",
            "curso": "Psicologia",
            "semestre": 1,
            "is_calouro": True,
            "bio": "Primeiro semestre de Psicologia! Um pouco perdido com a quantidade de textos para ler, mas super empolgado. Alguém doido por Freud e Lacan para indicar resumos? 📚🧘‍♂️",
            "matricula_estacio": "EST-202604321",
            "tags_list": ["Psicologia", "Dúvidas", "Resumos"],
            "level": 2,
            "xp": 120
        },
        {
            "username": "Larissa Santos",
            "email": "larissa.adm@estacio.br",
            "curso": "Administração",
            "semestre": 2,
            "is_calouro": True,
            "bio": "Curiosa sobre empreendedorismo e finanças. Quero ajuda para entender matérias de contabilidade e estatística básica, socorro! 😅📊",
            "matricula_estacio": "EST-202508821",
            "tags_list": ["Administração", "Dúvidas", "Dicas"],
            "level": 1,
            "xp": 40
        },
        {
            "username": "Lucas Ferreira",
            "email": "lucas.ferreira@estacio.br",
            "curso": "Engenharia de Software",
            "semestre": 2,
            "is_calouro": True,
            "bio": "Super interessado em desenvolvimento front-end e UX/UI. Quero dicas de como organizar meus estudos em HTML, CSS e JS para conseguir vagas juniores! 🎨💻",
            "matricula_estacio": "EST-202501192",
            "tags_list": ["Engenharia", "Programação", "Dicas", "Grupo de Estudos"],
            "level": 2,
            "xp": 110
        },
        {
            "username": "Juliana Menezes",
            "email": "juliana.penal@estacio.br",
            "curso": "Direito",
            "semestre": 1,
            "is_calouro": True,
            "bio": "Caloura empolgadíssima! Apaixonada por Direito Penal e Criminologia. Busco veteranos para indicarem boas doutrinas e resumos de Direito Penal I. 🏛️⚖️",
            "matricula_estacio": "EST-202601993",
            "tags_list": ["Direito", "Dúvidas", "Resumos"],
            "level": 1,
            "xp": 25
        },
        {
            "username": "Pedro Albuquerque",
            "email": "pedro.startup@estacio.br",
            "curso": "Administração",
            "semestre": 1,
            "is_calouro": True,
            "bio": "Querendo aprender tudo sobre gestão de processos e captação de recursos. Meu sonho é lançar uma fintech de educação logo após me formar! 🚀📈",
            "matricula_estacio": "EST-202603817",
            "tags_list": ["Administração", "Grupo de Estudos", "Carreira"],
            "level": 1,
            "xp": 30
        },
        {
            "username": "Isabela Rocha",
            "email": "isabela.psico@estacio.br",
            "curso": "Psicologia",
            "semestre": 2,
            "is_calouro": True,
            "bio": "Fascinada por Psicologia Social e Psicanálise. Quero dicas de artigos, grupos de discussão acadêmica e indicações de documentários sobre saúde mental. 🧠✨",
            "matricula_estacio": "EST-202504812",
            "tags_list": ["Psicologia", "Resumos", "Dicas"],
            "level": 2,
            "xp": 80
        },
        {
            "username": "Vitor Hugo",
            "email": "vitor.games@estacio.br",
            "curso": "Engenharia de Software",
            "semestre": 1,
            "is_calouro": True,
            "bio": "Estudante apaixonado por desenvolvimento de games. Quero aprender C# e Python para criar jogos indies e preciso de ajuda com cálculo diferencial básico! 🎮🔥",
            "matricula_estacio": "EST-202605772",
            "tags_list": ["Engenharia", "Programação", "Dúvidas", "Python"],
            "level": 1,
            "xp": 45
        },
        {
            "username": "Alice Santos",
            "email": "alice.internacional@estacio.br",
            "curso": "Direito",
            "semestre": 2,
            "is_calouro": True,
            "bio": "Estudante focada em Direito Internacional e Direitos Humanos. Gostaria de indicações de estágios em embaixadas, ONGs ou repartições públicas! 🌍🕊️",
            "matricula_estacio": "EST-202509121",
            "tags_list": ["Direito", "Estágio", "Dicas"],
            "level": 1,
            "xp": 60
        }
    ]

    seeded_users = []
    for data in profiles_data:
        # Criar ou obter usuário
        user, created = User.objects.get_or_create(
            email=data["email"],
            defaults={
                "username": data["username"],
                "curso": data["curso"],
                "semestre": data["semestre"],
                "is_calouro": data["is_calouro"],
                "bio": data["bio"],
                "matricula_estacio": data["matricula_estacio"],
                "level": data["level"],
                "xp": data["xp"],
                "is_active": True
            }
        )
        
        if created:
            user.set_password(password)
            user.save()
            print(f"Usuário criado: {data['username']} ({'Calouro' if data['is_calouro'] else 'Veterano'})")
        else:
            # Atualiza dados caso já exista para manter integridade
            user.username = data["username"]
            user.curso = data["curso"]
            user.semestre = data["semestre"]
            user.is_calouro = data["is_calouro"]
            user.bio = data["bio"]
            user.matricula_estacio = data["matricula_estacio"]
            user.level = data["level"]
            user.xp = data["xp"]
            user.save()
            print(f"Usuário atualizado: {data['username']}")

        # Associar tags
        user.tags.clear()
        for tag_name in data["tags_list"]:
            if tag_name in tags:
                user.tags.add(tags[tag_name])
        
        seeded_users.append(user)

    # 3. Criar Conexões/Matches de demonstração
    # Vamos fazer com que alguns calouros enviem pedidos de conexão pendentes para veteranos
    print("🔗 Criando conexões de demonstração...")
    
    # Gabriel (Calouro Engenharia) -> Mariana (Veterana Engenharia) (Pendente)
    gabriel = User.objects.get(email="gabriel.calouro@estacio.br")
    mariana = User.objects.get(email="mariana.veterana@estacio.br")
    ConnectionRequest.objects.get_or_create(
        sender=gabriel,
        receiver=mariana,
        defaults={"status": "pending"}
    )

    # Camila (Caloura Direito) -> Lucas (Veterano Direito) (Aceito -> Match!)
    camila = User.objects.get(email="camila.caloura@estacio.br")
    lucas = User.objects.get(email="lucas.oab@estacio.br")
    # Para ser aceito, ambos devem concordar ou criamos o registro de match aceito diretamente
    ConnectionRequest.objects.update_or_create(
        sender=camila,
        receiver=lucas,
        defaults={"status": "accepted"}
    )
    ConnectionRequest.objects.update_or_create(
        sender=lucas,
        receiver=camila,
        defaults={"status": "accepted"}
    )

    # Felipe (Calouro Psico) -> Beatriz (Veterana Psico) (Pendente)
    felipe = User.objects.get(email="felipe.psico@estacio.br")
    beatriz = User.objects.get(email="beatriz.psico@estacio.br")
    ConnectionRequest.objects.get_or_create(
        sender=felipe,
        receiver=beatriz,
        defaults={"status": "pending"}
    )

    # 4. Criar Comunidades e Quadros adicionais de demonstração
    print("📚 Criando comunidades e mensagens de discussão...")
    admin = User.objects.filter(is_superuser=True).first()
    if not admin:
        # Usa um veterano de creator
        creator_user = mariana
    else:
        creator_user = admin

    community_data = [
        {"name": "Engenharia de Software", "description": "Tudo sobre algoritmos, desenvolvimento ágil, engenharia de requisitos e dúvidas de aulas.", "icon": "💻", "color": "#0288D1", "category": "curso"},
        {"name": "Direito - Estácio", "description": "Discussão de matérias jurídicas, dicas de estágio em escritórios e estudos para OAB.", "icon": "⚖️", "color": "#8E24AA", "category": "curso"},
        {"name": "Grupo de Estudos - Geral", "description": "Encontre parceiros para estudar juntos para as provas da Estácio de qualquer período!", "icon": "🤝", "color": "#43A047", "category": "tema"},
        {"name": "Vagas & Estágios", "description": "Dicas de entrevistas, indicação de vagas e melhorias de currículo para conseguir estágio.", "icon": "🚀", "color": "#EF6C00", "category": "tema"}
    ]

    for c_info in community_data:
        community, created = Community.objects.get_or_create(
            name=c_info["name"],
            defaults={
                "description": c_info["description"],
                "icon": c_info["icon"],
                "color": c_info["color"],
                "category": c_info["category"],
                "creator": creator_user
            }
        )
        if created:
            print(f"Comunidade criada: {c_info['name']}")
        
        # Creator auto-joins
        community.members.add(creator_user)

        # Adiciona membros de teste
        for u in seeded_users:
            if u.curso in c_info["name"] or c_info["category"] == "tema":
                community.members.add(u)

        # Adiciona mensagens iniciais para que os quadros não fiquem vazios
        if created:
            messages = [
                ("Mariana Souza", "Alguém aí que esteja sofrendo com Estrutura de Dados em C/C++? Podemos nos unir para estudar!"),
                ("Gabriel Costa", "Eu! Acabei de entrar no 1º semestre de Engenharia e estou apanhando de ponteiros..."),
                ("Mariana Souza", "Sem pânico, Gabriel! Ponteiros é clássico. Vou postar um resumo excelente aqui mais tarde.")
            ] if "Engenharia" in c_info["name"] else [
                ("Lucas Andrade", "Pessoal, recomendo muito fazer os simulados da OAB desde o 5º período. Ajuda muito a pegar o ritmo."),
                ("Camila Ribeiro", "Excelente dica, Lucas! Quais doutrinas você recomenda para Introdução ao Estudo do Direito?"),
                ("Lucas Andrade", "Para o começo, o livro do Miguel Reale é indispensável. Linguagem super clara!")
            ] if "Direito" in c_info["name"] else [
                ("Thiago Martins", "Alguém sabe se o processo seletivo do Itaú para estágio de tecnologia/adm exige inglês fluente?"),
                ("Mariana Souza", "Para tecnologia nem sempre, mas ajuda bastante. O processo deles tem dinâmicas bem práticas.")
            ] if "Vagas" in c_info["name"] else [
                ("Beatriz Lima", "Dica de ouro para as provas da Estácio: façam os exercícios complementares da plataforma do aluno, cai igual!"),
                ("Felipe Neves", "Nossa, sério? Vou fazer isso hoje mesmo, obrigado, Beatriz!")
            ]
            
            for author_name, content in messages:
                try:
                    author = User.objects.get(username=author_name)
                except User.DoesNotExist:
                    author = creator_user
                
                CommunityMessage.objects.create(
                    community=community,
                    author=author,
                    content=content,
                    created_at=timezone.now()
                )

    print("✨ Semeadura de dados concluída com sucesso absoluto!")

if __name__ == "__main__":
    seed_data()
