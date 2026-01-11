import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle2, ArrowRight, Sparkles, Target, Users, Zap } from "lucide-react";
import Link from "next/link";
import { useGuestAuth } from "@/lib/auth";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function LandingPage() {
    const { loginAsGuest, loading } = useGuestAuth();
    const router = useRouter();
    const [isLogin, setIsLogin] = useState(false);

    const handleStart = async () => {
        setIsLogin(true);
        await loginAsGuest();
        router.push('/dashboard');
    };

    return (
        <div className="flex flex-col min-h-screen">
            {/* Hero Section */}
            <section className="flex-1 flex flex-col items-center justify-center text-center px-4 py-20 bg-gradient-to-b from-background to-muted/50">
                <div className="space-y-6 max-w-3xl">
                    <div className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 border-transparent bg-primary text-primary-foreground hover:bg-primary/80">
                        <Sparkles className="w-3 h-3 mr-1" />
                        2025 초기창업패키지 완벽 대비
                    </div>
                    <h1 className="text-4xl font-extrabold tracking-tight lg:text-6xl">
                        AI와 함께 완성하는<br />
                        <span className="text-primary">합격하는 사업계획서</span>
                    </h1>
                    <p className="text-xl text-muted-foreground">
                        막막한 사업계획서 작성, 이제 혼자 고민하지 마세요.<br />
                        전문 컨설턴트 AI가 아이디어 구체화부터 초안 작성까지 도와드립니다.
                    </p>
                    <div className="flex gap-4 justify-center pt-4">
                        <Button size="lg" onClick={handleStart} disabled={loading || isLogin}>
                            {isLogin ? "시작하는 중..." : "무료로 시작하기"}
                            <ArrowRight className="w-4 h-4 ml-2" />
                        </Button>
                        <Button size="lg" variant="outline" asChild>
                            <Link href="#features">기능 살펴보기</Link>
                        </Button>
                    </div>
                </div>
            </section>

            {/* Features Section */}
            <section id="features" className="py-20 bg-muted/30">
                <div className="container mx-auto px-4">
                    <h2 className="text-3xl font-bold text-center mb-12">왜 '비즈플랜 AI'인가요?</h2>
                    <div className="grid md:grid-cols-3 gap-8">
                        <Card>
                            <CardHeader>
                                <Target className="w-10 h-10 text-primary mb-2" />
                                <CardTitle>평가 지표 기반 코칭</CardTitle>
                                <CardDescription>
                                    초기창업패키지 실제 평가 지표(문제인식, 실현가능성, 성장전략, 팀구성)에 맞춰 구체적인 가이드를 제공합니다.
                                </CardDescription>
                            </CardHeader>
                        </Card>
                        <Card>
                            <CardHeader>
                                <Zap className="w-10 h-10 text-primary mb-2" />
                                <CardTitle>실시간 초안 생성</CardTitle>
                                <CardDescription>
                                    대화를 나누면 AI가 자동으로 사업계획서 초안을 작성해줍니다. 더 이상 빈 화면을 보고 막막해하지 마세요.
                                </CardDescription>
                            </CardHeader>
                        </Card>
                        <Card>
                            <CardHeader>
                                <Users className="w-10 h-10 text-primary mb-2" />
                                <CardTitle>전문가 페르소나</CardTitle>
                                <CardDescription>
                                    단순한 챗봇이 아닌, 날카로운 질문을 던지는 전문 컨설턴트 페르소나 AI가 논리적 허점을 보완해줍니다.
                                </CardDescription>
                            </CardHeader>
                        </Card>
                    </div>
                </div>
            </section>

            {/* Scoring Info Section */}
            <section className="py-20">
                <div className="container mx-auto px-4">
                    <h2 className="text-3xl font-bold text-center mb-12">평가 항목 완벽 분석</h2>
                    <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
                        <div className="space-y-4">
                            <div className="flex items-start gap-4">
                                <CheckCircle2 className="w-6 h-6 text-green-500 shrink-0" />
                                <div>
                                    <h3 className="font-bold">문제인식 (Problem) - 30점</h3>
                                    <p className="text-muted-foreground">창업아이템의 개발동기, 목적, 필요성을 명확히 제시합니다.</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-4">
                                <CheckCircle2 className="w-6 h-6 text-green-500 shrink-0" />
                                <div>
                                    <h3 className="font-bold">실현가능성 (Solution) - 30점</h3>
                                    <p className="text-muted-foreground">시장분석, 경쟁력 확보방안, 개발 방안을 구체화합니다.</p>
                                </div>
                            </div>
                        </div>
                        <div className="space-y-4">
                            <div className="flex items-start gap-4">
                                <CheckCircle2 className="w-6 h-6 text-green-500 shrink-0" />
                                <div>
                                    <h3 className="font-bold">성장전략 (Scale-up) - 20점</h3>
                                    <p className="text-muted-foreground">자금소요 및 조달계획, 시장진입 및 성과창출 전략을 수립합니다.</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-4">
                                <CheckCircle2 className="w-6 h-6 text-green-500 shrink-0" />
                                <div>
                                    <h3 className="font-bold">팀 구성 (Team) - 20점</h3>
                                    <p className="text-muted-foreground">대표자 및 팀원의 보유역량을 강조하여 신뢰도를 높입니다.</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="py-20 bg-primary text-primary-foreground text-center">
                <div className="container mx-auto px-4">
                    <h2 className="text-3xl font-bold mb-6">지금 바로 시작하세요</h2>
                    <p className="text-xl mb-8 opacity-90">
                        복잡한 회원가입 없이 바로 시작할 수 있습니다.
                    </p>
                    <Button size="lg" variant="secondary" onClick={handleStart} disabled={loading || isLogin}>
                        {isLogin ? "시작하는 중..." : "사업계획서 작성하기"}
                        <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                </div>
            </section>

            {/* Footer */}
            <footer className="py-8 border-t text-center text-muted-foreground text-sm">
                <p>© 2025 InitBizPlan. All rights reserved.</p>
            </footer>
        </div>
    );
}
