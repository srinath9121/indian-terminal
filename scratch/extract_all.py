import zipfile
import xml.etree.ElementTree as ET
import os
import sys

# Set encoding for output
sys.stdout.reconfigure(encoding='utf-8')

def get_docx_text(path):
    try:
        document = zipfile.ZipFile(path)
        xml_content = document.read('word/document.xml')
        document.close()
        tree = ET.XML(xml_content)
        WORD_NAMESPACE = '{http://schemas.openxmlformats.org/wordprocessingml/2006/main}'
        PARA = WORD_NAMESPACE + 'p'
        TEXT = WORD_NAMESPACE + 't'
        paragraphs = []
        for paragraph in tree.iter(PARA):
            texts = [node.text for node in paragraph.iter(TEXT) if node.text]
            if texts:
                paragraphs.append(''.join(texts))
            else:
                paragraphs.append('')
        return '\n'.join(paragraphs)
    except Exception as e:
        return str(e)

for filename in os.listdir('.'):
    if filename.endswith('.docx'):
        print(f"=== {filename} ===")
        print(get_docx_text(filename))
        print("\n" + "="*50 + "\n")
