import sys
from PIL import Image

def get_braille_char(pixels):
    # Braille dot mapping (width=2, height=4)
    # 1 4
    # 2 5
    # 3 6
    # 7 8
    dots = [
        (0, 0), (0, 1), (0, 2), (0, 3),
        (1, 0), (1, 1), (1, 2), (1, 3)
    ]
    # The Unicode braille offset is 0x2800
    # The dot values are 1, 2, 4, 64 for left column
    # and 8, 16, 32, 128 for right column
    dot_values = [1, 2, 4, 64, 8, 16, 32, 128]
    
    val = 0x2800
    for i, (x, y) in enumerate(dots):
        if pixels[y][x]:
            val += dot_values[i]
    return chr(val)

def img_to_braille(img_path, width, height):
    img = Image.open(img_path).convert('L')
    
    # Invert so black is foreground (True) and white is background (False)
    # The logo is black on white.
    # Actually, we will threshold it: pixel < 128 means it's black (so True)
    
    # Calculate target dimensions in terms of braille characters
    # Each character is 2 pixels wide and 4 pixels high
    px_w = width * 2
    px_h = height * 4
    
    img = img.resize((px_w, px_h), Image.Resampling.LANCZOS)
    
    lines = []
    for cy in range(height):
        line = ""
        for cx in range(width):
            # Extract 2x4 patch
            patch = []
            for y in range(4):
                row = []
                for x in range(2):
                    pixel_val = img.getpixel((cx * 2 + x, cy * 4 + y))
                    row.append(pixel_val < 128)
                patch.append(row)
            line += get_braille_char(patch)
        lines.append(line)
    return "\n".join(lines)

if __name__ == "__main__":
    path = sys.argv[1]
    print("--- 5 LINES ---")
    print(img_to_braille(path, 15, 5))
    print("--- 7 LINES ---")
    print(img_to_braille(path, 18, 7))
    print("--- 9 LINES ---")
    print(img_to_braille(path, 21, 9))
