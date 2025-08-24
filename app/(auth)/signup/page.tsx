
import { SignupForm } from '@/components/auth/signup-form'
import { ThompsonLogo } from '@/components/ui/thompson-logo'

export default function SignupPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <ThompsonLogo />
          <h1 className="text-2xl font-bold text-thompson-navy mt-4">
            Join Thompson PMC
          </h1>
          <p className="text-gray-600 mt-2">
            Create your executive analytics account
          </p>
        </div>
        
        <div className="ceo-card p-8">
          <SignupForm />
        </div>
        
        <div className="text-center mt-6">
          <p className="text-sm text-gray-500">
            Thompson Parking & Mobility Consultants
          </p>
        </div>
      </div>
    </div>
  )
}
