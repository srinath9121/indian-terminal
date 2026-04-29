Add-Type -AssemblyName System.IO.Compression.FileSystem
$zip = [System.IO.Compression.ZipFile]::OpenRead("c:\Users\Srikanth\Downloads\india_macro_terminal\india_macro_terminal\pulse_redesign_prompts (1).docx")
$entry = $zip.Entries | Where-Object { $_.FullName -eq "word/document.xml" }
$stream = $entry.Open()
$reader = New-Object System.IO.StreamReader($stream)
$xml = $reader.ReadToEnd()
$text = $xml -replace '<[^>]+>', ' ' -replace '\s+', ' '
$text
