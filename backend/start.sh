#!/bin/bash
echo "🔄 Rodando migrações..."
python manage.py migrate --noinput

echo "🌱 Rodando seed..."
python manage.py shell < seed.py

echo "📦 Coletando arquivos estáticos..."
python manage.py collectstatic --noinput

echo "🚀 Iniciando Gunicorn..."
gunicorn faculflow_backend.wsgi --bind 0.0.0.0:$PORT
