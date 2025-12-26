export type SystemRole = "admin" | "student" | "super_admin";

export function isAdminRole(role: SystemRole) {
  return role === "admin" || role === "super_admin";
}

export function isSuperAdmin(role: SystemRole) {
  return role === "super_admin";
}
