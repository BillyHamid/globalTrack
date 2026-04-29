import { useState, useMemo } from "react"
import { Link } from "react-router-dom"
import { Plus, Activity, Users } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import { EmptyState } from "@/components/common/EmptyState"
import { cn, formatDate } from "@/lib/utils"
import { mockUsers } from "@/mock/data"
import { useAppStore } from "@/store"
import type { UserRole } from "@/types"

const roleConfig: Record<UserRole, { label: string; variant: "default" | "secondary" | "warning" }> = {
  admin: { label: "Admin", variant: "default" },
  vendeur: { label: "Vendeur", variant: "secondary" },
  gestionnaire: { label: "Gestionnaire", variant: "warning" },
}

const avatarColors: Record<string, string> = {
  admin: "bg-primary text-primary-foreground",
  vendeur: "bg-blue-600 text-white",
  gestionnaire: "bg-amber-600 text-white",
}

function getInitials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase()
}

export default function UsersListPage() {
  const [roleFilter, setRoleFilter] = useState<string>("all")
  const activityLogs = useAppStore((s) => s.activityLogs)

  const activityCountByUser = useMemo(() => {
    const map = new Map<string, number>()
    for (const log of activityLogs) {
      map.set(log.userId, (map.get(log.userId) ?? 0) + 1)
    }
    return map
  }, [activityLogs])

  const filteredUsers = useMemo(() => {
    if (roleFilter === "all") return mockUsers
    return mockUsers.filter((u) => u.role === roleFilter)
  }, [roleFilter])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Gestion des utilisateurs</h1>
          <p className="text-muted-foreground">{mockUsers.length} utilisateurs</p>
        </div>
        <Link to="/users/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Nouvel utilisateur
          </Button>
        </Link>
      </div>

      <div className="max-w-[200px]">
        <Select value={roleFilter} onValueChange={setRoleFilter}>
          <SelectTrigger>
            <SelectValue placeholder="Filtrer par rôle" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous les rôles</SelectItem>
            <SelectItem value="admin">Admin</SelectItem>
            <SelectItem value="vendeur">Vendeur</SelectItem>
            <SelectItem value="gestionnaire">Gestionnaire</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {filteredUsers.length === 0 ? (
        <EmptyState
          icon={Users}
          title="Aucun utilisateur trouvé"
          description="Aucun utilisateur ne correspond à ce filtre."
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredUsers.map((user) => {
            const role = roleConfig[user.role]
            return (
              <Card key={user.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-5">
                  <div className="flex items-start gap-4">
                    <div
                      className={cn(
                        "h-12 w-12 rounded-full flex items-center justify-center text-sm font-semibold shrink-0",
                        avatarColors[user.role]
                      )}
                    >
                      {getInitials(user.name)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-semibold truncate">{user.name}</p>
                        <span
                          className={cn(
                            "h-2.5 w-2.5 rounded-full shrink-0",
                            user.isActive ? "bg-emerald-500" : "bg-gray-400"
                          )}
                          title={user.isActive ? "Actif" : "Inactif"}
                        />
                      </div>
                      <p className="text-sm text-muted-foreground truncate">{user.email}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <Badge variant={role.variant}>{role.label}</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-2">{user.phone}</p>
                      <p className="text-xs text-muted-foreground">
                        {activityCountByUser.get(user.id) ?? 0} action(s) enregistrée(s)
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Inscrit le {formatDate(user.createdAt)}
                      </p>
                    </div>
                  </div>
                  <div className="mt-4">
                    <Link to={`/users/${user.id}/activity`}>
                      <Button variant="outline" size="sm" className="w-full">
                        <Activity className="mr-1 h-4 w-4" />
                        Voir activité
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
