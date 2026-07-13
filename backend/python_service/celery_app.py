from celery import Celery
import os
from dotenv import load_dotenv

load_dotenv(os.path.join(os.path.dirname(__file__), '../.env'))

# Broker URL from .env or default to localhost
RABBITMQ_URL = os.getenv('RABBITMQ_URL', 'amqp://localhost')

app = Celery('python_service', broker=RABBITMQ_URL, include=['tasks'])

app.conf.update(
    result_expires=3600,
    task_serializer='json',
    accept_content=['json'],  # Ignore other content
    result_serializer='json',
    timezone='UTC',
    enable_utc=True,
)

if __name__ == '__main__':
    app.start()
