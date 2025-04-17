import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { NotificationProvider } from './context/NotificationContext';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import Login from './pages/Login';
import DashboardLayout from './layouts/DashboardLayout';
import Dashboard from './pages/Dashboard';
import Users from './pages/Users';
import ImageGenerations from './pages/ImageGenerations';
import Wallets from './pages/Wallets';
import Transactions from './pages/Transactions';
import Loras from './pages/Loras';
import FactureDemi from './pages/FactureDemi';
import NouvellePage from './pages/formations/NouvellePage';
import ListePage from './pages/formations/ListePage';
import Formateurs from './pages/Formateurs';
import Parametres from './pages/Parametres';
import NouveauParticipant from './pages/participants/NouvellePage';
import ListeParticipants from './pages/participants/ListePage';
import EditParticipant from './pages/participants/EditPage';
import NouveauLieu from './pages/lieux/NouvellePage';
import ListeLieux from './pages/lieux/ListePage';
import ListeEmails from './pages/emails/ListePage';

function App() {
  return (
    <Router>
      <NotificationProvider>
        <AuthProvider>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <DashboardLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<Dashboard />} />
              <Route path="users" element={<Users />} />
              <Route path="generations" element={<ImageGenerations />} />
              <Route path="wallets" element={<Wallets />} />
              <Route path="transactions" element={<Transactions />} />
              <Route path="loras" element={<Loras />} />
              <Route path="factures" element={<FactureDemi />} />
              <Route path="formations/nouvelle" element={<NouvellePage />} />
              <Route path="formations/liste" element={<ListePage />} />
              <Route path="formateurs/*" element={<Formateurs />} />
              <Route path="parametres" element={<Parametres />} />
              <Route path="participants">
                <Route path="nouveau" element={<NouveauParticipant />} />
                <Route path="liste" element={<ListeParticipants />} />
                <Route path="edit/:id" element={<EditParticipant />} />
              </Route>
              <Route path="lieux">
                <Route path="nouveau" element={<NouveauLieu />} />
                <Route path="liste" element={<ListeLieux />} />
              </Route>
              <Route path="emails">
                <Route path="liste" element={<ListeEmails />} />
              </Route>
            </Route>
          </Routes>
        </AuthProvider>
      </NotificationProvider>
    </Router>
  );
}

export default App;