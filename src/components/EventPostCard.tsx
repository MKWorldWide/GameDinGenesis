import React from 'react';
import { Post } from '../types';
import { ScarabIcon } from './Icons'; // Assuming a generic event icon for now

const EventPostCard: React.FC<{ post: Post }> = ({ post }) => {
  return (
    <article className="bg-slate-800/50 p-4 rounded-lg shadow-lg border-2 border-accent/30 flex flex-col gap-4 animate-fade-in">
      <div className="flex items-start gap-4">
        <div className="flex-shrink-0 mt-1">
          <ScarabIcon className="w-10 h-10 text-accent animate-glow" />
        </div>
        <div className="flex-1">
          <div className="flex items-baseline gap-2">
            <span className="font-bold text-accent">World Event</span>
            <span className="text-sm text-tertiary">· {new Date(post.timestamp).toLocaleString()}</span>
          </div>
          <div className="mt-2 text-primary whitespace-pre-wrap">
            {post.content}
          </div>
        </div>
      </div>
      <div className="flex justify-end items-center pt-3 border-t border-slate-700/50">
        <p className="text-xs text-tertiary italic">This is an automated world dispatch from The Oracle.</p>
      </div>
    </article>
  );
};

export default EventPostCard;
