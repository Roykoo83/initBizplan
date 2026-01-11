import { useRef, useEffect } from 'react';
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { ChatInput } from "./chat-input";
import { Message } from '@/hooks/use-chat-stream';
import { Bot, User } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

interface ChatInterfaceProps {
    messages: Message[];
    onSendMessage: (content: string, files: { name: string; content: string }[]) => void;
    isLoading: boolean;
}

export function ChatInterface({ messages, onSendMessage, isLoading }: ChatInterfaceProps) {
    const scrollRef = useRef<HTMLDivElement>(null);

    // Auto-scroll to bottom
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [messages]);

    return (
        <div className="flex flex-col h-full">
            <ScrollArea className="flex-1 p-4">
                <div className="space-y-4">
                    {messages.map((message, index) => (
                        <div
                            key={index}
                            className={cn(
                                "flex gap-3 text-sm",
                                message.role === 'user' ? "flex-row-reverse" : "flex-row"
                            )}
                        >
                            <Avatar className="w-8 h-8 shrink-0">
                                <AvatarFallback className={message.role === 'user' ? "bg-primary text-primary-foreground" : "bg-muted"}>
                                    {message.role === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                                </AvatarFallback>
                            </Avatar>
                            <div
                                className={cn(
                                    "rounded-lg px-4 py-2 max-w-[85%]",
                                    message.role === 'user'
                                        ? "bg-primary text-primary-foreground"
                                        : "bg-muted text-foreground"
                                )}
                            >
                                <ReactMarkdown className="prose prose-sm dark:prose-invert break-words">
                                    {message.content}
                                </ReactMarkdown>
                            </div>
                        </div>
                    ))}
                    {isLoading && (
                        <div className="flex gap-3 text-sm">
                            <Avatar className="w-8 h-8 shrink-0">
                                <AvatarFallback className="bg-muted"><Bot className="w-4 h-4" /></AvatarFallback>
                            </Avatar>
                            <div className="bg-muted rounded-lg px-4 py-2">
                                <span className="animate-pulse">Thinking...</span>
                            </div>
                        </div>
                    )}
                    <div ref={scrollRef} />
                </div>
            </ScrollArea>

            <ChatInput onSendMessage={onSendMessage} isLoading={isLoading} />
        </div>
    );
}
