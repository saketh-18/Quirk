from datetime import datetime, timezone
import uuid
import traceback

from fastapi import WebSocketDisconnect
from ConnectionStore import connection_store
from database.session import get_db
from services import connection_service
from services.message_service import MessageService

class MessageHandler:
    def __init__(self, matcher):
        self.matcher = matcher
        
    async def handle_chat(self, websocket, data):
        context = data.get("context")

        if context == "saved":
            await self.handle_saved_chat(websocket, data)
            return
        
        room_id = self.matcher.user_to_rooms.get(websocket)
        if not room_id:
            # Room doesn't exist, user should go back to matching
            return
            
        receiver = self.matcher.get_partner(room_id, websocket)
        if not receiver:
            # Partner not found, cleanup and return to matching
            await self.cleanup(websocket, True);
            return
            
        # Send message to receiver
        try:
            await receiver.send_json({
                "type" : "chat",
                "data" : {
                    "message" : data.get("data", {}).get("message")
                    },
                "time_stamp" : str(datetime.now()),
                "sender" : self.matcher.username_map.get(websocket, "Unknown")
            })
        except WebSocketDisconnect:
            self.cleanup(websocket, False)
        except RuntimeError:
            self.cleanup(websocket, False)
        except Exception as e:
            # If sending fails, partner might have disconnected
            print(f"Error sending message: {e}")
            await self.cleanup(websocket, False);
                
    async def handle_system(self, websocket, data):
        room_id = self.matcher.user_to_rooms.get(websocket)
        sender = self.matcher.username_map[websocket];
        receiver = self.matcher.get_partner(room_id, websocket) if room_id else None
        action = data.get("data").get("action");
        if action == "skip":
            # if the system message have action tab in it
            # skipped = True;
            if room_id:
                if receiver:
                    await receiver.send_json({
                        "type":"system",
                        "data" : {
                            "message" : "Partner Disconnected, start a new chat or exit the app",
                            "action" : "got_skipped"
                        }
                    })
            return True;
        if action == "save_request":
            if receiver:
                receiver_username = self.matcher.username_map[receiver];
                connection = connection_store.create_request(room_id, sender, receiver_username);
                if connection_store.sessions[websocket].get("is_authenticated"):
                    if connection: 
                        await receiver.send_json({
                            "type" : "system",
                            "data" : {
                                "action" : "save_reqeust",
                                "message" : "do you want to save this chat for future"
                            }
                        })
                else:
                    await websocket.send_json({
                        "type" : "system",
                        "data" : {
                            "message" : "You need to login to save chats"
                        }
                    })
        
        if action == "save_accept":
            connection_req = connection_store.accept_request(room_id)
            if not connection_req:
                print("")
                return False

            session_a = connection_store.sessions.get(websocket)
            session_b = connection_store.sessions.get(receiver)

            if not (session_a and session_b):
                return False

            if not (session_a["is_authenticated"] and session_b["is_authenticated"]):
                await websocket.send_json({
                    "type": "system",
                    "data": {
                        "message": "Both users must be logged in to save chats"
                    }
                })
                await receiver.send_json({
                    "type": "system",
                    "data": {
                        "message": "Both users must be logged in to save chats"
                    }
                })
                return False

            user_a_id = session_a["uid"]
            user_b_id = session_b["uid"]

            # writing to db
            async with get_db() as db:
                from services.connection_service import ConnectionService
                connection = await ConnectionService.create_connection(
                    db,
                    user_a_id,
                    user_b_id
                )

            await websocket.send_json({
                "type": "system",
                "data": {
                    "message": "Chat saved successfully",
                    "connection_id": str(connection.id)
                }
            })
            await receiver.send_json({
                "type": "system",
                "data": {
                    "message": "Chat saved successfully",
                    "connection_id": str(connection.id)
                }
            })        
    
    async def handle_typing(self, websocket, data):
        room_id = self.matcher.user_to_rooms.get(websocket);
        receiver = None
        if room_id:
            receiver = self.matcher.get_partner(room_id, websocket);
        if receiver:
            await receiver.send_json({
                "type": "typing",
                "username": self.matcher.username_map[websocket],
                "isTyping": data.get("isTyping", False)
            })
            
    async def cleanup(self, websocket, skipped):
        async with self.matcher.lock:
            self.matcher.queue[:] = [u for u in self.matcher.queue if u["socket"] != websocket]
            room_id = self.matcher.user_to_rooms.pop(websocket, None)
            if room_id:
                partner = self.matcher.get_partner(room_id, websocket)
                self.matcher.rooms.pop(room_id, None)
                self.matcher.user_to_rooms.pop(partner, None)
                try:
                    await partner.send_json({"type" : "system",
                                             "data" : {
                                                 "message" : "Partner disconnected",
                                                 "action" : "got_skipped"
                                                 }})
                except:
                    pass
            if skipped:
                return True;


    async def handle_saved_chat(self, websocket, data):
        try:
            connection_id = data["data"]["connection_id"]
            message = data["data"]["message"]
        except KeyError as e:
            await websocket.send_json({
                "type": "error",
                "data" : {
                "message": f"Missing required field: {e}"
            }})
            return

        session = connection_store.sessions.get(websocket)
        if not session or not session["is_authenticated"]:
            await websocket.send_json({
                "type": "error",
                "data" : {
                "message": "Authentication required"
            }})
            return

        sender_id = session["uid"]
        
        # Convert sender_id to UUID if it's a string (for database comparison)
        try:
            sender_id_uuid = uuid.UUID(sender_id) if isinstance(sender_id, str) else sender_id
        except (ValueError, TypeError) as e:
            await websocket.send_json({
                "type": "error",
                "data" : {
                "message": f"Invalid sender_id format: {str(e)}"
            }})
            return

        try:
            connection_id_uuid = uuid.UUID(connection_id)
        except (ValueError, TypeError) as e:
            await websocket.send_json({
                "type": "error",
                "data" : {
                "message": f"Invalid connection_id format: {str(e)}"
            }})
            return

        try:
            receiver_id = None
            async for db in get_db():
                # 1. persist message
                await MessageService.create_message(
                    db,
                    connection_id_uuid,
                    sender_id_uuid,  # Use UUID version
                    message
                )

                # 2. find receiver user_id
                receiver_id = await MessageService.get_other_user_id(
                    db,
                    connection_id_uuid,
                    sender_id_uuid  # Use UUID version
                )
                break

            if not receiver_id:
                await websocket.send_json({
                    "type": "error",
                    "data" : {
                    "message": "Could not find receiver for this connection"
                }})
                return

            # 3. realtime delivery if online
            # receiver_id from database is UUID, active_users keys are UUID
            receiver_ws = self.matcher.active_users.get(receiver_id)
            if receiver_ws:
                await receiver_ws.send_json({
                    "type": "chat",
                    "context": "saved",
                    "data": {
                        "connection_id": str(connection_id_uuid),
                        "message": message,
                        "sender": session["username"],
                        "timestamp": datetime.now().isoformat()
                    }
                })
            else:
                # Receiver is not online, send confirmation to sender
                await websocket.send_json({
                    "type": "system",
                    "data": {
                        "message": "Receiver is not online now, send your message. Receiver will see it when they come online.",
                        "connection_status": "offline"
                    }
                })
        except Exception as e:
            print(f"Error in handle_saved_chat: {e}")
            print(traceback.format_exc())
            await websocket.send_json({
                "type": "error",
                "data" : {
                "message": f"Failed to send message: {str(e)}"
            }})

    async def send_saved_chat_confirmation(self, websocket, receiver_id):
        receiver_websocket = self.matcher.active_users.get(receiver_id)
        if receiver_websocket:
            try:
                await receiver_websocket.send_json({
                    "type": "system",
                    "data": {
                        "message": "Both users are active, start chatting",
                        "connection_status": "connected"
                    }
                })
                await websocket.send_json({
                    "type": "system", 
                    "data": {
                        "message": "Both users are active, start chatting",
                        "connection_status": "connected"
                    }
                })
            except Exception as e:
                # Log error but don't fail the connection
                print(f"Error sending confirmation message: {e}")
        else:
            await websocket.send_json({
                "type": "system",
                "data": {
                    "message": "Receiver is not online now, send your message. Receiver will see it when they come online.",
                    "connection_status": "offline"
                }
            })
    

