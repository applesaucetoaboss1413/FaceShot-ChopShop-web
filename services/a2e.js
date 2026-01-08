const axios = require('axios')
const winston = require('winston')

const logger = winston.createLogger({
    level: process.env.LOG_LEVEL || 'info',
    format: winston.format.json(),
    transports: [new winston.transports.Console()]
})

class A2EService {
    constructor(apiKey, baseURL) {
        this.apiKey = apiKey
        this.baseURL = baseURL || 'https://video.a2e.ai'
        this.client = axios.create({
            baseURL: this.baseURL,
            headers: {
                'Authorization': `Bearer ${this.apiKey}`,
                'Content-Type': 'application/json'
            },
            timeout: 30000
        })
    }

    async startTask(type, mediaUrl, options = {}) {
        try {
            switch (type) {
                // Image Tools
                case 'faceswap':
                    return await this.startFaceSwap(mediaUrl, options)
                case 'enhance':
                    return await this.startEnhancement(mediaUrl, options)
                case 'bgremove':
                    return await this.startBackgroundRemoval(mediaUrl, options)
                case 'text2img':
                    return await this.startTextToImage(options)
                case 'nano_banana':
                    return await this.startNanoBanana(options)
                
                // Video Tools
                case 'img2vid':
                    return await this.startImage2Video(mediaUrl, options)
                case 'vid2vid':
                    return await this.startVideoToVideo(mediaUrl, options)
                case 'talking_photo':
                    return await this.startTalkingPhoto(mediaUrl, options)
                case 'talking_video':
                    return await this.startTalkingVideo(mediaUrl, options)
                case 'caption_removal':
                    return await this.startCaptionRemoval(mediaUrl, options)
                
                // Avatar Tools
                case 'avatar':
                case 'avatar_video':
                    return await this.startAvatarVideo(options)
                case 'create_avatar':
                    return await this.createCustomAvatar(mediaUrl, options)
                
                // Voice Tools
                case 'tts':
                    return await this.generateTTS(options)
                case 'voice_clone':
                    return await this.trainVoiceClone(mediaUrl, options)
                case 'dubbing':
                    return await this.startDubbing(mediaUrl, options)
                
                // Other Tools
                case 'virtual_tryon':
                    return await this.startVirtualTryOn(options)
                case 'product_avatar':
                    return await this.startProductAvatar(options)
                
                default:
                    throw new Error(`Unsupported task type: ${type}`)
            }
        } catch (error) {
            logger.error({ 
                msg: 'a2e_start_task_error', 
                type, 
                error: error.message,
                response: error.response?.data 
            })
            throw error
        }
    }

    async startFaceSwap(faceUrl, options = {}) {
        const { videoUrl, name } = options
        
        if (!videoUrl) {
            throw new Error('videoUrl is required for faceswap')
        }

        try {
            const response = await this.client.post('/api/v1/userFaceSwapTask/add', {
                face_url: faceUrl,
                video_url: videoUrl,
                name: name || `faceswap_${Date.now()}`
            })
            
            logger.info({ msg: 'a2e_faceswap_started', task_id: response.data?.data?._id })
            return response.data
        } catch (error) {
            logger.error({ 
                msg: 'a2e_faceswap_error', 
                error: error.message,
                response: error.response?.data 
            })
            throw error
        }
    }

    async startImage2Video(imageUrl, options = {}) {
        const { prompt, negative_prompt, name } = options

        try {
            const response = await this.client.post('/api/v1/userImage2Video/start', {
                image_url: imageUrl,
                name: name || `img2vid_${Date.now()}`,
                prompt: prompt || 'person speaking, looking at camera',
                negative_prompt: negative_prompt || 'bad quality, blurry'
            })
            
            logger.info({ msg: 'a2e_img2vid_started', task_id: response.data?.data?._id })
            return response.data
        } catch (error) {
            logger.error({ 
                msg: 'a2e_img2vid_error', 
                error: error.message,
                response: error.response?.data 
            })
            throw error
        }
    }

    async startEnhancement(imageUrl, options = {}) {
        const { name } = options

        try {
            const response = await this.client.post('/api/v1/userWatermark/add', {
                media_url: imageUrl,
                name: name || `enhance_${Date.now()}`,
                operation: 'enhance'
            })
            
            logger.info({ msg: 'a2e_enhance_started', task_id: response.data?.data?._id })
            return response.data
        } catch (error) {
            logger.error({ 
                msg: 'a2e_enhance_error', 
                error: error.message,
                response: error.response?.data 
            })
            throw error
        }
    }

    async startBackgroundRemoval(imageUrl, options = {}) {
        const { name } = options

        try {
            const response = await this.client.post('/api/v1/userMatting/add', {
                media_url: imageUrl,
                name: name || `bgremove_${Date.now()}`
            })
            
            logger.info({ msg: 'a2e_bgremove_started', task_id: response.data?.data?._id })
            return response.data
        } catch (error) {
            logger.error({ 
                msg: 'a2e_bgremove_error', 
                error: error.message,
                response: error.response?.data 
            })
            throw error
        }
    }

    // ===== AVATAR VIDEO GENERATION =====
    async startAvatarVideo(options = {}) {
        const { 
            avatar_id, 
            voice_id, 
            script, 
            video_length,
            resolution = '1080p',
            aspect_ratio = '16:9',
            background_music,
            name 
        } = options

        try {
            const response = await this.client.post('/api/v1/userVideo/create', {
                avatar_id,
                voice_id,
                script,
                video_length,
                resolution,
                aspect_ratio,
                background_music,
                name: name || `avatar_video_${Date.now()}`
            })
            
            logger.info({ msg: 'a2e_avatar_video_started', task_id: response.data?.data?._id })
            return response.data
        } catch (error) {
            logger.error({ 
                msg: 'a2e_avatar_video_error', 
                error: error.message,
                response: error.response?.data 
            })
            throw error
        }
    }

    async createCustomAvatar(mediaUrl, options = {}) {
        const { name, type = 'image' } = options

        try {
            const response = await this.client.post('/api/v1/userAvatar/create', {
                media_url: mediaUrl,
                type,
                name: name || `avatar_${Date.now()}`
            })
            
            logger.info({ msg: 'a2e_avatar_created', task_id: response.data?.data?._id })
            return response.data
        } catch (error) {
            logger.error({ 
                msg: 'a2e_avatar_error', 
                error: error.message,
                response: error.response?.data 
            })
            throw error
        }
    }

    // ===== TEXT TO IMAGE =====
    async startTextToImage(options = {}) {
        const { 
            prompt, 
            negative_prompt,
            style,
            resolution = '1024x1024',
            num_images = 1,
            name 
        } = options

        try {
            const response = await this.client.post('/api/v1/userText2Image/start', {
                prompt,
                negative_prompt,
                style,
                resolution,
                num_images,
                name: name || `text2img_${Date.now()}`
            })
            
            logger.info({ msg: 'a2e_text2img_started', task_id: response.data?.data?._id })
            return response.data
        } catch (error) {
            logger.error({ 
                msg: 'a2e_text2img_error', 
                error: error.message,
                response: error.response?.data 
            })
            throw error
        }
    }

    // ===== NANO BANANA (Gemini Image Generation) =====
    async startNanoBanana(options = {}) {
        const { 
            prompt,
            image_url,
            operation = 'generate', // 'generate' or 'edit'
            aspect_ratio = '1:1',
            name 
        } = options

        try {
            const response = await this.client.post('/api/v1/userNanoBanana/start', {
                prompt,
                image_url,
                operation,
                aspect_ratio,
                name: name || `nano_banana_${Date.now()}`
            })
            
            logger.info({ msg: 'a2e_nano_banana_started', task_id: response.data?.data?._id })
            return response.data
        } catch (error) {
            logger.error({ 
                msg: 'a2e_nano_banana_error', 
                error: error.message,
                response: error.response?.data 
            })
            throw error
        }
    }

    // ===== VIDEO TO VIDEO =====
    async startVideoToVideo(videoUrl, options = {}) {
        const { 
            prompt,
            style,
            strength = 0.7,
            name 
        } = options

        try {
            const response = await this.client.post('/api/v1/userVideo2Video/start', {
                video_url: videoUrl,
                prompt,
                style,
                strength,
                name: name || `vid2vid_${Date.now()}`
            })
            
            logger.info({ msg: 'a2e_vid2vid_started', task_id: response.data?.data?._id })
            return response.data
        } catch (error) {
            logger.error({ 
                msg: 'a2e_vid2vid_error', 
                error: error.message,
                response: error.response?.data 
            })
            throw error
        }
    }

    // ===== TALKING PHOTO =====
    async startTalkingPhoto(imageUrl, options = {}) {
        const { 
            audio_url,
            voice_text,
            voice_id,
            duration = 15,
            name 
        } = options

        try {
            const response = await this.client.post('/api/v1/userTalkingPhoto/start', {
                image_url: imageUrl,
                audio_url,
                voice_text,
                voice_id,
                duration,
                name: name || `talking_photo_${Date.now()}`
            })
            
            logger.info({ msg: 'a2e_talking_photo_started', task_id: response.data?.data?._id })
            return response.data
        } catch (error) {
            logger.error({ 
                msg: 'a2e_talking_photo_error', 
                error: error.message,
                response: error.response?.data 
            })
            throw error
        }
    }

    // ===== TALKING VIDEO =====
    async startTalkingVideo(videoUrl, options = {}) {
        const { 
            audio_url,
            voice_text,
            voice_id,
            name 
        } = options

        try {
            const response = await this.client.post('/api/v1/userTalkingVideo/start', {
                video_url: videoUrl,
                audio_url,
                voice_text,
                voice_id,
                name: name || `talking_video_${Date.now()}`
            })
            
            logger.info({ msg: 'a2e_talking_video_started', task_id: response.data?.data?._id })
            return response.data
        } catch (error) {
            logger.error({ 
                msg: 'a2e_talking_video_error', 
                error: error.message,
                response: error.response?.data 
            })
            throw error
        }
    }

    // ===== TTS (Text-to-Speech) =====
    async generateTTS(options = {}) {
        const { 
            text,
            voice_id,
            voice_type = 'professional',
            language = 'en-US',
            speed = 1.0,
            pitch = 1.0,
            name 
        } = options

        try {
            const response = await this.client.post('/api/v1/userTTS/generate', {
                text,
                voice_id,
                voice_type,
                language,
                speed,
                pitch,
                name: name || `tts_${Date.now()}`
            })
            
            logger.info({ msg: 'a2e_tts_started', task_id: response.data?.data?._id })
            return response.data
        } catch (error) {
            logger.error({ 
                msg: 'a2e_tts_error', 
                error: error.message,
                response: error.response?.data 
            })
            throw error
        }
    }

    // ===== VOICE CLONE =====
    async trainVoiceClone(audioUrl, options = {}) {
        const { 
            name,
            quality = 'standard', // 'standard' or 'professional'
            emotion_control = false
        } = options

        try {
            const response = await this.client.post('/api/v1/userVoiceClone/train', {
                audio_url: audioUrl,
                name: name || `voice_clone_${Date.now()}`,
                quality,
                emotion_control
            })
            
            logger.info({ msg: 'a2e_voice_clone_started', task_id: response.data?.data?._id })
            return response.data
        } catch (error) {
            logger.error({ 
                msg: 'a2e_voice_clone_error', 
                error: error.message,
                response: error.response?.data 
            })
            throw error
        }
    }

    // ===== AI DUBBING =====
    async startDubbing(videoUrl, options = {}) {
        const { 
            target_language,
            voice_type = 'auto',
            preserve_timing = true,
            name 
        } = options

        try {
            const response = await this.client.post('/api/v1/userDubbing/start', {
                video_url: videoUrl,
                target_language,
                voice_type,
                preserve_timing,
                name: name || `dubbing_${Date.now()}`
            })
            
            logger.info({ msg: 'a2e_dubbing_started', task_id: response.data?.data?._id })
            return response.data
        } catch (error) {
            logger.error({ 
                msg: 'a2e_dubbing_error', 
                error: error.message,
                response: error.response?.data 
            })
            throw error
        }
    }

    // ===== CAPTION REMOVAL =====
    async startCaptionRemoval(videoUrl, options = {}) {
        const { name } = options

        try {
            const response = await this.client.post('/api/v1/userCaptionRemoval/start', {
                video_url: videoUrl,
                name: name || `caption_removal_${Date.now()}`
            })
            
            logger.info({ msg: 'a2e_caption_removal_started', task_id: response.data?.data?._id })
            return response.data
        } catch (error) {
            logger.error({ 
                msg: 'a2e_caption_removal_error', 
                error: error.message,
                response: error.response?.data 
            })
            throw error
        }
    }

    // ===== VIRTUAL TRY-ON =====
    async startVirtualTryOn(options = {}) {
        const { 
            person_image_url,
            garment_image_url,
            category = 'upper_body',
            name 
        } = options

        try {
            const response = await this.client.post('/api/v1/userVirtualTryOn/start', {
                person_image_url,
                garment_image_url,
                category,
                name: name || `virtual_tryon_${Date.now()}`
            })
            
            logger.info({ msg: 'a2e_virtual_tryon_started', task_id: response.data?.data?._id })
            return response.data
        } catch (error) {
            logger.error({ 
                msg: 'a2e_virtual_tryon_error', 
                error: error.message,
                response: error.response?.data 
            })
            throw error
        }
    }

    // ===== PRODUCT AVATAR =====
    async startProductAvatar(options = {}) {
        const { 
            product_image_url,
            avatar_style,
            background,
            name 
        } = options

        try {
            const response = await this.client.post('/api/v1/userProductAvatar/start', {
                product_image_url,
                avatar_style,
                background,
                name: name || `product_avatar_${Date.now()}`
            })
            
            logger.info({ msg: 'a2e_product_avatar_started', task_id: response.data?.data?._id })
            return response.data
        } catch (error) {
            logger.error({ 
                msg: 'a2e_product_avatar_error', 
                error: error.message,
                response: error.response?.data 
            })
            throw error
        }
    }

    async getTaskStatus(type, taskId) {
        try {
            let endpoint
            
            switch (type) {
                case 'faceswap':
                    endpoint = `/api/v1/userFaceSwapTask/get/${taskId}`
                    break
                case 'img2vid':
                    endpoint = `/api/v1/userImage2Video/get/${taskId}`
                    break
                case 'enhance':
                    endpoint = `/api/v1/userWatermark/get/${taskId}`
                    break
                case 'bgremove':
                    endpoint = `/api/v1/userMatting/get/${taskId}`
                    break
                case 'avatar':
                    endpoint = `/api/v1/userAvatar/get/${taskId}`
                    break
                default:
                    throw new Error(`Unsupported task type: ${type}`)
            }

            const response = await this.client.get(endpoint)
            
            logger.info({ 
                msg: 'a2e_status_check', 
                type, 
                task_id: taskId, 
                status: response.data?.data?.current_status 
            })
            
            return response.data
        } catch (error) {
            logger.error({ 
                msg: 'a2e_status_error', 
                type, 
                task_id: taskId, 
                error: error.message,
                response: error.response?.data 
            })
            throw error
        }
    }

    async cancelTask(type, taskId) {
        try {
            let endpoint
            
            switch (type) {
                case 'faceswap':
                    endpoint = `/api/v1/userFaceSwapTask/cancel/${taskId}`
                    break
                case 'img2vid':
                    endpoint = `/api/v1/userImage2Video/cancel/${taskId}`
                    break
                case 'enhance':
                    endpoint = `/api/v1/userWatermark/cancel/${taskId}`
                    break
                case 'bgremove':
                    endpoint = `/api/v1/userMatting/cancel/${taskId}`
                    break
                case 'avatar':
                    endpoint = `/api/v1/userAvatar/cancel/${taskId}`
                    break
                default:
                    throw new Error(`Unsupported task type: ${type}`)
            }

            const response = await this.client.post(endpoint)
            
            logger.info({ msg: 'a2e_task_cancelled', type, task_id: taskId })
            return response.data
        } catch (error) {
            logger.error({ 
                msg: 'a2e_cancel_error', 
                type, 
                task_id: taskId, 
                error: error.message,
                response: error.response?.data 
            })
            throw error
        }
    }

    async getUserInfo() {
        try {
            const response = await this.client.get('/api/v1/user/info')
            logger.info({ msg: 'a2e_user_info', data: response.data })
            return response.data
        } catch (error) {
            logger.error({ 
                msg: 'a2e_user_info_error', 
                error: error.message,
                response: error.response?.data 
            })
            throw error
        }
    }
}

module.exports = A2EService
