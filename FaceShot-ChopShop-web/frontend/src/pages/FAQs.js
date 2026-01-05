import React from 'react';
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from '../components/ui/accordion';
import { motion } from 'framer-motion';

export default function FAQs() {
    const faqs = [
        {
            q: 'What is FaceShot-ChopShop?',
            a: 'FaceShot-ChopShop is an AI-powered platform to transform your images. Swap faces, generate unique avatars, and convert static images into animated videos.',
        },
        {
            q: 'How do credits work?',
            a: 'Credits are used to process images. Different transformations cost different amounts. Face swaps typically use 1 credit, avatars use 2–5 credits, and video generation uses 5–10 credits. Credits never expire.',
        },
        {
            q: 'Is my data secure?',
            a: 'We use encrypted uploads and automatically delete your images within 24 hours of processing. We do not share, sell, or train models on your data.',
        },
        {
            q: 'What image formats are supported?',
            a: 'JPG, JPEG, PNG, WebP, and HEIC are supported. For best results use high-resolution images with clear, front-facing subjects.',
        },
        {
            q: 'How long does processing take?',
            a: 'Most transformations complete in under 30 seconds. Complex operations like video generation may take 1–2 minutes. Pro users receive priority processing.',
        },
        {
            q: 'Can I use the results commercially?',
            a: 'Yes. All outputs generated through FaceShot-ChopShop are yours to use, including commercially, provided you have rights to the source images.',
        },
        {
            q: 'Do you offer refunds?',
            a: 'Yes, we offer a 7-day money-back guarantee on all credit purchases.',
        },
        {
            q: 'Is there an API available?',
            a: 'Pro and Enterprise users can access a REST API for integrating FaceShot-ChopShop into apps and workflows.',
        },
    ];

    return (
        <div className="p-8 max-w-4xl mx-auto">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="text-center mb-10"
            >
                <span className="inline-block text-indigo-700 font-semibold text-sm uppercase tracking-wider mb-2">FAQ</span>
                <h1 className="text-3xl sm:text-4xl font-bold mb-3">Frequently Asked Questions</h1>
                <p className="text-gray-600 text-lg max-w-2xl mx-auto">
                    If you don’t see what you’re looking for, reach out to our support team.
                </p>
            </motion.div>
            <Accordion type="single" collapsible className="space-y-4">
                {faqs.map((item, idx) => (
                    <AccordionItem key={idx} value={`item-${idx}`} className="border-none">
                        <AccordionTrigger className="px-0">
                            <span className="font-semibold">{item.q}</span>
                        </AccordionTrigger>
                        <AccordionContent className="text-gray-600">
                            {item.a}
                        </AccordionContent>
                    </AccordionItem>
                ))}
            </Accordion>
        </div>
    );
}
