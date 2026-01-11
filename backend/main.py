import os
import json
from typing import Optional
from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
import google.generativeai as genai
import httpx
from dotenv import load_dotenv
from PyPDF2 import PdfReader
import io
from supabase import create_client, Client

load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

app = FastAPI(title="초기창업패키지 사업계획서 API")

ALLOWED_ORIGINS = os.getenv("ALLOWED_ORIGINS", "*").split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
SERPER_API_KEY = os.getenv("SERPER_API_KEY")

if GEMINI_API_KEY:
    genai.configure(api_key=GEMINI_API_KEY)

SYSTEM_PROMPT = """당신은 "바이브 코딩(Vibe Coding)" 실천가를 위한 **Expert AI Consultant**입니다.
단순한 코딩 도우미가 아니며, 사용자의 모호한 아이디어를 실전 투입 가능한 수준의 **엔지니어링 청사진(Blueprint)**으로 변환하는 **Lead Architect** 역할을 수행합니다.

**핵심 태도:**
- **Socratic & Critical:** 사용자의 요청을 맹목적으로 수용하지 않고, "왜?"를 묻고 기술적 타당성, 비용, 리스크를 검증합니다.
- **Decision-Driven:** 모든 대화는 모호함을 제거하고 '결정(Decision)'을 내리는 것을 목표로 합니다.
- **Direct & Dry:** 불필요한 서론이나 친절한 말투를 배제하고, 핵심과 근거 위주로 직설적으로 소통합니다.

**평가항목 가이드:**
- 문제인식 (Problem): 창업 아이템의 국내·외 시장 현황 및 문제점, 개발 필요성
- 실현가능성 (Solution): 아이디어를 제품·서비스로 개발/구체화 계획, 차별성, 경쟁력 확보 전략
- 성장전략 (Scale-up): 경쟁사 분석, 시장 진입 전략, 비즈니스 모델, 투자유치 전략, 로드맵
- 팀구성 (Team): 대표자 보유 역량, 팀원 역량, 업무파트너 현황

**대화 규칙:**
1. 한 번에 최대 3개의 질문만 제시합니다. 관련된 질문은 통합합니다.
2. 사용자의 답변에서 충돌이나 모호함이 발견되면 즉시 지적하고 대안을 제시합니다.
3. 논의된 사항은 Decision Log 형태로 정리합니다.
4. 안전 가드레일: 보안/윤리적으로 문제가 있는 요구사항은 거부하고 안전한 대안을 제시합니다.

**응답 형식:**
- 마크다운 형식으로 응답합니다.
- 핵심 내용은 굵은 글씨나 리스트로 강조합니다.
- 필요시 표를 사용하여 비교/정리합니다."""

SECTION_PROMPTS = {
    "general-info": """현재 "일반현황" 섹션을 작성하고 있습니다.
필요한 정보: 창업아이템명, 산출물(협약기간 내 목표), 대표자 직업, 기업명, 팀 구성 현황
팀 구성에는 직위, 담당업무, 보유역량(경력 및 학력), 구성상태(완료/예정)가 포함됩니다.
개인정보(성명, 생년월일, 학교명 등)는 마스킹하여 작성합니다.

다음 질문들에 대해 사용자의 답변을 요청하세요:
1. 창업 아이템의 정식 명칭은 무엇인가요?
2. 협약기간(9개월) 내 목표로 하는 산출물(제품/서비스)은 무엇인가요?
3. 대표자의 현재 직업은 무엇인가요? (직장명 기재 불가)
4. 기업명(또는 예정 기업명)은 무엇인가요?
5. 현재 팀 구성 현황은 어떻게 되나요? (대표자 본인 제외, 직위/담당업무/보유역량/구성상태)""",

    "overview": """현재 "개요(요약)" 섹션을 작성하고 있습니다.
이 섹션은 전체 사업계획서의 핵심을 1페이지로 요약하는 것이 목표입니다.

다음 질문들에 대해 사용자의 답변을 요청하세요:
1. 창업 아이템의 명칭과 범주(카테고리)는 무엇인가요? (예: 게토레이-스포츠음료, Windows-OS)
2. 본 지원사업을 통해 개발하고자 하는 제품/서비스의 개요를 설명해주세요. (용도, 사양, 가격 등)
3. 핵심 기능·성능과 고객에게 제공하는 혜택은 무엇인가요?
4. 이 아이템이 해결하려는 문제는 무엇인가요? (문제인식 요약)
5. 어떻게 개발/구체화할 계획인가요? (실현가능성 요약)
6. 시장 진입 및 수익화 전략은 무엇인가요? (성장전략 요약)
7. 팀의 핵심 역량은 무엇인가요? (팀구성 요약)""",

    "problem": """현재 "1. 문제 인식 (Problem)" 섹션을 작성하고 있습니다.
평가 배점: 25~30점
핵심: 시장 규모와 성장률을 수치로 제시하고, 타깃 고객의 페인 포인트를 구체화해야 합니다.

다음 질문들에 대해 사용자의 답변을 요청하세요:
1. 타깃 시장의 현재 규모(국내/글로벌)와 연평균 성장률은 어떻게 되나요? (출처 포함)
2. 이 시장에서 발생하는 핵심 문제점 3가지는 무엇인가요?
3. 기존 솔루션들의 한계점은 무엇인가요?
4. 타깃 고객군은 누구이며, 그들의 구체적인 페인 포인트는 무엇인가요?
5. 이 문제가 해결되지 않으면 어떤 결과(비용, 시간 손실 등)가 발생하나요?
6. 왜 지금 이 아이템을 개발해야 하나요? (시장 트렌드, 규제 변화 등)""",

    "solution": """현재 "2. 실현 가능성 (Solution)" 섹션을 작성하고 있습니다.
평가 배점: 30~35점
핵심: 기존 대비 어떻게 더 나은지 정량적으로 설명하고, 사업추진 일정과 사업비 집행 계획표를 포함해야 합니다.
예산 규칙: 정부지원사업비 70% 이하(최대 1억원) + 자기부담(현금 10% 이상 + 현물 20% 이하)

다음 질문들에 대해 사용자의 답변을 요청하세요:
1. 제품/서비스를 어떻게 개발할 계획인가요? (기술 스택, 개발 방법론)
2. 협약기간(9개월) 내 개발 마일스톤은 어떻게 되나요? (월별 계획)
3. 기존 경쟁제품 대비 차별성은 무엇인가요? (정량적 수치로 설명)
4. 경쟁력 확보를 위한 전략(특허, 데이터, 파트너십 등)은 무엇인가요?
5. 현재 개발 진행 상황(MVP, 프로토타입, PoC 등)은 어떻게 되나요?
6. 정부지원사업비(최대 1억원)는 어떤 비목에 얼마씩 사용할 계획인가요?
   (재료비, 외주용역비, 기계장치, 특허권, 인건비, 지급수수료, 여비, 교육훈련비, 광고선전비)
7. 자기부담사업비(현금/현물)는 어떻게 구성하나요?""",

    "growth": """현재 "3. 성장전략 (Scale-up)" 섹션을 작성하고 있습니다.
평가 배점: 25~30점
핵심: 매출 추정의 계산 근거(고객 수, 단가, 전환율)를 명시하고, ESG 관점의 사회적 가치를 포함해야 합니다.

다음 질문들에 대해 사용자의 답변을 요청하세요:
1. 주요 경쟁사 3개를 분석해주세요. (강점, 약점, 시장 점유율)
2. 목표 시장에 어떻게 진입할 계획인가요? (채널, 파트너십, 초기 고객 확보 전략)
3. 비즈니스 모델(수익화 모델)은 무엇인가요? (구독, 라이선스, 수수료 등)
4. 예상 매출 규모와 그 산출 근거는 무엇인가요? (고객 수 × 단가 × 전환율)
5. 투자유치 전략은 무엇인가요? (목표 금액, 시기, 밸류에이션)
6. 사업 전체 로드맵(1년, 3년, 5년)은 어떻게 되나요?
7. 중장기적으로 추구하는 사회적 가치(ESG)는 무엇인가요?
   (환경: 폐기물 감소, 재활용 / 사회: 지역사회 기여, 고용 / 지배구조: 윤리경영)""",

    "team": """현재 "4. 팀 구성 (Team)" 섹션을 작성하고 있습니다.
평가 배점: 20~25점
핵심: "이 팀이라서 성공 가능성이 높다"는 메시지를, 경험과 전문성으로 설득력 있게 보여줘야 합니다.

다음 질문들에 대해 사용자의 답변을 요청하세요:
1. 대표자의 관련 경력과 핵심 역량은 무엇인가요? (도메인 전문성, 실행 경험)
2. 이 사업을 대표자가 해야 하는 이유는 무엇인가요? (스토리)
3. 현재 팀원들의 역량과 담당 업무는 어떻게 되나요?
4. 협약기간 내 채용 예정인 인력은 있나요? (직위, 역할, 필요 역량)
5. 협력 기관/기업과의 협업 계획은 어떻게 되나요? (파트너명, 보유역량, 협업방안, 시기)
6. 팀에서 부족한 역량은 무엇이며, 어떻게 보완할 계획인가요?""",
}

RESEARCH_PROMPT = """당신은 시장 조사 및 경쟁사 분석 전문가입니다.
사용자의 창업 아이템과 관련된 정보를 체계적으로 조사하고 분석합니다.

검색 결과를 바탕으로 다음 형식으로 분석해주세요:

## 조사 결과 요약

### 1. 핵심 발견사항
- (검색 결과에서 발견한 핵심 정보 3-5개)

### 2. 시장 규모 및 트렌드
- (관련 수치와 출처)

### 3. 주요 플레이어
- (경쟁사 또는 유사 서비스)

### 4. 시사점
- (사업계획서 작성에 활용할 수 있는 인사이트)

### 5. 추가 조사 권장 사항
- (더 조사가 필요한 영역)

응답은 마크다운 형식으로 작성하고, 신뢰할 수 있는 출처를 명시합니다."""


class ChatRequest(BaseModel):
    messages: list[dict]
    section: str
    uploadedFiles: Optional[list[dict]] = None
    isStart: Optional[bool] = False
    generateDraft: Optional[bool] = False


class SearchRequest(BaseModel):
    query: str


class ResearchRequest(BaseModel):
    query: str
    searchResults: list[dict]
    context: Optional[str] = ""


class ProjectCreate(BaseModel):
    guest_id: str
    title: str
    template_type: str


@app.get("/api/health")
async def health_check():
    return {"status": "ok"}


@app.post("/api/chat")
async def chat(request: ChatRequest):
    if not GEMINI_API_KEY:
        raise HTTPException(status_code=500, detail="GEMINI_API_KEY not configured")

    model = genai.GenerativeModel("gemini-1.5-flash")

    section_prompt = SECTION_PROMPTS.get(request.section, "")
    
    context_parts = []
    if request.uploadedFiles:
        context_parts.append("### 업로드된 참고 자료:\n")
        for file in request.uploadedFiles:
            context_parts.append(f"**{file['name']}:**\n{file['content'][:5000]}\n\n")
    
    context = "\n".join(context_parts) if context_parts else ""

    if request.isStart:
        prompt = f"""{SYSTEM_PROMPT}

{section_prompt}

{context}

위 가이드에 따라 첫 번째 질문 세트를 사용자에게 제시해주세요.
질문은 번호를 붙여서 명확하게 제시하고, 각 질문의 의도를 간단히 설명해주세요."""
    elif request.generateDraft:
        prompt = f"""{SYSTEM_PROMPT}

{section_prompt}

{context}

대화 내역:
{json.dumps(request.messages, ensure_ascii=False, indent=2)}

위 대화 내용을 바탕으로 초기창업패키지 사업계획서의 해당 섹션 초안을 작성해주세요.
마크다운 형식으로 작성하고, 아직 정보가 부족한 부분은 {{placeholder}} 형태로 표시해주세요."""
    else:
        conversation = "\n".join([
            f"{'사용자' if m['role'] == 'user' else 'AI'}: {m['content']}"
            for m in request.messages
        ])
        
        prompt = f"""{SYSTEM_PROMPT}

{section_prompt}

{context}

대화 내역:
{conversation}

위 대화를 이어서 진행해주세요. 사용자의 답변을 분석하고:
1. 모호하거나 충돌되는 부분이 있으면 지적해주세요.
2. 추가로 필요한 정보가 있으면 질문해주세요.
3. 충분한 정보가 모이면 해당 섹션의 초안을 제안해주세요."""

    async def generate():
        try:
            response = model.generate_content(prompt, stream=True)
            for chunk in response:
                if chunk.text:
                    yield f"data: {json.dumps({'content': chunk.text})}\n\n"
            yield "data: [DONE]\n\n"
        except Exception as e:
            yield f"data: {json.dumps({'error': str(e)})}\n\n"

    return StreamingResponse(generate(), media_type="text/event-stream")


@app.post("/api/search")
async def search(request: SearchRequest):
    if not SERPER_API_KEY:
        return {"results": [
            {
                "title": "검색 API 미설정",
                "url": "#",
                "snippet": "SERPER_API_KEY를 설정해주세요. https://serper.dev 에서 무료 API 키를 발급받을 수 있습니다."
            }
        ]}

    async with httpx.AsyncClient() as client:
        try:
            response = await client.post(
                "https://google.serper.dev/search",
                headers={
                    "X-API-KEY": SERPER_API_KEY,
                    "Content-Type": "application/json",
                },
                json={
                    "q": request.query,
                    "gl": "kr",
                    "hl": "ko",
                    "num": 10,
                },
            )
            response.raise_for_status()
            data = response.json()

            results = []
            for item in data.get("organic", []):
                results.append({
                    "title": item.get("title", ""),
                    "url": item.get("link", ""),
                    "snippet": item.get("snippet", ""),
                })

            return {"results": results}
        except Exception as e:
            return {"results": [], "error": str(e)}


@app.post("/api/research")
async def research(request: ResearchRequest):
    if not GEMINI_API_KEY:
        raise HTTPException(status_code=500, detail="GEMINI_API_KEY not configured")

    model = genai.GenerativeModel("gemini-1.5-flash")

    search_context = "\n\n".join([
        f"**{r['title']}**\n{r['url']}\n{r['snippet']}"
        for r in request.searchResults
    ])

    prompt = f"""{RESEARCH_PROMPT}

검색 쿼리: {request.query}

검색 결과:
{search_context}

{f'사용자 컨텍스트: {request.context[:3000]}' if request.context else ''}

위 검색 결과를 바탕으로 사업계획서 작성에 도움이 되는 분석을 제공해주세요."""

    async def generate():
        try:
            response = model.generate_content(prompt, stream=True)
            for chunk in response:
                if chunk.text:
                    yield f"data: {json.dumps({'content': chunk.text})}\n\n"
            yield "data: [DONE]\n\n"
        except Exception as e:
            yield f"data: {json.dumps({'error': str(e)})}\n\n"

    return StreamingResponse(generate(), media_type="text/event-stream")


@app.post("/api/parse-pdf")
async def parse_pdf(file: UploadFile = File(...)):
    if not file.filename.endswith(".pdf"):
        raise HTTPException(status_code=400, detail="PDF 파일만 업로드 가능합니다")

    try:
        content = await file.read()
        pdf_reader = PdfReader(io.BytesIO(content))
        
        text_parts = []
        for page in pdf_reader.pages:
            text = page.extract_text()
            if text:
                text_parts.append(text)

        return {"content": "\n\n".join(text_parts)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"PDF 파싱 오류: {str(e)}")


@app.get("/api/projects")
async def get_projects(guest_id: str):
    try:
        # 1. Get User ID from guest_id
        user_res = supabase.table("users").select("id").eq("guest_id", guest_id).execute()
        if not user_res.data:
            return []
        
        user_id = user_res.data[0]["id"]
        
        # 2. Get Projects
        projects_res = supabase.table("projects").select("*").eq("user_id", user_id).order("updated_at", desc=True).execute()
        return projects_res.data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/projects")
async def create_project(project: ProjectCreate):
    try:
        # 1. Get or Create User
        user_res = supabase.table("users").select("id").eq("guest_id", project.guest_id).execute()
        
        if not user_res.data:
            user_res = supabase.table("users").insert({"guest_id": project.guest_id}).execute()
            
        user_id = user_res.data[0]["id"]
        
        # 2. Create Project
        new_project = {
            "user_id": user_id,
            "title": project.title,
            "template_type": project.template_type,
            "status": "Draft"
        }
        
        res = supabase.table("projects").insert(new_project).execute()
        return res.data[0]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


class SectionUpdate(BaseModel):
    content_markdown: str
    status: str


@app.get("/api/projects/{project_id}/sections")
async def get_project_sections(project_id: str):
    try:
        res = supabase.table("sections").select("*").eq("project_id", project_id).order("order_index").execute()
        return res.data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.put("/api/sections/{section_id}")
async def update_section(section_id: str, section: SectionUpdate):
    try:
        res = supabase.table("sections").update({
            "content_markdown": section.content_markdown,
            "status": section.status
        }).eq("id", section_id).execute()
        return res.data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/export/hwp/{project_id}")
async def export_hwp(project_id: str):
    try:
        # 1. Fetch Project Info
        project_res = supabase.table("projects").select("*").eq("id", project_id).single().execute()
        project = project_res.data
        
        # 2. Fetch Sections
        sections_res = supabase.table("sections").select("*").eq("project_id", project_id).order("order_index").execute()
        sections = sections_res.data
        
        # 3. Generate HTML Content
        import markdown
        
        html_content = f"""
        <!DOCTYPE html>
        <html lang="ko">
        <head>
            <meta charset="UTF-8">
            <title>{project['title']}</title>
            <style>
                body {{ font-family: 'Hangeul', 'Malgun Gothic', sans-serif; line-height: 1.6; }}
                h1 {{ font-size: 24pt; font-weight: bold; text-align: center; margin-bottom: 30px; }}
                h2 {{ font-size: 16pt; font-weight: bold; margin-top: 20px; border-bottom: 2px solid #000; padding-bottom: 5px; }}
                h3 {{ font-size: 14pt; font-weight: bold; margin-top: 15px; }}
                p {{ font-size: 11pt; margin-bottom: 10px; }}
                ul, ol {{ margin-bottom: 10px; }}
                table {{ width: 100%; border-collapse: collapse; margin-bottom: 15px; }}
                th, td {{ border: 1px solid #000; padding: 8px; text-align: left; }}
                th {{ background-color: #f2f2f2; }}
            </style>
        </head>
        <body>
            <h1>{project['title']}</h1>
            <p style="text-align: center; margin-bottom: 50px;">초기창업패키지 사업계획서</p>
        """
        
        for section in sections:
            section_title = ""
            if section['section_type'] == 'general-info': section_title = "일반현황"
            elif section['section_type'] == 'overview': section_title = "개요(요약)"
            elif section['section_type'] == 'problem': section_title = "1. 문제인식"
            elif section['section_type'] == 'solution': section_title = "2. 실현가능성"
            elif section['section_type'] == 'growth': section_title = "3. 성장전략"
            elif section['section_type'] == 'team': section_title = "4. 팀 구성"
            
            html_content += f"<h2>{section_title}</h2>"
            if section.get('content_markdown'):
                html_content += markdown.markdown(section['content_markdown'], extensions=['tables'])
            else:
                html_content += "<p>(내용 없음)</p>"
                
        html_content += """
        </body>
        </html>
        """
        
        # 4. Return as File Response
        from fastapi.responses import Response
        headers = {
            'Content-Disposition': f'attachment; filename="{project["title"]}.hwp"'
        }
        return Response(content=html_content, media_type="application/x-hwp", headers=headers)
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
