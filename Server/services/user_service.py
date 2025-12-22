import uuid
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from database.models.user import User



class UserService:
    @staticmethod
    async def fetch_username(
        db: AsyncSession,
        id : uuid.UUID
    ) -> str | None : 
        query = select(User.username).where(User.id == id)
        result = await db.execute(query);
        
        return result.scalar_one_or_none()