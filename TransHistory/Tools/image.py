# AI prompt
# 用python PIL，os，random 做一个不规则图片拼接的效果，目标图片是1920×1080像素的web大小。
# 思路按照这样：
# 首先创建目标尺寸的空白画布，然后在min=300到max=500像素尺寸内随机生成一个矩形
# 然后将从给定图片集中随机选取一个填入矩形中，要求填满矩形
# 然后把这个矩形随机填入画布中，控制插入图片n=50次
# 将图片进行黑白处理
# 不要改变图片比例，而是用矩形的比例在图片中截取
# 不要随机形状
# 不要随机旋转

from PIL import Image
import os
import random
import math

def create_collage_with_crop(image_folder, output_path, n=50, target_size=(1920, 1080), 
                           black_white=True, bw_variation=True):
    """
    创建图片拼接效果 - 保持原始比例，按矩形比例截取
    
    参数:
    image_folder: 图片文件夹路径
    output_path: 输出图片路径
    n: 插入图片次数
    target_size: 目标画布尺寸 (宽, 高)
    black_white: 是否转换为黑白效果
    bw_variation: 是否添加黑白变化（不同灰度层次）
    """
    
    # 检查图片文件夹是否存在
    if not os.path.exists(image_folder):
        print(f"错误：图片文件夹 '{image_folder}' 不存在")
        return
    
    # 获取所有图片文件
    image_extensions = ('.jpg', '.jpeg', '.png', '.bmp', '.gif', '.tiff')
    image_files = [f for f in os.listdir(image_folder) 
                  if f.lower().endswith(image_extensions)]
    
    if not image_files:
        print("错误：文件夹中没有找到图片文件")
        return
    
    # 创建空白画布
    if black_white:
        canvas = Image.new('L', target_size, 255)  # 灰度模式
    else:
        canvas = Image.new('RGB', target_size, (255, 255, 255))
    
    for i in range(n):
        try:
            # 随机选择一张图片
            img_name = random.choice(image_files)
            img_path = os.path.join(image_folder, img_name)
            
            # 打开并处理图片
            with Image.open(img_path) as img:
                # 转换为RGB模式（避免RGBA问题）
                if img.mode != 'RGB':
                    img = img.convert('RGB')
                
                # 随机生成矩形尺寸 (300-500像素)
                rect_width = random.randint(300, 500)
                rect_height = random.randint(300, 500)
                
                # 从图片中按矩形比例截取一部分
                cropped_img = crop_image_to_ratio(img, rect_width, rect_height)
                
                # 调整到目标尺寸
                processed_img = cropped_img.resize((rect_width, rect_height), Image.Resampling.LANCZOS)
                
                # 应用黑白效果
                if black_white:
                    processed_img = apply_black_white(processed_img, bw_variation)
                    # 确保是灰度模式
                    if processed_img.mode != 'L':
                        processed_img = processed_img.convert('L')
                
                # 随机生成位置（确保在画布内）
                max_x = target_size[0] - rect_width
                max_y = target_size[1] - rect_height
                
                if max_x > 0 and max_y > 0:
                    pos_x = random.randint(0, max_x)
                    pos_y = random.randint(0, max_y)
                    
                    # 将图片粘贴到画布上
                    canvas.paste(processed_img, (pos_x, pos_y))
                
                print(f"已处理第 {i+1}/{n} 张图片: {img_name}")
                
        except Exception as e:
            print(f"处理图片 {img_name} 时出错: {str(e)}")
            continue
    
    # 保存结果
    if black_white:
        canvas.save(output_path, quality=95)
    else:
        canvas.save(output_path, quality=95)
    
    print(f"拼接完成！结果已保存至: {output_path}")
    canvas.show()

def crop_image_to_ratio(img, target_width, target_height):
    """
    从图片中按目标宽高比截取一部分，保持原始比例
    
    参数:
    img: 原始图片
    target_width: 目标宽度
    target_height: 目标高度
    
    返回: 截取后的图片
    """
    img_width, img_height = img.size
    target_ratio = target_width / target_height
    img_ratio = img_width / img_height
    
    # 计算截取区域
    if img_ratio > target_ratio:
        # 图片比目标更宽，需要裁剪宽度
        crop_width = int(img_height * target_ratio)
        crop_height = img_height
        left = random.randint(0, img_width - crop_width)
        top = 0
    else:
        # 图片比目标更高，需要裁剪高度
        crop_width = img_width
        crop_height = int(img_width / target_ratio)
        left = 0
        top = random.randint(0, img_height - crop_height)
    
    # 从随机位置截取
    return img.crop((left, top, left + crop_width, top + crop_height))

def apply_black_white(img, variation=True):
    """
    将图片转换为黑白效果
    
    参数:
    img: 原始图片
    variation: 是否添加灰度变化
    
    返回: 黑白处理后的图片
    """
    # 转换为灰度图
    bw_img = img.convert('L')
    
    if variation:
        # 随机选择一种黑白效果
        effect_type = random.choice(['standard', 'high_contrast', 'low_contrast', 
                                   'vintage', 'high_key', 'low_key'])
        
        if effect_type == 'high_contrast':
            # 高对比度
            from PIL import ImageEnhance
            enhancer = ImageEnhance.Contrast(bw_img)
            bw_img = enhancer.enhance(2.0)
            
        elif effect_type == 'low_contrast':
            # 低对比度
            from PIL import ImageEnhance
            enhancer = ImageEnhance.Contrast(bw_img)
            bw_img = enhancer.enhance(0.7)
            
        elif effect_type == 'vintage':
            # 复古效果 - 添加噪点
            bw_img = add_noise(bw_img, intensity=10)
            
        elif effect_type == 'high_key':
            # 高调效果（明亮）
            from PIL import ImageEnhance
            enhancer = ImageEnhance.Brightness(bw_img)
            bw_img = enhancer.enhance(1.3)
            
        elif effect_type == 'low_key':
            # 低调效果（暗调）
            from PIL import ImageEnhance
            enhancer = ImageEnhance.Brightness(bw_img)
            bw_img = enhancer.enhance(0.7)
    
    return bw_img

def add_noise(img, intensity=5):
    """
    为图片添加噪点效果
    
    参数:
    img: 灰度图片
    intensity: 噪点强度
    
    返回: 添加噪点后的图片
    """
    width, height = img.size
    noisy_img = img.copy()
    
    # 随机添加噪点
    for _ in range(int(width * height * intensity // 1000)):
        x = random.randint(0, width - 1)
        y = random.randint(0, height - 1)
        
        # 随机改变像素值
        current_pixel = img.getpixel((x, y))
        change = random.randint(-intensity * 10, intensity * 10)
        new_pixel = max(0, min(255, current_pixel + change))
        noisy_img.putpixel((x, y), new_pixel)
    
    return noisy_img

def create_simple_collage_with_crop(image_folder, output_path, n=50, target_size=(1920, 1080), 
                                  black_white=True, bw_variation=True):
    """
    简化版本 - 仅使用矩形拼接（支持黑白处理和按比例截取）
    """
    if not os.path.exists(image_folder):
        print(f"错误：图片文件夹 '{image_folder}' 不存在")
        return
    
    image_extensions = ('.jpg', '.jpeg', '.png', '.bmp', '.gif', '.tiff')
    image_files = [f for f in os.listdir(image_folder) 
                  if f.lower().endswith(image_extensions)]
    
    if not image_files:
        print("错误：文件夹中没有找到图片文件")
        return
    
    # 创建画布
    if black_white:
        canvas = Image.new('L', target_size, 255)
    else:
        canvas = Image.new('RGB', target_size, (255, 255, 255))
    
    for i in range(n):
        try:
            img_name = random.choice(image_files)
            img_path = os.path.join(image_folder, img_name)
            
            with Image.open(img_path) as img:
                if img.mode != 'RGB':
                    img = img.convert('RGB')
                
                rect_width = random.randint(300, 500)
                rect_height = random.randint(300, 500)
                
                # 从图片中按矩形比例截取一部分
                cropped_img = crop_image_to_ratio(img, rect_width, rect_height)
                
                # 调整到目标尺寸
                img_resized = cropped_img.resize((rect_width, rect_height), Image.Resampling.LANCZOS)
                
                # 应用黑白效果
                if black_white:
                    img_resized = apply_black_white(img_resized, bw_variation)
                    # 确保是灰度模式
                    if img_resized.mode != 'L':
                        img_resized = img_resized.convert('L')
                
                max_x = target_size[0] - rect_width
                max_y = target_size[1] - rect_height
                
                if max_x > 0 and max_y > 0:
                    pos_x = random.randint(0, max_x)
                    pos_y = random.randint(0, max_y)
                    
                    canvas.paste(img_resized, (pos_x, pos_y))
                
                print(f"已处理第 {i+1}/{n} 张图片: {img_name}")
                
        except Exception as e:
            print(f"处理图片 {img_name} 时出错: {str(e)}")
            continue
    
    # 保存结果
    if black_white:
        canvas.save(output_path, quality=95)
    else:
        canvas.save(output_path, quality=95)
    
    print(f"拼接完成！结果已保存至: {output_path}")
    canvas.show()

# 使用示例
if __name__ == "__main__":
    # 设置参数
    IMAGE_FOLDER = (
        r"TransHistoria\static\asserts\images\index"  # 替换为你的图片文件夹路径
    )
    OUTPUT_PATH = r"TransHistoria\static\asserts\images\index_backgroung.jpg"

    # 创建黑白拼接（按比例截取）
    create_collage_with_crop(
        IMAGE_FOLDER, 
        OUTPUT_PATH, 
        n=50,
        black_white=True,      # 启用黑白效果
        bw_variation=True      # 启用黑白变化
    )
    
    # 或者创建彩色拼接
    # create_collage_with_crop(IMAGE_FOLDER, "color_" + OUTPUT_PATH, n=50, black_white=False)
    
    # 或者使用简化版本
    # create_simple_collage_with_crop(IMAGE_FOLDER, "simple_" + OUTPUT_PATH, n=50, black_white=True)
