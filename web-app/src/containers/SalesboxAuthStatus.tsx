import { useState } from 'react'
import { LogOut, UserCircle, Clock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useSalesboxAuth } from '@/hooks/useSalesboxAuth'
import { formatTokenExpiry } from '@/lib/jwt'
import { LoginDialog } from './LoginDialog'

export function SalesboxAuthStatus() {
  const { user, token, logout, isAuthenticated } = useSalesboxAuth()
  const [showLoginDialog, setShowLoginDialog] = useState(false)

  if (!isAuthenticated || !user || !token) {
    return (
      <div className="flex flex-col gap-2">
        <div className="text-sm text-main-view-fg/70">
          Not signed in
        </div>
        <Button
          onClick={() => setShowLoginDialog(true)}
          size="sm"
          className="w-fit"
        >
          <UserCircle size={16} />
          Sign In
        </Button>
        <LoginDialog
          open={showLoginDialog}
          onOpenChange={setShowLoginDialog}
          onSuccess={() => setShowLoginDialog(false)}
        />
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-3">
      {/* User Info */}
      <div className="flex items-start gap-3">
        <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/10 text-primary">
          <UserCircle size={24} />
        </div>
        <div className="flex-1">
          <div className="font-medium text-main-view-fg">{user.name}</div>
          <div className="text-sm text-main-view-fg/70">{user.username}</div>
        </div>
      </div>

      {/* Token Expiry */}
      <div className="flex items-center gap-2 text-sm text-main-view-fg/60">
        <Clock size={14} />
        <span>Token expires: {formatTokenExpiry(token)}</span>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2">
        <Button
          onClick={() => setShowLoginDialog(true)}
          size="sm"
          variant="default"
        >
          Switch Account
        </Button>
        <Button
          onClick={logout}
          size="sm"
          variant="destructive"
        >
          <LogOut size={16} />
          Sign Out
        </Button>
      </div>

      <LoginDialog
        open={showLoginDialog}
        onOpenChange={setShowLoginDialog}
        onSuccess={() => setShowLoginDialog(false)}
      />
    </div>
  )
}
