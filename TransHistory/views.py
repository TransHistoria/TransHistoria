import json
from django.shortcuts import render
from django.contrib.auth.decorators import login_required
from django.views.decorators.csrf import csrf_protect
from django.http import JsonResponse
from django.core.files.storage import default_storage
from .models import HistoryNode, Contributor
from django.shortcuts import get_object_or_404
from .Tools.file import handle_upload_file
from django.db.models import Q
# Create your views here.


def index_A(request):
    return render(request, 'index_A.html')

def timeline_A(request):
    return render(request, 'timeline_A.html')

def index(request):
    return render(request, 'index.html')

def history(request):
    return render(request, 'archives_field.html', {'tag': '事件'})

def timeline(request):
    return render(request, 'timeline.html')

def timepoint(request, uuid, mkdoc_path):
    return render(request, 'detail.html', {'basePath': f"/media/mkdocs/{uuid}/", 'homepage': mkdoc_path})

def people(request):
    return render(request, 'archives_field.html', {'tag': '人物'})

def theory(request):
    return render(request, 'archives_field.html', {'tag': '理论'})

def gallery(request):
    return render(request, 'archives_field.html', {'tag': '艺术'})

def archives(request):
    input = request.GET.get('input')
    return render(request, 'archives.html', {'search_keyword': input})

def about_us(request):
    return render(request, 'about_us.html')

def about_submission(request):
    return render(request, 'about_submission.html')

def dlog(request):
    return render(request, 'dlog.html')


@login_required
def submit(request):
    user = request.user   # 当前登录用户对象
    return render(request, "submit.html", {"user": user})

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
        
        # 2. 获取文件
        uploaded_file = request.FILES.get('doc')  # 对应 <input name="doc">
        mkdoc_path = ""
        if uploaded_file:
            mkdoc_path = handle_upload_file(uploaded_file)

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
            oridoc=uploaded_file,
            mkdoc=mkdoc_path
        )

        Contributor.objects.create(
            name = data.get('user', {}).get('name', ''),
            email = data.get('user', {}).get('email', ''),
            node_id = node.id,
            title = node.title
        )

        return JsonResponse({'status': 'ok', 'data': data, 'id': node.id})

    return JsonResponse({'error': 'POST required'}, status=405)

def historynode_api(request, pk):
    node = get_object_or_404(HistoryNode, pk=pk)
    data = {
        "title": node.title,
        "con": node.con,
        "time": node.time,
        "mkdoc": node.mkdoc,
        "ref": node.ref,
    }
    return JsonResponse(data)

def get_historynodes(request):
    tags = request.GET.get('tag', '')        # tag参数
    keyword = request.GET.get('q', '')      # 搜索关键词

    # 先查询全部
    records = HistoryNode.objects.all()

    # 如果传了tag，就按tag过滤
    if tags:
        tag_list = [t.strip() for t in tags.split(',') if t.strip()]
        records = records.filter(tag__in=tag_list)

    # 如果传了搜索关键词，就按title包含过滤
    if keyword:
        records = records.filter(title__icontains=keyword)
    
    # 按创建时间倒序排序（最新的在前）
    records = records.order_by('-created_at')

    data = list(records.values())  # 转为dict列表返回
    return JsonResponse(data, safe=False)