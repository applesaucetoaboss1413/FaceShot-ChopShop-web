import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { PricingSection } from '@/components/landing/PricingSection';
<<<<<<< HEAD
import { ServicesSection } from '@/components/landing/ServicesSection';
=======
import { BundleBreakdown } from '@/components/pricing/BundleBreakdown';
>>>>>>> 67af479e20362b45dc48b9d333788b92111f2678
import { FAQSection } from '@/components/landing/FAQSection';

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-16">
        <PricingSection />
<<<<<<< HEAD
        <ServicesSection />
=======
        <BundleBreakdown />
>>>>>>> 67af479e20362b45dc48b9d333788b92111f2678
        <FAQSection />
      </main>
      <Footer />
    </div>
  );
}
