from datetime import datetime, timezone
import uuid

class ConnectionStore:
    def __init__(self):
        self.pending_saves = {};
        self.user_connections = {};
        self.connections = {};
        
        
    def create_request(self, room_id, from_user, to_user):
        connection = {
            "from" : from_user,
            "to" : to_user,
            "created_at" : str(datetime.now(timezone.utc)),
        }
        self.pending_saves[room_id] = connection
        return connection
    
    def accept_request(self, room_id):
        request = self.pending_saves[room_id];
        
        if not request:
            return None
        
        cid = str(uuid.uuid4());
        
        connection = {
            "cid" : cid,
            "user1" : request["from"],
            "user2" : request["to"],
            "createdAt" : str(datetime.now(timezone.utc)),
            "status" : "active",
         }
        
        self.connections[cid] = connection;
        
        if request["from"] not in self.user_connections:
            self.user_connections[request["from"]] = []
        if request["to"] not in self.user_connections:
            self.user_connections[request["to"]] = []
        
        
        self.user_connections[request["from"]].append(connection);
        self.user_connections[request["to"]].append(connection);
        
        self.pending_saves.pop(room_id, None)
        
        return connection
    
connection_store = ConnectionStore();
                
