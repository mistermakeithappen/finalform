'use client'

import { Button } from '@/components/ui/button'
import { Copy } from 'lucide-react'
import { toast } from 'sonner'

interface CopyLinkButtonProps {
  formSlug: string
}

export function CopyLinkButton({ formSlug }: CopyLinkButtonProps) {
  const handleCopyLink = () => {
    const url = `${window.location.origin}/form/${formSlug}`
    navigator.clipboard.writeText(url)
      .then(() => {
        toast.success('Form URL copied to clipboard!')
      })
      .catch(() => {
        toast.error('Failed to copy URL')
      })
  }

  return (
    <Button
      size="sm"
      variant="outline"
      onClick={handleCopyLink}
    >
      <Copy className="h-4 w-4 mr-2" />
      Copy Link
    </Button>
  )
}