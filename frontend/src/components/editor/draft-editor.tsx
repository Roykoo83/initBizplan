import { Textarea } from "@/components/ui/textarea";

interface DraftEditorProps {
    content: string;
    onChange: (content: string) => void;
    readOnly?: boolean;
}

export function DraftEditor({ content, onChange, readOnly = false }: DraftEditorProps) {
    return (
        <div className="h-full flex flex-col p-4">
            <Textarea
                value={content}
                onChange={(e) => onChange(e.target.value)}
                readOnly={readOnly}
                className="flex-1 resize-none font-mono text-sm leading-relaxed"
                placeholder="AI가 생성한 초안이 여기에 표시됩니다. 직접 수정할 수도 있습니다."
            />
        </div>
    );
}
