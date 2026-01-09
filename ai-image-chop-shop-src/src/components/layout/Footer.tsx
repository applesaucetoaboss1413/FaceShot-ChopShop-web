import { Link } from 'react-router-dom';
import { Zap, Github, Twitter, Mail, Shield, Lock, Award, CheckCircle } from 'lucide-react';

export function Footer() {
  return (
    <footer className="border-t border-border bg-card/30">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="md:col-span-2">
            <Link to="/" className="flex items-center gap-2 mb-4">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                <Zap className="w-5 h-5 text-primary-foreground" />
              </div>
              <span className="text-xl font-bold font-display">
                <span className="gradient-text">Face</span>Shot
              </span>
            </Link>
            <p className="text-muted-foreground text-sm max-w-xs">
              Transform your images with cutting-edge AI. Face swaps, avatars, and video generation powered by A2E technology.
            </p>
          </div>

          {/* Product Links */}
          <div>
            <h4 className="font-semibold text-foreground mb-4">Product</h4>
            <ul className="space-y-2">
              <li>
                <a href="/#features" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  Features
                </a>
              </li>
              <li>
                <Link to="/pricing" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  Pricing
                </Link>
              </li>
              <li>
                <a href="/#faq" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  FAQ
                </a>
              </li>
            </ul>
          </div>

          {/* Legal Links */}
          <div>
            <h4 className="font-semibold text-foreground mb-4">Legal</h4>
            <ul className="space-y-2">
              <li>
                <Link to="/privacy" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link to="/terms" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  Terms of Service
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Trust Badges */}
        <div className="mt-12 pt-8 border-t border-border">
          <div className="flex flex-wrap items-center justify-center gap-6 mb-8">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Shield className="w-5 h-5 text-primary" />
              <span>SSL Secured</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Lock className="w-5 h-5 text-primary" />
              <span>GDPR Compliant</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Award className="w-5 h-5 text-primary" />
              <span>SOC 2 Type II</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <CheckCircle className="w-5 h-5 text-primary" />
              <span>99.9% Uptime</span>
            </div>
          </div>
          <p className="text-center text-xs text-muted-foreground mb-4">
            Founded in 2024 • Trusted by creators worldwide • Your data is never stored or shared
          </p>
        </div>

        <div className="flex flex-col md:flex-row items-center justify-between pt-8 border-t border-border">
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} FaceShot-ChopShop. All rights reserved.
          </p>
          <div className="flex items-center gap-4 mt-4 md:mt-0">
            <a 
              href="https://twitter.com" 
              target="_blank" 
              rel="noopener noreferrer"
              className="p-2 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
            >
              <Twitter className="w-5 h-5" />
            </a>
            <a 
              href="https://github.com" 
              target="_blank" 
              rel="noopener noreferrer"
              className="p-2 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
            >
              <Github className="w-5 h-5" />
            </a>
            <a 
              href="mailto:support@faceshot.ai" 
              className="p-2 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
            >
              <Mail className="w-5 h-5" />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
