document.addEventListener('DOMContentLoaded', function(event){
	var host = 'ws://'+window.location.host
	var user_name = document.querySelector('status').getAttribute('username');
	//below are the functions that are neccessary for processing some stuff in the website.
	function createElementAndMessage(type, message, append_to, id='', dialog=false){
		var element=document.createElement('div');
		element.setAttribute('id', id)
		element.innerHTML = message;
		if(type=='chat-one'){
			element.setAttribute('class','uk-position-left uk-position-relative uk-margin-right uk-margin-medium-right chat-one');
		}else if(type=='chat-two'){
			element.setAttribute('class','uk-position-right uk-position-relative uk-margin-left uk-margin-medium-left chat-two');
		}else if(type=='notification'){
			element.setAttribute('class', 'uk-card uk-card-body uk-card-default uk-position-bottom uk-position-fixed notification')
		}else{
			element.setAttribute('class', 'uk-card uk-card-body uk-card-default uk-position-bottom uk-position-fixed notification')
		}
		if(dialog==true){
			var accept = document.createElement('button')
			accept.setAttribute('class', 'uk-button uk-button-primary uk-button-small accept')
			accept.innerHTML='Accept'
			accept.onclick = acceptChat;
			var decline = document.createElement('button')
			decline.setAttribute('class', 'uk-button uk-button-small uk-button-danger decline')
			decline.innerHTML='Decline'
			decline.onclick = declineChat;
			element.innerHTML += '<br>'
			element.appendChild(accept)
			element.appendChild(decline)
		}else if(type=='ok'){
			var okay=document.createElement('button')
			okay.setAttribute('class', 'uk-button uk-button-primary uk-button-small okay')
			okay.innerHTML='Ok'
			okay.onclick = Ok;
			element.innerHTML += '<br>'
			element.appendChild(okay)
		}
		append_to.appendChild(element)
		return element
	}

	function create_chat_socket(chat_name){
		//this is the function that takes care of making sure that the socket is created and that the message is well sent the way it is supposed to be sent
		window.endpoint = host+'/chat/'+chat_name+'/';
		window.socket = new WebSocket(endpoint);
		socket.onmessage = function(e){
			console.log(e)
			console.log(e.data)
			data = JSON.parse(e.data)
			console.log(data)
			var current_user = document.getElementById('chat').getAttribute('user')
			var chat_body = document.querySelector('.chat-body')
			if(current_user==data.user){
				var element=createElementAndMessage('chat-two', data.message, chat_body);
			}else{
				var element=createElementAndMessage('chat-one', data.message, chat_body);
			}
			console.log(element)
			var height=element.offsetHeight;
			console.log(height)
			chat_body.scrollBy(0, height)
			document.querySelector('#chat').style.visibility='visible'
			console.log('I scrolled now')
		}
		socket.onopen = function(e){
			console.log('open', e)
		}
	}
	if(document.querySelector('status').getAttribute('user-status')=='false'){ //trying to execute some functions with respect to the user's status in the website. Note: this uses django default staff check.
		var endpoint1 = host + '/user/'+user_name+'/'
		var socket1 = new WebSocket(endpoint1)
		socket1.onmessage = function(e){
			data = JSON.parse(e.data)
			if(data.message=='accepted'){
				createElementAndMessage('ok', data.message, document.body);
				var chat_name = data.staff+'_and_'+user_name
				create_chat_socket(chat_name)
				document.getElementById('chat').style.visibility='visible';
				console.log('chat created start chattiing with the user you want to chat with')
			}
		}
		socket1.onopen = function(e){
			console.log(e)
		}
		document.getElementById('customer_care').addEventListener('click', function(e){
			//this is were the staff users are being triggered of the incoming chat request from a given user
			e.preventDefault()
			console.log('triggering chat')
			socket1.send('I need to chat with the customer care representative') // this sends the actuall chat request message
		})
	}else{
		var endpoint2 = host + '/staff/'
		var socket2 = new WebSocket(endpoint2)
		socket2.onmessage = function(e){
			console.log('processing request')
			data = JSON.parse(e.data)
			if(data.customer!== null){
				console.log(e.data.customer, 'is the new customer')
				var message = 'Chat request from '+data.customer;
				if(data.status=='accepted'){
					console.log('staff have received the message of the accepted request')
					var element=document.getElementById(data.customer);
					console.log('passed customer element')
					element.parentNode.removeChild(element);
					console.log('notification has just been removed')
				}else{
					createElementAndMessage('notification', message, document.body, id=data.customer, dialog=true);
					window.chat_name =  user_name+'_and_'+data.customer;
					window.username = data.customer;
					console.log('request has been received by staff');
				}	
			}
			
		}
		socket2.onopen = function(e){
			console.log(e);
		}
	}
	function acceptChat(e){
		e.preventDefault()
		console.log('about to accept')
		var message = {
			'accepted':'true',
			'chatname':window.chat_name,
			'username':window.username
		}
		socket2.send(JSON.stringify(message))
		create_chat_socket(chat_name)
		document.getElementById('chat').style.visibility='visible';
	}
	function declineChat(e){
		e.preventDefault();
		console.log('about to reject')
		e.target.parentElement.parentNode.removeChild(e.target.parentElement);
	}
	function Ok(e){
		e.preventDefault()
		console.log('just agreed')
		e.target.parentNode.style.visibility='hidden'
		e.target.parentElement.parentNode.removeChild(e.target.parentElement);
	}
	// this is to help close the chat box when the user want to close it.
	document.querySelector('.chat-box-close').addEventListener('click', function(e){
		e.preventDefault();
		var id = this.getAttribute('parent-id');
		document.getElementById(id).style.visibility='hidden';
	});
	document.querySelector('.chat-form').addEventListener('submit', function(e){
		e.preventDefault()
		e.target.querySelector('#chat_message')
		var message = e.target.querySelector('#chat-message').value
		socket.send(message) //this is to send message via the socket connection that was created
		this.reset()
	})
})