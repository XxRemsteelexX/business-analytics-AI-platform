
'use client'

import { Building2 } from 'lucide-react'

export function ThompsonLogo({ size = 'default' }: { size?: 'sm' | 'default' | 'lg' }) {
  const sizeClasses = {
    sm: 'w-8 h-8',
    default: 'w-12 h-12',
    lg: 'w-16 h-16'
  }

  const textSize = {
    sm: 'text-lg',
    default: 'text-xl',
    lg: 'text-2xl'
  }

  return (
    <div className="flex items-center justify-center gap-3">
      <div className={`${sizeClasses[size]} thompson-gradient rounded-lg flex items-center justify-center`}>
        <Building2 className="text-white w-3/4 h-3/4" />
      </div>
      <div className="text-left">
        <div className={`${textSize[size]} font-bold text-thompson-navy`}>
          THOMPSON
        </div>
        <div className={`text-xs font-medium text-thompson-lime -mt-1`}>
          PMC
        </div>
      </div>
    </div>
  )
}
