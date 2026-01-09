import { motion } from 'framer-motion';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

const faqs = [
  {
    question: 'What is FaceShot-ChopShop?',
    answer: 'FaceShot-ChopShop is a comprehensive AI-powered platform featuring 21 advanced tools designed for content creators, e-commerce businesses, and digital marketers. Transform your visual content with Face Swap technology, generate stunning AI Avatars in multiple styles, convert images to animated videos, and access a complete suite of creative tools. Our platform combines cutting-edge AI with an intuitive interface, making professional-quality content creation accessible to everyone.',
    defaultOpen: true,
  },
  {
    question: 'How do credits work?',
    answer: 'Credits are the flexible currency system that powers all FaceShot-ChopShop tools. Each tool consumes a different amount of credits based on its complexity: Face Swap costs 100 credits (~$0.50), Image-to-Video costs 500 credits (~$2.50), AI Avatar generation costs 150 credits (~$0.75), and other tools range from 50-300 credits. Credits never expire and can be used across any of our 21 tools. Purchase credits through subscription plans (best value for regular users) or one-time bundles (perfect for specific projects).',
    defaultOpen: true,
  },
  {
    question: 'Is my data secure?',
    answer: 'Your privacy and security are our top priorities. We use military-grade end-to-end encryption (AES-256) for all uploads and processing. Your images are automatically deleted from our servers within 24 hours of processing - no exceptions. We never store, share, sell, or use your images for AI training purposes. Our infrastructure is GDPR compliant, and we maintain SOC 2 Type II certification. All processing happens in secure, isolated environments with zero data retention policies.',
    defaultOpen: true,
  },
  {
    question: 'What image formats are supported?',
    answer: 'We support all major image formats including JPG, JPEG, PNG, WebP, HEIC, BMP, and TIFF. For optimal results, we recommend uploading high-resolution images (minimum 512x512 pixels, ideally 1024x1024 or higher) with clear, front-facing subjects. Maximum file size is 10MB per image. Our AI works best with well-lit photos that have clear facial features for face-related tools.',
  },
  {
    question: 'How long does processing take?',
    answer: 'Processing times vary by tool complexity: Face Swap completes in 20-30 seconds, AI Avatar generation takes 45-60 seconds, Image-to-Video conversions require 2-5 minutes depending on output length, and other tools process in 15-90 seconds. Pro and Enterprise plan subscribers get priority queue access, reducing wait times by up to 50% during peak hours. You\'ll receive real-time progress updates and email notifications when your content is ready.',
  },
  {
    question: 'Can I use the results commercially?',
    answer: 'Yes! All content generated through FaceShot-ChopShop comes with a full commercial usage license. You retain complete ownership and can use outputs for business purposes, social media, marketing campaigns, e-commerce products, client work, and more. However, you must have the legal rights to use any source images you upload. For enterprise clients requiring additional licensing guarantees, custom commercial licenses are available.',
  },
  {
    question: 'Do you offer refunds?',
    answer: 'We stand behind our service with a 7-day money-back guarantee on all purchases. If you\'re not completely satisfied with FaceShot-ChopShop for any reason, contact our support team within 7 days of purchase for a full refund - no questions asked. This applies to both subscription plans and one-time credit bundles. Unused credits from refunded purchases will be deactivated.',
  },
  {
    question: 'Is there an API available?',
    answer: 'Yes! Pro and Enterprise plan subscribers have full access to our robust REST API. Integrate FaceShot-ChopShop\'s powerful AI capabilities directly into your applications, workflows, and automation systems. Our API includes comprehensive documentation, code examples in multiple languages (Python, JavaScript, PHP, Ruby), webhook support, and dedicated rate limits. API access includes priority support and 99.9% uptime SLA.',
  },
];

export function FAQSection() {
  return (
    <section id="faq" className="py-24 relative">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="text-center mb-16">
          <motion.span
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="inline-block text-primary font-semibold text-sm uppercase tracking-wider mb-4"
          >
            FAQ
          </motion.span>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4"
          >
            Frequently Asked <span className="gradient-text">Questions</span>
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="text-muted-foreground text-lg max-w-2xl mx-auto"
          >
            Got questions? We've got answers. If you don't see what you're looking for, reach out to our support team.
          </motion.p>
        </div>

        {/* FAQ Accordion */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.3 }}
          className="max-w-3xl mx-auto"
        >
          <Accordion type="multiple" defaultValue={['item-0', 'item-1', 'item-2']} className="space-y-4">
            {faqs.map((faq, index) => (
              <AccordionItem
                key={index}
                value={`item-${index}`}
                className="glass-card px-6 border-none"
              >
                <AccordionTrigger className="text-left hover:no-underline py-5">
                  <span className="font-semibold">{faq.question}</span>
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground pb-5 leading-relaxed">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </motion.div>
      </div>
    </section>
  );
}
