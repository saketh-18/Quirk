from fastapi import Depends, FastAPI, WebSocket, WebSocketDisconnect
import json
import logging
from datetime import datetime
import uuid
import asyncio
import time
from routers import test
from routers import username
from services.message_service import MessageService
from routers import messages
from routers import connections
from database.session import get_db
from core.state import state
import asyncio
from core.state import state
from database.models.user import User
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from routers.auth import decode_fastapi_users_jwt, fastapi_users, auth_backend, UserRead, UserCreate, get_token_payload
from fastapi.middleware.cors import CORSMiddleware

origins = ["http://localhost:3000"]

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"]
)

on_test = True

# logging.getLogger("uvicorn.error").setLevel(logging.WARNING)
# logging.getLogger("uvicorn.access").setLevel(logging.WARNING)

# This automatically creates /auth/jwt/login and /auth/jwt/logout
app.include_router(
    fastapi_users.get_auth_router(auth_backend),
    prefix="/auth",
    tags=["auth"],
)

# This automatically creates /auth/register
app.include_router(
    fastapi_users.get_register_router(UserRead, UserCreate),
    prefix="/auth",
    tags=["auth"],
)

# connection route
app.include_router(connections.router);

# messages route
app.include_router(messages.router);

# route for getting username
app.include_router(username.router);

#test route to wake up render
app.include_router(test.router)


async def heartbeat(websocket : WebSocket, session_state : dict):
    try:
        while not on_test:
            await websocket.send_json({"type": "ping"})
            await asyncio.sleep(20);
            if time.time() - session_state["last_pong"] > 1200:
                try:
                    await websocket.close()
                except Exception:
                    pass;
                break
    except:
        pass;
    

# @app.get("/all_users")
# async def home_route(db : AsyncSession = Depends(get_db)):
#     query = select(User);
    
#     result = await db.execute(query);
#     return result.scalars().all()


# @app.get("/protected")
# def validate(payload : dict = Depends(get_token_payload)):
#     user_id = payload.get("sub");
    
#     return {
#         "userid" : user_id,
#         "message" : "yayyyy"
#     }
    
    

@app.websocket("/ws")
async def websocket_handler(websocket : WebSocket):
    await websocket.accept();
    is_authorized = False
    payload = None
    user_id = None
    token = websocket.query_params.get("token");
    
    if token:
        print(f"Token received: {token[:20]}...")  # Log first 20 chars for debugging
        payload = decode_fastapi_users_jwt(token)
        if payload:
            is_authorized = True
            user_id = payload.get("sub")
            print(f"JWT decoded successfully. User ID: {user_id}, Payload keys: {list(payload.keys())}")
        else:
            print(f"JWT decode failed for token: {token[:20]}...")
    else:
        print("No token provided in query params")
            
    
    if user_id:
        # Convert user_id to UUID for consistent dictionary key format
        try:
            user_id_uuid_key = uuid.UUID(user_id) if isinstance(user_id, str) else user_id
            state.matcher.active_users[user_id_uuid_key] = websocket # setting user is active
        except (ValueError, TypeError):
            # If conversion fails, use string as fallback
            state.matcher.active_users[user_id] = websocket
    
    mode = websocket.query_params.get("mode");
    connection_id = websocket.query_params.get("connection_id");
    
    heartbeat_state = {"last_pong" : time.time()};
    heartbeat_task = asyncio.create_task(heartbeat(websocket, heartbeat_state));
    
    username = websocket.query_params.get("username");
    interests = websocket.query_params.get("interests", "");
    
    
    state.matcher.username_map[websocket] = username; 
    
    try:
        #  ========================
        # >>> SAVED CHATS MESSAGING LOGIC
        #  ========================
        
        if mode == "saved":
            # must be authenticated
            if not is_authorized or not connection_id:
                await websocket.send_json({
                    "type": "error",
                    "message": "Authentication required and connection_id must be provided for saved mode",
                    "is_authenticated": is_authorized,
                    "connection_id": connection_id,
                })
                await websocket.close(code=1008, reason="Missing authentication or connection_id")
                return

            try:
                connection_id_uuid = uuid.UUID(connection_id)
            except (ValueError, TypeError) as e:
                await websocket.send_json({
                    "type": "error", 
                    "data" : {
                    "message": f"Invalid connection_id format: {str(e)}"
                }})
                await websocket.close(code=1008, reason="Invalid connection_id")
                return

            # FIX: Use the generator correctly to get the session
            # Convert user_id string to UUID object
            try:
                user_id_uuid = uuid.UUID(user_id) if isinstance(user_id, str) else user_id
            except (ValueError, TypeError) as e:
                await websocket.send_json({
                    "type": "error",
                    "data" : {
                    "message": f"Invalid user_id format: {str(e)}"
                }})
                await websocket.close(code=1008, reason="Invalid user_id")
                return

            other_user = None
            async for db in get_db(): 
                other_user = await MessageService.get_other_user_id(
                    db,
                    connection_id_uuid,
                    user_id_uuid
                )
                # We only need the ID, so we can break after getting it
                break 

            if not other_user:
                await websocket.send_json({
                    "type": "error",
                    "data" : {
                    "message": "Connection not found or you don't have access to this connection"
                }})
                await websocket.close(code=1008, reason="Connection not found")
                return

            # Register session and start listening...
            # Store user_id as UUID for consistency with database operations
            state.connection_store.sessions[websocket] = {
                "uid": user_id_uuid,  # Store as UUID object, not string
                "is_authenticated": True,
                "username": username,
                "active_connection_id": str(connection_id_uuid),
            }
            
            await state.messenger.send_saved_chat_confirmation(websocket, other_user)

            try:
                while True:
                    data = await websocket.receive_json()
                    msg_type = data.get("type")

                    if msg_type == "chat":
                        await state.messenger.handle_chat(websocket, data)
                    elif msg_type == "typing":
                        await state.messenger.handle_typing(websocket, data)

            except WebSocketDisconnect:
                state.matcher.active_users.pop(user_id, None)

            finally:
                heartbeat_task.cancel()
                try:
                    await heartbeat_task
                except asyncio.CancelledError:
                    pass
                await state.messenger.cleanup(websocket, skipped=False)

            return
        
        #  ========================
        # >>> RANDOM MATCHING LOGIC
        #  ========================
        
        while True: # this loop runs from matching to websocket termination
            # Match -> Listen for messages -> cleanup -> start again if skipped -> terminate websocket
            if mode == "random": 
                matched = False;
                user1 = None
                user2 = None
                based_on = []
                skipped = False;
                
                user = {
                    "socket" : websocket,
                    "username" : username,
                    "interests": [i.strip().lower() for i in interests.split(',') if i.strip()],
                    "uid": payload["sub"] if payload else None,
                    }
                
                state.connection_store.sessions[websocket] = {
                    "uid": payload["sub"] if payload else None,
                    "is_authenticated": is_authorized,
                    "username": username,
                }

                matched, user1, user2, based_on = await state.matcher.try_match(user)
                
                if matched:
                    print("matched!!", based_on);
                    await state.matcher.confirm_connection(user1, user2, based_on);
                else:
                    await websocket.send_json({"system" : "waiting for a partner..."});
            
            try:
                while True:
                    data = await websocket.receive_json();
                    msg_type = data.get("type");
                    
                    if msg_type == "chat":
                        await state.messenger.handle_chat(websocket, data);
                    elif msg_type == "system":
                        skipped = await state.messenger.handle_system(websocket, data);
                        if skipped:
                            break;
                    elif msg_type == "typing":
                        await state.messenger.handle_typing(websocket, data);
                    
            except WebSocketDisconnect:
                pass;

            # control reaches here when user skips
            await state.messenger.cleanup(websocket, skipped);
            if skipped:
                continue;
            else:
                break;
            
        heartbeat_task.cancel();
        try:
            await heartbeat_task        
        except asyncio.CancelledError:
            pass
        
    except WebSocketDisconnect:
        # Normal disconnect, no need to send error
        pass
    except Exception as e:
        import traceback
        error_msg = f"Server error: {str(e)}"
        print(f"WebSocket error: {e}")
        print(traceback.format_exc())
        try:
            await websocket.send_json({
                "type": "error",
                "message": error_msg
            })
            await websocket.close(code=1011, reason="Internal server error")
        except:
            pass  # Connection already closed
        finally:
            heartbeat_task.cancel()
            try:
                await heartbeat_task
            except asyncio.CancelledError:
                pass
            



  
            