import requests

from celery_app import app
import google.generativeai as genai
from bson.objectid import ObjectId
from pymongo import MongoClient
import os
from dotenv import load_dotenv

import logging
import logging.handlers

load_dotenv(os.path.join(os.path.dirname(__file__), '../.env'))

# --- LOGGING CONFIGURATION ---
log_dir = os.path.join(os.path.dirname(__file__), '../logs')
if not os.path.exists(log_dir):
    os.makedirs(log_dir)

log_file = os.path.join(log_dir, 'worker.log')

logger = logging.getLogger('celery_worker')
logger.setLevel(logging.INFO)

# Create handlers
if not logger.handlers:
    file_handler = logging.FileHandler(log_file)
    file_handler.setLevel(logging.INFO)
    
    # Create formatters and add it to handlers
    formatter = logging.Formatter('%(asctime)s - %(name)s - %(levelname)s - %(message)s')
    file_handler.setFormatter(formatter)
    
    # Add handlers to the logger
    # Add handlers to the logger
    logger.addHandler(file_handler)
    logger.propagate = False  # Prevent propagation to root logger to avoid double logging or suppression

from celery.signals import setup_logging

@setup_logging.connect
def config_loggers(*args, **kwags):
    from logging.config import dictConfig
    import os
    
    log_dir = os.path.join(os.path.dirname(__file__), '../logs')
    if not os.path.exists(log_dir):
        os.makedirs(log_dir)
    
    dictConfig({
        'version': 1,
        'disable_existing_loggers': False,
        'formatters': {
            'default': {
                'format': '%(asctime)s - %(name)s - %(levelname)s - %(message)s',
            },
        },
        'handlers': {
            'file': {
                'level': 'INFO',
                'class': 'logging.FileHandler',
                'filename': os.path.join(log_dir, 'worker.log'),
                'formatter': 'default',
            },
            'console': {
                'level': 'INFO',
                'class': 'logging.StreamHandler',
                'formatter': 'default',
            },
        },
        'loggers': {
            'celery': {
                'handlers': ['console', 'file'],
                'level': 'INFO',
                'propagate': False
            },
            'celery_worker': {
                'handlers': ['console', 'file'],
                'level': 'INFO',
                'propagate': False
            }
        },
         'root': {
            'handlers': ['console', 'file'],
            'level': 'INFO',
        },
    })


MONGO_URI = os.getenv('MONGO_URI', 'mongodb://localhost:27017/cartAppDB')
client = MongoClient(MONGO_URI)
db = client.get_database()
tasks_collection = db['tasks']

genai.configure(api_key=os.getenv('GEMINI_API_KEY'))

@app.task(name='tasks.generate_text_task')
def generate_text_task(prompt, task_id):
    logger.info(f"Processing Task: {task_id}")
    
    # Update status to processing
    tasks_collection.update_one(
        {"_id": ObjectId(task_id)},
        {"$set": {"status": "processing"}}
    )

    try:
        model = genai.GenerativeModel('gemini-flash-latest')
        response = model.generate_content(prompt)
        result_text = response.text

        # Update status to completed
        tasks_collection.update_one(
            {"_id": ObjectId(task_id)},
            {"$set": {"status": "completed", "result": result_text}}
        )
        logger.info(f"Task {task_id} Completed")
        
        # NOTIFY SERVER
        try:
            requests.post("http://localhost:5000/internal/webhook", json={
                "taskId": task_id,
                "status": "completed",
                "result": result_text
            })
        except Exception as we:
            logger.error(f"Webhook failed: {we}")
            
        return result_text

    except Exception as e:
        logger.error(f"Task {task_id} Failed: {e}")
        tasks_collection.update_one(
            {"_id": ObjectId(task_id)},
            {"$set": {"status": "failed", "error": str(e)}}
        )
        
        # NOTIFY SERVER (ERROR)
        try:
            requests.post("http://localhost:5000/internal/webhook", json={
                "taskId": task_id,
                "status": "failed",
                "error": str(e)
            })
        except Exception as we:
            logger.error(f"Webhook failed: {we}")
            
        raise e
