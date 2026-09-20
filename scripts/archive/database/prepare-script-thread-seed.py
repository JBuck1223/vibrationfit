"""Extract complete drafts from the retrieved conversation without rewriting source text."""
import json
import re
import uuid
from pathlib import Path

root = Path(__file__).resolve().parents[3]
data = json.loads((root / 'tmp/script-studio-source-thread.json').read_text())
messages = {}
for turn in data['turns']:
    for item in turn['items']:
        messages[item['id']] = item.get('text') or '\n'.join(c.get('text', '') for c in item.get('content', []))

def between(message, start, end=None):
    text = messages[message]
    begin = text.index(start) + len(start)
    stop = text.index(end, begin) if end else len(text)
    return text[begin:stop].strip()

def document(message):
    return re.search(r':::writing\{[^\n]+\}\n([\s\S]*?)\n:::', messages[message]).group(1).strip()

intro = [
    ('Jordan original', 'ff371c46-b2cd-41b8-a62f-6f5131357965', between('ff371c46-b2cd-41b8-a62f-6f5131357965', 'Working on a script for the website:\n\n', '\n\nIt’s for inside the platform')),
    ('Business draft — post-purchase welcome', 'ff371c46-b2cd-41b8-a62f-6f5131357965', between('ff371c46-b2cd-41b8-a62f-6f5131357965', '## Revised In-Platform Welcome Script\n\n', '\n\n### Button')),
    ('Personal rewrite — preserve the mechanism', '6d37caae-4c4c-469d-b580-b759f7296260', document('6d37caae-4c4c-469d-b580-b759f7296260')),
    ('Business draft — shared free and paid introduction', 'a208b3a2-a168-49f1-ab55-e9c61d8b13d2', between('a208b3a2-a168-49f1-ab55-e9c61d8b13d2', '## Revised Video Script\n\n', '\n\n### Button')),
    ('Personal rewrite — Free Activation and member video', '26586260-c743-43a9-b793-c58eb423fb73', document('26586260-c743-43a9-b793-c58eb423fb73')),
]
membership = [
    ('Business draft — membership invitation', '34b91023-a26e-48bb-9123-f5f9967df67c', between('34b91023-a26e-48bb-9123-f5f9967df67c', '## Membership Video Script\n\n', '\n\n### Button')),
    ('Personal rewrite — Conscious Creation cycle', '73e3bad5-a7f4-47a1-8cf9-8d8ff7c9d4b1', document('73e3bad5-a7f4-47a1-8cf9-8d8ff7c9d4b1')),
    ('Personal rewrite — correct categories and system', '48553b0f-15e8-4e8b-8e02-14fb9686d5e8', document('48553b0f-15e8-4e8b-8e02-14fb9686d5e8')),
    ('Business draft — tightened invitation', '69da970b-1e19-45e5-bda7-ff6593cd2ff4', between('69da970b-1e19-45e5-bda7-ff6593cd2ff4', '## Tightened Script\n\n', '\n\n### Button')),
    ('Personal rewrite — Choose, Activate, Align', 'd5754d52-a35e-43a6-a1b5-f3fbd39b45a8', document('d5754d52-a35e-43a6-a1b5-f3fbd39b45a8')),
    ('Business draft — final polish', '8f42c766-71a2-4770-b09d-81361f6c00e3', between('8f42c766-71a2-4770-b09d-81361f6c00e3', '## Final Polished Script\n\n')),
    ('Personal rewrite — restored Manifestations and membership', 'af38dc43-d2d5-4317-9c4d-c2910a227d88', document('af38dc43-d2d5-4317-9c4d-c2910a227d88')),
    ('Final — comprehensive and congruent, membership line preserved', '316c84f6-e880-45f9-b3a8-913b5a2d255b', document('316c84f6-e880-45f9-b3a8-913b5a2d255b')),
]

# Locate paragraph boundaries. Section titles are metadata; script text is untouched.
def segment(text, family):
    paragraphs = text.split('\n\n')
    if family == 'intro':
        rules = [
            ('vibrational-grammar', 'Vibrational Grammar', ['The magic of the life vision', '### The Magic Is in the Language', "And here's where something really important"]),
            ('meet-viva', 'Meet VIVA', ['That’s why we created VIVA', '### Meet VIVA', "That's why we created VIVA", 'You’ll begin by sharing', 'You’ll begin by talking']),
            ('invitation', 'Your invitation to begin', ['Talk with VIVA life', 'So don\'t try', 'Take your time.', 'Think of this as the first step']),
        ]
    else:
        rules = [
            ('choose', 'Choose', ['First, you']),
            ('activate', 'Activate', ['Then, you']),
            ('align', 'Align and work through wobbles', ['Then, you **align**', 'Then, you **ALIGN**', 'And then you **ALIGN**', 'And then something really important happens.', 'As you activate, old thought']),
            ('tools', 'Personal tools and Manifestations', ['And the more you use', "She can turn", 'VIVA can transform', 'Over time, those conversations']),
            ('evolution', 'Clarity and vision versions', ["But there's another part", "But here's one of our favorite", 'And your Life Vision is allowed']),
            ('membership', 'Membership and community', ["And you don't have to do it alone.", "And inside Vibration Fit, you don't", 'Inside Vibration Fit, you do not', 'Inside the membership, you’ll receive:']),
            ('closing', 'Closing invitation', ['Because there will always', 'There will always', 'If you’re ready to create']),
        ]
    boundaries = {0: ('opening', 'Opening and choice' if family == 'intro' else 'Opening and whole-life vision')}
    for section_id, title, starts in rules:
        for index, paragraph in enumerate(paragraphs):
            if any(paragraph.startswith(start) for start in starts):
                # Then, you can mark Align too; Activate must actually mention activate.
                if section_id == 'activate' and 'activate' not in paragraph.lower():
                    continue
                boundaries[index] = (section_id, title)
                break
    indices = sorted(boundaries)
    sections = []
    for number, start in enumerate(indices):
        stop = indices[number + 1] if number + 1 < len(indices) else len(paragraphs)
        section_id, title = boundaries[start]
        sections.append({'id': section_id, 'title': title, 'content': '\n\n'.join(paragraphs[start:stop]), 'locked': False})
    assert '\n\n'.join(section['content'] for section in sections) == text
    assert len({section['id'] for section in sections}) == len(sections)
    return sections

output = []
for title, family, versions in [('Before You Create Your Life Vision', 'intro', intro), ('Now Imagine Your Whole Life', 'membership', membership)]:
    package = {'request_id': str(uuid.uuid5(uuid.NAMESPACE_URL, f"{data['thread']['id']}/{family}/full-drafts-v1")), 'title': title, 'versions': []}
    for label, message_id, content in versions:
        assert content in messages[message_id], f'Script not exact in source: {label}'
        package['versions'].append({'label': label, 'content': content, 'sections': segment(content, family), 'source': 'personal'})
    output.append(package)
(root / 'tmp/script-studio-seed-packages.json').write_text(json.dumps(output, ensure_ascii=False, indent=2))
print(json.dumps([{'title': item['title'], 'versions': len(item['versions']), 'section_counts': [len(v['sections']) for v in item['versions']]} for item in output], indent=2))
