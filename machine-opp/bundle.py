#!/usr/bin/env python3
"""
Bundle script for machine-opp ERP system.
Reads all JS files and CSS from the machine-opp directory and bundles them into a single index.html.
"""

import os
import re
from pathlib import Path


def read_file_content(filepath):
    """Read content from a file."""
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            return f.read()
    except Exception as e:
        print(f"Error reading {filepath}: {e}")
        return ""


def extract_js_files(html_content):
    """Extract the order of JS files from the HTML script tags."""
    js_files = []
    pattern = r'<script\s+src="js/([^"]+)"></script>'
    matches = re.findall(pattern, html_content)
    return matches


def bundle_js_files(js_files, js_dir):
    """Bundle all JS files in the correct order."""
    bundled_js = []
    for js_file in js_files:
        filepath = os.path.join(js_dir, js_file)
        content = read_file_content(filepath)
        if content:
            bundled_js.append(f"\n// ============ {js_file} ============\n")
            bundled_js.append(content)
    return "\n".join(bundled_js)


def bundle_css(css_file):
    """Read and bundle CSS content."""
    content = read_file_content(css_file)
    return content


def create_bundled_html(original_html, js_dir, css_dir, output_path):
    """Create the bundled HTML file."""
    # Extract JS file order from original HTML
    js_files = extract_js_files(original_html)
    
    # Bundle JS files
    bundled_js = bundle_js_files(js_files, js_dir)
    
    # Bundle CSS
    css_file = os.path.join(css_dir, 'styles.css')
    bundled_css = bundle_css(css_file)
    
    # Create new HTML with bundled content
    # Remove existing script and link tags
    html_lines = original_html.split('\n')
    new_html_lines = []
    skip_next = False
    
    for i, line in enumerate(html_lines):
        # Skip script tags with js/ src
        if re.match(r'\s*<script\s+src="js/', line):
            continue
        # Skip CSS link tag
        if re.match(r'\s*<link\s+rel="stylesheet"\s+href="css/', line):
            continue
        new_html_lines.append(line)
    
    new_html = '\n'.join(new_html_lines)
    
    # Insert bundled CSS before </head>
    css_block = f'\n    <style>\n{bundled_css}\n    </style>'
    new_html = new_html.replace('</head>', css_block + '\n</head>')
    
    # Insert bundled JS before </body>
    js_block = f'\n    <script>\n{bundled_js}\n    </script>'
    new_html = new_html.replace('</body>', js_block + '\n</body>')
    
    # Write to output file
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    with open(output_path, 'w', encoding='utf-8') as f:
        f.write(new_html)
    
    print(f"Bundled HTML created at: {output_path}")
    print(f"Bundled {len(js_files)} JS files and 1 CSS file")


def main():
    # Define paths
    base_dir = Path(__file__).parent
    index_html = base_dir / 'index.html'
    js_dir = base_dir / 'js'
    css_dir = base_dir / 'css'
    output_path = base_dir / 'build' / 'index.html'
    
    # Read original HTML
    original_html = read_file_content(index_html)
    if not original_html:
        print("Error: Could not read index.html")
        return
    
    # Create bundled HTML
    create_bundled_html(original_html, js_dir, css_dir, output_path)


if __name__ == '__main__':
    main()
