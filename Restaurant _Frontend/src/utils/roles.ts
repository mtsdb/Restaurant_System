export type AppUser = {
  id: number
  username: string
  is_active: boolean
  role?: {
    id: number
    name: string
    is_admin?: boolean
  } | null
}

export function roleName(user: AppUser | null | undefined): string | null {
  const name = user?.role?.name || null
  return name ? String(name).toLowerCase() : null
}

export function isAdmin(user: AppUser | null | undefined): boolean {
  return Boolean(user?.role?.is_admin)
}

export function hasRole(user: AppUser | null | undefined, role: string): boolean {
  return roleName(user) === role.toLowerCase()
}
