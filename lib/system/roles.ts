export type SystemRole = "student" | "leader" | "super_admin";

export function isAdminRole(role: SystemRole) {
  return role === "leader" || role === "super_admin";
}

export function isSuperAdmin(role: SystemRole) {
  return role === "super_admin";
}
