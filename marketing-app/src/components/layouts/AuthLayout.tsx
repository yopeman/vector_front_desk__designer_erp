import { Outlet } from 'react-router-dom'

export default function AuthLayout() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary to-white flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-primary mb-2">V☰CTOR</h1>
            <h2 className="text-xl text-gray-600">Advert & Manufacturing</h2>
            <h3 className="text-lg text-gray-600">Marketing ERP</h3>
            <p className="text-gray-600">Sign in to your account</p>
          </div>
          <Outlet />
        </div>
      </div>
    </div>
  )
}
