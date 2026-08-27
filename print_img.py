from PIL import Image
import sys
import glob

files = glob.glob("/var/folders/bh/wlq5vd7s2sz5mqjdrxst8p6h0000gn/T/TemporaryItems/NSIRD_screencaptureui_gw2PI8/*.png")
if not files:
    print("No image found!")
    sys.exit(1)

img = Image.open(files[0]).convert('L')
img = img.resize((40, 20), Image.Resampling.LANCZOS)
for y in range(20):
    line = ""
    for x in range(40):
        pixel = img.getpixel((x, y))
        line += "██" if pixel < 128 else "  "
    print(line)
