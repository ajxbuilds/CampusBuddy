import { StudyBuddyProfile, StudyBuddyProfileCreate, StudyBuddyDiscover, StudyBuddyRequest, StudyBuddyConnection,
  AuthResponse,
  User,
  Complaint,
  ComplaintCategory,
  ComplaintEscalation,
  CommunityPost,
  CommunityAnswer,
  CommunityReply,
  Badge,
  UserBadge,
  PointTransaction,
  GamificationSummary,
  LeaderboardResponse,
  AppNotification,
  AdminStats,
  CategoryDistribution,
  ComplaintsTrendPoint,
  AuditLog,
  ReportResponse,
  AIChatMessage,
  AIChatResponse,
  UserRole,
} from '../types';


export const API_BASE = 'http://localhost:8000/api';

function getToken(): string | null {
  return sessionStorage.getItem('cb_token');
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string>),
  };

  if (!(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    if (response.status === 503) window.dispatchEvent(new Event('maintenance-mode-active'));
    let errorDetail = 'Request failed';
    try {
      const err = await response.json();
      errorDetail = err.detail || err.message || errorDetail;
    } catch {
      errorDetail = response.statusText;
    }
    throw new Error(errorDetail);
  }

  if (response.status === 204) {
    return {} as T;
  }
  if (response.status === 204) {
    return {} as T;
  }
  return response.json();
}

export const api = {

  // Admin Community
  getAdminCommunityStats: async () => {
    return request<any>('/admin/community/stats');
  },
  getAdminCommunityPosts: async (params?: any) => {
    const sp = new URLSearchParams();
    if (params?.page) sp.append('page', params.page);
    if (params?.limit) sp.append('limit', params.limit);
    if (params?.search) sp.append('search', params.search);
    if (params?.category) sp.append('category', params.category);
    if (params?.status) sp.append('status', params.status);
    const q = sp.toString() ? `?${sp.toString()}` : '';
    return request<any>(`/admin/community/posts${q}`);
  },

  // Admin Gamification
  getAdminGamificationStats: async (params?: any) => {
    const q = params && params.start_date ? `?start_date=${params.start_date}` : '';
    return request<any>(`/admin/gamification/stats${q}`);
  },
  getAdminGamificationChart: async (params?: any) => {
    const q = params && params.start_date ? `?start_date=${params.start_date}` : '';
    return request<any>(`/admin/gamification/chart${q}`);
  },
  getAdminGamificationBreakdown: async (params?: any) => {
    const q = params && params.start_date ? `?start_date=${params.start_date}` : '';
    return request<any>(`/admin/gamification/breakdown${q}`);
  },
  getAdminGamificationTopContributors: async (params?: any) => {
    return request<any>(`/admin/gamification/top-contributors`);
  },
  getAdminGamificationTransactions: async (params?: any) => {
    const sp = new URLSearchParams();
    if (params?.page) sp.append('page', params.page);
    if (params?.limit) sp.append('limit', params.limit);
    if (params?.event_type) sp.append('event_type', params.event_type);
    const q = sp.toString() ? `?${sp.toString()}` : '';
    return request<any>(`/admin/gamification/transactions${q}`);
  },

  // Auth
  login: (email: string, password: string, role?: UserRole) =>
    request<AuthResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password, role }),
    }),

  register: (data: any) =>
    request<AuthResponse>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  getMe: () => request<User>('/auth/me'),
  updateMyProfile: (data: any) => request<User>('/auth/me/profile', { method: 'PUT', body: JSON.stringify(data) }),

  // Google OAuth
  getGoogleAuthStatus: () =>
    request<{ configured: boolean; client_id: string | null; redirect_uri: string }>('/auth/google/status'),

  getGoogleLoginUrl: (redirect: boolean = false) =>
    request<{ configured: boolean; url: string | null; message: string | null }>(
      `/auth/google/login?redirect=${redirect}`
    ),



  onboardGoogleUser: (data: {
    onboarding_token: string;
    role: string;
    department?: string;
    phone?: string;
    roll_number?: string;
    semester?: number;
    program?: string;
    year?: string;
    division?: string;
  }) =>
    request<AuthResponse>('/auth/google/onboard', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  listStudents: () => request<User[]>('/auth/students'),
  listStaff: () => request<User[]>('/auth/staff'),

  // Complaints
  getCategories: () => request<ComplaintCategory[]>('/complaints/categories'),

  listComplaints: (params?: { category_id?: number; status_filter?: string; priority_filter?: string }) => {
    const searchParams = new URLSearchParams();
    if (params?.category_id) searchParams.append('category_id', params.category_id.toString());
    if (params?.status_filter && params.status_filter !== 'ALL') searchParams.append('status_filter', params.status_filter);
    if (params?.priority_filter && params.priority_filter !== 'ALL') searchParams.append('priority_filter', params.priority_filter);
    const query = searchParams.toString() ? `?${searchParams.toString()}` : '';
    return request<Complaint[]>(`/complaints/${query}`);
  },

  getComplaint: (id: number) => request<Complaint>(`/complaints/${id}`),

  uploadAttachment: (complaintId: number, file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return fetch(`${API_BASE}/complaints/${complaintId}/attachments`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${sessionStorage.getItem("cb_token")}`,
      },
      body: formData,
    }).then(async (res) => {
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || 'Upload failed');
      }
      return res.json();
    });
  },

  createComplaint: (data: {
    title: string;
    description: string;
    category_id: number;
    priority: string;
    attachment_url?: string;
  }) =>
    request<Complaint>('/complaints/', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  updateComplaint: (
    id: number,
    data: {
      status?: string;
      assigned_to?: number;
      priority?: string;
      remarks?: string;
    }
  ) =>
    request<Complaint>(`/complaints/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),


  addComplaintUpdate: (id: number, remarks: string) =>
    request<Complaint>(`/complaints/${id}/updates?remarks=${encodeURIComponent(remarks)}`, {
      method: 'POST',
    }),

  confirmResolution: (id: number) =>
    request<Complaint>(`/complaints/${id}/confirm-resolution`, {
      method: 'POST',
    }),

  reopenComplaint: (id: number) =>
    request<Complaint>(`/complaints/${id}/reopen`, {
      method: 'POST',
    }),

  // Escalation
  requestEscalation: (complaintId: number, data: { reason: string; level: string }) =>
    request<ComplaintEscalation>(`/escalations/${complaintId}`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  reviewEscalation: (
    escalationId: number,
    data: {
      status: string;
      admin_notes?: string;
      assigned_to?: number;
      priority?: string;
    }
  ) =>
    request<ComplaintEscalation>(`/escalations/${escalationId}/review`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  // Community
  uploadCommunityAttachment: (postId: number, file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return request<{ id: number; filename: string }>(`/community/posts/${postId}/attachments`, {
      method: 'POST',
      body: formData,
    });
  },
  listPosts: (params?: { category?: string; sort_by?: string; search?: string }) => {
    const searchParams = new URLSearchParams();
    if (params?.category && params.category !== 'All') searchParams.append('category', params.category);
    if (params?.sort_by) searchParams.append('sort_by', params.sort_by);
    if (params?.search) searchParams.append('search', params.search);
    const query = searchParams.toString() ? `?${searchParams.toString()}` : '';
    return request<CommunityPost[]>(`/community/posts${query}`);
  },

  getPost: (id: number) => request<CommunityPost>(`/community/posts/${id}`),

  createPost: (data: { title: string; content: string; category: string; resources?: { url: string; title?: string }[] }) =>
    request<CommunityPost>('/community/posts', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  createAnswer: (postId: number, content: string) =>
    request<CommunityAnswer>(`/community/posts/${postId}/answers`, {
      method: 'POST',
      body: JSON.stringify({ content }),
    }),

  toggleVote: (targetType: 'POST' | 'ANSWER' | 'REPLY', targetId: number, voteType: 'UPVOTE' | 'DOWNVOTE' = 'UPVOTE') =>
    request<{ status: string; action: string; upvotes: number; downvotes: number }>('/community/vote', {
      method: 'POST',
      body: JSON.stringify({ target_type: targetType, target_id: targetId, vote_type: voteType }),
    }),

  deletePost: (id: number) =>
    request<{ status: string }>(`/community/posts/${id}`, {
      method: 'DELETE',
    }),
  deleteAnswer: (id: number) =>
    request<{ status: string }>(`/community/answers/${id}`, {
      method: 'DELETE',
    }),
  deleteReply: (id: number) =>
    request<{ status: string }>(`/community/replies/${id}`, {
      method: 'DELETE',
    }),
  createReply: (answerId: number, content: string, parentReplyId?: number) =>
    request<CommunityReply>(`/community/answers/${answerId}/replies`, {
      method: 'POST',
      body: JSON.stringify({ content, parent_reply_id: parentReplyId }),
    }),

  acceptAnswer: (answerId: number) =>
    request<{ status: string; message: string; points_awarded?: number }>(`/community/answers/${answerId}/accept`, {
      method: 'PATCH',
    }),

  reportContent: (targetType: 'POST' | 'ANSWER', targetId: number, reason: string) =>
    request<ReportResponse>('/community/reports', {
      method: 'POST',
      body: JSON.stringify({ target_type: targetType, target_id: targetId, reason }),
    }),

  // Gamification
  listBadges: () => request<Badge[]>('/gamification/badges'),
  getMyBadges: () => request<UserBadge[]>('/gamification/my-badges'),
  getMyTransactions: () => request<PointTransaction[]>('/gamification/my-transactions'),
  getGamificationSummary: () => request<GamificationSummary>('/gamification/me'),
  getLeaderboard: (period: 'weekly' | 'monthly' | 'all-time' = 'all-time') =>
    request<LeaderboardResponse>(`/gamification/leaderboard?period=${period}`),

  // AI Assistant
  askAI: (messages: AIChatMessage[], contextCategory?: string, currentPage?: string, quickAction?: string) =>
    request<AIChatResponse>('/ai/chat', {
      method: 'POST',
      body: JSON.stringify({
        messages,
        context_category: contextCategory,
        current_page: currentPage,
        quick_action: quickAction,
      }),
    }),

  // Notifications
  getNotifications: () => request<AppNotification[]>('/notifications/'),
  markNotificationRead: (id: number) =>
    request<{ status: string }>(`/notifications/${id}/read`, { method: 'PATCH' }),
  markAllNotificationsRead: () =>
    request<{ status: string; updated: number }>('/notifications/mark-all-read', { method: 'POST' }),



  // User Settings API
  getUserSettings: () => request<any>('/auth/me/settings'),
  updateUserSettings: (data: any) => request<any>('/auth/me/settings', {
    method: 'PUT',
    body: JSON.stringify(data),
  }),
  // Settings API
  getSettings: () => request<any[]>('/admin/settings'),
  updateSettings: (updates: {key: string, value: string}[]) => request<any[]>('/admin/settings', {
    method: 'PATCH',
    body: JSON.stringify(updates)
  }),


  // Health API
  getSystemHealth: () => request<any>('/admin/system-health'),

  // Admin


  getAdminStats: () => request<AdminStats>('/admin/stats'),
  // New Admin Endpoints
    listAuditLogs: (params: { limit?: number; skip?: number; start_date?: string; end_date?: string; action?: string } = {}) => {
    const sp = new URLSearchParams();
    if (params.limit !== undefined) sp.append('limit', params.limit.toString());
    if (params.skip !== undefined) sp.append('skip', params.skip.toString());
    if (params.start_date) sp.append('start_date', params.start_date);
    if (params.end_date) sp.append('end_date', params.end_date);
    if (params.action) sp.append('action', params.action);
    return request<{items: any[], total: number, skip: number, limit: number}>(`/admin/audit-logs?${sp.toString()}`);
  },

  listAdminUsers: (role?: string, search?: string) => {
    const sp = new URLSearchParams();
    if (role && role !== 'ALL') sp.append('role', role);
    if (search) sp.append('search', search);
    const q = sp.toString() ? `?${sp.toString()}` : '';
    return request<User[]>(`/admin/users${q}`);
  },
  updateUserRole: (userId: number, data: { role: string; department?: string; is_active?: boolean }) =>
    request<User>(`/admin/users/${userId}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),
  listReports: (statusFilter?: string) => {
    const q = statusFilter ? `?status_filter=${statusFilter}` : '';
    return request<ReportResponse[]>(`/admin/reports${q}`);
  },
  handleReport: (reportId: number, action: 'dismiss' | 'hide_content', adminNotes?: string) => {
    const q = new URLSearchParams({ action });
    if (adminNotes) q.append('admin_notes', adminNotes);
    return request<{ status: string; report_status: string }>(`/admin/reports/${reportId}?${q.toString()}`, {
      method: 'PATCH',
    });
  },

  // Analytics
  getCategoryDistribution: () => request<CategoryDistribution[]>('/analytics/by-category'),
  getTrends: (days = 7) => request<ComplaintsTrendPoint[]>(`/analytics/trends?days=${days}`),
  // Study Buddy Methods
  studyBuddy: {
    getProfile: () => request<StudyBuddyProfile>('/study-buddy/profile'),
    createProfile: (data: StudyBuddyProfileCreate) => request<StudyBuddyProfile>('/study-buddy/profile', { method: 'POST', body: JSON.stringify(data) }),
    updateProfile: (data: Partial<StudyBuddyProfileCreate>) => request<StudyBuddyProfile>('/study-buddy/profile', { method: 'PATCH', body: JSON.stringify(data) }),
    discover: () => request<StudyBuddyDiscover[]>('/study-buddy/discover'),
    sendRequest: (receiverId: number, message?: string) => request<StudyBuddyRequest>('/study-buddy/requests', { method: 'POST', body: JSON.stringify({ receiver_id: receiverId, message }) }),
    getRequests: () => request<{incoming: {request: StudyBuddyRequest, user: any}[], outgoing: {request: StudyBuddyRequest, user: any}[]}>('/study-buddy/requests'),
    acceptRequest: (reqId: number) => request(`/study-buddy/requests/${reqId}/accept`, { method: 'POST' }),
    rejectRequest: (reqId: number) => request(`/study-buddy/requests/${reqId}/reject`, { method: 'POST' }),
    getConnections: () => request<StudyBuddyConnection[]>('/study-buddy/connections'),
  },
};
