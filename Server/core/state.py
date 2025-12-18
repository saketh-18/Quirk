from matcher import matcher
from MessageHandler import MessageHandler

class AppState:
    def __init__(self):
        self.matcher = matcher
        self.messenger = MessageHandler(self.matcher)
        
state = AppState();

