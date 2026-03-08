import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { AppLayout } from "@/components/layout/AppLayout";
import LineLive from "@/pages/LineLive";
import Stops from "@/pages/Stops";
import HourlyProduction from "@/pages/HourlyProduction";
import Dashboard from "@/pages/Dashboard";
import Configuracoes from "@/pages/Configuracoes";
import Assistente from "@/pages/Assistente";
import ProductionOrders from "@/pages/ProductionOrders";
import Debug from "@/pages/Debug";
import Login from "@/pages/Login";
import Register from "@/pages/Register";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route element={<AppLayout />}>
              <Route path="/" element={<LineLive />} />
              <Route path="/paradas" element={<Stops />} />
              <Route path="/producao" element={<HourlyProduction />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/configuracoes" element={<Configuracoes />} />
              <Route path="/ordens" element={<ProductionOrders />} />
              <Route path="/assistente" element={<Assistente />} />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
