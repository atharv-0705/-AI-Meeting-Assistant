import os

def filter_youtube_cookies(input_file: str, output_file: str):
    if not os.path.exists(input_file):
        print(f"Error: {input_file} not found.")
        return

    with open(input_file, "r", encoding="utf-8") as f:
        lines = f.readlines()

    filtered_lines = []
    for line in lines:
        # Keep comments, empty lines (headers), and lines containing youtube.com or google.com
        if line.startswith("#") or not line.strip() or "youtube.com" in line or "google.com" in line:
            filtered_lines.append(line)

    with open(output_file, "w", encoding="utf-8") as f:
        f.writelines(filtered_lines)

    original_size = os.path.getsize(input_file)
    new_size = os.path.getsize(output_file)
    
    print(f"Success! Filtered cookies saved to {output_file}")
    print(f"Original size: {original_size / 1024:.2f} KB")
    print(f"New size: {new_size / 1024:.2f} KB")

if __name__ == "__main__":
    filter_youtube_cookies("youtube.com_cookies.txt", "filtered_cookies.txt")
