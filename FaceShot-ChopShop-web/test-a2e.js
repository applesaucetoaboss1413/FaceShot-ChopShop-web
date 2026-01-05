const A2EService = require('./services/a2e')

async function testA2EService() {
    const apiKey = process.env.A2E_API_KEY || 'test-key'
    const baseURL = process.env.A2E_BASE_URL || 'https://video.a2e.ai'
    
    console.log('Testing A2E Service Integration...')
    console.log('API Key:', apiKey.substring(0, 10) + '...')
    console.log('Base URL:', baseURL)
    console.log('')
    
    const service = new A2EService(apiKey, baseURL)
    
    try {
        console.log('1. Testing getUserInfo()...')
        const userInfo = await service.getUserInfo()
        console.log('✓ User Info:', JSON.stringify(userInfo, null, 2))
    } catch (error) {
        console.log('✗ getUserInfo() failed:', error.message)
        if (error.response?.data) {
            console.log('  Response:', JSON.stringify(error.response.data, null, 2))
        }
    }
    
    console.log('')
    console.log('2. Testing startTask() method routing...')
    
    const testCases = [
        { type: 'faceswap', url: 'https://example.com/face.jpg', options: { videoUrl: 'https://example.com/video.mp4' } },
        { type: 'img2vid', url: 'https://example.com/image.jpg', options: { prompt: 'test prompt' } },
        { type: 'enhance', url: 'https://example.com/image.jpg', options: {} },
        { type: 'bgremove', url: 'https://example.com/image.jpg', options: {} },
        { type: 'avatar', url: 'https://example.com/image.jpg', options: {} }
    ]
    
    for (const testCase of testCases) {
        try {
            console.log(`  Testing ${testCase.type}...`)
            const result = await service.startTask(testCase.type, testCase.url, testCase.options)
            console.log(`  ✓ ${testCase.type} task created:`, result.data?._id || 'unknown id')
        } catch (error) {
            console.log(`  ✗ ${testCase.type} failed:`, error.message)
            if (error.response?.data) {
                console.log('    Response:', JSON.stringify(error.response.data, null, 2))
            }
        }
    }
    
    console.log('')
    console.log('3. Testing getTaskStatus() method routing...')
    
    const statusTestCases = [
        { type: 'faceswap', taskId: 'test-id-123' },
        { type: 'img2vid', taskId: 'test-id-123' },
        { type: 'enhance', taskId: 'test-id-123' },
        { type: 'bgremove', taskId: 'test-id-123' },
        { type: 'avatar', taskId: 'test-id-123' }
    ]
    
    for (const testCase of statusTestCases) {
        try {
            console.log(`  Testing ${testCase.type} status...`)
            const result = await service.getTaskStatus(testCase.type, testCase.taskId)
            console.log(`  ✓ ${testCase.type} status retrieved:`, result.data?.current_status || 'unknown status')
        } catch (error) {
            console.log(`  ✗ ${testCase.type} status failed:`, error.message)
        }
    }
    
    console.log('')
    console.log('Test completed!')
}

testA2EService().catch(console.error)
