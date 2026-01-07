import React from 'react';
import ChatInterface from './chat/ChatInterface';

interface StaffWallProps {
    userId: string;
    userName: string;
    userRole: string;
}

const StaffWall: React.FC<StaffWallProps> = ({ userId, userName, userRole }) => {
    return (
        <div className="h-full flex flex-col bg-background">
            {/* Header */}
            <div className="p-4 border-b border-white/10 bg-surface flex justify-between items-center shrink-0">
                <div>
                    <h1 className="text-xl font-black font-display text-white uppercase italic tracking-tighter flex items-center gap-2">
                        Staff Wall
                        <span className="text-[10px] bg-volt text-black px-1.5 py-0.5 rounded font-bold">LIVE</span>
                    </h1>
                    <p className="text-slate-500 text-xs font-mono uppercase tracking-widest mt-1">Canal Global de Staff</p>
                </div>
            </div>

            {/* Chat Interface */}
            <div className="flex-1 overflow-hidden relative">
                <ChatInterface
                    roomId="staff-main"
                    currentUserId={userId}
                    currentUserName={userName}
                    currentUserRole={userRole as any}
                    otherUserName="Staff Global"
                    onClose={() => { }}
                    inputPosition="top"
                />
            </div>
        </div>
    );
};

export default StaffWall;