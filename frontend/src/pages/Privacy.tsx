import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';

export default function Privacy() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-16">
        <section className="py-16">
          <div className="container mx-auto px-4 max-w-3xl">
            <h1 className="text-3xl md:text-4xl font-bold mb-6">Privacy Policy</h1>
            <p className="text-muted-foreground mb-4">
              Your privacy is important to us. This page outlines how FaceShot-ChopShop handles your data
              when you use the website and services.
            </p>
            <p className="text-muted-foreground mb-4">
              Uploaded images are processed for the sole purpose of delivering your requested transformations.
              We do not use your content to train models and do not sell your data.
            </p>
            <p className="text-muted-foreground mb-4">
              For full details on data retention, security, and your rights, please update this document with
              your final legal text before going live.
            </p>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}

