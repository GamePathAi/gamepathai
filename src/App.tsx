import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Routes, Route, Navigate } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";

import Index from "./pages/Index";
import NetworkMetrics from "./pages/NetworkMetrics";
import NotFound from "./pages/NotFound";
import SystemOptimization from "./pages/SystemOptimization";
import RouteOptimizerPage from "./pages/RouteOptimizer";
import Performance from "./pages/Performance";
import AdvancedOptimizer from "./pages/AdvancedOptimizer";
import VPNIntegration from "./pages/VPNIntegration";
import PowerManager from "./pages/PowerManager";
import Settings from "./pages/Settings";
import SubscriptionManagement from "./pages/SubscriptionManagement";
import AccountSubscription from "./pages/AccountSubscription";
import { NotificationProvider } from "./hooks/use-notifications";
import { SubscriptionProvider } from "./hooks/use-subscription";
import Account from "./pages/Account";
import PaymentMethods from "./pages/PaymentMethods";
import BillingHistory from "./pages/BillingHistory";
import ChangePlan from "./pages/ChangePlan";
import CancelSubscription from "./pages/CancelSubscription";
import PrivacyPolicy from "./pages/legal/PrivacyPolicy";
import TermsOfService from "./pages/legal/TermsOfService";
import CookiePolicy from "./pages/legal/CookiePolicy";
import GDPRCompliance from "./pages/legal/GDPRCompliance";
import Games from "./pages/Games";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import ForgotPassword from "./pages/ForgotPassword";
import CheckoutPlanPage from "./pages/checkout/CheckoutPlanPage";
import CheckoutPaymentPage from "./pages/checkout/CheckoutPaymentPage";
import CheckoutProcessingPage from "./pages/checkout/CheckoutProcessingPage";
import CheckoutSuccessPage from "./pages/checkout/CheckoutSuccessPage";
import HomePage from "./pages/landing/HomePage";
import FeaturesPage from "./pages/landing/FeaturesPage";
import PricingPage from "./pages/landing/PricingPage";
import TechnologyPage from "./pages/landing/TechnologyPage";
import GamePage from "./pages/landing/GamePage";
import AboutPage from "./pages/company/AboutPage";
import BlogPage from "./pages/company/BlogPage";
import BlogArticlePage from "./pages/company/BlogArticlePage";
import CareersPage from "./pages/company/CareersPage";
import ContactPage from "./pages/company/ContactPage";
import DocumentationPage from "./pages/resources/DocumentationPage";
import SupportPage from "./pages/resources/SupportPage";
import StatusPage from "./pages/resources/StatusPage";
import FaqPage from "./pages/resources/FaqPage";
import QuickStartGuide from "./pages/resources/docs/QuickStartGuide";
import InstallationPage from "./pages/resources/docs/Installation";
import BasicConfiguration from "./pages/resources/docs/BasicConfiguration";
import PerformanceTuning from "./pages/resources/docs/PerformanceTuning";
import NetworkOptimization from "./pages/resources/docs/NetworkOptimization";
import CustomConfigurations from "./pages/resources/docs/CustomConfigurations";
import SupportInstallationPage from "./pages/support/InstallationPage";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <HelmetProvider>
      <TooltipProvider>
        <NotificationProvider>
          <SubscriptionProvider>
            <Toaster />
            <Sonner />
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<Signup />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route path="/dashboard" element={<Index />} />
              <Route path="/network-metrics" element={<NetworkMetrics />} />
              <Route path="/system-optimization" element={<SystemOptimization />} />
              <Route path="/route-optimizer" element={<RouteOptimizerPage />} />
              <Route path="/performance" element={<Performance />} />
              <Route path="/advanced-optimizer" element={<AdvancedOptimizer />} />
              <Route path="/vpn-integration" element={<VPNIntegration />} />
              <Route path="/power-manager" element={<PowerManager />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="/subscription" element={<SubscriptionManagement />} />
              <Route path="/account/subscription" element={<AccountSubscription />} />
              
              <Route path="/account" element={<Account />} />
              <Route path="/account/payment-methods" element={<PaymentMethods />} />
              <Route path="/account/billing-history" element={<BillingHistory />} />
              <Route path="/account/change-plan" element={<ChangePlan />} />
              <Route path="/account/cancel-subscription" element={<CancelSubscription />} />
              
              <Route path="/checkout/plan" element={<CheckoutPlanPage />} />
              <Route path="/checkout/payment" element={<CheckoutPaymentPage />} />
              <Route path="/checkout/processing" element={<CheckoutProcessingPage />} />
              <Route path="/checkout/success" element={<CheckoutSuccessPage />} />
              
              <Route path="/landing" element={<HomePage />} />
              <Route path="/features" element={<FeaturesPage />} />
              <Route path="/pricing" element={<PricingPage />} />
              <Route path="/technology" element={<TechnologyPage />} />
              
              <Route path="/games/:gameName" element={<GamePage />} />
              
              <Route path="/privacy" element={<PrivacyPolicy />} />
              <Route path="/terms" element={<TermsOfService />} />
              <Route path="/cookies" element={<CookiePolicy />} />
              <Route path="/gdpr" element={<GDPRCompliance />} />
              
              <Route path="/games" element={<Games />} />
              
              <Route path="*" element={<NotFound />} />
              
              {/* Company Pages */}
              <Route path="/about" element={<AboutPage />} />
              <Route path="/blog" element={<BlogPage />} />
              <Route path="/blog/:slug" element={<BlogArticlePage />} />
              <Route path="/careers" element={<CareersPage />} />
              <Route path="/contact" element={<ContactPage />} />
              
              {/* Resources Pages */}
              <Route path="/docs" element={<DocumentationPage />} />
              <Route path="/support" element={<SupportPage />} />
              <Route path="/support/installation" element={<SupportInstallationPage />} />
              <Route path="/status" element={<StatusPage />} />
              <Route path="/faq" element={<FaqPage />} />
              
              {/* Documentation Routes */}
              <Route path="/docs/quick-start" element={<QuickStartGuide />} />
              <Route path="/docs/installation" element={<InstallationPage />} />
              <Route path="/docs/basic-configuration" element={<BasicConfiguration />} />
              <Route path="/docs/performance-tuning" element={<PerformanceTuning />} />
              <Route path="/docs/network-optimization" element={<NetworkOptimization />} />
              <Route path="/docs/custom-configurations" element={<CustomConfigurations />} />
            </Routes>
          </SubscriptionProvider>
        </NotificationProvider>
      </TooltipProvider>
    </HelmetProvider>
  </QueryClientProvider>
);

export default App;
