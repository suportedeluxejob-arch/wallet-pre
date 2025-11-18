'use client'

import { useState, useEffect } from 'react'
import { Shield, AlertTriangle, CheckCircle, XCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { dappProviderService, type PendingRequest } from '@/lib/dapp-provider'

export function DAppRequestHandler() {
  const [pendingRequests, setPendingRequests] = useState<PendingRequest[]>([])
  const [currentRequest, setCurrentRequest] = useState<PendingRequest | null>(null)
  const [autoApprove, setAutoApprove] = useState(false)

  useEffect(() => {
    const unsubscribe = dappProviderService.subscribeToPendingRequests((requests) => {
      setPendingRequests(requests)
      if (requests.length > 0 && !currentRequest) {
        setCurrentRequest(requests[0])
      }
    })

    return unsubscribe
  }, [currentRequest])

  const handleApprove = () => {
    if (!currentRequest) return

    if (currentRequest.type === 'connect') {
      dappProviderService.grantPermission({
        origin: currentRequest.origin,
        name: currentRequest.dappName,
        icon: currentRequest.dappIcon,
        permissions: ['connect', 'signTransaction', 'signMessage'],
        autoApprove,
      })
      // Approve with current wallet public key
      // In real implementation, get from wallet context
      dappProviderService.approveRequest(currentRequest.id, { publicKey: 'mock_public_key' })
    } else {
      dappProviderService.approveRequest(currentRequest.id, currentRequest.data)
    }

    setCurrentRequest(null)
    if (pendingRequests.length > 1) {
      setCurrentRequest(pendingRequests[1])
    }
  }

  const handleReject = () => {
    if (!currentRequest) return

    dappProviderService.rejectRequest(currentRequest.id, 'User rejected request')
    setCurrentRequest(null)
    if (pendingRequests.length > 1) {
      setCurrentRequest(pendingRequests[1])
    }
  }

  const getRequestIcon = (type: PendingRequest['type']) => {
    switch (type) {
      case 'connect':
        return <Shield className="h-6 w-6 text-blue-500" />
      case 'signTransaction':
        return <AlertTriangle className="h-6 w-6 text-yellow-500" />
      case 'signMessage':
        return <AlertTriangle className="h-6 w-6 text-orange-500" />
      default:
        return <Shield className="h-6 w-6" />
    }
  }

  const getRequestTitle = (type: PendingRequest['type']) => {
    switch (type) {
      case 'connect':
        return 'Connection Request'
      case 'signTransaction':
        return 'Sign Transaction'
      case 'signAllTransactions':
        return 'Sign Multiple Transactions'
      case 'signMessage':
        return 'Sign Message'
      default:
        return 'Request'
    }
  }

  const getRequestDescription = (request: PendingRequest) => {
    switch (request.type) {
      case 'connect':
        return `${request.dappName} wants to connect to your wallet`
      case 'signTransaction':
        return `${request.dappName} wants you to sign a transaction`
      case 'signAllTransactions':
        return `${request.dappName} wants you to sign ${request.data.transactions?.length || 0} transactions`
      case 'signMessage':
        return `${request.dappName} wants you to sign a message`
      default:
        return 'Unknown request'
    }
  }

  return (
    <Dialog open={currentRequest !== null} onOpenChange={(open) => !open && handleReject()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            {currentRequest && getRequestIcon(currentRequest.type)}
            <div>
              <DialogTitle>{currentRequest && getRequestTitle(currentRequest.type)}</DialogTitle>
              <DialogDescription className="mt-1">
                {currentRequest && getRequestDescription(currentRequest)}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {currentRequest && (
          <div className="space-y-4">
            <Card className="p-4 bg-muted/50">
              <div className="flex items-center gap-3">
                {currentRequest.dappIcon ? (
                  <img src={currentRequest.dappIcon || "/placeholder.svg"} alt="" className="w-10 h-10 rounded" />
                ) : (
                  <div className="w-10 h-10 rounded bg-primary/10 flex items-center justify-center">
                    <Shield className="h-5 w-5 text-primary" />
                  </div>
                )}
                <div>
                  <h4 className="font-medium text-sm">{currentRequest.dappName}</h4>
                  <p className="text-xs text-muted-foreground">{currentRequest.origin}</p>
                </div>
              </div>
            </Card>

            {currentRequest.type === 'connect' && (
              <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                <Label htmlFor="auto-approve" className="text-sm">
                  Trust this DApp (auto-approve future requests)
                </Label>
                <Switch
                  id="auto-approve"
                  checked={autoApprove}
                  onCheckedChange={setAutoApprove}
                />
              </div>
            )}

            {currentRequest.type === 'signMessage' && currentRequest.data.display && (
              <Card className="p-4">
                <h5 className="text-sm font-medium mb-2">Message to sign:</h5>
                <p className="text-sm font-mono bg-muted p-2 rounded">
                  {currentRequest.data.display}
                </p>
              </Card>
            )}

            {pendingRequests.length > 1 && (
              <Badge variant="secondary" className="w-full justify-center">
                {pendingRequests.length - 1} more request{pendingRequests.length > 2 ? 's' : ''} pending
              </Badge>
            )}
          </div>
        )}

        <DialogFooter className="flex-row gap-2">
          <Button variant="outline" onClick={handleReject} className="flex-1">
            <XCircle className="h-4 w-4 mr-2" />
            Reject
          </Button>
          <Button onClick={handleApprove} className="flex-1">
            <CheckCircle className="h-4 w-4 mr-2" />
            Approve
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
