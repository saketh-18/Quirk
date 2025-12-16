from fastapi import FastAPI, WebSocket, WebSocketDisconnect
import json
from datetime import datetime
import uuid
import asyncio
import time



app = FastAPI(); # Creating an instance of fastApi , just like we create in express

# when a user hits websocket
    # add them to que
    # match two users if exists
    # if doesnt dont go to next part
        # next part -> 
        # infinite loop for message
        # keep on listening for messages and send it to the other socket in room

# user - {
    # WebSocket, 
    # username,
    # interests,
    # random | interest_based (boolean),
    # wait_timer (upto 30s)
# }

queue = []; # contains users
rooms = {}; # room_id is mapped to tuples(list) of websockets of users => 1 -> [user1, user2];
user_to_room = {}; # user's websocket is mapped to room_id
lock = asyncio.Lock();

def get_partner(room_id, websocket):
    s1, s2 = rooms.get(room_id, (None, None))
    if s1 is None or s2 is None:
        return None
    return s2 if websocket == s1 else s1

def interest_match(user1, user2, based_on):
    score = 0
    setA = user1["interests"];
    for interest in setA:
        if interest in user2["interests"]:
            based_on.append(interest);
            score += 1
    return score;

# def has_timed_out(user):
#     return time.time() - user["joined_at"] >= user["wait_timer"]


@app.websocket("/ws")
async def matcher(websocket : WebSocket):
    await websocket.accept();
    heartbeat_state = {"last_pong" : time.time()}
    heartbeat_task = asyncio.create_task(heartbeat(websocket, heartbeat_state));
    username = websocket.query_params.get("username");
    interests = websocket.query_params.get("interests", "");
    # wait_timer = int(websocket.query_params.get("wait", 15))

    try:
        while True:
            matched = False
            user1 = None
            user2 = None
            based_on = []
            skipped = False;

            user = {
                    "socket" : websocket,
                    "username" : username,
                "interests": [i.strip().lower() for i in interests.split(',') if i.strip()],
                    # "wait_timer" : wait_timer,
                    # "joined_at" : time.time()
                    }

            async with lock:
                queue[:] = [u for u in queue if u["socket"] != websocket]
                queue.append(user);
                if len(queue) >= 2:
                    for u in queue:
                        if u != user:
                            temp_based_on = []
                            score = interest_match(u, user, temp_based_on)
                            if score >= 1:
                                based_on = temp_based_on
                                user1, user2 = user, u
                                matched = True
                                break

                if not matched:

                    for u in queue:
                        if u != user:
                            # if has_timed_out(u) or has_timed_out(user):
                            user1 , user2 = user, u;
                            matched = True;
                            based_on = ["random"];
                            break;
                
                if matched:
                    if user1 in queue:
                        queue.remove(user1)
                    if user2 in queue:
                        queue.remove(user2)

                    room_id = str(uuid.uuid4())
                    rooms[room_id] = [user1["socket"], user2["socket"]]
                    user_to_room[user1["socket"]] = room_id
                    user_to_room[user2["socket"]] = room_id
                    
                    if not based_on:
                        based_on = ["random"];
                    print(based_on);
                    await user1["socket"].send_json({"system": "Connected", "paired_to" : user2["username"] , "based_on": ','.join(based_on)})
                    await user2["socket"].send_json({"system": "Connected", "paired_to" : user1["username"] , "based_on": ','.join(based_on)})

                
                else:
                    await websocket.send_json({
                        "system": "Waiting for a partner..."
                    })

            try:
                while True:
                    data = await websocket.receive_json(); 
                    msg_type = data.get("type"); 
                    room_id = user_to_room.get(websocket)
                    receiver = get_partner(room_id, websocket) if room_id else None
                    if msg_type == "chat": 
                        # room_id = user_to_room.get(websocket)
                        # if not room_id:
                        #     continue # guards if somehow user send message in waiting stage
                        # receiver = get_partner(room_id, websocket);
                        # if not receiver:
                        #     continue
                        
                        if not room_id:
                            # it means the other user skipped
                            skipped = True
                            break;
                        if receiver:   
                            await receiver.send_json({
                                "type" : "chat",
                                "data" : {
                                    "message" : data.get("data", {}).get("message")
                                    },
                                "time_stamp" : str(datetime.now()),
                                "sender" : username
                            })
                        else:
                            # receiver is not present (might have skipped -> (send current user back to matching))
                            skipped = True;
                            break;
                    elif msg_type == "system":
                        if data.get("data").get("action") == "skip":
                            # if the system message have action tab in it
                            skipped = True;
                            if room_id:
                                if receiver:
                                    await receiver.send_json({
                                        "type":"system",
                                        "data" : {
                                            "message" : "Partner Disconnected"
                                        }
                                    })
                            break;

                    elif msg_type == "typing":
                            room_id = user_to_room.get(websocket);
                            if not room_id:
                                continue
                            receiver = get_partner(room_id, websocket);

                            if not receiver:
                                continue
                            await receiver.send_json({
                                "type": "typing",
                                "username": username,
                                "isTyping": data.get("isTyping", False)
                            })
                    elif msg_type == "pong":
                        heartbeat_state["last_pong"] = time.time()

            except WebSocketDisconnect:
                pass;


            # cleanup
            # this thing only runs when a user skips
            async with lock:
                queue[:] = [u for u in queue if u["socket"] != websocket]
                room_id = user_to_room.pop(websocket, None)
                if room_id:
                    partner = get_partner(room_id, websocket)
                    rooms.pop(room_id, None)
                    user_to_room.pop(partner, None)
                    try:
                        await partner.send_json({"system": "Partner disconnected"})
                    except:
                        pass
                if skipped:
                    continue
                else:
                    break;
                

            heartbeat_task.cancel()
            try:
                await heartbeat_task        
            except asyncio.CancelledError:
                pass
            
    except Exception as e:
        print(f"Error: {e}")



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




# Old matching logic (Random)
# if len(queue) >= 2:
        #     u1 = queue.pop();
        #     u2 = queue.pop();
        #     room_id = str(uuid.uuid4());
        #     rooms[room_id] = [u1["socket"], u2["socket"]];
        #     user_to_room[u1["socket"]] = room_id;
        #     user_to_room[u2["socket"]] = room_id;
        #     await u1["socket"].send_json({
        #         "system": f"Connected to {u2['username']}",
        #         "paired_to" : u2['username']
        #     })
        #     await u2["socket"].send_json({
        #         "system": f"Connected to {u1['username']}",
        #         "paired_to" : u1['username']
        #     })

# clients = [];
# @app.websocket("/ws")
# async def websocket_endpoint(websocket : WebSocket):
#     username = websocket.query_params.get("username");
#     await websocket.accept() # if we hit the route websocket gets accepted
#     client_info = {"socket": websocket, "username": username}
#     clients.append(client_info)
#     try:
#         while True:
#             data = await websocket.receive_text();
#             print(data);
#             obj = {"message" : data, "username" : username};
#             for client in clients:
#                 await client["socket"].send_json(obj);
#     except WebSocketDisconnect:
#         clients.remove(client_info);