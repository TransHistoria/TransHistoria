import os
import json
import uuid
import json
from django.contrib.auth.decorators import login_required
from django.core.files.storage import default_storage
from django.conf import settings
from django.http import HttpResponse
from django.utils.translation import gettext_lazy as _
from django.contrib.auth.decorators import login_required
from django.core.files.storage import default_storage
from django.core.files.base import ContentFile
from martor.utils import LazyEncoder

# copy form martor github wiki
# https://github.com/agusmakmun/django-markdown-editor/wiki
# post by "Upload an image" button in editor
# bug
# 在编辑器中插入的图片直接上传到了服务器，并用于预览，但是用户可能上传之后又把图片引用删除了，或者关闭页面刷新页面，导致最后服务器上残留无用图片。
@login_required
def images_uploader(request):
    """
    Makdown image upload for locale storage
    and represent as json to markdown editor.
    """
    if request.method == 'POST':
        print(request.FILES)
        if 'markdown-image-upload' in request.FILES:
            image = request.FILES['markdown-image-upload']
            image_types = [
                'image/png', 'image/jpg',
                'image/jpeg', 'image/pjpeg', 'image/gif'
            ]
            if image.content_type not in image_types:
                data = json.dumps({
                    'status': 405,
                    'error': _('Bad image format.')
                }, cls=LazyEncoder)
                return HttpResponse(
                    data, content_type='application/json', status=405)

            if image.size > settings.MAX_IMAGE_UPLOAD_SIZE:
                to_MB = settings.MAX_IMAGE_UPLOAD_SIZE / (1024 * 1024)
                data = json.dumps({
                    'status': 405,
                    'error': _('Maximum image file is %(size)s MB.') % {'size': to_MB}
                }, cls=LazyEncoder)
                return HttpResponse(
                    data, content_type='application/json', status=405)

            img_uuid = "{0}-{1}".format(uuid.uuid4().hex[:10], image.name.replace(' ', '-'))
            tmp_file = os.path.join(settings.MARTOR_UPLOAD_PATH, img_uuid)
            def_path = default_storage.save(tmp_file, ContentFile(image.read()))
            img_url = os.path.join(settings.MEDIA_URL, def_path)

            data = json.dumps({
                'status': 200,
                'link': img_url,
                'name': image.name
            })
            return HttpResponse(data, content_type='application/json')
        return HttpResponse(_('Invalid request!'))
    return HttpResponse(_('Invalid request!'))
