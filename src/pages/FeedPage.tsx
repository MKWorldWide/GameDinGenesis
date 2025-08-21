
import React, { useState, useMemo, useEffect } from 'react';
import SearchBar from '../components/SearchBar';
import PostCard from '../components/PostCard';
import OracleWidget from '../components/GeminiKitten';
import CreatePost from '../components/CreatePost';
import { Post } from '../types';
import * as db from '../services/database';
import EventPostCard from '../components/EventPostCard';
import QuestPostCard from '../components/QuestPostCard';

const FeedPage: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [posts, setPosts] = useState<Post[]>([]);

  useEffect(() => {
    const loadPosts = () => {
        const allPosts = db.getPosts();
        setPosts(allPosts);
    };
    
    loadPosts();
    // Use an interval to check for new posts from the simulation engine
    const intervalId = setInterval(loadPosts, 5000); // Check every 5 seconds

    return () => clearInterval(intervalId);
  }, []);


  const handleNewPost = (newPost: Post) => {
    // Add to DB and then update state to reflect the change
    db.addPost(newPost);
    setPosts(db.getPosts());
  };

  const filteredPosts = useMemo(() => {
    const lowercasedQuery = searchQuery.toLowerCase().trim();
    if (!lowercasedQuery) {
      return posts;
    }
    return posts.filter(post =>
      post.content.toLowerCase().includes(lowercasedQuery) ||
      post.authorName.toLowerCase().includes(lowercasedQuery) ||
      post.authorHandle.toLowerCase().includes(lowercasedQuery)
    );
  }, [searchQuery, posts]);

  return (
    <div className="space-y-8">
      <SearchBar 
          searchQuery={searchQuery} 
          setSearchQuery={setSearchQuery} 
          placeholder="Search the archives..." 
      />

      <CreatePost onNewPost={handleNewPost} />
      
      <section className="space-y-4">
        {filteredPosts.length > 0 ? (
          filteredPosts.map(post => {
            switch(post.type) {
                case 'quest':
                    return <QuestPostCard key={post.id} post={post} />;
                case 'event':
                    return <EventPostCard key={post.id} post={post} />;
                default:
                    return <PostCard key={post.id} post={post} />;
            }
          })
        ) : (
          <div className="text-center py-12 text-secondary bg-secondary/50 rounded-lg">
              <h3 className="text-xl font-semibold">The ether is quiet</h3>
              <p className="mt-2">No decrees match your search. Be the first to speak.</p>
          </div>
        )}
      </section>

      <OracleWidget posts={posts} />

      <footer className="text-center p-4 text-tertiary text-sm">
        <p>Powered by The Oracle & Google AI. 👁️</p>
      </footer>
    </div>
  );
};

export default FeedPage;
