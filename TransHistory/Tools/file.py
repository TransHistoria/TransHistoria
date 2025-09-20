import os
import uuid
import shutil
import zipfile
import tarfile
from pathlib import Path
from django.conf import settings
from django.http import HttpResponseBadRequest, JsonResponse

def handle_upload_file(file):
    """
    接收压缩包文件，解压并检查：
    - 至少有一个 markdown 文件
    - 其它文件全部是图片或空
    - 符合条件则在 static/mkdoc/<uuid> 下创建文件夹并复制解压内容
    返回 static path: uuid/md_filename
    """

    # === 1. 保存临时文件 ===
    tmp_dir = Path(settings.BASE_DIR) / 'tmp_uploads'
    tmp_dir.mkdir(exist_ok=True)
    tmp_file = tmp_dir / file.name
    with open(tmp_file, 'wb+') as f:
        for chunk in file.chunks():
            f.write(chunk)

    # === 2. 解压到临时目录 ===
    extract_dir = tmp_dir / f'extract_{uuid.uuid4().hex}'
    extract_dir.mkdir()

    try:
        if zipfile.is_zipfile(tmp_file):
            with zipfile.ZipFile(tmp_file, 'r') as zf:
                zf.extractall(extract_dir)
        elif tarfile.is_tarfile(tmp_file):
            with tarfile.open(tmp_file, 'r:*') as tf:
                tf.extractall(extract_dir)
        else:
            # 不支持的压缩包类型
            return None
    except Exception:
        return None

    # === 3. 校验内容 ===
    md_files = []
    other_files = []

    file_name = None
    for root, dirs, files in os.walk(extract_dir):
        for name in files:
            p = Path(root) / name
            suffix = p.suffix.lower()
            if suffix == '.md':
                md_files.append(p)
                file_name = name
            elif suffix in {'.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp'}:
                continue  # 图片可以
            else:
                other_files.append(p)

    if len(md_files) != 1 or len(other_files) > 0:
        # 压缩包内容不符合要求（至少一个md，其它必须全是图片）
        return None

    # === 4. 复制到 static/mkdoc/<uuid> ===
    target_uuid = uuid.uuid4().hex
    mkdoc_root = Path(settings.BASE_DIR) / 'static' / 'mkdocs' / target_uuid
    mkdoc_root.mkdir(parents=True, exist_ok=True)

    # 将整个解压内容复制过去（保留目录结构）
    for item in extract_dir.iterdir():
        dest = mkdoc_root / item.name
        if item.is_dir():
            shutil.copytree(item, dest, dirs_exist_ok=True)
        else:
            shutil.copy2(item, dest)

    # === 5. 清理临时文件 ===
    try:
        shutil.rmtree(extract_dir)
        tmp_file.unlink(missing_ok=True)
    except Exception:
        pass

    # === 6. 返回 uuid ===
    return f"{target_uuid}/{file_name}"
