import mysql.connector
from mysql.connector import pooling
from app.config import DB_HOST, DB_PORT, DB_NAME, DB_USER, DB_PASSWORD

# MySQL Connection Pool for Python
cnx_pool = pooling.MySQLConnectionPool(
    pool_name="ml_pool",
    pool_size=10,
    host=DB_HOST,
    port=DB_PORT,
    user=DB_USER,
    password=DB_PASSWORD,
    database=DB_NAME
)

def get_db_connection():
    return cnx_pool.get_connection()
