import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../lib/auth';
import axios from 'axios';

const api = axios.create({
    baseURL: process.env.REACT_APP_BACKEND_URL || '',
});

api.interceptors.request.use((config) => {
    const token = localStorage.getItem('auth_token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

export default function CreateNew() {
    const [catalog, setCatalog] = useState(null);
    const [selectedCategory, setSelectedCategory] = useState('image');
    const [selectedTool, setSelectedTool] = useState(null);
    const [file, setFile] = useState(null);
    const [prompt, setPrompt] = useState('');
    const [negativePrompt, setNegativePrompt] = useState('');
    const [textInput, setTextInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [uploadedUrl, setUploadedUrl] = useState(null);
    const { user } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        if (user) {
            loadCatalog();
        }
    }, [user]);

    const loadCatalog = async () => {
        try {
            const { data } = await api.get('/api/web/tool-catalog');
            setCatalog(data);
            
            // Auto-select first tool in first category with items
            const categories = ['image', 'video', 'voice', 'content', 'bundle'];
            for (const cat of categories) {
                if (data.categories[cat] && data.categories[cat].length > 0) {
                    setSelectedCategory(cat);
                    setSelectedTool(data.categories[cat][0]);
                    break;
                }
            }
        } catch (err) {
            console.error('Failed to load catalog:', err);
        }
    };

    const handleFileUpload = async (e) => {
        const uploadedFile = e.target.files[0];
        if (!uploadedFile) return;
        
        setFile(uploadedFile);
        setLoading(true);
        
        try {
            const formData = new FormData();
            formData.append('file', uploadedFile);
            formData.append('type', selectedTool?.sku_code || 'general');
            
            const { data } = await api.post('/api/web/upload', formData);
            setUploadedUrl(data.url);
            setLoading(false);
        } catch (err) {
            alert('Upload failed: ' + err.message);
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!selectedTool || !user) return;
        
        // Check if required inputs are provided
        const requiresImage = selectedTool.inputs.includes('image');
        const requiresText = selectedTool.inputs.includes('text');
        const requiresPrompt = selectedTool.inputs.includes('prompt');
        
        if (requiresImage && !uploadedUrl) {
            alert('Please upload an image first');
            return;
        }
        
        if (requiresText && !textInput) {
            alert('Please provide text input');
            return;
        }
        
        setLoading(true);
        try {
            const options = {};
            if (requiresPrompt && prompt) options.prompt = prompt;
            if (negativePrompt) options.negative_prompt = negativePrompt;
            if (requiresText) options.text = textInput;
            
            const { data } = await api.post('/api/web/process', {
                sku_code: selectedTool.sku_code,
                media_url: uploadedUrl,
                options
            });
            
            navigate(`/status?id=${data.job_id}`);
        } catch (err) {
            alert('Creation failed: ' + err.message);
            setLoading(false);
        }
    };

    const selectTool = (tool) => {
        setSelectedTool(tool);
        setFile(null);
        setUploadedUrl(null);
        setPrompt('');
        setNegativePrompt('');
        setTextInput('');
    };

    if (!user) {
        return (
            <div className="p-8 max-w-4xl mx-auto">
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
                    <h2 className="text-xl font-bold mb-2">Login Required</h2>
                    <p className="text-gray-700 mb-4">Please login to access the ChopShop tools</p>
                    <button
                        onClick={() => navigate('/auth')}
                        className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
                    >
                        Go to Login
                    </button>
                </div>
            </div>
        );
    }

    if (!catalog) {
        return (
            <div className="p-8 max-w-4xl mx-auto">
                <div className="text-center">Loading tools...</div>
            </div>
        );
    }

    const categoryNames = {
        image: '📸 Image Tools',
        video: '🎬 Video Tools',
        voice: '🎙️ Voice & Audio',
        content: '📝 Content & SEO',
        bundle: '💼 Bundles & Packages'
    };

    const requiresImage = selectedTool?.inputs.includes('image');
    const requiresText = selectedTool?.inputs.includes('text');
    const requiresPrompt = selectedTool?.inputs.includes('prompt');
    const requiresAudio = selectedTool?.inputs.includes('audio');

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="max-w-7xl mx-auto p-4 sm:p-8">
                <div className="mb-8">
                    <h1 className="text-3xl sm:text-4xl font-bold mb-2">FaceShot ChopShop</h1>
                    <p className="text-gray-600">Professional AI tools for creators and agencies</p>
                    
                    {catalog.user_plan && (
                        <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-4">
                            <div className="flex justify-between items-center">
                                <div>
                                    <span className="font-semibold">{catalog.user_plan.code} Plan</span>
                                    <span className="text-sm text-gray-600 ml-2">
                                        {catalog.user_plan.remaining_seconds} seconds remaining
                                    </span>
                                </div>
                                <div className="text-sm text-gray-600">
                                    {catalog.user_plan.usage_percent}% used
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Category Selection Sidebar */}
                    <div className="lg:col-span-1">
                        <div className="bg-white rounded-lg shadow-sm p-4 sticky top-4">
                            <h2 className="font-bold text-lg mb-4">Tool Categories</h2>
                            <div className="space-y-2">
                                {Object.keys(categoryNames).map(cat => {
                                    const toolCount = catalog.categories[cat]?.length || 0;
                                    if (toolCount === 0) return null;
                                    
                                    return (
                                        <button
                                            key={cat}
                                            onClick={() => {
                                                setSelectedCategory(cat);
                                                if (catalog.categories[cat].length > 0) {
                                                    selectTool(catalog.categories[cat][0]);
                                                }
                                            }}
                                            className={`w-full text-left px-4 py-3 rounded-lg transition ${
                                                selectedCategory === cat
                                                    ? 'bg-blue-600 text-white'
                                                    : 'bg-gray-100 hover:bg-gray-200'
                                            }`}
                                        >
                                            <div className="font-medium">{categoryNames[cat]}</div>
                                            <div className={`text-sm ${selectedCategory === cat ? 'text-blue-100' : 'text-gray-500'}`}>
                                                {toolCount} tool{toolCount !== 1 ? 's' : ''}
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    </div>

                    {/* Tool Grid */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Available Tools in Category */}
                        <div className="bg-white rounded-lg shadow-sm p-6">
                            <h2 className="font-bold text-xl mb-4">{categoryNames[selectedCategory]}</h2>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {catalog.categories[selectedCategory]?.map(tool => (
                                    <button
                                        key={tool.sku_code}
                                        onClick={() => selectTool(tool)}
                                        className={`text-left p-4 rounded-lg border-2 transition ${
                                            selectedTool?.sku_code === tool.sku_code
                                                ? 'border-blue-600 bg-blue-50'
                                                : 'border-gray-200 hover:border-blue-300'
                                        }`}
                                    >
                                        <div className="flex items-start justify-between mb-2">
                                            <span className="text-2xl">{tool.icon}</span>
                                            <span className="text-sm font-bold text-blue-600">
                                                ${tool.base_price_usd}
                                            </span>
                                        </div>
                                        <h3 className="font-bold mb-1">{tool.name}</h3>
                                        <p className="text-sm text-gray-600">{tool.description}</p>
                                        <div className="mt-2 text-xs text-gray-500">
                                            {tool.base_credits} credits • {tool.vector_name}
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Tool Configuration Form */}
                        {selectedTool && (
                            <div className="bg-white rounded-lg shadow-sm p-6">
                                <form onSubmit={handleSubmit}>
                                    <div className="mb-6">
                                        <h2 className="text-xl font-bold mb-2">
                                            {selectedTool.icon} {selectedTool.display_name}
                                        </h2>
                                        <p className="text-gray-600 mb-2">{selectedTool.description}</p>
                                        <div className="flex items-center gap-4 text-sm">
                                            <span className="font-semibold text-blue-600">
                                                ${selectedTool.base_price_usd}
                                            </span>
                                            <span className="text-gray-500">
                                                {selectedTool.base_credits} credits
                                            </span>
                                        </div>
                                    </div>

                                    {requiresImage && (
                                        <div className="mb-6">
                                            <label className="block mb-2 font-medium">
                                                Upload Image {requiresImage && <span className="text-red-500">*</span>}
                                            </label>
                                            <input
                                                type="file"
                                                accept="image/*"
                                                onChange={handleFileUpload}
                                                className="block w-full text-sm text-gray-500
                                                    file:mr-4 file:py-2 file:px-4
                                                    file:rounded-lg file:border-0
                                                    file:text-sm file:font-semibold
                                                    file:bg-blue-50 file:text-blue-700
                                                    hover:file:bg-blue-100 cursor-pointer"
                                            />
                                            {uploadedUrl && (
                                                <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded text-sm text-green-700">
                                                    ✓ Image uploaded successfully
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {requiresAudio && (
                                        <div className="mb-6">
                                            <label className="block mb-2 font-medium">
                                                Upload Audio {requiresAudio && <span className="text-red-500">*</span>}
                                            </label>
                                            <input
                                                type="file"
                                                accept="audio/*"
                                                onChange={handleFileUpload}
                                                className="block w-full text-sm text-gray-500
                                                    file:mr-4 file:py-2 file:px-4
                                                    file:rounded-lg file:border-0
                                                    file:text-sm file:font-semibold
                                                    file:bg-blue-50 file:text-blue-700
                                                    hover:file:bg-blue-100 cursor-pointer"
                                            />
                                        </div>
                                    )}

                                    {requiresPrompt && (
                                        <div className="mb-6">
                                            <label className="block mb-2 font-medium">
                                                Prompt {requiresPrompt && <span className="text-red-500">*</span>}
                                            </label>
                                            <textarea
                                                value={prompt}
                                                onChange={e => setPrompt(e.target.value)}
                                                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                rows="3"
                                                placeholder="Describe what you want to create..."
                                            />
                                        </div>
                                    )}

                                    {(requiresPrompt || selectedCategory === 'video') && (
                                        <div className="mb-6">
                                            <label className="block mb-2 font-medium">
                                                Negative Prompt (Optional)
                                            </label>
                                            <textarea
                                                value={negativePrompt}
                                                onChange={e => setNegativePrompt(e.target.value)}
                                                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                rows="2"
                                                placeholder="What to avoid in the generation..."
                                            />
                                        </div>
                                    )}

                                    {requiresText && (
                                        <div className="mb-6">
                                            <label className="block mb-2 font-medium">
                                                Text Content {requiresText && <span className="text-red-500">*</span>}
                                            </label>
                                            <textarea
                                                value={textInput}
                                                onChange={e => setTextInput(e.target.value)}
                                                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                rows="6"
                                                placeholder="Enter the text content for this tool..."
                                            />
                                        </div>
                                    )}

                                    <button
                                        type="submit"
                                        disabled={loading}
                                        className="w-full bg-blue-600 text-white py-3 rounded-lg font-bold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
                                    >
                                        {loading ? 'Processing...' : `Create with ${selectedTool.name}`}
                                    </button>

                                    {!catalog.user_plan && (
                                        <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-sm">
                                            <strong>Note:</strong> You'll be charged ${selectedTool.base_price_usd} for this creation.
                                            Consider subscribing to a plan for better rates.
                                        </div>
                                    )}
                                </form>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
