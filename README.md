# chaechae_daddy

인스타그램 인플루언서의 협찬 관리를 AI로 자동화하는 SaaS.
협찬 DM 분석 → 요구사항 정리 → 광고 콘텐츠 생성까지 한 번에.

## 기술 스택

- **프레임워크**: Next.js 16 (App Router) + TypeScript
- **스타일링**: Tailwind CSS 4
- **인증/DB**: Supabase (Auth, PostgreSQL, RLS)
- **AI**: Anthropic Claude API (Opus 오케스트레이터 + Sonnet 실행)
- **배포**: Vercel

## 로컬 개발

```bash
# 1. 의존성 설치
npm install

# 2. 환경 변수 설정
cp .env.example .env.local
# .env.local에 실제 값 입력

# 3. Supabase 테이블 생성
# Supabase 대시보드 > SQL Editor에서 supabase/schema.sql 실행

# 4. 개발 서버 실행
npm run dev
```

http://localhost:3000 에서 확인.

## 환경 변수

| 변수 | 설명 | 어디서 발급 |
|------|------|------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase 프로젝트 URL | Supabase 대시보드 > Settings > API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon/public 키 | 같은 위치 |
| `ANTHROPIC_API_KEY` | Claude API 키 | console.anthropic.com |

## Vercel 배포

### 1. GitHub에 Push

```bash
git remote add origin https://github.com/YOUR_USERNAME/chaechae-daddy.git
git add -A
git commit -m "Initial commit"
git push -u origin main
```

### 2. Vercel에서 Import

1. [vercel.com/new](https://vercel.com/new) 접속
2. GitHub 리포지토리 선택 (chaechae-daddy)
3. Framework Preset: **Next.js** (자동 감지됨)
4. Root Directory: `.` (기본값)

### 3. 환경 변수 설정

Vercel 대시보드 > 프로젝트 > Settings > Environment Variables에서:

```
NEXT_PUBLIC_SUPABASE_URL = https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY = eyJ...
ANTHROPIC_API_KEY = sk-ant-...
```

세 값 모두 Production, Preview, Development 환경에 추가.

### 4. 배포 확인

환경 변수 설정 후 **Redeploy** (Deployments 탭 > 최근 배포 > ... > Redeploy).

### 5. Supabase 설정

Supabase 대시보드에서:

1. **Authentication > URL Configuration**:
   - Site URL: `https://your-project.vercel.app`
   - Redirect URLs: `https://your-project.vercel.app/**`

2. **SQL Editor**에서 `supabase/schema.sql` 실행

## 프로젝트 구조

```
src/
├── app/
│   ├── api/agent/          # AI 에이전트 API 라우트
│   ├── dashboard/          # 대시보드 (인증 필요)
│   │   ├── sponsorships/   # 협찬 관리
│   │   └── usage/          # 사용량 확인
│   ├── landing/            # 랜딩 페이지
│   ├── login/              # 로그인
│   ├── signup/             # 회원가입
│   └── pricing/            # 가격 페이지
├── components/
│   ├── dashboard/          # 대시보드 공통 컴포넌트
│   └── sponsorship/        # 협찬 관련 컴포넌트
├── lib/
│   ├── agents/             # AI 에이전트 로직
│   ├── db/                 # Supabase 클라이언트, 사용량 관리
│   └── types/              # TypeScript 타입 정의
└── proxy.ts                # 인증 프록시 (Next.js 16)
```
