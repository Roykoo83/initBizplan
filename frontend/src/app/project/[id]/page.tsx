import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useGuestAuth } from '@/lib/auth';
import { ChatInterface } from '@/components/chat/chat-interface';
import { useChatStream, Message } from '@/hooks/use-chat-stream';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ChevronLeft, FileText, MessageSquare, Layout, Sparkles, Upload, Download } from 'lucide-react';
import { DraftEditor } from '@/components/editor/draft-editor';
import { cn } from '@/lib/utils';
import { useProjectData } from '@/hooks/use-project-data';
import { toast } from "sonner";
import FileUploadModal from '@/components/FileUploadModal';
import { UploadedFile } from '@/types';
import { useChatPersistence } from '@/hooks/use-chat-persistence';
import { API_BASE_URL } from '@/lib/config';

const SECTIONS = [
    { id: 'general-info', label: '일반현황' },
    { id: 'overview', label: '개요(요약)' },
    { id: 'problem', label: '1. 문제인식' },
    { id: 'solution', label: '2. 실현가능성' },
    { id: 'growth', label: '3. 성장전략' },
    { id: 'team', label: '4. 팀 구성' },
];

export default function ProjectPage() {
    const params = useParams();
    const projectId = params.id as string;
    const { guestId, loading: authLoading } = useGuestAuth();
    const [activeSectionId, setActiveSectionId] = useState('general-info');

    // Project Data Hook
    const { sections, loading: dataLoading, updateSectionContent, refresh } = useProjectData(projectId);

    // Persistence Hook
    const { messages: dbMessages, saveMessages, loading: dbLoading } = useChatPersistence(projectId, activeSectionId);

    // Chat Hook
    const { messages, loading: chatLoading, sendMessage, setMessages } = useChatStream({
        onFinish: (msgs) => {
            saveMessages(msgs);
        }
    });

    // Sync loaded messages to chat stream
    useEffect(() => {
        if (dbMessages) {
            setMessages(dbMessages);
        }
    }, [dbMessages, setMessages]);

    // Draft Generation State
    const [isGeneratingDraft, setIsGeneratingDraft] = useState(false);
    const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
    const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);

    const handleSendMessage = async (content: string, files: { name: string; content: string }[] = []) => {
        // Merge uploadedFiles (from sidebar) with files attached in chat (from ChatInput)
        const allFiles = [
            ...uploadedFiles.map(f => ({ name: f.name, content: f.content })),
            ...files
        ];

        await sendMessage(content, activeSectionId, allFiles);
    };

    const handleGenerateDraft = async () => {
        setIsGeneratingDraft(true);
        try {
            const response = await fetch(`${API_BASE_URL}/api/chat`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    messages: messages,
                    section: activeSectionId,
                    uploadedFiles: uploadedFiles.map(f => ({ name: f.name, content: f.content })),
                    generateDraft: true
                }),
            });

            if (!response.ok) throw new Error('Failed to generate draft');

            const reader = response.body?.getReader();
            if (!reader) throw new Error('No reader');

            const decoder = new TextDecoder();
            let draftContent = '';

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
                                draftContent += parsed.content;
                                // Update editor content in real-time if possible, 
                                // or just accumulate and update at the end.
                                // For now, we'll update the section content at the end.
                            }
                        } catch (e) { console.error(e); }
                    }
                }
            }

            // Update section content
            await updateSectionContent(activeSectionId, draftContent);
            toast.success('초안이 생성되었습니다.');
            refresh(); // Refresh data

        } catch (error) {
            console.error('Error generating draft:', error);
            toast.error('초안 생성 중 오류가 발생했습니다.');
        } finally {
            setIsGeneratingDraft(false);
        }
    };

    const handleFileUpload = (file: UploadedFile) => {
        setUploadedFiles(prev => [...prev, file]);
        toast.success(`${file.name} 업로드 완료`);
    };

    const handleExportHWP = async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/api/export/hwp/${projectId}`);
            if (!response.ok) throw new Error('Export failed');

            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `사업계획서_${projectId}.hwp`; // Backend sets filename but this is fallback
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
        } catch (error) {
            console.error('HWP Download Error:', error);
            toast.error('HWP 다운로드 실패');
        }
    };

    if (authLoading || dataLoading) {
        return <div className="flex items-center justify-center h-screen">Loading...</div>;
    }

    const activeSection = sections.find(s => s.section_type === activeSectionId);

    return (
        <>
            <div className="flex h-screen overflow-hidden bg-background">
                {/* Sidebar */}
                <div className="w-64 border-r bg-muted/30 flex flex-col">
                    <div className="p-4 border-b flex items-center">
                        <Button variant="ghost" size="icon" asChild className="mr-2">
                            <a href="/dashboard"><ChevronLeft className="w-4 h-4" /></a>
                        </Button>
                        <span className="font-semibold truncate">프로젝트</span>
                    </div>

                    <ScrollArea className="flex-1">
                        <div className="p-2 space-y-1">
                            {SECTIONS.map((section) => (
                                <Button
                                    key={section.id}
                                    variant={activeSectionId === section.id ? "secondary" : "ghost"}
                                    className="w-full justify-start"
                                    onClick={() => setActiveSectionId(section.id)}
                                >
                                    {activeSectionId === section.id ? (
                                        <MessageSquare className="w-4 h-4 mr-2" />
                                    ) : (
                                        <Layout className="w-4 h-4 mr-2 text-muted-foreground" />
                                    )}
                                    {section.label}
                                </Button>
                            ))}
                        </div>
                    </ScrollArea>

                    <div className="p-4 border-t space-y-2">
                        <Button
                            variant="outline"
                            className="w-full"
                            onClick={() => setIsUploadModalOpen(true)}
                        >
                            <Upload className="w-4 h-4 mr-2" />
                            자료 업로드
                        </Button>
                        {uploadedFiles.length > 0 && (
                            <div className="text-xs text-muted-foreground px-2">
                                {uploadedFiles.length}개 파일 업로드됨
                            </div>
                        )}
                    </div>
                </div>

                {/* Main Content */}
                <div className="flex-1 flex flex-col min-w-0">
                    {/* Header */}
                    <header className="h-14 border-b flex items-center justify-between px-6 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
                        <h1 className="font-semibold text-lg">
                            {SECTIONS.find(s => s.id === activeSectionId)?.label}
                        </h1>
                        <div className="flex items-center gap-2">
                            <Button
                                variant="default"
                                size="sm"
                                onClick={handleGenerateDraft}
                                disabled={isGeneratingDraft}
                            >
                                {isGeneratingDraft ? (
                                    <>Generating...</>
                                ) : (
                                    <>
                                        <Sparkles className="w-4 h-4 mr-2" />
                                        AI 초안 생성
                                    </>
                                )}
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={handleExportHWP}
                            >
                                <FileText className="w-4 h-4 mr-2" />
                                HWP 다운로드
                            </Button>
                        </div>
                    </header>

                    {/* Split View */}
                    <div className="flex-1 flex overflow-hidden">
                        {/* Chat Area */}
                        <div className="w-1/2 border-r flex flex-col bg-background">
                            <ChatInterface
                                messages={messages}
                                onSendMessage={handleSendMessage}
                                isLoading={chatLoading}
                            />
                        </div>

                        {/* Editor Area */}
                        <div className="w-1/2 flex flex-col bg-background">
                            <DraftEditor
                                content={activeSection?.content_markdown || ''}
                                onChange={(content) => updateSectionContent(activeSectionId, content)}
                                readOnly={false}
                            />
                        </div>
                    </div>
                </div>
            </div>

            <FileUploadModal
                isOpen={isUploadModalOpen}
                onClose={() => setIsUploadModalOpen(false)}
                onUpload={handleFileUpload}
            />
        </>
    );
}
