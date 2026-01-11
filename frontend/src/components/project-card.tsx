import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, ArrowRight } from "lucide-react";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { ko } from "date-fns/locale";

interface Project {
    id: string;
    title: string;
    template_type: string;
    updated_at: string;
    status: string;
}

export function ProjectCard({ project }: { project: Project }) {
    return (
        <Card>
            <CardHeader>
                <div className="flex justify-between items-start">
                    <CardTitle className="line-clamp-1">{project.title}</CardTitle>
                    <Badge variant={project.status === 'Completed' ? 'default' : 'secondary'}>
                        {project.status}
                    </Badge>
                </div>
                <CardDescription>
                    초기창업패키지 사업계획서
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div className="flex items-center text-sm text-muted-foreground">
                    <Calendar className="mr-2 h-4 w-4" />
                    {formatDistanceToNow(new Date(project.updated_at), { addSuffix: true, locale: ko })} 수정됨
                </div>
            </CardContent>
            <CardFooter>
                <Button asChild className="w-full">
                    <Link href={`/project/${project.id}`}>
                        이어서 작성하기 <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                </Button>
            </CardFooter>
        </Card>
    );
}
