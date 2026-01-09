import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { PricingSection } from '@/components/landing/PricingSection';
import { BundleBreakdown } from '@/components/pricing/BundleBreakdown';
import { FAQSection } from '@/components/landing/FAQSection';

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-16">
        <PricingSection />
        <BundleBreakdown />
        <FAQSection />
      </main>
      <Footer />
    </div>
  );
}
