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
    answer: 'FaceShot-ChopShop is an AI-powered platform that allows you to transform your images with cutting-edge technology. You can swap faces between photos, generate unique avatars, and convert static images into animated videos.',
  },
  {
    question: 'How do credits work?',
    answer: 'Credits are the currency you use to process images. Different transformations cost different amounts of credits. Face swaps typically use 1 credit, avatars use 2-5 credits depending on complexity, and video generation uses 5-10 credits. Credits never expire.',
  },
  {
    question: 'Is my data secure?',
    answer: 'Absolutely. We use end-to-end encryption for all uploads, and your images are automatically deleted from our servers within 24 hours of processing. We never share, sell, or use your images for training purposes.',
  },
  {
    question: 'What image formats are supported?',
    answer: 'We support all common image formats including JPG, JPEG, PNG, WebP, and HEIC. For best results, we recommend high-resolution images (at least 512x512 pixels) with clear, front-facing subjects.',
  },
  {
    question: 'How long does processing take?',
    answer: 'Most transformations complete in under 30 seconds. Complex operations like video generation may take 1-2 minutes. Pro and Enterprise users get priority processing for even faster results.',
  },
  {
    question: 'Can I use the results commercially?',
    answer: 'Yes! All outputs generated through FaceShot-ChopShop are yours to use however you like, including for commercial purposes. However, please ensure you have the rights to use any source images.',
  },
  {
    question: 'Do you offer refunds?',
    answer: 'Yes, we offer a 7-day money-back guarantee on all credit purchases. If you\'re not satisfied for any reason, contact our support team for a full refund.',
  },
  {
    question: 'Is there an API available?',
    answer: 'Yes! Pro and Enterprise users have access to our REST API for integrating FaceShot-ChopShop into your own applications and workflows. Check our documentation for details.',
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
          <Accordion type="single" collapsible className="space-y-4">
            {faqs.map((faq, index) => (
              <AccordionItem
                key={index}
                value={`item-${index}`}
                className="glass-card px-6 border-none"
              >
                <AccordionTrigger className="text-left hover:no-underline py-5">
                  <span className="font-semibold">{faq.question}</span>
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground pb-5">
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
