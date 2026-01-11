"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle2, ArrowRight, Sparkles, Target, Users, Zap, Rocket, ShieldCheck } from "lucide-react";
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
        <div className="flex flex-col min-h-screen bg-background font-sans selection:bg-primary/20">
            {/* Hero Section */}
            <section className="relative overflow-hidden pt-24 pb-32 lg:pt-32 lg:pb-40">
                <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-primary/20 via-background to-background opacity-70"></div>
                <div className="container mx-auto px-4 text-center">
                    <div className="inline-flex items-center rounded-full border border-primary/20 bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary mb-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
                        <Sparkles className="w-4 h-4 mr-2" />
                        2025 초기창업패키지 완벽 대비
                    </div>
                    <h1 className="text-5xl font-extrabold tracking-tight lg:text-7xl mb-6 bg-gradient-to-br from-foreground to-muted-foreground bg-clip-text text-transparent animate-in fade-in slide-in-from-bottom-6 duration-700 delay-100">
                        AI와 함께 완성하는<br />
                        <span className="text-primary">합격하는 사업계획서</span>
                    </h1>
                    <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-10 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-200">
                        막막한 사업계획서 작성, 이제 혼자 고민하지 마세요.<br />
                        전문 컨설턴트 AI가 아이디어 구체화부터 초안 작성까지 도와드립니다.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center items-center animate-in fade-in slide-in-from-bottom-10 duration-700 delay-300">
                        <Button size="lg" className="h-12 px-8 text-lg rounded-full shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all" onClick={handleStart} disabled={loading || isLogin}>
                            {isLogin ? (
                                <>
                                    <Rocket className="w-5 h-5 mr-2 animate-bounce" />
                                    시작하는 중...
                                </>
                            ) : (
                                <>
                                    무료로 시작하기
                                    <ArrowRight className="w-5 h-5 ml-2" />
                                </>
                            )}
                        </Button>
                        <Button size="lg" variant="outline" className="h-12 px-8 text-lg rounded-full backdrop-blur-sm bg-background/50" asChild>
                            <Link href="#features">기능 살펴보기</Link>
                        </Button>
                    </div>
                </div>
            </section>

            {/* Features Section */}
            <section id="features" className="py-24 bg-muted/30 relative">
                <div className="container mx-auto px-4">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl font-bold tracking-tight lg:text-4xl mb-4">왜 '비즈플랜 AI'인가요?</h2>
                        <p className="text-muted-foreground text-lg">단순한 챗봇이 아닌, 합격을 위한 전략 파트너입니다.</p>
                    </div>
                    <div className="grid md:grid-cols-3 gap-8">
                        {[
                            {
                                icon: Target,
                                title: "평가 지표 기반 코칭",
                                desc: "초기창업패키지 실제 평가 지표(문제인식, 실현가능성, 성장전략, 팀구성)에 맞춰 구체적인 가이드를 제공합니다."
                            },
                            {
                                icon: Zap,
                                title: "실시간 초안 생성",
                                desc: "대화를 나누면 AI가 자동으로 사업계획서 초안을 작성해줍니다. 더 이상 빈 화면을 보고 막막해하지 마세요."
                            },
                            {
                                icon: Users,
                                title: "전문가 페르소나",
                                desc: "단순한 챗봇이 아닌, 날카로운 질문을 던지는 전문 컨설턴트 페르소나 AI가 논리적 허점을 보완해줍니다."
                            }
                        ].map((feature, i) => (
                            <Card key={i} className="border-none shadow-md bg-background/60 backdrop-blur-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                                <CardHeader>
                                    <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
                                        <feature.icon className="w-6 h-6 text-primary" />
                                    </div>
                                    <CardTitle className="text-xl">{feature.title}</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <CardDescription className="text-base leading-relaxed">
                                        {feature.desc}
                                    </CardDescription>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </div>
            </section>

            {/* Scoring Info Section */}
            <section className="py-24">
                <div className="container mx-auto px-4">
                    <div className="max-w-5xl mx-auto bg-card rounded-3xl border shadow-sm p-8 lg:p-12">
                        <div className="text-center mb-12">
                            <h2 className="text-3xl font-bold mb-4">평가 항목 완벽 분석</h2>
                            <p className="text-muted-foreground">초기창업패키지 평가 기준을 완벽하게 반영했습니다.</p>
                        </div>
                        <div className="grid md:grid-cols-2 gap-12">
                            <div className="space-y-8">
                                <div className="flex gap-4">
                                    <div className="w-10 h-10 rounded-full bg-green-100 text-green-600 flex items-center justify-center shrink-0">
                                        <span className="font-bold">1</span>
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-lg mb-2">문제인식 (Problem) - 30점</h3>
                                        <p className="text-muted-foreground leading-relaxed">창업아이템의 개발동기, 목적, 필요성을 명확히 제시합니다. 시장의 페인포인트를 정확히 타격합니다.</p>
                                    </div>
                                </div>
                                <div className="flex gap-4">
                                    <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
                                        <span className="font-bold">2</span>
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-lg mb-2">실현가능성 (Solution) - 30점</h3>
                                        <p className="text-muted-foreground leading-relaxed">시장분석, 경쟁력 확보방안, 개발 방안을 구체화합니다. 구체적인 실행 계획을 수립합니다.</p>
                                    </div>
                                </div>
                            </div>
                            <div className="space-y-8">
                                <div className="flex gap-4">
                                    <div className="w-10 h-10 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center shrink-0">
                                        <span className="font-bold">3</span>
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-lg mb-2">성장전략 (Scale-up) - 20점</h3>
                                        <p className="text-muted-foreground leading-relaxed">자금소요 및 조달계획, 시장진입 및 성과창출 전략을 수립합니다. 스케일업 로드맵을 제시합니다.</p>
                                    </div>
                                </div>
                                <div className="flex gap-4">
                                    <div className="w-10 h-10 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center shrink-0">
                                        <span className="font-bold">4</span>
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-lg mb-2">팀 구성 (Team) - 20점</h3>
                                        <p className="text-muted-foreground leading-relaxed">대표자 및 팀원의 보유역량을 강조하여 신뢰도를 높입니다. 성공적인 사업 수행 역량을 증명합니다.</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="py-24 bg-primary text-primary-foreground text-center relative overflow-hidden">
                <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10"></div>
                <div className="container mx-auto px-4 relative z-10">
                    <h2 className="text-3xl font-bold mb-6 lg:text-4xl">지금 바로 시작하세요</h2>
                    <p className="text-xl mb-10 opacity-90 max-w-2xl mx-auto">
                        복잡한 절차 없이 바로 사업계획서 작성을 시작할 수 있습니다.<br />
                        여러분의 아이디어를 현실로 만들어보세요.
                    </p>
                    <Button size="lg" variant="secondary" className="h-14 px-10 text-lg rounded-full shadow-xl hover:shadow-2xl transition-all" onClick={handleStart} disabled={loading || isLogin}>
                        {isLogin ? "시작하는 중..." : "무료로 사업계획서 작성하기"}
                        <ArrowRight className="w-5 h-5 ml-2" />
                    </Button>
                </div>
            </section>

            {/* Footer */}
            <footer className="py-12 border-t bg-muted/10">
                <div className="container mx-auto px-4 text-center text-muted-foreground">
                    <p className="mb-4 font-semibold">InitBizPlan</p>
                    <p className="text-sm">© 2025 InitBizPlan. All rights reserved.</p>
                </div>
            </footer>
        </div>
    );
}
