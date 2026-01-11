import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState, useRef } from "react";
import { Upload, FileText, X, Loader2 } from "lucide-react";
import { UploadedFile } from "@/types";
import { API_BASE_URL } from '@/lib/config';

interface FileUploadModalProps {
    isOpen: boolean;
    onClose: () => void;
    onUpload: (file: UploadedFile) => void;
}

export default function FileUploadModal({ isOpen, onClose, onUpload }: FileUploadModalProps) {
    const [isUploading, setIsUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            setIsUploading(true);
            const file = e.target.files[0];

            try {
                let content = '';
                let type: 'pdf' | 'image' | 'text' = 'text';

                if (file.type === 'application/pdf') {
                    const formData = new FormData();
                    formData.append('file', file);
                    const response = await fetch(`${API_BASE_URL}/api/parse-pdf`, {
                        method: 'POST',
                        body: formData,
                    });
                    if (!response.ok) throw new Error('PDF parsing failed');
                    const data = await response.json();
                    content = data.content;
                    type = 'pdf';
                } else {
                    // Text file fallback
                    content = await file.text();
                }

                const uploadedFile: UploadedFile = {
                    id: Math.random().toString(36).substring(7),
                    name: file.name,
                    type,
                    content
                };

                onUpload(uploadedFile);
                onClose();
            } catch (error) {
                console.error('Upload error:', error);
                alert('파일 업로드 실패');
            } finally {
                setIsUploading(false);
            }
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>참고 자료 업로드</DialogTitle>
                    <DialogDescription>
                        사업계획서 작성에 참고할 PDF 문서를 업로드하세요.
                    </DialogDescription>
                </DialogHeader>

                <div className="grid w-full max-w-sm items-center gap-1.5">
                    <Label htmlFor="file">파일 선택</Label>
                    <Input
                        id="file"
                        type="file"
                        accept=".pdf,.txt"
                        ref={fileInputRef}
                        onChange={handleFileChange}
                        disabled={isUploading}
                    />
                </div>

                <DialogFooter>
                    {isUploading && <div className="flex items-center text-sm text-muted-foreground"><Loader2 className="w-4 h-4 animate-spin mr-2" />업로드 중...</div>}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
