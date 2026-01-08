const catalog = [
    // IMAGE TOOLS
    { 
        key: 'faceswap', 
        name: 'Face Swap', 
        description: 'Swap faces in images or videos',
        category: 'image',
        inputs: ['source_image', 'target_image'],
        adjustments: []
    },
    { 
        key: 'enhance', 
        name: 'Image Enhancement', 
        description: 'Upscale and sharpen images to 4K quality',
        category: 'image',
        inputs: ['image'],
        adjustments: ['resolution', 'format']
    },
    { 
        key: 'bgremove', 
        name: 'Background Remove', 
        description: 'Remove background from images',
        category: 'image',
        inputs: ['image'],
        adjustments: []
    },
    { 
        key: 'text2img', 
        name: 'Text to Image', 
        description: 'Generate images from text descriptions',
        category: 'image',
        inputs: ['prompt'],
        adjustments: ['resolution', 'style', 'num_images', 'negative_prompt']
    },
    { 
        key: 'nano_banana', 
        name: 'Nano Banana (Gemini)', 
        description: 'AI image generation and editing powered by Gemini',
        category: 'image',
        inputs: ['prompt'],
        adjustments: ['aspect_ratio', 'operation']
    },

    // VIDEO TOOLS
    { 
        key: 'img2vid', 
        name: 'Image to Video', 
        description: 'Animate static images into dynamic videos',
        category: 'video',
        inputs: ['image'],
        adjustments: ['duration', 'prompt', 'negative_prompt', 'fps']
    },
    { 
        key: 'vid2vid', 
        name: 'Video to Video', 
        description: 'Transform videos with AI styling',
        category: 'video',
        inputs: ['video'],
        adjustments: ['prompt', 'style', 'strength']
    },
    { 
        key: 'avatar_video', 
        name: 'AI Avatar Video', 
        description: 'Generate realistic avatar videos with lip-sync',
        category: 'video',
        inputs: ['avatar_id', 'voice_id', 'script'],
        adjustments: ['video_length', 'resolution', 'aspect_ratio', 'background_music']
    },
    { 
        key: 'talking_photo', 
        name: 'Talking Photo', 
        description: 'Make photos talk with AI voice',
        category: 'video',
        inputs: ['image'],
        adjustments: ['audio_url', 'voice_text', 'voice_id', 'duration']
    },
    { 
        key: 'talking_video', 
        name: 'Talking Video', 
        description: 'Add AI voiceover to videos with lip-sync',
        category: 'video',
        inputs: ['video'],
        adjustments: ['audio_url', 'voice_text', 'voice_id']
    },
    { 
        key: 'caption_removal', 
        name: 'Caption Removal', 
        description: 'Remove captions and text overlays from videos',
        category: 'video',
        inputs: ['video'],
        adjustments: []
    },

    // VOICE & AUDIO TOOLS
    { 
        key: 'tts', 
        name: 'Text-to-Speech', 
        description: 'Convert text to natural-sounding speech',
        category: 'voice',
        inputs: ['text'],
        adjustments: ['voice_id', 'voice_type', 'language', 'speed', 'pitch']
    },
    { 
        key: 'voice_clone', 
        name: 'Voice Clone', 
        description: 'Clone any voice for unlimited use',
        category: 'voice',
        inputs: ['audio'],
        adjustments: ['quality', 'emotion_control']
    },
    { 
        key: 'dubbing', 
        name: 'AI Dubbing', 
        description: 'Translate and dub videos into any language',
        category: 'voice',
        inputs: ['video'],
        adjustments: ['target_language', 'voice_type', 'preserve_timing']
    },

    // AVATAR & CHARACTER TOOLS
    { 
        key: 'create_avatar', 
        name: 'Custom Avatar', 
        description: 'Create custom avatars from photos or videos',
        category: 'avatar',
        inputs: ['media'],
        adjustments: ['type']
    },

    // SPECIALTY TOOLS
    { 
        key: 'virtual_tryon', 
        name: 'Virtual Try-On', 
        description: 'Try on clothes virtually using AI',
        category: 'special',
        inputs: ['person_image', 'garment_image'],
        adjustments: ['category']
    },
    { 
        key: 'product_avatar', 
        name: 'Product Avatar', 
        description: 'Create AI presenters for products',
        category: 'special',
        inputs: ['product_image'],
        adjustments: ['avatar_style', 'background']
    }
]

// Adjustment definitions with UI metadata
const adjustments = {
    // RESOLUTION
    resolution: {
        type: 'select',
        label: 'Resolution',
        options: [
            { value: '1080p', label: '1080p (Full HD)', price_multiplier: 1.0 },
            { value: '2k', label: '2K (2560x1440)', price_multiplier: 1.3 },
            { value: '4k', label: '4K (3840x2160)', price_multiplier: 1.8 }
        ],
        default: '1080p'
    },
    
    // DURATION / LENGTH
    duration: {
        type: 'slider',
        label: 'Duration (seconds)',
        min: 5,
        max: 120,
        step: 5,
        default: 15,
        price_per_second: 0.02
    },
    
    video_length: {
        type: 'slider',
        label: 'Video Length (seconds)',
        min: 10,
        max: 180,
        step: 10,
        default: 30,
        price_per_second: 0.03
    },

    // ASPECT RATIO
    aspect_ratio: {
        type: 'select',
        label: 'Aspect Ratio',
        options: [
            { value: '1:1', label: '1:1 (Square - Instagram)', price_multiplier: 1.0 },
            { value: '16:9', label: '16:9 (Widescreen - YouTube)', price_multiplier: 1.0 },
            { value: '9:16', label: '9:16 (Vertical - TikTok/Reels)', price_multiplier: 1.0 },
            { value: '4:3', label: '4:3 (Standard)', price_multiplier: 1.0 }
        ],
        default: '16:9'
    },

    // STYLE
    style: {
        type: 'select',
        label: 'Style',
        options: [
            { value: 'realistic', label: 'Realistic', price_multiplier: 1.0 },
            { value: 'artistic', label: 'Artistic', price_multiplier: 1.2 },
            { value: 'anime', label: 'Anime', price_multiplier: 1.2 },
            { value: 'cartoon', label: 'Cartoon', price_multiplier: 1.1 },
            { value: '3d_render', label: '3D Render', price_multiplier: 1.3 }
        ],
        default: 'realistic'
    },

    // FORMAT
    format: {
        type: 'select',
        label: 'Format',
        options: [
            { value: 'jpg', label: 'JPG', price_multiplier: 1.0 },
            { value: 'png', label: 'PNG', price_multiplier: 1.1 },
            { value: 'webp', label: 'WebP', price_multiplier: 1.0 }
        ],
        default: 'jpg'
    },

    // FPS
    fps: {
        type: 'select',
        label: 'Frame Rate',
        options: [
            { value: 24, label: '24 FPS (Cinematic)', price_multiplier: 1.0 },
            { value: 30, label: '30 FPS (Standard)', price_multiplier: 1.1 },
            { value: 60, label: '60 FPS (Smooth)', price_multiplier: 1.4 }
        ],
        default: 30
    },

    // VOICE TYPE
    voice_type: {
        type: 'select',
        label: 'Voice Type',
        options: [
            { value: 'professional', label: 'Professional', price_multiplier: 1.0 },
            { value: 'casual', label: 'Casual', price_multiplier: 1.0 },
            { value: 'energetic', label: 'Energetic', price_multiplier: 1.1 },
            { value: 'soothing', label: 'Soothing', price_multiplier: 1.1 }
        ],
        default: 'professional'
    },

    // LANGUAGE
    language: {
        type: 'select',
        label: 'Language',
        options: [
            { value: 'en-US', label: 'English (US)', price_multiplier: 1.0 },
            { value: 'en-GB', label: 'English (UK)', price_multiplier: 1.0 },
            { value: 'es-ES', label: 'Spanish', price_multiplier: 1.1 },
            { value: 'fr-FR', label: 'French', price_multiplier: 1.1 },
            { value: 'de-DE', label: 'German', price_multiplier: 1.1 },
            { value: 'it-IT', label: 'Italian', price_multiplier: 1.1 },
            { value: 'pt-BR', label: 'Portuguese', price_multiplier: 1.1 },
            { value: 'zh-CN', label: 'Chinese', price_multiplier: 1.2 },
            { value: 'ja-JP', label: 'Japanese', price_multiplier: 1.2 },
            { value: 'ko-KR', label: 'Korean', price_multiplier: 1.2 }
        ],
        default: 'en-US'
    },

    // QUALITY
    quality: {
        type: 'select',
        label: 'Quality',
        options: [
            { value: 'standard', label: 'Standard', price_multiplier: 1.0 },
            { value: 'high', label: 'High', price_multiplier: 1.3 },
            { value: 'professional', label: 'Professional', price_multiplier: 1.6 }
        ],
        default: 'standard'
    },

    // SPEED
    speed: {
        type: 'slider',
        label: 'Speed',
        min: 0.5,
        max: 2.0,
        step: 0.1,
        default: 1.0,
        price_multiplier: 1.0
    },

    // PITCH
    pitch: {
        type: 'slider',
        label: 'Pitch',
        min: 0.5,
        max: 2.0,
        step: 0.1,
        default: 1.0,
        price_multiplier: 1.0
    },

    // TEXT INPUTS
    prompt: {
        type: 'textarea',
        label: 'Prompt',
        placeholder: 'Describe what you want to create...',
        required: true
    },

    negative_prompt: {
        type: 'textarea',
        label: 'Negative Prompt (Optional)',
        placeholder: 'What to avoid in the output...',
        required: false
    },

    script: {
        type: 'textarea',
        label: 'Script',
        placeholder: 'Enter the script for the avatar to speak...',
        required: true
    },

    text: {
        type: 'textarea',
        label: 'Text',
        placeholder: 'Enter text to convert to speech...',
        required: true
    },

    // BOOLEAN OPTIONS
    emotion_control: {
        type: 'checkbox',
        label: 'Emotion Control',
        default: false,
        price_add: 500 // $5.00
    },

    background_music: {
        type: 'checkbox',
        label: 'Add Background Music',
        default: false,
        price_add: 300 // $3.00
    },

    preserve_timing: {
        type: 'checkbox',
        label: 'Preserve Original Timing',
        default: true,
        price_multiplier: 1.0
    },

    // NUMBER INPUTS
    num_images: {
        type: 'number',
        label: 'Number of Images',
        min: 1,
        max: 10,
        default: 1,
        price_per_unit: 299 // $2.99 per additional image
    },

    strength: {
        type: 'slider',
        label: 'Transformation Strength',
        min: 0.1,
        max: 1.0,
        step: 0.1,
        default: 0.7,
        price_multiplier: 1.0
    },

    // SPECIAL SELECTORS
    operation: {
        type: 'select',
        label: 'Operation',
        options: [
            { value: 'generate', label: 'Generate New Image', price_multiplier: 1.0 },
            { value: 'edit', label: 'Edit Existing Image', price_multiplier: 1.2 }
        ],
        default: 'generate'
    },

    target_language: {
        type: 'select',
        label: 'Target Language',
        options: [
            { value: 'es', label: 'Spanish', price_multiplier: 1.0 },
            { value: 'fr', label: 'French', price_multiplier: 1.0 },
            { value: 'de', label: 'German', price_multiplier: 1.0 },
            { value: 'it', label: 'Italian', price_multiplier: 1.0 },
            { value: 'pt', label: 'Portuguese', price_multiplier: 1.0 },
            { value: 'zh', label: 'Chinese', price_multiplier: 1.2 },
            { value: 'ja', label: 'Japanese', price_multiplier: 1.2 },
            { value: 'ko', label: 'Korean', price_multiplier: 1.2 },
            { value: 'ar', label: 'Arabic', price_multiplier: 1.2 },
            { value: 'hi', label: 'Hindi', price_multiplier: 1.2 }
        ],
        default: 'es'
    },

    category: {
        type: 'select',
        label: 'Category',
        options: [
            { value: 'upper_body', label: 'Upper Body', price_multiplier: 1.0 },
            { value: 'lower_body', label: 'Lower Body', price_multiplier: 1.0 },
            { value: 'full_body', label: 'Full Body', price_multiplier: 1.3 },
            { value: 'dress', label: 'Dress', price_multiplier: 1.2 }
        ],
        default: 'upper_body'
    },

    avatar_style: {
        type: 'select',
        label: 'Avatar Style',
        options: [
            { value: 'professional', label: 'Professional', price_multiplier: 1.0 },
            { value: 'casual', label: 'Casual', price_multiplier: 1.0 },
            { value: 'animated', label: 'Animated', price_multiplier: 1.2 },
            { value: 'futuristic', label: 'Futuristic', price_multiplier: 1.3 }
        ],
        default: 'professional'
    },

    background: {
        type: 'select',
        label: 'Background',
        options: [
            { value: 'studio', label: 'Studio', price_multiplier: 1.0 },
            { value: 'office', label: 'Office', price_multiplier: 1.0 },
            { value: 'outdoor', label: 'Outdoor', price_multiplier: 1.1 },
            { value: 'custom', label: 'Custom', price_multiplier: 1.3 }
        ],
        default: 'studio'
    },

    type: {
        type: 'select',
        label: 'Type',
        options: [
            { value: 'image', label: 'From Image', price_multiplier: 1.0 },
            { value: 'video', label: 'From Video', price_multiplier: 1.5 }
        ],
        default: 'image'
    }
}

module.exports = { catalog, adjustments }

