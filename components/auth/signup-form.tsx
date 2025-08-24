
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { signIn } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'
import { Mail, Lock, User, Building, Briefcase, UserPlus, ArrowRight } from 'lucide-react'
import Link from 'next/link'

export function SignupForm() {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    companyName: '',
    jobTitle: ''
  })
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const { toast } = useToast()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const response = await fetch('/api/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        toast({
          title: 'Account Created!',
          description: 'Your account has been created successfully. Signing you in...',
        })

        // Auto sign in after successful signup
        const result = await signIn('credentials', {
          email: formData.email,
          password: formData.password,
          redirect: false,
        })

        if (result?.ok) {
          router.push('/dashboard')
          router.refresh()
        }
      } else {
        const data = await response.json()
        toast({
          title: 'Signup Failed',
          description: data.error || 'An error occurred during signup.',
          variant: 'destructive',
        })
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'An unexpected error occurred. Please try again.',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }))
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="firstName" className="text-sm font-medium text-gray-700">
            First Name
          </Label>
          <div className="relative mt-1">
            <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <Input
              id="firstName"
              name="firstName"
              type="text"
              value={formData.firstName}
              onChange={handleChange}
              className="pl-10"
              placeholder="John"
              required
            />
          </div>
        </div>

        <div>
          <Label htmlFor="lastName" className="text-sm font-medium text-gray-700">
            Last Name
          </Label>
          <div className="relative mt-1">
            <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <Input
              id="lastName"
              name="lastName"
              type="text"
              value={formData.lastName}
              onChange={handleChange}
              className="pl-10"
              placeholder="Doe"
              required
            />
          </div>
        </div>
      </div>

      <div>
        <Label htmlFor="email" className="text-sm font-medium text-gray-700">
          Email Address
        </Label>
        <div className="relative mt-1">
          <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
          <Input
            id="email"
            name="email"
            type="email"
            value={formData.email}
            onChange={handleChange}
            className="pl-10"
            placeholder="john.doe@company.com"
            required
          />
        </div>
      </div>

      <div>
        <Label htmlFor="password" className="text-sm font-medium text-gray-700">
          Password
        </Label>
        <div className="relative mt-1">
          <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
          <Input
            id="password"
            name="password"
            type="password"
            value={formData.password}
            onChange={handleChange}
            className="pl-10"
            placeholder="Create a strong password"
            required
            minLength={6}
          />
        </div>
      </div>

      <div>
        <Label htmlFor="companyName" className="text-sm font-medium text-gray-700">
          Company Name
        </Label>
        <div className="relative mt-1">
          <Building className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
          <Input
            id="companyName"
            name="companyName"
            type="text"
            value={formData.companyName}
            onChange={handleChange}
            className="pl-10"
            placeholder="Thompson PMC"
          />
        </div>
      </div>

      <div>
        <Label htmlFor="jobTitle" className="text-sm font-medium text-gray-700">
          Job Title
        </Label>
        <div className="relative mt-1">
          <Briefcase className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
          <Input
            id="jobTitle"
            name="jobTitle"
            type="text"
            value={formData.jobTitle}
            onChange={handleChange}
            className="pl-10"
            placeholder="CEO, Director, Manager"
          />
        </div>
      </div>

      <Button
        type="submit"
        disabled={isLoading}
        className="w-full ceo-button-accent"
      >
        {isLoading ? (
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 border-2 border-thompson-navy border-t-transparent rounded-full animate-spin" />
            Creating Account...
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <UserPlus className="w-4 h-4" />
            Create Account
            <ArrowRight className="w-4 h-4" />
          </div>
        )}
      </Button>

      <div className="text-center">
        <p className="text-sm text-gray-600">
          Already have an account?{' '}
          <Link 
            href="/login" 
            className="text-thompson-blue hover:text-thompson-navy font-medium"
          >
            Sign In
          </Link>
        </p>
      </div>
    </form>
  )
}
