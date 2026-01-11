import { useState, useEffect, useCallback } from 'react';
import { Message } from './use-chat-stream';
import { supabase } from '@/lib/supabase';

export function useChatPersistence(projectId: string, sectionType: string) {
    const [messages, setMessages] = useState<Message[]>([]);
    const [loading, setLoading] = useState(false);

    // Load messages when section changes
    const loadMessages = useCallback(async () => {
        if (!projectId || !sectionType) return;

        console.log(`[Persistence] Loading messages for ${projectId} / ${sectionType}`);

        try {
            setLoading(true);

            // Try loading from Supabase first
            const { data, error } = await supabase
                .from('interviews')
                .select('messages')
                .eq('project_id', projectId)
                .eq('section_type', sectionType)
                .single();

            if (error) {
                console.log(`[Persistence] Supabase error:`, error);
            }

            if (data?.messages) {
                console.log(`[Persistence] Loaded from Supabase: ${data.messages.length} messages`);
                setMessages(data.messages);
                // Sync to local storage
                localStorage.setItem(`chat_${projectId}_${sectionType}`, JSON.stringify(data.messages));
            } else {
                // Fallback to local storage if DB is empty or fails
                const localData = localStorage.getItem(`chat_${projectId}_${sectionType}`);
                console.log(`[Persistence] Fallback to localStorage. Found:`, !!localData);

                if (localData) {
                    try {
                        const parsed = JSON.parse(localData);
                        console.log(`[Persistence] Loaded from localStorage: ${parsed.length} messages`);
                        setMessages(parsed);
                    } catch (e) {
                        console.error('[Persistence] Error parsing localStorage:', e);
                        setMessages([]);
                    }
                } else {
                    setMessages([]);
                }
            }
        } catch (error) {
            console.error('[Persistence] Error loading messages:', error);
            // Fallback to local storage on error
            const localData = localStorage.getItem(`chat_${projectId}_${sectionType}`);
            if (localData) {
                try {
                    setMessages(JSON.parse(localData));
                } catch (e) {
                    setMessages([]);
                }
            }
        } finally {
            setLoading(false);
        }
    }, [projectId, sectionType]);

    // Save messages to database and local storage
    const saveMessages = useCallback(async (newMessages: Message[]) => {
        if (!projectId || !sectionType) return;

        console.log(`[Persistence] Saving ${newMessages.length} messages for ${projectId} / ${sectionType}`);

        // 1. Save to Local Storage immediately
        try {
            localStorage.setItem(`chat_${projectId}_${sectionType}`, JSON.stringify(newMessages));
            console.log(`[Persistence] Saved to localStorage`);
        } catch (e) {
            console.error('[Persistence] Error saving to localStorage:', e);
        }

        // 2. Save to Supabase (fire and forget)
        try {
            const { error } = await supabase
                .from('interviews')
                .upsert({
                    project_id: projectId,
                    section_type: sectionType,
                    messages: newMessages,
                    updated_at: new Date().toISOString()
                }, {
                    onConflict: 'project_id,section_type'
                });

            if (error) {
                console.error('[Persistence] Error saving messages to DB:', error);
            }
        } catch (error) {
            console.error('[Persistence] Error saving messages to DB:', error);
        }
    }, [projectId, sectionType]);

    // Initial load
    useEffect(() => {
        loadMessages();
    }, [loadMessages]);

    const updateMessages = useCallback((updater: React.SetStateAction<Message[]>) => {
        setMessages(prev => {
            const next = typeof updater === 'function' ? updater(prev) : updater;
            saveMessages(next);
            return next;
        });
    }, [saveMessages]);

    const clearMessages = useCallback(async () => {
        setMessages([]);
        try {
            localStorage.removeItem(`chat_${projectId}_${sectionType}`);
            await supabase
                .from('interviews')
                .delete()
                .eq('project_id', projectId)
                .eq('section_type', sectionType);
        } catch (e) {
            console.error('Error clearing messages:', e);
        }
    }, [projectId, sectionType]);

    return {
        messages,
        setMessages: updateMessages,
        saveMessages,
        loading,
        clearMessages,
        refresh: loadMessages
    };
}
