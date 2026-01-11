import { useState, useRef } from 'react'
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { SendHorizontal, Paperclip, X, FileText, Image as ImageIcon, Loader2 } from "lucide-react"
import { API_BASE_URL } from '@/lib/config';

interface UploadedFile {
    id: string;
    name: string;
    type: 'pdf' | 'image' | 'text';
    content: string; // Base64 for images, text content for PDF/Text
    previewUrl?: string; // For images
}

interface ChatInputProps {
    onSendMessage: (content: string, files: { name: string; content: string }[]) => void
    isLoading: boolean
    placeholder?: string
}

export function ChatInput({ onSendMessage, isLoading, placeholder }: ChatInputProps) {
    const [input, setInput] = useState('')
    const [files, setFiles] = useState<UploadedFile[]>([])
    const [isUploading, setIsUploading] = useState(false)
    const fileInputRef = useRef<HTMLInputElement>(null)
    const textareaRef = useRef<HTMLTextAreaElement>(null)

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault()
            handleSend()
        }
    }

    const handleSend = () => {
        if ((!input.trim() && files.length === 0) || isLoading || isUploading) return

        // Prepare files for sending
        const filesToSend = files.map(f => ({
            name: f.name,
            content: f.content
        }))

        onSendMessage(input, filesToSend)
        setInput('')
        setFiles([])

        // Reset height
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto'
        }
    }

    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            setIsUploading(true)
            const selectedFiles = Array.from(e.target.files)

            try {
                const newFiles: UploadedFile[] = []

                for (const file of selectedFiles) {
                    // Check file type
                    if (!file.type.includes('pdf') && !file.type.includes('image')) {
                        alert('PDF 또는 이미지 파일만 업로드 가능합니다.')
                        continue
                    }

                    // Check size (max 10MB)
                    if (file.size > 10 * 1024 * 1024) {
                        alert('파일 크기는 10MB를 초과할 수 없습니다.')
                        continue
                    }

                    let content = ''
                    let type: 'pdf' | 'image' | 'text' = 'text'

                    if (file.type === 'application/pdf') {
                        // For PDF, send to backend for parsing
                        const formData = new FormData()
                        formData.append('file', file)
                        const response = await fetch(`${API_BASE_URL}/api/parse-pdf`, {
                            method: 'POST',
                            body: formData,
                        })

                        if (!response.ok) throw new Error('PDF parsing failed')
                        const data = await response.json()
                        content = data.content
                        type = 'pdf'
                    } else if (file.type.includes('image')) {
                        // For images, convert to base64
                        content = await new Promise((resolve) => {
                            const reader = new FileReader()
                            reader.onloadend = () => resolve(reader.result as string)
                            reader.readAsDataURL(file)
                        })
                        type = 'image'
                    }

                    newFiles.push({
                        id: Math.random().toString(36).substring(7),
                        name: file.name,
                        type,
                        content,
                        previewUrl: type === 'image' ? content : undefined
                    })
                }

                setFiles(prev => [...prev, ...newFiles])
            } catch (error) {
                console.error('File upload error:', error)
                alert('파일 업로드 중 오류가 발생했습니다.')
            } finally {
                setIsUploading(false)
                if (fileInputRef.current) {
                    fileInputRef.current.value = ''
                }
            }
        }
    }

    const removeFile = (id: string) => {
        setFiles(prev => prev.filter(f => f.id !== id))
    }

    return (
        <div className="p-4 border-t bg-background">
            {/* File Previews */}
            {files.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-2">
                    {files.map(file => (
                        <div key={file.id} className="relative group flex items-center gap-2 bg-muted p-2 rounded-md text-xs border">
                            {file.type === 'image' ? (
                                <ImageIcon className="w-4 h-4 text-blue-500" />
                            ) : (
                                <FileText className="w-4 h-4 text-red-500" />
                            )}
                            <span className="max-w-[150px] truncate">{file.name}</span>
                            <button
                                onClick={() => removeFile(file.id)}
                                className="ml-1 hover:bg-destructive/10 rounded-full p-0.5"
                            >
                                <X className="w-3 h-3" />
                            </button>
                        </div>
                    ))}
                </div>
            )}

            <div className="relative flex items-end gap-2">
                <input
                    type="file"
                    ref={fileInputRef}
                    className="hidden"
                    multiple
                    accept=".pdf,image/*"
                    onChange={handleFileSelect}
                />
                <Button
                    variant="ghost"
                    size="icon"
                    className="shrink-0"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isLoading || isUploading}
                >
                    <Paperclip className="w-5 h-5 text-muted-foreground" />
                </Button>

                <Textarea
                    ref={textareaRef}
                    value={input}
                    onChange={(e) => {
                        setInput(e.target.value)
                        e.target.style.height = 'auto'
                        e.target.style.height = `${e.target.scrollHeight}px`
                    }}
                    onKeyDown={handleKeyDown}
                    placeholder={isUploading ? "파일 처리 중..." : (placeholder || "메시지를 입력하세요...")}
                    className="min-h-[44px] max-h-[200px] resize-none py-3"
                    rows={1}
                    disabled={isLoading || isUploading}
                />

                <Button
                    onClick={handleSend}
                    disabled={(!input.trim() && files.length === 0) || isLoading || isUploading}
                    size="icon"
                    className="shrink-0"
                >
                    {isLoading || isUploading ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                        <SendHorizontal className="w-5 h-5" />
                    )}
                </Button>
            </div>
        </div>
    )
}
