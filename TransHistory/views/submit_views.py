import json
from django.shortcuts import render
from django.contrib.auth.decorators import login_required
from django.views.decorators.csrf import csrf_protect
from django.http import JsonResponse
from ..models import HistoryNode, Contributor
from django import forms
from martor.fields import MartorFormField
from django.utils.translation import gettext_lazy as _
from django.contrib.auth.decorators import login_required


class TestForm(forms.Form):
    details = MartorFormField(
        label=_('Details'),
        help_text=_('请使用Markdown语法书写，点击右上角问号可以查看帮助'),
        required = False,
        max_length = 3000,
    )

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
        time_str = data.get('time', 0)  # 默认 0
        try:
            time = int(time_str)
        except (ValueError, TypeError):
            time = 0


        # 3. 保存到数据库
        node = HistoryNode.objects.create(
            title=data.get('title', ''),
            con=data.get('con', ''),
            ref=data.get('ref', []),
            time=time,
            time_name=data.get('attr', {}).get('time_name', ''),
            field=data.get('attr', {}).get('field', ''),
            theme=data.get('attr', {}).get('theme', ''),
            region=data.get('attr', {}).get('region', ''),
            tag=data.get('attr', {}).get('tag', ''),
            details=form.data['details'],
            cover=data.get('cover', ''),
        )

        Contributor.objects.create(
            name = data.get('user', {}).get('name', ''),
            email = data.get('user', {}).get('email', ''),
            node_id = node.id,
            title = node.title
        )

        return JsonResponse({'status': 'ok', 'data': data, 'id': node.id})

    return JsonResponse({'error': 'POST required'}, status=405)
