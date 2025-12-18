from datetime import datetime
from ConnectionStore import connection_store

class MessageHandler:
    def __init__(self, matcher):
        self.matcher = matcher
        
    async def handle_chat(self, websocket, data):
        room_id = self.matcher.user_to_rooms.get(websocket)
        if not room_id:
            # Room doesn't exist, user should go back to matching
            return
            
        receiver = self.matcher.get_partner(room_id, websocket)
        if not receiver:
            # Partner not found, cleanup and return to matching
            await self.cleanup(websocket);
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
        except Exception as e:
            # If sending fails, partner might have disconnected
            print(f"Error sending message: {e}")
            await self.cleanup(websocket);
                
    async def handle_system(self, websocket, data):
        room_id = self.matcher.user_to_rooms.get(websocket)
        sender = self.matcher.username_map[websocket];
        receiver = self.matcher.get_partner(room_id, websocket) if room_id else None
        action = data.get("data").get("action");
        if action == "skip":
            # if the system message have action tab in it
            skipped = True;
            if room_id:
                if receiver:
                    await receiver.send_json({
                        "type":"system",
                        "data" : {
                            "message" : "Partner Disconnected, start a new chat or exit the app"
                        }
                    })
            return True;
        if action == "save_request":
            if receiver:
                receiver_username = self.matcher.username_map[receiver];
                connection = connection_store.create_request(room_id, sender, receiver_username);
                
                if connection: 
                    await receiver.send_json({
                        "type" : "system",
                        "data" : {
                            "action" : "save_reqeust",
                            "message" : "do you want to save this chat for future"
                        }
                    })
        
        if action == "save_accept":
            connection = connection_store.accept_request(room_id);
            if connection:
                await websocket.send_json({
                    "system" : "connection created"
                })
                await receiver.send_json({
                    "system" : "connection created"
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
                    await partner.send_json({"system": "Partner disconnected"})
                except:
                    pass
            if skipped:
                return True;
