import React, { useState, useEffect } from 'react';
import { getSystemPrompt, updateSystemPrompt } from '../../api';

const SystemPromptEditor = () => {
    const [prompt, setPrompt] = useState('');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });

    useEffect(() => {
        fetchPrompt();
    }, []);

    const fetchPrompt = async () => {
        try {
            const res = await getSystemPrompt();
            setPrompt(res.data.prompt);
        } catch (err) {
            setMessage({ type: 'error', text: 'Failed to load system prompt' });
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        setSaving(true);
        setMessage({ type: '', text: '' });
        try {
            await updateSystemPrompt(prompt);
            setMessage({ type: 'success', text: 'System prompt updated successfully!' });
        } catch (err) {
            setMessage({ type: 'error', text: 'Failed to update system prompt' });
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div className="p-8 text-center text-gray-500">Loading editor...</div>;

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-6 border-bottom border-gray-100">
                <h3 className="text-xl font-bold text-gray-900">Guruji Prompt Configuration</h3>
                <p className="text-sm text-gray-500 mt-1">
                    This prompt defines the core personality and rules for the Astrology Guruji.
                </p>
            </div>

            <div className="p-6 space-y-4">
                {message.text && (
                    <div className={`p-3 rounded-md text-sm ${message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                        {message.text}
                    </div>
                )}

                <textarea
                    className="w-full h-80 p-4 font-mono text-sm text-gray-800 border border-gray-200 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all outline-none"
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="Enter system prompt here..."
                />

                <div className="flex justify-end">
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50"
                    >
                        {saving ? 'Saving...' : 'Save Configuration'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default SystemPromptEditor;
