import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';

export default function Terms() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-16">
        <section className="py-16">
          <div className="container mx-auto px-4 max-w-3xl">
            <h1 className="text-3xl md:text-4xl font-bold mb-6">Terms of Service</h1>
            <p className="text-muted-foreground mb-4">
              These terms govern your use of FaceShot-ChopShop. By accessing or using the site, you agree to
              abide by these terms.
            </p>
            <p className="text-muted-foreground mb-4">
              You are responsible for ensuring you have the rights to any content you upload and for complying
              with all applicable laws when using the service.
            </p>
            <p className="text-muted-foreground mb-4">
              Before launch, replace this placeholder content with your final legal terms, including payment,
              refunds, acceptable use, and limitation of liability.
            </p>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}

