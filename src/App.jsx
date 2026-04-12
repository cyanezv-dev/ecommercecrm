import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AnimatePresence, motion } from 'framer-motion'
import BrandBootstrap from '@/components/BrandBootstrap'
import Wizard   from '@/pages/Wizard'
import Results  from '@/pages/Results'
import Checkout from '@/pages/Checkout'
import Payment  from '@/pages/Payment'
import Confirm  from '@/pages/Confirm'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 60000, retry: 1 }
  }
})

const pageVariants = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit:    { opacity: 0 },
}
const pageTransition = { duration: 0.3 }

function AnimatedRoutes() {
  const location = useLocation()
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={location.pathname}
        variants={pageVariants}
        initial="initial"
        animate="animate"
        exit="exit"
        transition={pageTransition}
        style={{ minHeight: '100dvh' }}
      >
        <Routes location={location}>
          <Route path="/"             element={<Wizard />} />
          <Route path="/resultados"   element={<Results />} />
          <Route path="/checkout"     element={<Checkout />} />
          <Route path="/pago"         element={<Payment />} />
          <Route path="/confirmacion" element={<Confirm />} />
          <Route path="*"             element={<Navigate to="/" replace />} />
        </Routes>
      </motion.div>
    </AnimatePresence>
  )
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <BrandBootstrap />
        <AnimatedRoutes />
      </BrowserRouter>
    </QueryClientProvider>
  )
}
