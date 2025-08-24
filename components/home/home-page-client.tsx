
'use client'

import { ThompsonLogo } from '@/components/ui/thompson-logo'
import { Button } from '@/components/ui/button'
import { 
  BarChart, 
  TrendingUp, 
  Users, 
  Shield,
  FileText,
  Zap,
  ArrowRight,
  ChevronRight
} from 'lucide-react'
import Link from 'next/link'
import { motion } from 'framer-motion'

export function HomePageClient() {
  const features = [
    {
      icon: BarChart,
      title: 'Professional Analytics',
      description: 'Transform raw data into executive-ready insights with stunning visualizations.'
    },
    {
      icon: TrendingUp,
      title: 'Real-time Reporting',
      description: 'Generate comprehensive reports instantly for client presentations.'
    },
    {
      icon: Users,
      title: 'CEO Dashboard',
      description: 'Executive-level interface designed for leadership decision making.'
    },
    {
      icon: Shield,
      title: 'Secure Access',
      description: 'Enterprise-grade security for sensitive business data.'
    },
    {
      icon: FileText,
      title: 'Export Ready',
      description: 'Professional charts and reports ready for presentations and meetings.'
    },
    {
      icon: Zap,
      title: 'AI-Powered',
      description: 'Intelligent data analysis with natural language processing.'
    }
  ]

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-slate-50 via-white to-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="text-center">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <ThompsonLogo size="lg" />
            </motion.div>
            
            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="mt-8 text-5xl md:text-6xl font-bold text-thompson-navy leading-tight"
            >
              Executive Analytics
              <span className="text-thompson-lime block mt-2">Platform</span>
            </motion.h1>
            
            <motion.p
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="mt-6 text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed"
            >
              Transform your data into compelling business insights. Professional analytics
              and visualizations designed for executive presentations and client meetings.
            </motion.p>
            
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.6 }}
              className="mt-10 flex flex-col sm:flex-row gap-4 justify-center"
            >
              <Button asChild size="lg" className="ceo-button-primary text-lg px-8 py-4">
                <Link href="/login">
                  Get Started
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Link>
              </Button>
              
              <Button asChild size="lg" variant="outline" className="text-lg px-8 py-4">
                <Link href="/signup">
                  Create Account
                  <ChevronRight className="ml-2 w-5 h-5" />
                </Link>
              </Button>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-thompson-navy mb-4">
              Built for Leadership
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Everything you need to transform data into actionable business intelligence
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="ceo-card p-8 text-center"
              >
                <div className="w-16 h-16 mx-auto mb-6 thompson-gradient rounded-xl flex items-center justify-center">
                  <feature.icon className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-bold text-thompson-navy mb-4">
                  {feature.title}
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 thompson-gradient">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
              Ready to Transform Your Data?
            </h2>
            <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
              Join Thompson PMC executives in making data-driven decisions with 
              professional analytics and stunning visualizations.
            </p>
            <Button asChild size="lg" className="ceo-button-accent text-lg px-8 py-4">
              <Link href="/signup">
                Start Your Analytics Journey
                <ArrowRight className="ml-2 w-5 h-5" />
              </Link>
            </Button>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-thompson-navy py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="mb-6 md:mb-0">
              <ThompsonLogo />
              <p className="text-blue-200 mt-2">
                Professional Analytics Platform
              </p>
            </div>
            
            <div className="text-blue-200 text-sm">
              <p>&copy; 2024 Thompson Parking & Mobility Consultants</p>
              <p className="mt-1">Executive Analytics Platform</p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
