import re

path = 'c:/Users/Ajinkya/Desktop/projects/PBL/frontend/src/services/api.ts'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

new_admin_endpoints = """
  // New Admin Endpoints
  listAuditLogs: (limit: number = 50) => request<any[]>(`/admin/audit-logs?limit=${limit}`),
  listParentLinks: () => request<any[]>('/admin/parent-links'),
  createParentLink: (parentId: number, studentId: number) => request<any>('/admin/parent-links', {
    method: 'POST',
    body: JSON.stringify({ parent_id: parentId, student_id: studentId })
  }),
  deleteParentLink: (linkId: number) => request<{status: string}>(`/admin/parent-links/${linkId}`, {
    method: 'DELETE'
  }),
  listAdminComplaints: (status?: string, priority?: string) => {
    const sp = new URLSearchParams();
    if (status) sp.append('status', status);
    if (priority) sp.append('priority', priority);
    const q = sp.toString() ? `?${sp.toString()}` : '';
    return request<any[]>(`/admin/complaints${q}`);
  },
  importStudents: (csvFile: File) => {
    const formData = new FormData();
    formData.append('file', csvFile);
    
    // We must use fetch directly to avoid setting Content-Type to JSON
    const token = localStorage.getItem('token');
    return fetch('/api/admin/students/import', {
      method: 'POST',
      headers: {
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
      },
      body: formData
    }).then(async res => {
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.detail || 'Import failed');
      }
      return res.json();
    });
  },
"""

content = re.sub(r'(getAdminStats:\s*\(\)\s*=>\s*request<AdminStats>\(\'/admin/stats\'\),)', r'\1' + new_admin_endpoints, content)

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)
print("Updated api.ts")
