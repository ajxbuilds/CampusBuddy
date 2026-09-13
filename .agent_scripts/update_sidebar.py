import re
import os

path = 'c:/Users/Ajinkya/Desktop/projects/PBL/frontend/src/components/layout/Sidebar.tsx'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

# Replace lucide imports
lucide_import_pattern = r"import\s+\{.*?\}\s+from\s+'lucide-react';"
new_lucide_imports = "import {\n  LayoutDashboard, MessageSquare, Bot, Trophy, HelpCircle, User, Users,\n  LogOut, ChevronLeft, ChevronRight, GraduationCap, X, Shield, FileText, AlertTriangle, Settings, Upload, Flag, Link as LinkIcon\n} from 'lucide-react';"
content = re.sub(lucide_import_pattern, new_lucide_imports, content, flags=re.DOTALL)

# Replace ADMIN case
admin_case_pattern = r"case 'ADMIN':\s*return\s*\[(.*?)\];"
new_admin_case = """case 'ADMIN':
        return [
          {
            title: 'Overview',
            items: [{ label: 'Dashboard', path: '/admin', icon: LayoutDashboard }]
          },
          {
            title: 'Management',
            items: [
              { label: 'Users', path: '/admin/users', icon: Users },
              { label: 'Parent Links', path: '/admin/parent-links', icon: LinkIcon }
            ]
          },
          {
            title: 'Community',
            items: [
              { label: 'Questions', path: '/admin/community', icon: MessageSquare },
              { label: 'Reports', path: '/admin/reports', icon: Flag }
            ]
          },
          {
            title: 'Complaints',
            items: [
              { label: 'All Complaints', path: '/admin/complaints', icon: HelpCircle },
              { label: 'Escalations', path: '/admin/escalations', icon: AlertTriangle }
            ]
          },
          {
            title: 'Engagement',
            items: [
              { label: 'Contributions', path: '/admin/contributions', icon: Trophy }
            ]
          },
          {
            title: 'System',
            items: [
              { label: 'Settings & Cats', path: '/admin/system', icon: Settings },
              { label: 'Bulk Import', path: '/admin/import', icon: Upload }
            ]
          },
          {
            title: 'Security',
            items: [
              { label: 'Audit Logs', path: '/admin/audit-logs', icon: Shield }
            ]
          }
        ];"""
content = re.sub(admin_case_pattern, new_admin_case, content, flags=re.DOTALL)

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)
print("Updated Sidebar.tsx")
