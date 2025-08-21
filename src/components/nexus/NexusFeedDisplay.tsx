import React from 'react';
import { NexusFeedItem, NetworkProvider } from '../../types';
import { TrophyIcon, UserPlusIcon, LinkIcon, SteamIcon, XboxIcon, PlaystationIcon, DiscordIcon, TwitchIcon, TwitterIcon } from '../Icons';

const getIconForType = (type: string) => {
    switch (type) {
        case 'Trophy': return <TrophyIcon className="w-5 h-5 text-amber-400" />;
        case 'Friend': return <UserPlusIcon className="w-5 h-5 text-sky-400" />;
        case 'AccountLink': return <LinkIcon className="w-5 h-5 text-green-400" />;
        default: return <LinkIcon className="w-5 h-5 text-slate-400" />;
    }
}

const getIconForProvider = (provider?: NetworkProvider) => {
    switch (provider) {
        case 'steam': return <SteamIcon className="w-4 h-4" />;
        case 'xbox': return <XboxIcon className="w-4 h-4" />;
        case 'playstation': return <PlaystationIcon className="w-4 h-4" />;
        case 'discord': return <DiscordIcon className="w-4 h-4" />;
        case 'twitch': return <TwitchIcon className="w-4 h-4" />;
        case 'twitter': return <TwitterIcon className="w-4 h-4" />;
        default: return null;
    }
}

const NexusFeedDisplay: React.FC<{ feed: NexusFeedItem[] }> = ({ feed }) => {
    if (feed.length === 0) {
        return (
            <div className="text-center py-12 text-secondary bg-secondary/50 rounded-lg animate-fade-in">
                <LinkIcon className="w-16 h-16 mx-auto text-tertiary mb-4" />
                <h3 className="text-lg font-semibold">Nexus Feed is Empty</h3>
                <p className="mt-2">Link accounts and sync data in Settings to see your activity log.</p>
            </div>
        );
    }
    
    // Sort feed by most recent first
    const sortedFeed = [...feed].sort((a,b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    return (
        <div className="flow-root animate-fade-in">
            <ul role="list" className="-mb-8">
                {sortedFeed.map((item, itemIdx) => (
                    <li key={item.id}>
                        <div className="relative pb-8">
                            {itemIdx !== sortedFeed.length - 1 ? (
                                <span className="absolute left-4 top-4 -ml-px h-full w-0.5 bg-slate-700" aria-hidden="true" />
                            ) : null}
                            <div className="relative flex items-start space-x-3">
                                <div>
                                    <div className="relative px-1">
                                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-800 ring-8 ring-secondary">
                                            {getIconForType(item.type)}
                                        </div>
                                    </div>
                                </div>
                                <div className="min-w-0 flex-1 py-1.5">
                                    <div className="text-sm text-secondary">
                                        <p className="font-medium text-primary">{item.text}</p>
                                    </div>
                                    <div className="mt-1 flex items-center gap-2 text-xs text-tertiary">
                                        <span>{new Date(item.timestamp).toLocaleString()}</span>
                                        {item.sourceProvider && (
                                            <div className="flex items-center gap-1">
                                                <span>·</span>
                                                {getIconForProvider(item.sourceProvider)}
                                                <span>{item.sourceProvider}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </li>
                ))}
            </ul>
        </div>
    );
};

export default NexusFeedDisplay;
