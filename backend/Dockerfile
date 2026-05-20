FROM python:3.12-slim

# Set environment variables
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

WORKDIR /app

# Install dependencies only (no Django management commands during build)
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy project files
COPY . .

# Expose port (Railway injects $PORT at runtime)
EXPOSE 8000

# All Django management commands run at RUNTIME, not build time.
# Migrations, collectstatic, and seed happen when the container starts.
CMD python manage.py migrate --noinput && \
    python manage.py collectstatic --noinput && \
    python manage.py shell -c "exec(open('seed.py').read())" && \
    gunicorn faculflow_backend.wsgi --bind 0.0.0.0:${PORT:-8000}
