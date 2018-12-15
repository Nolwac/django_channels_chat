from channels.consumer import AsyncConsumer
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.layers import get_channel_layer
import asyncio
import json

class UserConsumer(AsyncWebsocketConsumer):
	"""
	The purpose of this class is to consume the user ping for a chat with the customer care representative.
	This class captures the ping and then processes it and creates a channel layer layer to accept the chat between the user and staff
	user that accepted the chat request.
	"""

	async def connect(self):
		await self.accept() #this accepts the connection
		user = self.scope['user']
		if user.is_authenticated:
			self.name = user.username
		else:
			self.name = self.scope['url_route']['kwargs']['username']
		await self.channel_layer.group_add(self.name, self.channel_name)
	
	async def receive(self, text_data=None, byte_data=None):
		user = self.scope['user']
		if user.is_authenticated:
			message = {
			'message':'your chat request has been received'
			}
			await self.send(text_data=json.dumps(message)) #sends a message to the user to wait for staff connection
			await self.channel_layer.group_send( #sends a message to all available staff requesting for chat connection with user.
				'staff',
				{
				'type':'chat.request',
				'event':'newchat request',
				'message':'incomming chat request...',
				'username':user.username
				}
				)
			print('messaging sending successful')
		else:
			await self.send(text_data='you are not a logged in user. log in to be able to access this features of the website')
			print('message sending failed')
			#tells the user that he is not authenticated and is not allowed to contact the customer care.

	async def disconnect(self, code):
		await self.send(text_data='the connection has been disconnected')
		await self.channel_layer.group_discard(self.name, self.channel_name)

	async def chat_accepted(self, event):
		"""this receives the message that the chat has been accepted and and also to redirect the user so that the chat can start."""
		recieved_message = event['message']
		staff = event['staff']
		message = {
		'message':recieved_message,
		'staff':staff
		}
		await self.send(text_data=json.dumps(message))
		print('chat accepted')

class StaffConsumer(AsyncWebsocketConsumer):
	"""
	This class is responsible for creating the channel and linking the staff user and the regular user together for the chat.
	"""
	async def connect(self):
		await self.accept()
		await self.channel_layer.group_add('staff', self.channel_name)

	async def receive(self, text_data=None, byte_data=None):
		staff = self.scope['user']
		text = json.loads(text_data)
		print(text_data)
		customer_username = text['username']
		if staff.is_staff:
			accepted = text.get('accepted', None)
			if accepted == 'true':
				#await self.channel_layer.group_add(f'{staff.username}_and_{customer_username}', self.channel_name) #this is to create a new group between user and staff
				message = {
				'status':'accepted',
				'customer': customer_username,
				'staff': staff.username
				}
				await self.send( #this is to make known to other staff members that the user has been accepted by a staff member
					text_data=json.dumps(message)
					)
				print('message has just been sent to staff users online')
				await self.channel_layer.group_send( #this is to send message to the user that his request has been accepted and to redirect user
					customer_username,{
					'type':'chat_accepted', 
					'staff':staff.username,
					'message':'accepted'
					})
				
				print('the chat request has been fully delivered')
	async def chat_request(self, event):
		print('started chat request function')
		customer_username = event['username']
		message = {
		'status':'incomming',
		'message':'Incomming chat request from a user',
		'customer': customer_username
		}
		await self.send(text_data=json.dumps(message))
		print('chat request sent to staff users')
	async def disconnect(self, code):
		await self.send(text_data='the connection has been disconnected')
		await self.channel_layer.group_discard('staff', self.channel_name)
	async def send_chat(self, event):
		"""
		The purpose of this function is to process the received broadcat and then sends the chat message
		"""
		message = event['message']
		user = event['user']
		full_message = {
		'message':message,
		'user':user
		}
		await self.send(text_data=json.dumps(full_message)) #actual message sending takes place hered.
		print('message successfully sent from the staff app')
class ChatConsumer(AsyncWebsocketConsumer):
	"""
	This is the chat layer were all the conversation between all the staff user and the regular user will be handled
	"""
	async def connect(self):
		await self.accept()
		self.chatroom = self.scope['url_route']['kwargs']['chat_name'] #sets the chat room name
		await self.channel_layer.group_add(self.chatroom, self.channel_name) #creates the chat room
		await self.send(text_data='you have been connected to the socket') #send message that connection was safely made
		print('chat started')

	async def receive(self, text_data=None, byte_data=None):
		message=text_data
		print(self.chatroom)
		await self.channel_layer.group_send( #thsi processes broadcasts the chat message to the chat room
			self.chatroom, {
			'type':'send.chat',
			'message':message,
			'user':self.scope['user'].username
			})

	async def send_chat(self, event):
		"""
		The purpose of this function is to process the received broadcat and then sends the chat message
		"""
		message = event['message']
		user = event['user']
		full_message = {
		'message':message,
		'user':user
		}
		await self.send(text_data=json.dumps(full_message)) #actual message sending takes place hered.
		print('message successfully sent from the chat app')
	async def disconnect(self, code):
		await self.send(text_data='the connection has been disconnected')
		await self.channel_layer.group_discard(self.chatroom, self.channel_name)


