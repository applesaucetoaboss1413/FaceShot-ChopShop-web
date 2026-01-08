#!/usr/bin/env node
/**
 * Seed SKU Tool Configurations
 * Implements all mappings from API_TOOL_MAPPING.md
 */

const Database = require('better-sqlite3');
const SKUConfigManager = require('../services/sku-config-manager');
require('dotenv').config();

const DB_PATH = process.env.DB_PATH || 'production.db';
const db = new Database(DB_PATH);
const configManager = new SKUConfigManager(db);

console.log('=== Seeding SKU Tool Configurations ===\n');

// ==========================================================================
// V3: VIDEO GENERATION SKUs
// ==========================================================================

// C1-15: 15s Promo/Reel
configManager.saveConfig('C1-15',
    [
        {
            step_order: 0,
            step_name: 'generate_tts',
            a2e_endpoint: '/api/v1/video/send_tts',
            http_method: 'POST',
            required: false,
            condition_expression: { field: 'use_tts', operator: '==', value: true },
            params_template: {
                msg: '${script}',
                tts_id: '${voice_id}',
                user_voice_id: '${custom_voice_id}',
                speechRate: '${speech_rate}',
                country: 'en',
                region: 'US'
            },
            timeout_seconds: 120,
            retry_max_attempts: 3
        },
        {
            step_order: 1,
            step_name: 'generate_video',
            a2e_endpoint: '/api/v1/video/generate',
            http_method: 'POST',
            required: true,
            params_template: {
                title: '${title}',
                anchor_id: '${avatar_id}',
                anchor_type: 1,
                audioSrc: '${audio_url}',
                resolution: 1080,
                web_bg_width: '${width}',
                web_bg_height: '${height}',
                anchor_background_color: '${bg_color}',
                anchor_background_img: '${bg_image}',
                isSkipRs: true,
                isCaptionEnabled: '${captions_enabled}',
                captionAlign: '${caption_style}',
                isToPublicPool: '${is_rapid}'
            },
            timeout_seconds: 600,
            retry_max_attempts: 2
        }
    ],
    [
        {
            option_key: 'avatar_id',
            option_label: 'Select Avatar',
            option_type: 'dropdown',
            option_values: null, // Loaded dynamically from A2E
            required: true,
            help_text: 'Choose an avatar for your video'
        },
        {
            option_key: 'orientation',
            option_label: 'Video Orientation',
            option_type: 'radio',
            option_values: [
                { label: 'Vertical (9:16) - Stories/Reels', value: 'vertical', width: 1080, height: 1920 },
                { label: 'Square (1:1) - Social Posts', value: 'square', width: 1080, height: 1080 },
                { label: 'Horizontal (16:9) - Standard', value: 'horizontal', width: 1920, height: 1080 }
            ],
            default_value: 'vertical',
            required: true
        },
        {
            option_key: 'audio_source',
            option_label: 'Audio Source',
            option_type: 'radio',
            option_values: [
                { label: 'Upload Audio', value: 'upload' },
                { label: 'Text-to-Speech', value: 'tts' }
            ],
            default_value: 'tts',
            required: true
        },
        {
            option_key: 'audio_url',
            option_label: 'Upload Audio File',
            option_type: 'file',
            required: false,
            validation_rules: { allowedTypes: ['mp3', 'wav', 'm4a'], maxSize: 10485760 },
            help_text: 'Upload MP3, WAV, or M4A file (max 10MB)'
        },
        {
            option_key: 'script',
            option_label: 'Script Text',
            option_type: 'text',
            required: false,
            validation_rules: { minLength: 10, maxLength: 500 },
            help_text: 'Your script for text-to-speech (shown if TTS selected)'
        },
        {
            option_key: 'voice_id',
            option_label: 'Voice Selection',
            option_type: 'dropdown',
            option_values: null, // Loaded dynamically
            required: false,
            help_text: 'Select a voice for TTS'
        },
        {
            option_key: 'speech_rate',
            option_label: 'Speech Speed',
            option_type: 'slider',
            option_values: [
                { label: 'Slow (0.8x)', value: 0.8 },
                { label: 'Normal (1.0x)', value: 1.0 },
                { label: 'Fast (1.2x)', value: 1.2 }
            ],
            default_value: 1.0,
            required: false
        },
        {
            option_key: 'background_type',
            option_label: 'Background',
            option_type: 'radio',
            option_values: [
                { label: 'Solid Color', value: 'color' },
                { label: 'Custom Image', value: 'image' },
                { label: 'Green Screen', value: 'green' }
            ],
            default_value: 'color',
            required: true
        },
        {
            option_key: 'bg_color',
            option_label: 'Background Color',
            option_type: 'text',
            default_value: 'rgb(255,255,255)',
            validation_rules: { pattern: '^rgb\\(\\d+,\\s*\\d+,\\s*\\d+\\)$' }
        },
        {
            option_key: 'captions_enabled',
            option_label: 'Enable Captions',
            option_type: 'checkbox',
            default_value: false
        }
    ]
);

// C2-30: 30s Ad/UGC Clip
configManager.saveConfig('C2-30',
    [
        {
            step_order: 0,
            step_name: 'generate_tts',
            a2e_endpoint: '/api/v1/video/send_tts',
            http_method: 'POST',
            required: false,
            condition_expression: { field: 'use_tts', operator: '==', value: true },
            params_template: {
                msg: '${script}',
                tts_id: '${voice_id}',
                speechRate: '${speech_rate}'
            }
        },
        {
            step_order: 1,
            step_name: 'generate_video',
            a2e_endpoint: '/api/v1/video/generate',
            http_method: 'POST',
            required: true,
            params_template: {
                anchor_id: '${avatar_id}',
                audioSrc: '${audio_url}',
                resolution: 1080,
                web_bg_width: 1920,
                web_bg_height: 1080,
                isSkipRs: true,
                isCaptionEnabled: '${captions_enabled}',
                captionAlign: {
                    language: 'en-US',
                    PrimaryColour: 'rgba(255, 255, 255, 1)',
                    FontName: 'Arial',
                    Fontsize: 50,
                    subtitle_position: '0.2'
                }
            }
        }
    ],
    [
        {
            option_key: 'avatar_id',
            option_label: 'Select Avatar',
            option_type: 'dropdown',
            required: true
        },
        {
            option_key: 'audio_source',
            option_label: 'Audio Source',
            option_type: 'radio',
            option_values: [
                { label: 'Upload Audio', value: 'upload' },
                { label: 'Text-to-Speech', value: 'tts' }
            ],
            default_value: 'tts',
            required: true
        },
        {
            option_key: 'script',
            option_label: 'Script Text',
            option_type: 'text',
            validation_rules: { minLength: 20, maxLength: 1000 }
        },
        {
            option_key: 'captions_enabled',
            option_label: 'Enable Auto-Captions',
            option_type: 'checkbox',
            default_value: true
        },
        {
            option_key: 'caption_style',
            option_label: 'Caption Style',
            option_type: 'dropdown',
            option_values: [
                { label: 'Modern Bold', value: 'bold' },
                { label: 'Classic', value: 'classic' },
                { label: 'Minimal', value: 'minimal' }
            ],
            default_value: 'bold'
        }
    ]
);

// C3-60: 60s YouTube/Explainer
configManager.saveConfig('C3-60',
    [
        {
            step_order: 0,
            step_name: 'generate_tts',
            a2e_endpoint: '/api/v1/video/send_tts',
            condition_expression: { field: 'use_tts', operator: '==', value: true },
            params_template: {
                msg: '${script}',
                tts_id: '${voice_id}',
                speechRate: 1.0
            }
        },
        {
            step_order: 1,
            step_name: 'generate_video',
            a2e_endpoint: '/api/v1/video/generate',
            required: true,
            params_template: {
                anchor_id: '${avatar_id}',
                audioSrc: '${audio_url}',
                resolution: 1080,
                web_bg_width: 1920,
                web_bg_height: 1080,
                isSkipRs: false, // Enable smart motion for quality
                isCaptionEnabled: true,
                msg: '${script}'
            },
            timeout_seconds: 900 // 15 minutes for longer video
        }
    ],
    [
        {
            option_key: 'avatar_id',
            option_label: 'Select Avatar',
            option_type: 'dropdown',
            required: true
        },
        {
            option_key: 'quality',
            option_label: 'Video Quality',
            option_type: 'radio',
            option_values: [
                { label: 'Standard (Fast)', value: 'standard' },
                { label: 'Premium (Smart Motion)', value: 'premium' }
            ],
            default_value: 'premium'
        },
        {
            option_key: 'aspect_ratio',
            option_label: 'Aspect Ratio',
            option_type: 'radio',
            option_values: [
                { label: '16:9 (YouTube)', value: '16:9' },
                { label: '9:16 (Shorts)', value: '9:16' },
                { label: '1:1 (Social)', value: '1:1' }
            ],
            default_value: '16:9'
        },
        {
            option_key: 'script',
            option_label: 'Full Script',
            option_type: 'text',
            required: true,
            validation_rules: { minLength: 100, maxLength: 2000 }
        }
    ]
);

// ==========================================================================
// V4/V5: VOICE CLONE & TTS SKUs
// ==========================================================================

// D1-VO30: 30s Standard Voiceover
configManager.saveConfig('D1-VO30',
    [
        {
            step_order: 0,
            step_name: 'generate_tts',
            a2e_endpoint: '/api/v1/video/send_tts',
            required: true,
            params_template: {
                msg: '${script}',
                tts_id: '${voice_id}',
                speechRate: '${speech_rate}'
            }
        }
    ],
    [
        {
            option_key: 'script',
            option_label: 'Voiceover Script',
            option_type: 'text',
            required: true,
            validation_rules: { minLength: 20, maxLength: 500 },
            help_text: 'Your script (approximately 30 seconds when spoken)'
        },
        {
            option_key: 'voice_id',
            option_label: 'Voice Selection',
            option_type: 'dropdown',
            required: true,
            help_text: 'Choose from 50+ professional voices'
        },
        {
            option_key: 'speech_rate',
            option_label: 'Speaking Speed',
            option_type: 'radio',
            option_values: [
                { label: 'Slow (0.8x)', value: 0.8 },
                { label: 'Normal (1.0x)', value: 1.0 },
                { label: 'Fast (1.2x)', value: 1.2 }
            ],
            default_value: 1.0
        }
    ]
);

// D2-CLONE: Standard Voice Clone
configManager.saveConfig('D2-CLONE',
    [
        {
            step_order: 0,
            step_name: 'train_voice',
            a2e_endpoint: '/api/v1/userVoice/training',
            required: true,
            params_template: {
                name: '${voice_name}',
                voice_urls: '${audio_samples}',
                model: '${model}',
                language: '${language}',
                gender: '${gender}',
                denoise: true
            },
            timeout_seconds: 300
        }
    ],
    [
        {
            option_key: 'voice_name',
            option_label: 'Voice Clone Name',
            option_type: 'text',
            required: true,
            validation_rules: { minLength: 3, maxLength: 50 },
            help_text: 'Give your voice clone a name'
        },
        {
            option_key: 'audio_samples',
            option_label: 'Voice Sample (15-60 seconds)',
            option_type: 'file',
            required: true,
            validation_rules: { allowedTypes: ['mp3', 'wav', 'm4a'], minSize: 100000, maxSize: 20971520 },
            help_text: 'Upload clear audio sample (15-60 seconds, no background noise)'
        },
        {
            option_key: 'language',
            option_label: 'Primary Language',
            option_type: 'dropdown',
            option_values: [
                { label: 'English', value: 'en' },
                { label: 'Spanish', value: 'es' },
                { label: 'French', value: 'fr' },
                { label: 'German', value: 'de' },
                { label: 'Chinese', value: 'zh' }
            ],
            default_value: 'en',
            required: true
        },
        {
            option_key: 'gender',
            option_label: 'Voice Gender',
            option_type: 'radio',
            option_values: [
                { label: 'Male', value: 'male' },
                { label: 'Female', value: 'female' }
            ],
            required: true
        },
        {
            option_key: 'model',
            option_label: 'Cloning Model',
            option_type: 'radio',
            option_values: [
                { label: 'A2E (Best for English/Chinese)', value: 'a2e' },
                { label: 'Cartesia (Multilingual)', value: 'cartesia' }
            ],
            default_value: 'a2e'
        }
    ]
);

// D3-CLPRO: Advanced Voice Clone
configManager.saveConfig('D3-CLPRO',
    [
        {
            step_order: 0,
            step_name: 'train_voice',
            a2e_endpoint: '/api/v1/userVoice/training',
            required: true,
            params_template: {
                name: '${voice_name}',
                voice_urls: '${audio_samples}',
                model: 'elevenlabs', // Premium model
                language: '${language}',
                gender: '${gender}',
                denoise: true
            },
            timeout_seconds: 600
        }
    ],
    [
        {
            option_key: 'voice_name',
            option_label: 'Voice Clone Name',
            option_type: 'text',
            required: true,
            validation_rules: { minLength: 3, maxLength: 50 }
        },
        {
            option_key: 'audio_samples',
            option_label: 'Multiple Voice Samples',
            option_type: 'file',
            required: true,
            help_text: 'Upload 3-5 audio samples for better quality (each 15-60 seconds)'
        },
        {
            option_key: 'language',
            option_label: 'Languages',
            option_type: 'dropdown',
            option_values: [
                { label: 'English', value: 'en' },
                { label: 'Spanish', value: 'es' },
                { label: 'French', value: 'fr' },
                { label: 'German', value: 'de' },
                { label: 'Italian', value: 'it' },
                { label: 'Portuguese', value: 'pt' },
                { label: 'Chinese', value: 'zh' },
                { label: 'Japanese', value: 'ja' }
            ],
            default_value: 'en',
            required: true
        },
        {
            option_key: 'gender',
            option_label: 'Voice Gender',
            option_type: 'radio',
            option_values: [
                { label: 'Male', value: 'male' },
                { label: 'Female', value: 'female' }
            ],
            required: true
        },
        {
            option_key: 'emotion_range',
            option_label: 'Train for Multiple Emotions',
            option_type: 'checkbox',
            default_value: true,
            help_text: 'Enable emotion control (happy, sad, excited, professional)'
        }
    ]
);

// ==========================================================================
// V1: IMAGE GENERATION SKUs
// ==========================================================================

// A1-IG: Instagram Image 1080p
configManager.saveConfig('A1-IG',
    [
        {
            step_order: 0,
            step_name: 'generate_image',
            a2e_endpoint: '/api/v1/userImage2Video/start',
            required: true,
            params_template: {
                image_url: '${source_image}',
                name: '${name}',
                prompt: '${style_prompt}',
                duration: 1 // Minimal for single frame extraction
            },
            timeout_seconds: 180
        }
    ],
    [
        {
            option_key: 'source_image',
            option_label: 'Source Image or Concept',
            option_type: 'file',
            required: true,
            validation_rules: { allowedTypes: ['jpg', 'jpeg', 'png', 'webp'], maxSize: 10485760 }
        },
        {
            option_key: 'style',
            option_label: 'Style',
            option_type: 'dropdown',
            option_values: [
                { label: 'Photo Realistic', value: 'photo' },
                { label: 'Illustration', value: 'illustration' },
                { label: 'Product Shot', value: 'product' }
            ],
            default_value: 'photo'
        },
        {
            option_key: 'aspect_ratio',
            option_label: 'Aspect Ratio',
            option_type: 'radio',
            option_values: [
                { label: 'Square (1:1)', value: '1:1' },
                { label: 'Portrait (4:5)', value: '4:5' },
                { label: 'Landscape (16:9)', value: '16:9' }
            ],
            default_value: '1:1'
        }
    ]
);

// A4-BR: Brand-Styled Image
configManager.saveConfig('A4-BR',
    [
        {
            step_order: 0,
            step_name: 'train_avatar',
            a2e_endpoint: '/api/v1/userVideoTwin/startTraining',
            required: false,
            condition_expression: { field: 'create_custom_avatar', operator: '==', value: true },
            params_template: {
                name: '${brand_name}',
                video_urls: '${brand_samples}',
                model: 'instant'
            },
            timeout_seconds: 600
        },
        {
            step_order: 1,
            step_name: 'generate_image',
            a2e_endpoint: '/api/v1/video/generate',
            required: true,
            params_template: {
                anchor_id: '${avatar_id}',
                resolution: 1080,
                web_bg_width: 1080,
                web_bg_height: 1080,
                anchor_background_color: '${brand_colors}'
            }
        }
    ],
    [
        {
            option_key: 'brand_name',
            option_label: 'Brand Name',
            option_type: 'text',
            required: true,
            validation_rules: { minLength: 2, maxLength: 100 }
        },
        {
            option_key: 'brand_colors',
            option_label: 'Brand Primary Color',
            option_type: 'text',
            required: true,
            help_text: 'Hex code (e.g., #FF5733) or RGB'
        },
        {
            option_key: 'brand_guidelines',
            option_label: 'Brand Guidelines',
            option_type: 'file',
            required: false,
            validation_rules: { allowedTypes: ['pdf', 'jpg', 'png'] }
        },
        {
            option_key: 'style_references',
            option_label: 'Style Reference Images',
            option_type: 'file',
            required: false,
            help_text: 'Upload 3-5 images showing your brand style'
        }
    ]
);

// ==========================================================================
// V7: MULTI-MODAL BUNDLES
// ==========================================================================

// E2-LAUNCHKIT: Brand Launch Kit
configManager.saveConfig('E2-LAUNCHKIT',
    [
        {
            step_order: 0,
            step_name: 'collect_requirements',
            a2e_endpoint: '/internal/collect_requirements', // Internal processing step (not sent to A2E)
            http_method: 'POST',
            required: true,
            params_template: {
                brand_info: '${brand_info}',
                target_audience: '${target_audience}',
                industry: '${industry}'
            },
            timeout_seconds: 60
        }
    ],
    [
        {
            option_key: 'brand_info',
            option_label: 'Brand Information',
            option_type: 'text',
            required: true,
            validation_rules: { minLength: 50, maxLength: 500 },
            help_text: 'Tell us about your brand, mission, and values'
        },
        {
            option_key: 'target_audience',
            option_label: 'Target Audience',
            option_type: 'text',
            required: true,
            validation_rules: { minLength: 20, maxLength: 200 }
        },
        {
            option_key: 'industry',
            option_label: 'Industry',
            option_type: 'dropdown',
            option_values: [
                { label: 'Technology', value: 'tech' },
                { label: 'E-commerce', value: 'ecommerce' },
                { label: 'Healthcare', value: 'healthcare' },
                { label: 'Finance', value: 'finance' },
                { label: 'Education', value: 'education' },
                { label: 'Food & Beverage', value: 'food' },
                { label: 'Fashion', value: 'fashion' },
                { label: 'Real Estate', value: 'realestate' },
                { label: 'Other', value: 'other' }
            ],
            required: true
        },
        {
            option_key: 'logo',
            option_label: 'Brand Logo',
            option_type: 'file',
            required: true,
            validation_rules: { allowedTypes: ['png', 'svg', 'jpg'], maxSize: 5242880 }
        },
        {
            option_key: 'product_photos',
            option_label: 'Product/Service Photos',
            option_type: 'file',
            required: false,
            help_text: 'Upload 5-10 high-quality product images'
        },
        {
            option_key: 'tone',
            option_label: 'Brand Tone',
            option_type: 'radio',
            option_values: [
                { label: 'Professional', value: 'professional' },
                { label: 'Friendly', value: 'friendly' },
                { label: 'Authoritative', value: 'authoritative' },
                { label: 'Playful', value: 'playful' }
            ],
            default_value: 'professional'
        }
    ]
);

console.log('\n✓ Successfully seeded SKU tool configurations');
console.log(`✓ Configured ${configManager.getAllConfiguredSKUs().length} SKUs`);

db.close();
process.exit(0);
