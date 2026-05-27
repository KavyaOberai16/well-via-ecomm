import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { rolesApi } from './api.js';

const ROLES_KEY = ['roles'];
const PERMS_KEY = ['permissions'];

function useInvalidateRoles() {
  const qc = useQueryClient();
  return () => qc.invalidateQueries({ queryKey: ROLES_KEY });
}

export function useRoles() {
  return useQuery({
    queryKey: ROLES_KEY,
    queryFn: rolesApi.listRoles,
  });
}

export function usePermissions() {
  return useQuery({
    queryKey: PERMS_KEY,
    queryFn: rolesApi.listPermissions,
    // Permissions are seeded at boot and effectively static during a session.
    staleTime: Infinity,
  });
}

export function useCreateRole() {
  const invalidate = useInvalidateRoles();
  return useMutation({
    mutationFn: (data) => rolesApi.createRole(data),
    onSuccess: invalidate,
  });
}

export function useUpdateRole() {
  const invalidate = useInvalidateRoles();
  return useMutation({
    mutationFn: ({ id, data }) => rolesApi.updateRole(id, data),
    onSuccess: invalidate,
  });
}

export function useDeleteRole() {
  const invalidate = useInvalidateRoles();
  return useMutation({
    mutationFn: (id) => rolesApi.removeRole(id),
    onSuccess: invalidate,
  });
}

export function useAssignUserRoles() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ userId, roleIds }) => rolesApi.assignUserRoles(userId, roleIds),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['users'] });
      qc.invalidateQueries({ queryKey: ROLES_KEY });
    },
  });
}
