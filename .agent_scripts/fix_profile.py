import re

path = 'c:/Users/Ajinkya/Desktop/projects/PBL/frontend/src/pages/ProfilePage.tsx'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

# Fix imports
content = re.sub(r'import\s+\{\s*api\s*\}\s+from\s+[\'"]../services/api[\'"];\s*import\s+\{\s*ParentLinkCodeResponse', "import { ParentLinkCodeResponse", content)
content = re.sub(r'import\s+\{\s*api\s*\}\s+from\s+[\'"]../services/api[\'"];\s*import\s+\{\s*api\s*\}\s+from\s+[\'"]../services/api[\'"];', "import { api } from '../services/api';", content)

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)
