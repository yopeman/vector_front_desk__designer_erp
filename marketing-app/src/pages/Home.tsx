import { Button } from '../components/ui/Button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/Card'

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-white">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-gray-900 mb-4">
            Marketing ERP
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Comprehensive marketing campaign management with real-time tracking, 
            proposal management, and budget analytics.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle>Campaigns</CardTitle>
              <CardDescription>
                Plan and track marketing campaigns with KPIs and targets
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline" className="w-full">
                Coming Soon
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Activities</CardTitle>
              <CardDescription>
                Manage digital and physical marketing activities
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline" className="w-full">
                Coming Soon
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Proposals</CardTitle>
              <CardDescription>
                Track proposals, proformas, and tenders
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline" className="w-full">
                Coming Soon
              </Button>
            </CardContent>
          </Card>
        </div>

        <div className="mt-12 text-center">
          <Card className="max-w-2xl mx-auto">
            <CardHeader>
              <CardTitle>Phase 1 Complete</CardTitle>
              <CardDescription>
                Infrastructure setup with TypeScript, TailwindCSS, Supabase, and React Query
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-sm text-gray-600 space-y-2">
                <p>✅ TypeScript configuration</p>
                <p>✅ TailwindCSS with brand color (#00CED1)</p>
                <p>✅ Supabase client setup</p>
                <p>✅ React Query integration</p>
                <p>✅ Zustand auth store</p>
                <p>✅ Basic UI components</p>
                <p>✅ Project directory structure</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
