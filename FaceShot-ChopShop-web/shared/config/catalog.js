const catalog = [
    // IMAGE TOOLS
    { 
        key: 'faceswap', 
        name: 'Face Swap', 
        description: 'Swap faces in images or videos',
        category: 'image',
        basePrice: 299,
        icon: '😊'
    },
    { 
        key: 'enhance', 
        name: 'Image Enhancement', 
        description: 'Upscale to 4K quality',
        category: 'image',
        basePrice: 499,
        icon: '✨'
    },
    { 
        key: 'bgremove', 
        name: 'Background Remove', 
        description: 'Remove backgrounds instantly',
        category: 'image',
        basePrice: 199,
        icon: '🎨'
    },
    { 
        key: 'text2img', 
        name: 'Text to Image', 
        description: 'Generate images from text',
        category: 'image',
        basePrice: 399,
        icon: '🖼️'
    },
    { 
        key: 'nano_banana', 
        name: 'Nano Banana (Gemini)', 
        description: 'AI image generation powered by Gemini',
        category: 'image',
        basePrice: 599,
        icon: '🍌'
    },

    // VIDEO TOOLS
    { 
        key: 'img2vid', 
        name: 'Image to Video', 
        description: 'Animate static images',
        category: 'video',
        basePrice: 799,
        icon: '🎬'
    },
    { 
        key: 'vid2vid', 
        name: 'Video to Video', 
        description: 'Transform videos with AI',
        category: 'video',
        basePrice: 1299,
        icon: '🎥'
    },
    { 
        key: 'avatar_video', 
        name: 'AI Avatar Video', 
        description: 'Realistic avatar videos with lip-sync',
        category: 'video',
        basePrice: 1499,
        icon: '👤'
    },
    { 
        key: 'talking_photo', 
        name: 'Talking Photo', 
        description: 'Make photos talk',
        category: 'video',
        basePrice: 899,
        icon: '📸'
    },
    { 
        key: 'talking_video', 
        name: 'Talking Video', 
        description: 'Add AI voiceover with lip-sync',
        category: 'video',
        basePrice: 1099,
        icon: '🎞️'
    },
    { 
        key: 'caption_removal', 
        name: 'Caption Removal', 
        description: 'Remove captions from videos',
        category: 'video',
        basePrice: 399,
        icon: '🚫'
    },

    // VOICE TOOLS
    { 
        key: 'tts', 
        name: 'Text-to-Speech', 
        description: 'Natural-sounding speech',
        category: 'voice',
        basePrice: 299,
        icon: '🗣️'
    },
    { 
        key: 'voice_clone', 
        name: 'Voice Clone', 
        description: 'Clone any voice',
        category: 'voice',
        basePrice: 999,
        icon: '🎤'
    },
    { 
        key: 'dubbing', 
        name: 'AI Dubbing', 
        description: 'Translate and dub videos',
        category: 'voice',
        basePrice: 1299,
        icon: '🌍'
    },

    // AVATAR TOOLS
    { 
        key: 'avatar', 
        name: 'Custom Avatar', 
        description: 'Create custom avatars',
        category: 'avatar',
        basePrice: 699,
        icon: '👨‍🎨'
    },

    // SPECIAL TOOLS
    { 
        key: 'virtual_tryon', 
        name: 'Virtual Try-On', 
        description: 'Try on clothes virtually',
        category: 'special',
        basePrice: 799,
        icon: '👔'
    },
    { 
        key: 'product_avatar', 
        name: 'Product Avatar', 
        description: 'AI presenters for products',
        category: 'special',
        basePrice: 1099,
        icon: '🛍️'
    }
]

module.exports = { catalog }

