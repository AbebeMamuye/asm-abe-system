import urllib.request
import xml.etree.ElementTree as ET

url = 'https://www.youtube.com/api/timedtext?v=tcxNmU01eP0&caps=asr&opi=112496729&exp=xpe&xoaf=5&xowf=1&xospf=1&hl=en&ip=0.0.0.0&ipbits=0&expire=1793205875&sparams=ip,ipbits,expire,v,ei,caps,opi,exp,xoaf&signature=29BACCBEEDD23D96DD16B252981E475716C14218.651130D65E2775A157944D41907E692D08C5B69F&key=yt8&kind=asr&lang=am'
req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
try:
    xml_data = urllib.request.urlopen(req).read().decode('utf-8')
    root = ET.fromstring(xml_data)
    lines = []
    for text_el in root.findall('text'):
        start = text_el.attrib.get('start', '0')
        content = text_el.text or ''
        lines.append(f"[{float(start):0.1f}s] {content}")
    with open('scratch/transcript.txt', 'w', encoding='utf-8') as f:
        f.write("\n".join(lines))
    print(f"Saved {len(lines)} lines of transcript.")
    for l in lines[:30]:
        print(l)
except Exception as e:
    print("Error:", e)
