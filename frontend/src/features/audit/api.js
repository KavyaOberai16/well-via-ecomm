import { apiClient } from '@/services/apiClient.js';

export const auditApi = {
  list: ({ action, actor_user_id, target_type, target_id, page = 1, page_size = 50 } = {}) => {
    const params = { page, page_size };
    if (action) params.action = action;
    if (actor_user_id != null) params.actor_user_id = actor_user_id;
    if (target_type) params.target_type = target_type;
    if (target_id != null) params.target_id = target_id;
    return apiClient.get('/audit-events', { params }).then((r) => r.data);
  },
};
