import json
from django.shortcuts import render
from django.contrib.auth.decorators import login_required
from django.views.decorators.csrf import csrf_exempt
from django.http import JsonResponse
from django.core.files.storage import default_storage
from .models import HistoryNode, Contributor
# Create your views here.


def index_A(request):
    return render(request, 'index_A.html')

def index(request):
    return render(request, 'index.html')

def history(request):
    return render(request, 'history.html')

def timeline(request):
    return render(request, 'timeline.html')

def timepoint(request, year):
    markdown_file = f'{year}.md'
    return render(request, 'detail.html', {'homepage': markdown_file})

def people(request):
    return render(request, 'people.html')

def theory(request):
    return render(request, 'theory.html')

def gallery(request):
    return render(request, 'gallery.html')

def archives(request):
    return render(request, 'archives.html')

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

@csrf_exempt
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
            oridoc=uploaded_file
        )

        Contributor.objects.create(
            name = data.get('user', {}).get('name', ''),
            email = data.get('user', {}).get('email', ''),
            node_id = node.id,
            title = node.title
        )

        return JsonResponse({'status': 'ok', 'data': data, 'id': node.id})

    return JsonResponse({'error': 'POST required'}, status=405)