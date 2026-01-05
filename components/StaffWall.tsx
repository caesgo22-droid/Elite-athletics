import React, { useState, useRef } from 'react';
import { WallPost, FileAttachment, WallComment } from '../types';
import { Badge } from './common/Atomic';
import { uploadMultipleFiles, formatFileSize, getFileIcon } from '../services/fileUpload';

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
    const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
    const [uploading, setUploading] = useState(false);
    const [expandedComments, setExpandedComments] = useState<Set<string>>(new Set());
    const [newComment, setNewComment] = useState<Record<string, string>>({});
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handlePost = async () => {
        if (!newPost.trim() && selectedFiles.length === 0) return;

        setUploading(true);
        let attachments: FileAttachment[] = [];

        try {
            // Upload files if any
            if (selectedFiles.length > 0) {
                const postId = Date.now().toString();
                attachments = await uploadMultipleFiles(selectedFiles, '1', postId);
            }

            const post: WallPost = {
                id: Date.now().toString(),
                author: 'Coach David',
                role: 'HEAD COACH',
                content: newPost,
                timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                tags: [selectedTag],
                likes: 0,
                attachments: attachments.length > 0 ? attachments : undefined,
                comments: []
            };

            setPosts([...posts, post]);
            setNewPost('');
            setSelectedFiles([]);
        } catch (error) {
            console.error('Error posting:', error);
            alert('Error al subir archivos. Intenta de nuevo.');
        } finally {
            setUploading(false);
        }
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            setSelectedFiles(Array.from(e.target.files));
        }
    };

    const removeFile = (index: number) => {
        setSelectedFiles(prev => prev.filter((_, i) => i !== index));
    };

    const toggleComments = (postId: string) => {
        setExpandedComments(prev => {
            const newSet = new Set(prev);
            if (newSet.has(postId)) {
                newSet.delete(postId);
            } else {
                newSet.add(postId);
            }
            return newSet;
        });
    };

    const handleAddComment = (postId: string) => {
        const content = newComment[postId]?.trim();
        if (!content) return;

        const comment: WallComment = {
            id: Date.now().toString(),
            author: 'Coach David',
            role: 'HEAD COACH',
            content,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            likes: 0
        };

        setPosts(prev => prev.map(post => {
            if (post.id === postId) {
                return {
                    ...post,
                    comments: [...(post.comments || []), comment]
                };
            }
            return post;
        }));

        setNewComment(prev => ({ ...prev, [postId]: '' }));
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
                                {(post.comments && post.comments.length > 0) && (
                                    <button
                                        onClick={() => toggleComments(post.id)}
                                        className="flex items-center gap-1 text-[10px] text-slate-500 hover:text-primary transition-colors"
                                    >
                                        <span className="material-symbols-outlined text-sm">chat_bubble</span> {post.comments.length}
                                    </button>
                                )}
                            </div>

                            {/* Attachments */}
                            {post.attachments && post.attachments.length > 0 && (
                                <div className="mt-3 space-y-2">
                                    {post.attachments.map(file => (
                                        <a
                                            key={file.id}
                                            href={file.url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="flex items-center gap-3 bg-white/5 border border-white/10 p-3 rounded-lg hover:bg-white/10 hover:border-primary/30 transition-all group"
                                        >
                                            <div className="size-10 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                                                <span className="material-symbols-outlined text-primary text-lg">{getFileIcon(file.type)}</span>
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-xs font-bold text-white truncate">{file.name}</p>
                                                <p className="text-[10px] text-slate-500">{formatFileSize(file.size)}</p>
                                            </div>
                                            <span className="material-symbols-outlined text-slate-500 group-hover:text-primary text-sm">download</span>
                                        </a>
                                    ))}
                                </div>
                            )}

                            {/* Comments Thread */}
                            {expandedComments.has(post.id) && (
                                <div className="mt-4 space-y-3 pl-4 border-l-2 border-white/5">
                                    {post.comments?.map(comment => (
                                        <div key={comment.id} className="flex gap-2">
                                            <div className="size-6 rounded-full bg-slate-700 flex items-center justify-center text-[8px] font-bold text-white shrink-0">
                                                {comment.author.charAt(0)}
                                            </div>
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <span className="text-[10px] font-bold text-slate-300">{comment.author}</span>
                                                    <span className="text-[8px] text-slate-600">{comment.timestamp}</span>
                                                </div>
                                                <p className="text-xs text-slate-400">{comment.content}</p>
                                            </div>
                                        </div>
                                    ))}

                                    {/* Add Comment Input */}
                                    <div className="flex gap-2 mt-3">
                                        <input
                                            type="text"
                                            value={newComment[post.id] || ''}
                                            onChange={(e) => setNewComment(prev => ({ ...prev, [post.id]: e.target.value }))}
                                            onKeyDown={(e) => { if (e.key === 'Enter') handleAddComment(post.id); }}
                                            placeholder="Agregar comentario..."
                                            className="flex-1 bg-black/50 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white focus:border-primary outline-none"
                                        />
                                        <button
                                            onClick={() => handleAddComment(post.id)}
                                            className="px-3 py-1.5 bg-primary/20 text-primary rounded-lg hover:bg-primary hover:text-black transition-all text-xs font-bold"
                                        >
                                            Enviar
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* Show Comments Button */}
                            {!expandedComments.has(post.id) && post.comments && post.comments.length > 0 && (
                                <button
                                    onClick={() => toggleComments(post.id)}
                                    className="mt-3 text-[10px] text-primary hover:text-white transition-colors font-bold uppercase tracking-wider"
                                >
                                    Ver {post.comments.length} comentario{post.comments.length > 1 ? 's' : ''}
                                </button>
                            )}
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
                            onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handlePost(); } }}
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