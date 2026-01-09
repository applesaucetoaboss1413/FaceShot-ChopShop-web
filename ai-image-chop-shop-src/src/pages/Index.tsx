import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { HeroSection } from '@/components/landing/HeroSection';
import { DemoVideoSection } from '@/components/landing/DemoVideoSection';
import { FeaturesSection } from '@/components/landing/FeaturesSection';
import { GallerySection } from '@/components/landing/GallerySection';
import { HowItWorksSection } from '@/components/landing/HowItWorksSection';
import { CreditExplainerSection } from '@/components/landing/CreditExplainerSection';
import { EnhancedPricingSection } from '@/components/landing/EnhancedPricingSection';
import { TestimonialsSection } from '@/components/landing/TestimonialsSection';
import { ComparisonSection } from '@/components/landing/ComparisonSection';
import { PlatformAccessSection } from '@/components/landing/PlatformAccessSection';
import { FAQSection } from '@/components/landing/FAQSection';
import { CTASection } from '@/components/landing/CTASection';

export default function Index() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main>
        <HeroSection />
        <DemoVideoSection />
        <FeaturesSection />
        <GallerySection />
        <TestimonialsSection />
        <HowItWorksSection />
        <CreditExplainerSection />
        <EnhancedPricingSection />
        <ComparisonSection />
        <PlatformAccessSection />
        <FAQSection />
        <CTASection />
      </main>
      <Footer />
    </div>
  );
}
