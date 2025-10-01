import os
import json
import uuid
import json
from django.shortcuts import render
from django.contrib.auth.decorators import login_required
from django.views.decorators.csrf import csrf_protect
from django.http import JsonResponse
from django.core.files.storage import default_storage
from ..models import HistoryNode, Contributor
from django import forms
from martor.fields import MartorFormField
from django.conf import settings
from django.http import HttpResponse
from django.utils.translation import gettext_lazy as _
from django.contrib.auth.decorators import login_required
from django.core.files.storage import default_storage
from django.core.files.base import ContentFile
from martor.utils import LazyEncoder


class TestForm(forms.Form):
    details = MartorFormField()

@login_required
def submit(request):
    user = request.user   # 当前登录用户对象
    form = TestForm()
    return render(request, "submit.html", {"user": user, 'form': form})

@csrf_protect
def post(request):
    if request.method == "POST":
        # 1. 获取 JSON
        json_str = request.POST.get('json_data')
        if not json_str:
            return JsonResponse({'error': 'Missing JSON data'}, status=400)
        try:
            data = json.loads(json_str)
        except json.JSONDecodeError:
            return JsonResponse({'error': 'Invalid JSON'}, status=400)
        form = TestForm(request.POST)
        

        # 3. 保存到数据库
        node = HistoryNode.objects.create(
            title=data.get('title', ''),
            con=data.get('con', ''),
            ref=data.get('ref', []),
            time=data.get('attr', {}).get('time', ''),
            field=data.get('attr', {}).get('field', ''),
            theme=data.get('attr', {}).get('theme', ''),
            region=data.get('attr', {}).get('region', ''),
            tag=data.get('attr', {}).get('tag', ''),
            details=form.data['details']
        )

        Contributor.objects.create(
            name = data.get('user', {}).get('name', ''),
            email = data.get('user', {}).get('email', ''),
            node_id = node.id,
            title = node.title
        )

        return JsonResponse({'status': 'ok', 'data': data, 'id': node.id})

    return JsonResponse({'error': 'POST required'}, status=405)
