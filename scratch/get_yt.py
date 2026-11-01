import urllib.request
import json
import re

url = 'https://www.youtube.com/watch?v=tcxNmU01eP0'
req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'})
try:
    html = urllib.request.urlopen(req).read().decode('utf-8', errors='ignore')
    match = re.search(r'"captionTracks":\[(.*?)\]', html)
    if match:
        tracks = json.loads('[' + match.group(1) + ']')
        for t in tracks:
            print("Track:", t.get('name', {}).get('simpleText'), t.get('baseUrl'))
    
    desc_match = re.search(r'"shortDescription":"(.*?)"', html)
    if desc_match:
        print("Description:", desc_match.group(1).encode('utf-8').decode('unicode_escape')[:1000])

    # Find video title and any other details
    title_match = re.search(r'"title":"(.*?)"', html)
    if title_match:
        print("Title:", title_match.group(1))

except Exception as e:
    print('Error:', e)
