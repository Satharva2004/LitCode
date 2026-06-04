import os
from PIL import Image

def pad_png(file_path):
    try:
        img = Image.open(file_path).convert("RGBA")
        width, height = img.size
        
        # Scale down by 15% (leaving 15% padding overall, i.e., scale is 85%)
        scale_factor = 0.82
        new_w = int(width * scale_factor)
        new_h = int(height * scale_factor)
        
        # Resize original image using high-quality resampling
        img_resized = img.resize((new_w, new_h), Image.Resampling.LANCZOS)
        
        # Create a new transparent canvas
        new_img = Image.new("RGBA", (width, height), (0, 0, 0, 0))
        
        # Calculate paste position to center the resized image
        offset_x = (width - new_w) // 2
        offset_y = (height - new_h) // 2
        
        new_img.paste(img_resized, (offset_x, offset_y), img_resized)
        
        # Save back
        new_img.save(file_path, "PNG")
        print(f"Successfully padded: {file_path} ({width}x{height})")
    except Exception as e:
        print(f"Error padding {file_path}: {e}")

# Apply to public and build directories
target_dirs = [
    os.path.join(".", "public"),
    os.path.join(".", "build")
]

files_to_pad = ["logo.png", "logo 2.png", "logo-128.png", "logo-48.png", "logo-16.png"]

for directory in target_dirs:
    if os.path.exists(directory):
        for filename in files_to_pad:
            file_path = os.path.join(directory, filename)
            if os.path.exists(file_path):
                pad_png(file_path)
