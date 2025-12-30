import React, { useState } from 'react';
import { WallPost } from '../types';
import { Badge } from './common/Atomic';

const MOCK_POSTS: WallPost[] = [
    {
        id: '1',
        author: 'Dr. Fernando',
        role: 'PHYSIO',
        content: 'Mateo reportó rigidez en isquio derecho post-sesión. Recomiendo reducir volumen de velocidad mañana al 70%.',
        timestamp: '10:45 AM',
        tags: ['#Medical', '#Alert'],
        likes: 2
    },
    {
        id: '2',
        author: 'Coach Alex',
        role: 'HEAD COACH',
        content: 'Recibido. Ajustaré el plan en el Data Ring. @BioLab necesito video análisis de su técnica de salida, sospecho overstriding.',
        timestamp: '11:02 AM',
        tags: ['#Training', '#Strategy'],
        likes: 1
    }
];

const StaffWall: React.FC = () => {
    const [posts, setPosts] = useState<WallPost[]>(MOCK_POSTS);
    const [newPost, setNewPost] = useState('');
    const [selectedTag, setSelectedTag] = useState('#General');

    const handlePost = () => {
        if (!newPost.trim()) return;
        const post: WallPost = {
            id: Date.now().toString(),
            author: 'Coach David', // Current User
            role: 'HEAD COACH',
            content: newPost,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            tags: [selectedTag],
            likes: 0
        };
        setPosts([...posts, post]);
        setNewPost('');
    };

    return (
        <div className="h-full flex flex-col bg-background">
            {/* Header */}
            <div className="p-4 lg:p-6 border-b border-white/10 bg-surface flex justify-between items-center shrink-0">
                <div>
                    <h1 className="text-xl lg:text-2xl font-black font-display text-white uppercase italic tracking-tighter flex items-center gap-2">
                        Staff Wall
                        <Badge variant="volt">LIVE</Badge>
                    </h1>
                    <p className="text-slate-500 text-xs font-mono uppercase tracking-widest mt-1">Canal Seguro de Comunicación Técnica</p>
                </div>
                <div className="flex -space-x-2">
                    <div className="size-8 rounded-full bg-slate-700 border-2 border-surface flex items-center justify-center text-[10px] text-white">CD</div>
                    <div className="size-8 rounded-full bg-indigo-900 border-2 border-surface flex items-center justify-center text-[10px] text-white">DF</div>
                    <div className="size-8 rounded-full bg-emerald-900 border-2 border-surface flex items-center justify-center text-[10px] text-white">CA</div>
                </div>
            </div>

            {/* Feed */}
            <div className="flex-1 overflow-y-auto custom-scrollbar p-4 lg:p-6 space-y-6">
                {posts.map((post) => (
                    <div key={post.id} className="flex gap-4 animate-in fade-in slide-in-from-bottom-4">
                        <div className="flex flex-col items-center gap-2">
                            <div className={`size-10 rounded-full flex items-center justify-center text-xs font-bold border-2 border-surface 
                                ${post.role === 'HEAD COACH' ? 'bg-primary text-white' : post.role === 'PHYSIO' ? 'bg-danger text-white' : 'bg-slate-700 text-slate-300'}`}>
                                {post.author.charAt(0)}
                            </div>
                            <div className="h-full w-0.5 bg-white/5 rounded-full"></div>
                        </div>
                        <div className="flex-1 pb-6">
                            <div className="flex items-center gap-2 mb-1">
                                <span className="text-sm font-bold text-white uppercase tracking-wide">{post.author}</span>
                                <span className="text-[9px] font-mono text-slate-500 bg-white/5 px-1.5 py-0.5 rounded">{post.role}</span>
                                <span className="text-[9px] text-slate-600 font-mono ml-auto">{post.timestamp}</span>
                            </div>
                            <div className="bg-[#1C1C1E] border border-white/5 p-4 rounded-r-xl rounded-bl-xl text-sm text-slate-300 font-mono leading-relaxed shadow-sm">
                                {post.content}
                            </div>
                            <div className="flex items-center gap-4 mt-2 ml-1">
                                {post.tags.map(tag => (
                                    <span key={tag} className="text-[10px] font-bold text-primary uppercase tracking-wider">{tag}</span>
                                ))}
                                <button className="flex items-center gap-1 text-[10px] text-slate-500 hover:text-white transition-colors ml-auto">
                                    <span className="material-symbols-outlined text-sm">thumb_up</span> {post.likes || ''}
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Input Area */}
            <div className="p-4 lg:p-6 bg-surface border-t border-white/10 shrink-0 pb-24 lg:pb-6">
                <div className="flex flex-col gap-3">
                    <div className="flex gap-2">
                        {['#General', '#Medical', '#Training', '#Urgent'].map(tag => (
                            <button 
                                key={tag}
                                onClick={() => setSelectedTag(tag)}
                                className={`text-[9px] font-bold uppercase px-3 py-1 rounded-full border transition-all ${selectedTag === tag ? 'bg-white text-black border-white' : 'text-slate-500 border-white/10 hover:border-white/30'}`}
                            >
                                {tag}
                            </button>
                        ))}
                    </div>
                    <div className="relative flex items-center">
                        <textarea 
                            value={newPost}
                            onChange={(e) => setNewPost(e.target.value)}
                            onKeyDown={(e) => { if(e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handlePost(); }}}
                            placeholder="Escribe una observación técnica..." 
                            className="w-full bg-black border border-white/20 rounded-xl p-4 pr-14 text-sm text-white font-mono focus:border-primary outline-none resize-none h-14 min-h-[56px] custom-scrollbar"
                        />
                        <button 
                            onClick={handlePost}
                            disabled={!newPost.trim()}
                            className="absolute right-2 p-2 bg-primary text-white rounded-lg hover:bg-primary-dark disabled:opacity-50 disabled:bg-slate-700 transition-all"
                        >
                            <span className="material-symbols-outlined text-lg">send</span>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default StaffWall;