import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom"
import { Toaster } from "sonner"
import { MainLayout } from "@/components/layout/MainLayout"
import LoginPage from "@/pages/auth/LoginPage"
import DashboardPage from "@/pages/dashboard/DashboardPage"
import StockListPage from "@/pages/stock/StockListPage"
import StockAddPage from "@/pages/stock/StockAddPage"
import StockDetailPage from "@/pages/stock/StockDetailPage"
import StockHistoryPage from "@/pages/stock/StockHistoryPage"
import SortiesPage from "@/pages/sorties/SortiesPage"
import SalesListPage from "@/pages/sales/SalesListPage"
import SaleNewPage from "@/pages/sales/SaleNewPage"
import SaleDetailPage from "@/pages/sales/SaleDetailPage"
import CreditsPage from "@/pages/credits/CreditsPage"
import ClientsListPage from "@/pages/clients/ClientsListPage"
import ClientAddPage from "@/pages/clients/ClientAddPage"
import ClientDetailPage from "@/pages/clients/ClientDetailPage"
import UsersListPage from "@/pages/users/UsersListPage"
import UserFormPage from "@/pages/users/UserFormPage"
import AlertsPage from "@/pages/alerts/AlertsPage"

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route element={<MainLayout />}>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/stock" element={<StockListPage />} />
          <Route path="/stock/add" element={<StockAddPage />} />
          <Route path="/stock/history" element={<StockHistoryPage />} />
          <Route path="/stock/:id" element={<StockDetailPage />} />
          <Route path="/sorties" element={<SortiesPage />} />
          <Route path="/sales" element={<SalesListPage />} />
          <Route path="/sales/new" element={<SaleNewPage />} />
          <Route path="/sales/:id" element={<SaleDetailPage />} />
          <Route path="/credits" element={<CreditsPage />} />
          <Route path="/clients" element={<ClientsListPage />} />
          <Route path="/clients/add" element={<ClientAddPage />} />
          <Route path="/clients/:id" element={<ClientDetailPage />} />
          <Route path="/users" element={<UsersListPage />} />
          <Route path="/users/new" element={<UserFormPage />} />
          <Route path="/alerts" element={<AlertsPage />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <Toaster position="top-right" richColors closeButton />
    </BrowserRouter>
  )
}
