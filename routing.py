from channels.routing import ProtocolTypeRouter, URLRouter
from channels.auth import AuthMiddlewareStack
from django.urls import path
from .consumer import *
from django.conf.urls import url

application = ProtocolTypeRouter({
	"websocket": AuthMiddlewareStack(
		URLRouter([
		path('staff/', StaffConsumer),
		path('user/<username>/', UserConsumer),
		path('chat/<chat_name>/', ChatConsumer),
		])
		)
	})