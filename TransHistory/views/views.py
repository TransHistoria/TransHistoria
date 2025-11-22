from django.shortcuts import render
from django.shortcuts import get_object_or_404
from ..models import HistoryNode
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
    concept_nodes = HistoryNode.objects.all().filter(tag='理论')
    default_fontsize = 25
    concept_nodes_json = [
        {
            'id': node.id,
            'title': node.title,
            'con': node.con,
            'fontsize': default_fontsize,
        }
        for node in concept_nodes
    ]
    return render(request, 'theory.html', {'concept_nodes_json': concept_nodes_json})

def gallery(request):
    return render(request, 'archives_field.html', {'tag': '艺术'})

def archives(request):
    input = request.GET.get('input')
    return render(request, 'archives.html', {'search_keyword': input})

def node(request, id):
    node = get_object_or_404(HistoryNode, id=id)
    return render(request, 'node.html', {'node': node})

def about_us(request):
    return render(request, 'about_us.html')

def about_submission(request):
    return render(request, 'about_submission.html')

def dlog(request):
    dlogs = HistoryNode.objects.all().filter(tag='Devlog').order_by('-created_at')
    return render(request, 'dlog.html', {'dlogs':dlogs})
