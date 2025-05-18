export default function CandidateProfileLoading() {
  return (
    <div className="space-y-8">
      <div>
        <div className="h-8 w-64 bg-gray-200 rounded animate-pulse mb-2"></div>
        <div className="h-4 w-48 bg-gray-200 rounded animate-pulse"></div>
      </div>

      <div className="border rounded-lg overflow-hidden">
        <div className="p-6 border-b space-y-6">
          <div className="flex items-center gap-4">
            <div className="h-24 w-24 rounded-full bg-gray-200 animate-pulse"></div>
            <div className="space-y-2 flex-1">
              <div className="h-6 w-48 bg-gray-200 rounded animate-pulse"></div>
              <div className="h-4 w-full max-w-md bg-gray-200 rounded animate-pulse"></div>
              <div className="h-4 w-32 bg-gray-200 rounded animate-pulse"></div>
            </div>
          </div>
        </div>

        <div className="p-6 space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-6">
              <div>
                <div className="h-5 w-40 bg-gray-200 rounded animate-pulse mb-3"></div>
                <div className="space-y-2">
                  <div className="h-4 w-full max-w-xs bg-gray-200 rounded animate-pulse"></div>
                  <div className="h-4 w-full max-w-xs bg-gray-200 rounded animate-pulse"></div>
                </div>
              </div>
              
              <div>
                <div className="h-5 w-40 bg-gray-200 rounded animate-pulse mb-3"></div>
                <div className="h-4 w-full bg-gray-200 rounded animate-pulse"></div>
              </div>
            </div>
            
            <div className="space-y-6">
              <div>
                <div className="h-5 w-40 bg-gray-200 rounded animate-pulse mb-3"></div>
                <div className="flex gap-2">
                  <div className="h-6 w-16 rounded bg-gray-200 animate-pulse"></div>
                  <div className="h-6 w-16 rounded bg-gray-200 animate-pulse"></div>
                  <div className="h-6 w-16 rounded bg-gray-200 animate-pulse"></div>
                </div>
              </div>
              
              <div>
                <div className="h-5 w-40 bg-gray-200 rounded animate-pulse mb-3"></div>
                <div className="h-4 w-full bg-gray-200 rounded animate-pulse"></div>
              </div>
            </div>
          </div>
        </div>
        
        <div className="bg-gray-50 p-4 flex justify-between">
          <div className="h-10 w-24 rounded bg-gray-200 animate-pulse"></div>
          <div className="h-10 w-40 rounded bg-gray-200 animate-pulse"></div>
        </div>
      </div>
    </div>
  )
}
