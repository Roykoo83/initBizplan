import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, FileText, Loader2 } from "lucide-react";
import { useGuestAuth } from '@/lib/auth';
import { useRouter } from 'next/navigation';
import { ProjectCard } from '@/components/project-card';
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { API_BASE_URL } from '@/lib/config';

interface Project {
    id: string;
    title: string;
    template_type: string;
    updated_at: string;
    status: string;
}

export default function DashboardPage() {
    const { guestId, loading: authLoading } = useGuestAuth();
    const router = useRouter();
    const [projects, setProjects] = useState<Project[]>([]);
    const [loading, setLoading] = useState(true);
    const [isCreating, setIsCreating] = useState(false);
    const [newProjectTitle, setNewProjectTitle] = useState('');

    useEffect(() => {
        if (guestId) {
            fetchProjects();
        }
    }, [guestId]);

    const fetchProjects = async () => {
        try {
            const res = await fetch(`${API_BASE_URL}/api/projects?guest_id=${guestId}`);
            if (!res.ok) throw new Error('Failed to fetch projects');
            const data = await res.json();
            setProjects(data);
        } catch (error) {
            console.error('Error fetching projects:', error);
            toast.error('프로젝트 목록을 불러오는데 실패했습니다.');
        } finally {
            setLoading(false);
        }
    };

    const handleCreateProject = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newProjectTitle.trim() || !guestId) return;

        setIsCreating(true);
        try {
            const res = await fetch(`${API_BASE_URL}/api/projects`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    guest_id: guestId,
                    title: newProjectTitle,
                    template_type: 'startup_package'
                }),
            });

            if (!res.ok) throw new Error('Failed to create project');

            const project = await res.json();
            toast.success('새 프로젝트가 생성되었습니다.');
            router.push(`/project/${project.id}`);
        } catch (error) {
            console.error('Error creating project:', error);
            toast.error('프로젝트 생성에 실패했습니다.');
            setIsCreating(false);
        }
    };

    if (authLoading) {
        return <div className="flex items-center justify-center h-screen">Loading...</div>;
    }

    return (
        <div className="container mx-auto py-10 px-4">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">내 프로젝트</h1>
                    <p className="text-muted-foreground mt-1">
                        진행 중인 사업계획서 프로젝트 목록입니다.
                    </p>
                </div>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {/* Create New Project Card */}
                <Card className="border-dashed">
                    <CardHeader>
                        <CardTitle>새 프로젝트 만들기</CardTitle>
                        <CardDescription>새로운 사업계획서 작성을 시작합니다.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleCreateProject} className="space-y-4">
                            <div className="space-y-2">
                                <Input
                                    placeholder="프로젝트 제목 (예: AI 기반 펫케어 서비스)"
                                    value={newProjectTitle}
                                    onChange={(e) => setNewProjectTitle(e.target.value)}
                                    disabled={isCreating}
                                />
                            </div>
                            <Button type="submit" className="w-full" disabled={isCreating || !newProjectTitle.trim()}>
                                {isCreating ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        생성 중...
                                    </>
                                ) : (
                                    <>
                                        <Plus className="mr-2 h-4 w-4" />
                                        프로젝트 생성
                                    </>
                                )}
                            </Button>
                        </form>
                    </CardContent>
                </Card>

                {/* Project List */}
                {loading ? (
                    <>
                        <Skeleton className="h-[200px] w-full rounded-xl" />
                        <Skeleton className="h-[200px] w-full rounded-xl" />
                    </>
                ) : (
                    projects.map((project) => (
                        <ProjectCard key={project.id} project={project} />
                    ))
                )}
            </div>
        </div>
    );
}
