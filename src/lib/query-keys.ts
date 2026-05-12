/** Clés centralisées pour éviter les typos et mutualiser le cache */
export const qk = {
  appBundle: ["app", "bundle"] as const,
  adminDashboard: ["admin", "dashboard"] as const,
  phoneDeletionLog: (search: string, page: number) => ["phones", "deletion-log", search, page] as const,
}
