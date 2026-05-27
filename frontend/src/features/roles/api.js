import { apiClient } from '@/services/apiClient.js';

export const rolesApi = {
  listRoles: () => apiClient.get('/roles').then((r) => r.data),
  getRole: (id) => apiClient.get(`/roles/${id}`).then((r) => r.data),
  createRole: (data) => apiClient.post('/roles', data).then((r) => r.data),
  updateRole: (id, data) => apiClient.patch(`/roles/${id}`, data).then((r) => r.data),
  removeRole: (id) => apiClient.delete(`/roles/${id}`),

  listPermissions: () => apiClient.get('/roles/permissions').then((r) => r.data),

  // Assign a set of roles to a user (replaces the user's role list).
  assignUserRoles: (userId, roleIds) =>
    apiClient.put(`/roles/users/${userId}`, { role_ids: roleIds }).then((r) => r.data),
};
