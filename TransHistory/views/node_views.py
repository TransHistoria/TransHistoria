from django.http import JsonResponse
from django.shortcuts import get_object_or_404
from ..models import HistoryNode

def historynode_api(request, pk):
    node = get_object_or_404(HistoryNode, pk=pk)
    data = {
        "id": node.id,
        "title": node.title,
        "con": node.con,
        "time": node.time,
        "mkdoc": node.mkdoc,
        "ref": node.ref,
        "details": node.details,
    }
    return JsonResponse(data)

def get_historynodes(request):
    tags = request.GET.get('tag', '')        # tag参数
    keyword = request.GET.get('q', '')      # 搜索关键词

    # 先查询全部
    records = HistoryNode.objects.all().exclude(tag="Devlog")

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


def get_theory_nodes(request):
    records = HistoryNode.objects.all().filter(tag="理论")
    data = list(records.values())  # 转为dict列表返回
    return JsonResponse(data, safe=False)

def get_timeline(request):
    records = HistoryNode.objects.all().filter(tag="事件").order_by('time')
    data = list(records.values())  # 转为dict列表返回
    return JsonResponse(data, safe=False)