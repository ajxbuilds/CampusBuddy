import re

path = 'c:/Users/Ajinkya/Desktop/projects/PBL/frontend/src/services/api.ts'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

content = re.sub(r"\n\s*listAuditLogs:\s*\(\)\s*=>\s*request<AuditLog\[\]>\('/admin/audit-logs'\),", "", content)

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)
