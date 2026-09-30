import mysql.connector
from mysql.connector import pooling
from app.config import DB_HOST, DB_PORT, DB_NAME, DB_USER, DB_PASSWORD, DB_SSL

# MySQL Connection Pool for Python
pool_kwargs = dict(
    pool_name="ml_pool",
    pool_size=10,
    host=DB_HOST,
    port=DB_PORT,
    user=DB_USER,
    password=DB_PASSWORD,
    database=DB_NAME,
)
if DB_SSL:
    # Managed MySQL (e.g. Aiven) requires TLS
    pool_kwargs["ssl_disabled"] = False
cnx_pool = pooling.MySQLConnectionPool(**pool_kwargs)

def get_db_connection():
    return cnx_pool.get_connection()
