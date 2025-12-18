import asyncio
import uuid

class MatchHandler:
    def __init__(self):
        self.queue = []
        self.rooms = {};
        self.user_to_rooms = {};
        self.lock = asyncio.Lock();
        self.username_map = {};
        
    def get_partner(self, room_id, websocket):
        s1, s2 = self.rooms.get(room_id, (None, None))
        if s1 is None or s2 is None:
            return None
        return s2 if websocket == s1 else s1
    
    def interest_score(self, user1, user2, based_on):
        score = 0
        setA = user1["interests"];
        for interest in setA:
            if interest in user2["interests"]:
                based_on.append(interest);
                score += 1
        return score;
        
    async def try_match(self, user):
        # first try interest matching and then random all in one function
        async with self.lock:
            self.queue[:] = [u for u in self.queue if u != user]
            self.queue.append(user);
            matched = False;
            if len(self.queue) >= 2:
                for u in self.queue:
                    if u != user:
                        temp_based_on = []
                        score = self.interest_score(u, user, temp_based_on)
                        based_on = temp_based_on
                        if score >= 1:
                            matched = True;
                            return matched, user, u, based_on
            
            if not matched:
                for u in self.queue:
                    if u != user:
                        matched = True;
                        user1, user2 = user, u;
                        return matched, user1, user2, ["random"];

            return False, None, None, [];
                    
    async def confirm_connection(self, user1, user2, based_on):
        async with self.lock:
            # Verify both users are still valid and not already in rooms (race condition check)
            if (user1["socket"] in self.user_to_rooms or 
                user2["socket"] in self.user_to_rooms or
                user1["socket"] == user2["socket"]):
                return  # Already matched or invalid match
            
            # Remove users from queue by socket (should already be done in match functions, but ensure it)
            self.queue[:] = [u for u in self.queue if u["socket"] != user1["socket"] and u["socket"] != user2["socket"]]
            
            # Create room and assign users
            room_id = str(uuid.uuid4())
            self.rooms[room_id] = [user1["socket"], user2["socket"]]
            self.user_to_rooms[user1["socket"]] = room_id
            self.user_to_rooms[user2["socket"]] = room_id
        
        if not based_on:
            based_on = ["random"];
        # print(based_on);
        try:
            await user1["socket"].send_json({"system": "Connected", "paired_to" : user2["username"] , "based_on": ','.join(based_on)})
            await user2["socket"].send_json({"system": "Connected", "paired_to" : user1["username"] , "based_on": ','.join(based_on)})
        except Exception as e:
            # If sending fails, cleanup the connection
            async with self.lock:
                self.user_to_rooms.pop(user1["socket"], None)
                self.user_to_rooms.pop(user2["socket"], None)
                self.rooms.pop(room_id, None)
        

matcher = MatchHandler();