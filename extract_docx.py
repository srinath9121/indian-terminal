import zipfile
import xml.etree.ElementTree as ET
import sys

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

with open('doc_contents.txt', 'w', encoding='utf-8') as f:
    f.write('=== India_Macro_Terminal_Build_Guide.docx ===\n')
    f.write(get_docx_text(r'c:\Users\Srikanth\Downloads\india_macro_terminal\india_macro_terminal\India_Macro_Terminal_Build_Guide.docx'))
    f.write('\n\n=== india_macro_terminal_FULL.docx ===\n')
    f.write(get_docx_text(r'c:\Users\Srikanth\Downloads\india_macro_terminal\india_macro_terminal\india_macro_terminal_FULL.docx'))

print("Done extracting text.")
