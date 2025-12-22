from fastapi import APIRouter, Depends
from fastapi.security import HTTPAuthorizationCredentials
from sqlalchemy import or_, select
from database.session import get_db
from database import models
from database.models.connection import Connection
from sqlalchemy.ext.asyncio import AsyncSession
import uuid
from sqlalchemy.orm import aliased
from database import models
from routers.auth import get_token_payload

router = APIRouter();



@router.get("/connections")
async def get_connections(payload: dict = Depends(get_token_payload), db: AsyncSession = Depends(get_db)):
    user_id = uuid.UUID(payload.get("sub"))
    
    # We create an alias for the User table to represent the "other person"
    OtherUser = aliased(models.user.User)

    # Join Connection to User where the User is NOT the current user
    query = (
        select(Connection.id, OtherUser.username)
        .join(
            OtherUser, 
            or_(
                (Connection.user_a == user_id) & (Connection.user_b == OtherUser.id),
                (Connection.user_b == user_id) & (Connection.user_a == OtherUser.id)
            )
        )
        .where(or_(Connection.user_a == user_id, Connection.user_b == user_id))
    )

    result = await db.execute(query)
    
    # result.all() will return rows containing (id, username)
    return [
        {"connection_id": row.id, "username": row.username} 
        for row in result.all()
    ]
    