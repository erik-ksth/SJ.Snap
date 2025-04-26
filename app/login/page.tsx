export default function LoginPage() {
     return (
          <div className="container mx-auto px-4 py-8 max-w-md">
               <h1 className="text-2xl font-bold mb-6 text-center">Login</h1>
               <div className="p-6 border rounded-lg shadow-sm">
                    <div className="space-y-4">
                         <div>
                              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                                   Email
                              </label>
                              <input
                                   type="email"
                                   id="email"
                                   className="w-full px-3 py-2 border rounded-md"
                                   placeholder="you@example.com"
                              />
                         </div>
                         <div>
                              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                                   Password
                              </label>
                              <input
                                   type="password"
                                   id="password"
                                   className="w-full px-3 py-2 border rounded-md"
                              />
                         </div>
                         <button className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700">
                              Sign In
                         </button>
                    </div>
               </div>
          </div>
     );
} 