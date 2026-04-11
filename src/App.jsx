import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import Wizard   from '@/pages/Wizard'
import Results  from '@/pages/Results'
import Checkout from '@/pages/Checkout'
import Confirm  from '@/pages/Confirm'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 60000, retry: 1 }
  }
})

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route path="/"             element={<Wizard />} />
          <Route path="/resultados"   element={<Results />} />
          <Route path="/checkout"     element={<Checkout />} />
          <Route path="/confirmacion" element={<Confirm />} />
          <Route path="*"             element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  )
}
