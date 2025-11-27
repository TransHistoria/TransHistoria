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

def get_gallery_nodes(request):
    records = HistoryNode.objects.all().filter(tag="作品").order_by('-created_at')
    data = list(records.values())  # 转为dict列表返回
    return JsonResponse(data, safe=False)

def get_people_nodes(request):
    records = HistoryNode.objects.all().filter(tag="人物")
    data = list(records.values())  # 转为dict列表返回
    return JsonResponse(data, safe=False)

def get_timeline(request):
    records = HistoryNode.objects.all().filter(tag="事件").order_by('time')
    data = list(records.values())  # 转为dict列表返回
    return JsonResponse(data, safe=False)

def save_collage(request):
    import json
    import os
    from django.conf import settings

    if request.method == 'POST':
        try:
            # 获取请求体中的数据
            body = json.loads(request.body)
            data = body.get('data')
            path = body.get('path', '/media/config/test.json')

            if not data:
                return JsonResponse({'status': 'error', 'message': '没有数据'}, status=400)

            # 确保目录存在
            full_path = os.path.join(settings.MEDIA_ROOT, path.replace('/media/', ''))
            os.makedirs(os.path.dirname(full_path), exist_ok=True)

            # 写入文件
            with open(full_path, 'w', encoding='utf-8') as f:
                f.write(data)

            return JsonResponse({'status': 'success', 'message': '保存成功'})
        except Exception as e:
            return JsonResponse({'status': 'error', 'message': str(e)}, status=500)

    return JsonResponse({'status': 'error', 'message': '仅支持POST请求'}, status=405)

def load_collage(request):
    import json
    import os
    from django.conf import settings

    if request.method == 'GET':
        try:
            # 获取page参数
            page = request.GET.get('page', 'index')

            # 构建文件路径
            file_path = os.path.join(settings.MEDIA_ROOT, f'config/{page}.json')

            # 检查文件是否存在
            if os.path.exists(file_path):
                # 读取文件内容
                with open(file_path, 'r', encoding='utf-8') as f:
                    content = f.read()

                return JsonResponse({
                    'success': True,
                    'content': content
                })
            else:
                return JsonResponse({
                    'success': False,
                    'message': f'没有找到页面 {page} 的拼贴画数据'
                })
        except Exception as e:
            return JsonResponse({
                'success': False,
                'message': str(e)
            }, status=500)

    return JsonResponse({'success': False, 'message': '仅支持GET请求'}, status=405)

def upload_collage_image(request):
    import os
    from django.conf import settings
    from django.core.files.storage import default_storage
    from django.core.files.base import ContentFile
    from django.http import JsonResponse
    
    if request.method == 'POST':
        try:
            # 获取上传的图片文件
            if 'image' in request.FILES:
                image = request.FILES['image']
                
                # 检查文件类型
                image_types = [
                    'image/png', 'image/jpg',
                    'image/jpeg', 'image/pjpeg', 'image/gif'
                ]
                if image.content_type not in image_types:
                    return JsonResponse({
                        'status': 'error',
                        'message': '不支持的图片格式'
                    }, status=400)
                
                # 获取页面类型，如果没有则使用默认值
                page_type = request.POST.get('page_type', 'default')
                
                # 生成文件名，不使用UUID，直接使用页面类型
                filename = f"{page_type}.png"
                
                # 确保目录存在
                upload_dir = os.path.join('config', 'images')
                if not os.path.exists(os.path.join(settings.MEDIA_ROOT, upload_dir)):
                    os.makedirs(os.path.join(settings.MEDIA_ROOT, upload_dir))
                
                # 文件路径
                file_path = os.path.join(upload_dir, filename)

                # 如果文件已存在，先删除
                if default_storage.exists(file_path):
                    default_storage.delete(file_path)

                # 保存新文件
                saved_path = default_storage.save(file_path, ContentFile(image.read()))
                
                # 返回成功响应
                return JsonResponse({
                    'status': 'success',
                    'message': '图片上传成功',
                    'path': os.path.join(settings.MEDIA_URL, saved_path)
                })
            else:
                return JsonResponse({
                    'status': 'error',
                    'message': '没有找到图片文件'
                }, status=400)
        except Exception as e:
            return JsonResponse({
                'status': 'error',
                'message': f'上传过程中出错: {str(e)}'
            }, status=500)
    
    return JsonResponse({
        'status': 'error', 
        'message': '仅支持POST请求'
    }, status=405)