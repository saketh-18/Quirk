from fastapi import FastAPI, WebSocket, WebSocketDisconnect
import json
from datetime import datetime
import uuid
import asyncio
import time
from core.state import state
import asyncio
from core.state import state

app = FastAPI();

async def heartbeat(websocket : WebSocket, state : dict):
    try:
        while True:
            await websocket.send_json({"type": "ping"})
            await asyncio.sleep(20);
            if time.time() - state["last_pong"] > 120:
                try:
                    await websocket.close()
                except Exception:
                    pass;
                break
    except:
        pass;

@app.websocket("/ws")
async def websocket_handler(websocket : WebSocket):
    await websocket.accept();
    heartbeat_state = {"last_pong" : time.time()};
    heartbeat_task = asyncio.create_task(heartbeat(websocket, heartbeat_state));
    username = websocket.query_params.get("username");
    interests = websocket.query_params.get("interests", "");
    
    
    state.matcher.username_map[websocket] = username; 
    
    try:
        while True: # this loop runs from matching to websocket termination
            # Match -> Listen for messages -> cleanup -> start again if skipped -> terminate websocket 
            matched = False;
            user1 = None
            user2 = None
            based_on = []
            skipped = False;
            
            user = {
                "socket" : websocket,
                "username" : username,
                "interests": [i.strip().lower() for i in interests.split(',') if i.strip()],
                "uid" : uuid.uuid4()
                }
            
            matched, user1, user2, based_on = await state.matcher.try_match(user)
            
            if matched:
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
        
    except Exception as e:
        print(f"Error: {e}")
            
            
            