import { useState, useRef, useCallback } from 'react';
import { API_BASE_URL } from '@/lib/config';

export interface Message {
    role: 'user' | 'model';
    content: string;
}

export interface UploadedFileContext {
    name: string;
    content: string;
}

interface UseChatStreamProps {
    onFinish?: (messages: Message[]) => void;
}

export function useChatStream({ onFinish }: UseChatStreamProps = {}) {
    const [messages, setMessages] = useState<Message[]>([]);
    const [loading, setLoading] = useState(false);
    const abortControllerRef = useRef<AbortController | null>(null);

    const sendMessage = useCallback(async (content: string, section: string, uploadedFiles: UploadedFileContext[] = []) => {
        setLoading(true);
        const userMessage: Message = { role: 'user', content };

        // Optimistic update
        setMessages(prev => [...prev, userMessage]);

        try {
            const history = [...messages, userMessage];

            const response = await fetch(`${API_BASE_URL}/api/chat`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    messages: history,
                    section: section,
                    uploadedFiles: uploadedFiles, // Pass uploaded files to backend
                }),
            });

            if (!response.ok) {
                throw new Error('Network response was not ok');
            }

            const reader = response.body?.getReader();
            if (!reader) throw new Error('No reader available');

            const decoder = new TextDecoder();
            let aiMessageContent = '';

            // Add initial empty AI message
            setMessages(prev => [...prev, { role: 'model', content: '' }]);

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                const chunk = decoder.decode(value);
                const lines = chunk.split('\n');

                for (const line of lines) {
                    if (line.startsWith('data: ')) {
                        const data = line.slice(6);
                        if (data === '[DONE]') continue;

                        try {
                            const parsed = JSON.parse(data);
                            if (parsed.content) {
                                aiMessageContent += parsed.content;
                                setMessages(prev => {
                                    const newMessages = [...prev];
                                    newMessages[newMessages.length - 1] = {
                                        role: 'model',
                                        content: aiMessageContent
                                    };
                                    return newMessages;
                                });
                            }
                        } catch (e) {
                            console.error('Error parsing chunk:', e);
                        }
                    }
                }
            }

            // Call onFinish with complete history
            if (onFinish) {
                onFinish([...history, { role: 'model', content: aiMessageContent }]);
            }

        } catch (error) {
            console.error('Error sending message:', error);
            setMessages(prev => [...prev, { role: 'model', content: 'Error: Failed to generate response.' }]);
        } finally {
            setLoading(false);
        }
    }, [messages, onFinish]);

    const clearMessages = useCallback(async () => {
        setMessages([]);
    }, []);

    return {
        messages,
        loading,
        sendMessage,
        setMessages,
        clearMessages
    };
}
