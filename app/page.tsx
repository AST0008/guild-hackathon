"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Users,
  FileText,
  MessageSquare,
  QrCode,
  Cloud,
  BarChart3,
  ArrowRight,
  CheckCircle,
  TrendingUp,
  Loader2,
  Brain,
  RefreshCw,
} from "lucide-react"

interface Stats {
  customerCount: number
  documentCount: number
  paymentCount: number
  cloudSyncPercentage: number
}

export default function HomePage() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchStats = async () => {
      const response = await fetch("/api/stats")
      const data = await response.json()
      setStats(data)
      setIsLoading(false)
    }
    fetchStats()
  }, [])

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/20">
      <header className="border-b bg-card/95 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="h-10 w-10 bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl flex items-center justify-center shadow-lg">
                <BarChart3 className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-foreground">MintLoop</h1>
                <p className="text-xs text-muted-foreground">Efficiency Platform</p>
              </div>
            </div>
            <nav className="hidden md:flex items-center space-x-8">
              <Link
                href="/customers"
                className="text-muted-foreground hover:text-foreground transition-colors font-medium"
              >
                Customers
              </Link>
              <Link
                href="/documents"
                className="text-muted-foreground hover:text-foreground transition-colors font-medium"
              >
                Documents
              </Link>
              <Link
                href="/communications"
                className="text-muted-foreground hover:text-foreground transition-colors font-medium"
              >
                Communications
              </Link>
              <Link
                href="/conversations"
                className="text-muted-foreground hover:text-foreground transition-colors font-medium"
              >
                Conversations
              </Link>
              <Link
                href="/analytics"
                className="text-muted-foreground hover:text-foreground transition-colors font-medium"
              >
                Analytics
              </Link>
              <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
                Get Started
              </Button>
            </nav>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4">
        <section className="py-16 md:py-24 text-center">
          <div className="max-w-6xl mx-auto">
            <Badge variant="secondary" className="mb-6 bg-gradient-to-r from-blue-50 to-purple-50 text-blue-700 border-blue-200">
              <TrendingUp className="h-3 w-3 mr-1" />
              Hackathon Project - AI-Powered Insurance Platform
            </Badge>
            <h2 className="text-4xl md:text-6xl font-bold text-foreground mb-6 text-balance leading-tight">
            MintLoop
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600 block">AI Conversation Engine</span>
            </h2>
            <p className="text-xl text-muted-foreground max-w-4xl mx-auto mb-8 text-pretty leading-relaxed">
              A comprehensive insurance management platform featuring AI-powered customer conversations, 
              mood analysis, predictive foresights, and automated workflows. Built with Next.js, TypeScript, 
              and integrated with Python AI backend.
            </p>
            
            {/* Tech Stack */}
            <div className="mb-12">
              <h3 className="text-lg font-semibold text-foreground mb-4">Tech Stack</h3>
              <div className="flex flex-wrap justify-center gap-3">
                <Badge variant="outline" className="px-3 py-1">Next.js 14</Badge>
                <Badge variant="outline" className="px-3 py-1">TypeScript</Badge>
                <Badge variant="outline" className="px-3 py-1">Tailwind CSS</Badge>
                <Badge variant="outline" className="px-3 py-1">shadcn/ui</Badge>
                <Badge variant="outline" className="px-3 py-1">Python AI Backend</Badge>
                <Badge variant="outline" className="px-3 py-1">Mood Analysis</Badge>
                <Badge variant="outline" className="px-3 py-1">Predictive Analytics</Badge>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
              <Link href="/conversations">
                <Button size="lg" className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-3">
                  <MessageSquare className="mr-2 h-5 w-5" />
                  View AI Conversations
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <Link href="/analytics">
                <Button variant="outline" size="lg" className="px-8 py-3 bg-transparent border-2">
                  <BarChart3 className="mr-2 h-5 w-5" />
                  View Analytics
                </Button>
              </Link>
            </div>

            <div className="flex flex-wrap justify-center gap-6 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span>Real-time Mood Analysis</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span>AI-Powered Foresights</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span>Conversation Simulation</span>
              </div>
            </div>
          </div>
        </section>

        <section className="py-16">
          <div className="text-center mb-12">
            <h3 className="text-3xl font-bold text-foreground mb-4">Core Features & Demo</h3>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Explore the AI-powered features and capabilities of this hackathon project. 
              Each module demonstrates different aspects of the insurance automation platform.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
            <Card className="group hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border-0 shadow-md bg-card/50 backdrop-blur-sm">
              <CardHeader className="pb-4">
                <div className="flex items-center space-x-3 mb-3">
                  <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center group-hover:bg-blue-600 transition-colors">
                    <Users className="h-6 w-6 text-blue-600 group-hover:text-white transition-colors" />
                  </div>
                  <CardTitle className="text-xl">Customer Management</CardTitle>
                </div>
                <CardDescription className="text-base leading-relaxed">
                  <strong>Demo:</strong> Customer profiles with insurance details, policy management, 
                  and communication history. Features CRUD operations and data visualization.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Link href="/customers">
                  <Button className="w-full bg-blue-600 hover:bg-blue-700 group-hover:shadow-lg transition-all">
                    <Users className="mr-2 h-4 w-4" />
                    View Demo
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </CardContent>
            </Card>

            <Card className="group hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border-0 shadow-md bg-card/50 backdrop-blur-sm">
              <CardHeader className="pb-4">
                <div className="flex items-center space-x-3 mb-3">
                  <div className="h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center group-hover:bg-green-600 transition-colors">
                    <FileText className="h-6 w-6 text-green-600 group-hover:text-white transition-colors" />
                  </div>
                  <CardTitle className="text-xl">Document Processing</CardTitle>
                </div>
                <CardDescription className="text-base leading-relaxed">
                  <strong>Demo:</strong> AI-powered document processing with text extraction, 
                  template generation, and automated form filling capabilities.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Link href="/documents">
                  <Button
                    variant="outline"
                    className="w-full border-green-200 hover:bg-green-50 hover:border-green-300 group-hover:shadow-lg transition-all bg-transparent"
                  >
                    <FileText className="mr-2 h-4 w-4" />
                    View Demo
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </CardContent>
            </Card>

            <Card className="group hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border-0 shadow-md bg-card/50 backdrop-blur-sm ring-2 ring-purple-200">
              <CardHeader className="pb-4">
                <div className="flex items-center space-x-3 mb-3">
                  <div className="h-12 w-12 bg-purple-100 rounded-lg flex items-center justify-center group-hover:bg-purple-600 transition-colors">
                    <MessageSquare className="h-6 w-6 text-purple-600 group-hover:text-white transition-colors" />
                  </div>
                  <CardTitle className="text-xl">AI Conversations</CardTitle>
                  <Badge className="bg-purple-100 text-purple-800">Featured</Badge>
                </div>
                <CardDescription className="text-base leading-relaxed">
                  <strong>Main Feature:</strong> AI-powered customer conversations with real-time mood analysis, 
                  outcome prediction, and automated foresights. The core innovation of this hackathon project.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Link href="/conversations">
                  <Button className="w-full bg-purple-600 hover:bg-purple-700 group-hover:shadow-lg transition-all">
                    <MessageSquare className="mr-2 h-4 w-4" />
                    Try AI Conversations
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </CardContent>
            </Card>

            <Card className="group hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border-0 shadow-md bg-card/50 backdrop-blur-sm">
              <CardHeader className="pb-4">
                <div className="flex items-center space-x-3 mb-3">
                  <div className="h-12 w-12 bg-orange-100 rounded-lg flex items-center justify-center group-hover:bg-orange-600 transition-colors">
                    <QrCode className="h-6 w-6 text-orange-600 group-hover:text-white transition-colors" />
                  </div>
                  <CardTitle className="text-xl">Payment QR Codes</CardTitle>
                </div>
                <CardDescription className="text-base leading-relaxed">
                  <strong>Demo:</strong> Dynamic QR code generation for premium payments with real-time tracking, 
                  payment status monitoring, and transaction history.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Link href="/payments">
                  <Button
                    variant="outline"
                    className="w-full border-orange-200 hover:bg-orange-50 hover:border-orange-300 group-hover:shadow-lg transition-all bg-transparent"
                  >
                    <QrCode className="mr-2 h-4 w-4" />
                    View Demo
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </CardContent>
            </Card>

            <Card className="group hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border-0 shadow-md bg-card/50 backdrop-blur-sm">
              <CardHeader className="pb-4">
                <div className="flex items-center space-x-3 mb-3">
                  <div className="h-12 w-12 bg-cyan-100 rounded-lg flex items-center justify-center group-hover:bg-cyan-600 transition-colors">
                    <Cloud className="h-6 w-6 text-cyan-600 group-hover:text-white transition-colors" />
                  </div>
                  <CardTitle className="text-xl">File Storage</CardTitle>
                </div>
                <CardDescription className="text-base leading-relaxed">
                  <strong>Demo:</strong> File upload, download, and management system with cloud storage integration, 
                  document organization, and secure file handling.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Link href="/storage">
                  <Button
                    variant="outline"
                    className="w-full border-cyan-200 hover:bg-cyan-50 hover:border-cyan-300 group-hover:shadow-lg transition-all bg-transparent"
                  >
                    <Cloud className="mr-2 h-4 w-4" />
                    View Demo
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </CardContent>
            </Card>

            <Card className="group hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border-0 shadow-md bg-card/50 backdrop-blur-sm">
              <CardHeader className="pb-4">
                <div className="flex items-center space-x-3 mb-3">
                  <div className="h-12 w-12 bg-indigo-100 rounded-lg flex items-center justify-center group-hover:bg-indigo-600 transition-colors">
                    <BarChart3 className="h-6 w-6 text-indigo-600 group-hover:text-white transition-colors" />
                  </div>
                  <CardTitle className="text-xl">Analytics Dashboard</CardTitle>
                </div>
                <CardDescription className="text-base leading-relaxed">
                  <strong>Demo:</strong> Data visualization dashboard with charts, metrics, and insights for 
                  conversation performance, customer engagement, and business analytics.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Link href="/analytics">
                  <Button
                    variant="outline"
                    className="w-full border-indigo-200 hover:bg-indigo-50 hover:border-indigo-300 group-hover:shadow-lg transition-all bg-transparent"
                  >
                    <BarChart3 className="mr-2 h-4 w-4" />
                    View Demo
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </section>

        <section className="py-16 mb-16">
          <div className="text-center mb-12">
            <h3 className="text-3xl font-bold text-foreground mb-4">Live Demo Data</h3>
            <p className="text-lg text-muted-foreground">Real-time metrics and statistics from the hackathon demo environment</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card className="text-center p-8 bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200 hover:shadow-lg transition-shadow">
              {isLoading ? (
                <Loader2 className="h-8 w-8 mx-auto animate-spin text-blue-600" />
              ) : (
                <CardContent className="p-0">
                  <div className="text-4xl font-bold text-blue-600 mb-2">{stats?.customerCount ?? 0}</div>
                  <p className="text-sm font-medium text-blue-700 mb-1">Demo Customers</p>
                  <p className="text-xs text-blue-600">Mock Data</p>
                </CardContent>
              )}
            </Card>

            <Card className="text-center p-8 bg-gradient-to-br from-green-50 to-green-100 border-green-200 hover:shadow-lg transition-shadow">
              {isLoading ? (
                <Loader2 className="h-8 w-8 mx-auto animate-spin text-green-600" />
              ) : (
                <CardContent className="p-0">
                  <div className="text-4xl font-bold text-green-600 mb-2">{stats?.documentCount ?? 0}</div>
                  <p className="text-sm font-medium text-green-700 mb-1">AI Conversations</p>
                  <p className="text-xs text-green-600">Live Demo</p>
                </CardContent>
              )}
            </Card>

            <Card className="text-center p-8 bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200 hover:shadow-lg transition-shadow">
              {isLoading ? (
                <Loader2 className="h-8 w-8 mx-auto animate-spin text-orange-600" />
              ) : (
                <CardContent className="p-0">
                  <div className="text-4xl font-bold text-orange-600 mb-2">{stats?.paymentCount ?? 0}</div>
                  <p className="text-sm font-medium text-orange-700 mb-1">Mood Analysis</p>
                  <p className="text-xs text-orange-600">AI Features</p>
                </CardContent>
              )}
            </Card>

            <Card className="text-center p-8 bg-gradient-to-br from-cyan-50 to-cyan-100 border-cyan-200 hover:shadow-lg transition-shadow">
              {isLoading ? (
                <Loader2 className="h-8 w-8 mx-auto animate-spin text-cyan-600" />
              ) : (
                <CardContent className="p-0">
                  <div className="text-4xl font-bold text-cyan-600 mb-2">{stats?.cloudSyncPercentage ?? 0}%</div>
                  <p className="text-sm font-medium text-cyan-700 mb-1">API Integration</p>
                  <p className="text-xs text-cyan-600">Python Backend</p>
                </CardContent>
              )}
            </Card>
          </div>
        </section>

        {/* Technical Features Section */}
        <section className="py-16 bg-gradient-to-r from-blue-50 to-purple-50">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h3 className="text-3xl font-bold text-foreground mb-4">Key Technical Features</h3>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                This hackathon project demonstrates advanced AI integration and real-time conversation management
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              <Card className="text-center p-6 bg-white/80 backdrop-blur-sm">
                <div className="h-16 w-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Brain className="h-8 w-8 text-white" />
                </div>
                <h4 className="text-xl font-semibold mb-2">AI Mood Analysis</h4>
                <p className="text-muted-foreground text-sm">
                  Real-time sentiment analysis with confidence scoring for each customer interaction
                </p>
              </Card>

              <Card className="text-center p-6 bg-white/80 backdrop-blur-sm">
                <div className="h-16 w-16 bg-gradient-to-br from-purple-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <TrendingUp className="h-8 w-8 text-white" />
                </div>
                <h4 className="text-xl font-semibold mb-2">Predictive Foresights</h4>
                <p className="text-muted-foreground text-sm">
                  AI-generated insights and outcome predictions based on conversation patterns
                </p>
              </Card>

              <Card className="text-center p-6 bg-white/80 backdrop-blur-sm">
                <div className="h-16 w-16 bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <MessageSquare className="h-8 w-8 text-white" />
                </div>
                <h4 className="text-xl font-semibold mb-2">Conversation Simulation</h4>
                <p className="text-muted-foreground text-sm">
                  Test and iterate on conversation flows with simulated customer responses
                </p>
              </Card>

              <Card className="text-center p-6 bg-white/80 backdrop-blur-sm">
                <div className="h-16 w-16 bg-gradient-to-br from-orange-500 to-orange-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <RefreshCw className="h-8 w-8 text-white" />
                </div>
                <h4 className="text-xl font-semibold mb-2">Real-time Updates</h4>
                <p className="text-muted-foreground text-sm">
                  Live conversation monitoring with instant mood and outcome updates
                </p>
              </Card>

              <Card className="text-center p-6 bg-white/80 backdrop-blur-sm">
                <div className="h-16 w-16 bg-gradient-to-br from-cyan-500 to-cyan-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <BarChart3 className="h-8 w-8 text-white" />
                </div>
                <h4 className="text-xl font-semibold mb-2">Analytics Dashboard</h4>
                <p className="text-muted-foreground text-sm">
                  Comprehensive data visualization and performance metrics
                </p>
              </Card>

              <Card className="text-center p-6 bg-white/80 backdrop-blur-sm">
                <div className="h-16 w-16 bg-gradient-to-br from-pink-500 to-pink-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="h-8 w-8 text-white" />
                </div>
                <h4 className="text-xl font-semibold mb-2">API Integration</h4>
                <p className="text-muted-foreground text-sm">
                  Seamless integration between Next.js frontend and Python AI backend
                </p>
              </Card>
            </div>
          </div>
        </section>
      </main>

      <footer className="bg-muted/30 border-t mt-16">
        <div className="container mx-auto px-4 py-12">
          <div className="text-center">
            <div className="flex items-center justify-center space-x-3 mb-4">
              <div className="h-8 w-8 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                <BarChart3 className="h-5 w-5 text-white" />
              </div>
              <h4 className="text-lg font-bold text-foreground">MintLoop AI</h4>
            </div>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto">
              Hackathon project showcasing AI-powered insurance conversation management with mood analysis and predictive foresights.
            </p>
            <div className="flex justify-center space-x-6 text-sm text-muted-foreground">
              <span>Built with Next.js & TypeScript</span>
              <span>•</span>
              <span>Python AI Backend</span>
              <span>•</span>
              <span>Real-time Mood Analysis</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
