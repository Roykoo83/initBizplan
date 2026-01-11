export interface UploadedFile {
    id: string;
    name: string;
    type: 'pdf' | 'image' | 'text';
    content: string;
    previewUrl?: string;
}
