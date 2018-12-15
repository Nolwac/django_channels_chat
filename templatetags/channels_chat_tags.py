from django import template

register = template.Library()

@register.inclusion_tag('channels_chat/chat_box.html')
def chat_box(request):
	return {'request':request}