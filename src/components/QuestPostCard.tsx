
import React, { useState, useEffect } from 'react';
import { Post, WorldQuest, Faction } from '../types';
import * as db from '../services/database';
import { ShieldCheckIcon, SparklesIcon } from './Icons';
import { useRouter } from '../hooks/useRouter';

const QuestPostCard: React.FC<{ post: Post }> = ({ post }) => {
    const [quest, setQuest] = useState<WorldQuest | null>(null);
    const [issuerFaction, setIssuerFaction] = useState<Faction | null>(null);
    const { navigate } = useRouter();

    useEffect(() => {
        if (post.questId) {
            const currentQuest = db.getQuestById(post.questId);
            setQuest(currentQuest);
            if (currentQuest) {
                const faction = db.getFactions().find(f => f.id === currentQuest.issuerFactionId);
                setIssuerFaction(faction || null);
            }
        }
    }, [post.questId]);

    if (!quest) {
        return null; // Or a loading state
    }

    const progress = quest.contributions.length;
    const target = quest.goal.targetCount;
    const progressPercent = target > 0 ? (progress / target) * 100 : 0;

    return (
        <article className="bg-slate-800/60 p-4 rounded-lg shadow-lg border-2 border-accent/50 flex flex-col gap-4 animate-fade-in">
            <div className="flex items-start gap-4">
                <div className="flex-shrink-0 mt-1">
                    <ShieldCheckIcon className="w-10 h-10 text-accent animate-glow" />
                </div>
                <div className="flex-1">
                    <div className="flex items-baseline gap-2">
                        <span className="font-bold text-accent">World Quest</span>
                        <span className="text-sm text-tertiary">· Issued by {issuerFaction?.name || 'an unknown power'}</span>
                    </div>
                    <h3 className="text-xl font-bold text-primary mt-2">{quest.title}</h3>
                    <div className="mt-2 text-secondary whitespace-pre-wrap">
                        {quest.description}
                    </div>
                </div>
            </div>
            
            <div className="pl-14">
                <div className="flex justify-between items-center text-sm text-tertiary mb-1">
                    <span>Progress</span>
                    <span>{progress} / {target} Contributions</span>
                </div>
                <div className="w-full bg-slate-700 rounded-full h-2.5">
                    <div className="bg-accent h-2.5 rounded-full transition-all duration-500" style={{ width: `${progressPercent}%` }}></div>
                </div>
            </div>

            <div className="flex justify-end items-center pt-3 border-t border-slate-700/50">
                <button
                    onClick={() => navigate('/creator-studio')}
                    className="flex items-center gap-2 rounded-md bg-accent px-4 py-2 text-sm font-semibold text-on-accent shadow-sm hover:bg-accent-hover transition-colors"
                >
                    <SparklesIcon className="w-5 h-5" />
                    Contribute in Creator Studio
                </button>
            </div>
        </article>
    );
};

export default QuestPostCard;
