import os
from contextlib import asynccontextmanager
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from fastapi import Depends
from fastapi_users.db import SQLAlchemyUserDatabase
from database.models.user import User

# 1. Fallback to local if DATABASE_URL environment variable isn't set
# Use your Render INTERNAL URL in the Render dashboard environment settings
DATABASE_URL = os.getenv("DATABASE_URL", "postgresql+asyncpg://postgres:saketh@localhost:5432/Quirk")

# 2. Fix Render's 'postgres://' prefix and add SSL requirement
if DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql+asyncpg://", 1)

if "ssl=" not in DATABASE_URL and "localhost" not in DATABASE_URL:
    # Render requires SSL for external and internal connections
    separator = "&" if "?" in DATABASE_URL else "?"
    DATABASE_URL += f"{separator}ssl=require"

engine = create_async_engine(
    DATABASE_URL,
    echo=True
)

AsyncSessionLocal = sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False
)

async def get_db():
    async with AsyncSessionLocal() as session:
        yield session
        
async def get_user_db(session: AsyncSession = Depends(get_db)):
    yield SQLAlchemyUserDatabase(session, User)