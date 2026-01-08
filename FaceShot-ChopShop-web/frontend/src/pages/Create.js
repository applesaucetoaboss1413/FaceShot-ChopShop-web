import React, { useEffect, useState } from 'react';
import { getCatalog, uploadFile, processJob } from '../lib/api';
import { useAuth } from '../lib/auth';
import { useNavigate } from 'react-router-dom';

export default function Create() {
    const [catalog, setCatalog] = useState([]);
    const [selectedTool, setSelectedTool] = useState(null);
    const [file, setFile] = useState(null);
    const [prompt, setPrompt] = useState('');
    const [negativePrompt, setNegativePrompt] = useState('');
    const [loading, setLoading] = useState(false);
    const { user } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        getCatalog().then(res => {
            setCatalog(res.data);
            if (res.data.length > 0) setSelectedTool(res.data[0].key);
        });
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!file || !user) return;
        setLoading(true);
        try {
            // 1. Upload
            await uploadFile(file, selectedTool, user.id);
            // 2. Process
            const options = selectedTool === 'img2vid' ? { prompt, negative_prompt: negativePrompt } : {};
            const { data } = await processJob(selectedTool, options);
            // 3. Redirect to status
            navigate(`/status?id=${data.job_id}`);
        } catch (err) {
            alert('Creation failed: ' + err.message);
            setLoading(false);
        }
    };

    if (!user) return <div className="p-8">Please login first.</div>;

    return (
        <div className="p-8 max-w-2xl mx-auto">
            <h1 className="text-3xl font-bold mb-6">Create New</h1>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2 mb-8">
                {catalog.map(tool => (
                    <button
                        key={tool.key}
                        onClick={() => setSelectedTool(tool.key)}
                        className={`p-3 rounded-lg text-center transition-all ${selectedTool === tool.key
                                ? 'bg-black text-white shadow-lg scale-105'
                                : 'bg-gray-50 hover:bg-gray-100 border border-gray-200'
                            }`}
                    >
                        <div className="text-3xl mb-1">{tool.icon}</div>
                        <div className="text-xs font-medium">{tool.name}</div>
                    </button>
                ))}
            </div>

            <form onSubmit={handleSubmit} className="border p-8 rounded-lg shadow-sm">
                <h2 className="text-xl font-bold mb-4 capitalize">
                    {catalog.find(c => c.key === selectedTool)?.name || 'Select Tool'}
                </h2>
                <p className="text-gray-600 mb-6">
                    {catalog.find(c => c.key === selectedTool)?.description}
                </p>

                <div className="mb-6">
                    <label className="block mb-2 font-medium">Upload Image/Video</label>
                    <input
                        type="file"
                        onChange={e => setFile(e.target.files[0])}
                        className="block w-full text-sm text-gray-500
              file:mr-4 file:py-2 file:px-4
              file:rounded-full file:border-0
              file:text-sm file:font-semibold
              file:bg-blue-50 file:text-blue-700
              hover:file:bg-blue-100"
                        required
                    />
                </div>

                {selectedTool === 'img2vid' && (
                    <>
                        <div className="mb-6">
                            <label className="block mb-2 font-medium">Prompt</label>
                            <textarea
                                value={prompt}
                                onChange={e => setPrompt(e.target.value)}
                                className="w-full border rounded px-3 py-2"
                                rows="3"
                                placeholder="Describe the motion or style you want..."
                            />
                        </div>
                        <div className="mb-6">
                            <label className="block mb-2 font-medium">Negative Prompt (Optional)</label>
                            <textarea
                                value={negativePrompt}
                                onChange={e => setNegativePrompt(e.target.value)}
                                className="w-full border rounded px-3 py-2"
                                rows="2"
                                placeholder="What to avoid in the generation..."
                            />
                        </div>
                    </>
                )}

                <button
                    type="submit"
                    disabled={loading || !file}
                    className="w-full bg-blue-600 text-white py-3 rounded font-bold hover:bg-blue-700 disabled:opacity-50"
                >
                    {loading ? 'Processing...' : 'Start Creation'}
                </button>
            </form>
        </div>
    );
}
