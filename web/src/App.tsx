import { BrowserRouter, Route, Routes } from 'react-router-dom'
import Layout from './components/Layout'
import Home from './pages/Home'
import Hub from './pages/Hub'
import AngrebPage from './pages/sikkerhed/AngrebPage'
import AuthenticationPage from './pages/sikkerhed/AuthenticationPage'
import HashingPage from './pages/sikkerhed/HashingPage'
import KrypteringPage from './pages/sikkerhed/KrypteringPage'
import StandarderPage from './pages/sikkerhed/StandarderPage'
import ToolsPage from './pages/sikkerhed/ToolsPage'
import BrunoE2ePage from './pages/test/BrunoE2ePage'
import CiCdPage from './pages/test/CiCdPage'
import IntegrationPage from './pages/test/IntegrationPage'
import MetodikkerPage from './pages/test/MetodikkerPage'
import OversigtPage from './pages/test/OversigtPage'
import PerformancePage from './pages/test/PerformancePage'
import ReleasePage from './pages/test/ReleasePage'
import TestplanPage from './pages/test/TestplanPage'
import TrykPage from './pages/test/TrykPage'
import UnitPage from './pages/test/UnitPage'
import UxPage from './pages/test/UxPage'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="maalpinde" element={<Hub />} />
          <Route path="test/oversigt" element={<OversigtPage />} />
          <Route path="test/unit" element={<UnitPage />} />
          <Route path="test/integration" element={<IntegrationPage />} />
          <Route path="test/testplan" element={<TestplanPage />} />
          <Route path="test/metodikker" element={<MetodikkerPage />} />
          <Route path="test/release" element={<ReleasePage />} />
          <Route path="test/bruno-e2e" element={<BrunoE2ePage />} />
          <Route path="test/ci-cd" element={<CiCdPage />} />
          <Route path="test/tryk" element={<TrykPage />} />
          <Route path="test/performance" element={<PerformancePage />} />
          <Route path="test/ux" element={<UxPage />} />
          <Route path="sikkerhed/kryptering" element={<KrypteringPage />} />
          <Route path="sikkerhed/standarder" element={<StandarderPage />} />
          <Route path="sikkerhed/authentication" element={<AuthenticationPage />} />
          <Route path="sikkerhed/hashing" element={<HashingPage />} />
          <Route path="sikkerhed/angreb" element={<AngrebPage />} />
          <Route path="sikkerhed/tools" element={<ToolsPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
