import re

path = 'c:/Users/Ajinkya/Desktop/projects/PBL/frontend/src/App.tsx'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

# Insert imports
import_str = """
import { 
  AdminUsersPage, AdminParentLinksPage, AdminComplaintsPage, AdminEscalationsPage, 
  AdminCommunityPage, AdminReportsPage, AdminContributionsPage, AdminSystemPage, 
  AdminImportPage, AdminAuditLogsPage 
} from './pages/admin/AdminPages';
"""
content = re.sub(r"(import \{ AdminDashboard \} from './pages/AdminDashboard';)", r"\1" + import_str, content)

# Insert routes
routes_str = """
          <Route path="/admin" element={<AuthenticatedLayout allowedRoles={['ADMIN']}><AdminDashboard /></AuthenticatedLayout>} />
          <Route path="/admin/users" element={<AuthenticatedLayout allowedRoles={['ADMIN']}><AdminUsersPage /></AuthenticatedLayout>} />
          <Route path="/admin/parent-links" element={<AuthenticatedLayout allowedRoles={['ADMIN']}><AdminParentLinksPage /></AuthenticatedLayout>} />
          <Route path="/admin/community" element={<AuthenticatedLayout allowedRoles={['ADMIN']}><AdminCommunityPage /></AuthenticatedLayout>} />
          <Route path="/admin/reports" element={<AuthenticatedLayout allowedRoles={['ADMIN']}><AdminReportsPage /></AuthenticatedLayout>} />
          <Route path="/admin/complaints" element={<AuthenticatedLayout allowedRoles={['ADMIN']}><AdminComplaintsPage /></AuthenticatedLayout>} />
          <Route path="/admin/escalations" element={<AuthenticatedLayout allowedRoles={['ADMIN']}><AdminEscalationsPage /></AuthenticatedLayout>} />
          <Route path="/admin/contributions" element={<AuthenticatedLayout allowedRoles={['ADMIN']}><AdminContributionsPage /></AuthenticatedLayout>} />
          <Route path="/admin/system" element={<AuthenticatedLayout allowedRoles={['ADMIN']}><AdminSystemPage /></AuthenticatedLayout>} />
          <Route path="/admin/import" element={<AuthenticatedLayout allowedRoles={['ADMIN']}><AdminImportPage /></AuthenticatedLayout>} />
          <Route path="/admin/audit-logs" element={<AuthenticatedLayout allowedRoles={['ADMIN']}><AdminAuditLogsPage /></AuthenticatedLayout>} />
"""
content = re.sub(r'<Route path="/admin" element=\{<AuthenticatedLayout allowedRoles=\{\[\'ADMIN\'\]\}><AdminDashboard /></AuthenticatedLayout>\} />', routes_str, content)

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)
print("Updated App.tsx")
