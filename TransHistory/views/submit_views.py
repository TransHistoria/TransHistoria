import json
from django.shortcuts import render
from django.contrib.auth.decorators import login_required
from django.views.decorators.csrf import csrf_protect
from django.http import JsonResponse
from ..models import HistoryNode, Contributor
from django import forms
from martor.fields import MartorFormField
from django.utils.translation import gettext_lazy as _


class TestForm(forms.Form):
    title = forms.CharField(
        label=_('标题'),
        max_length=255,
        required=True
    )
    content = forms.CharField(
        label=_('内容'),
        widget=forms.Textarea,
        required=True
    )
    time = forms.IntegerField(
        label=_('时间'),
        required=False,
        min_value=-9999,
        max_value=99999999
    )
    time_name = forms.CharField(
        label=_('时间名称'),
        max_length=100,
        required=False
    )
    field = forms.CharField(
        label=_('领域'),
        max_length=100,
        required=False
    )
    theme = forms.CharField(
        label=_('主题'),
        max_length=100,
        required=False
    )
    region = forms.CharField(
        label=_('地区'),
        max_length=100,
        required=False
    )
    tag = forms.ChoiceField(
        label=_('标签'),
        choices=[
            ('事件', '事件'),
            ('理论', '理论'),
            ('作品', '作品'),
        ],
        required=True
    )
    details = MartorFormField(
        label=_('详细资料'),
        help_text=_('请使用Markdown语法书写，点击右上角问号可以查看帮助'),
        required=False,
        max_length=10000,
    )
    cover = forms.ImageField(
        label=_('封面图片'),
        required=False
    )

@login_required
def submit(request):
    user = request.user   # 当前登录用户对象
    node_id = request.GET.get('node_id')

    # 如果有node_id，先获取节点数据
    initial_data = {}
    if node_id:
        try:
            node = HistoryNode.objects.get(id=node_id)
            initial_data = {
                'title': node.title,
                'content': node.con,
                'time': node.time,
                'time_name': node.time_name,
                'field': node.field,
                'theme': node.theme,
                'region': node.region,
                'tag': node.tag,
                'details': node.details,
                'cover': node.cover,
            }
        except HistoryNode.DoesNotExist:
            pass  # 如果节点不存在，忽略错误

    form = TestForm(initial=initial_data)
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
