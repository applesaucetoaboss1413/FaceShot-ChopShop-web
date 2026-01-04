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
                case 'faceswap':
                    return await this.startFaceSwap(mediaUrl, options)
                case 'img2vid':
                    return await this.startImage2Video(mediaUrl, options)
                case 'enhance':
                    return await this.startEnhancement(mediaUrl, options)
                case 'bgremove':
                    return await this.startBackgroundRemoval(mediaUrl, options)
                case 'avatar':
                    return await this.startAvatarCreation(mediaUrl, options)
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

    async startAvatarCreation(mediaUrl, options = {}) {
        const { name } = options

        try {
            const response = await this.client.post('/api/v1/userAvatar/create', {
                media_url: mediaUrl,
                name: name || `avatar_${Date.now()}`
            })
            
            logger.info({ msg: 'a2e_avatar_started', task_id: response.data?.data?._id })
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
