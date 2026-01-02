import React from 'react';

export default function FAQs() {
    return (
        <div className="p-8 max-w-3xl mx-auto">
            <h1 className="text-3xl font-bold mb-8">Frequently Asked Questions</h1>
            <div className="space-y-6">
                <div>
                    <h2 className="text-xl font-bold mb-2">How do credits work?</h2>
                    <p className="text-gray-600">Credits are used to generate media. Each tool consumes a specific amount of credits per usage.</p>
                </div>
                <div>
                    <h2 className="text-xl font-bold mb-2">Is this isolated from the main bot?</h2>
                    <p className="text-gray-600">Yes, this web platform operates independently but syncs with your Telegram account for login.</p>
                </div>
                <div>
                    <h2 className="text-xl font-bold mb-2">How do I purchase?</h2>
                    <p className="text-gray-600">Visit the Pricing page and select a pack. We use Stripe for secure payments.</p>
                </div>
            </div>
        </div>
    );
}
