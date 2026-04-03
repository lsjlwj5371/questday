# QuestDay - Design Specification

## 1. 서비스 개요

**서비스명**: QuestDay
**한 줄 설명**: D-Day 목표를 RPG 퀘스트로 만들고, 매일 미션을 클리어하며 잔디를 채워가는 게이미피케이션 목표 관리 서비스
**타겟**: 2-30대 범용 (취준생, 직장인, 대학생 모두)
**기술 스택**: Next.js (Vercel) + Supabase (Auth + PostgreSQL)

### 핵심 구조

```
[메인 퀘스트] = D-Day 목표 (예: 토익 900점 D-45)
    └── [데일리 미션] = 매일 할 일 (예: 단어 50개, 리스닝 1세트)
        └── [완료] → XP 획득 → 잔디 채워짐 → 레벨업
```

### MVP 기능 범위

1. 회원가입/로그인 (Supabase Auth — Google 소셜 로그인)
2. 메인 퀘스트(D-Day) CRUD
3. 데일리 미션(투두) 체크
4. XP + 레벨 시스템
5. 잔디 캘린더 (달성 현황 시각화)
6. 스트릭 (연속 달성일)
7. 간단한 리더보드 (주간 XP 탑 10)

---

## 2. 데이터 구조 (Supabase PostgreSQL)

### users 테이블

| 컬럼 | 타입 | 설명 |
|------|------|------|
| id | UUID (PK) | Supabase Auth uid |
| email | TEXT | 이메일 |
| nickname | TEXT | 닉네임 |
| total_xp | INTEGER (default 0) | 누적 경험치 |
| level | INTEGER (default 1) | 현재 레벨 |
| current_streak | INTEGER (default 0) | 현재 연속일 |
| max_streak | INTEGER (default 0) | 최대 연속일 |
| created_at | TIMESTAMPTZ | 가입일 |

### quests 테이블 (메인 퀘스트 = D-Day)

| 컬럼 | 타입 | 설명 |
|------|------|------|
| id | UUID (PK) | 퀘스트 ID |
| user_id | UUID (FK → users) | 소유자 |
| title | TEXT | 퀘스트 이름 |
| target_date | DATE | D-Day 날짜 |
| category | TEXT | 공부/운동/재테크/기타 |
| is_completed | BOOLEAN (default false) | 완료 여부 |
| created_at | TIMESTAMPTZ | 생성일 |

### missions 테이블 (데일리 미션 = 투두)

| 컬럼 | 타입 | 설명 |
|------|------|------|
| id | UUID (PK) | 미션 ID |
| quest_id | UUID (FK → quests) | 소속 퀘스트 |
| user_id | UUID (FK → users) | 소유자 |
| title | TEXT | 미션 이름 |
| xp_reward | INTEGER (default 10) | 완료 시 XP |
| is_completed | BOOLEAN (default false) | 완료 여부 |
| completed_at | TIMESTAMPTZ | 완료 시각 |
| date | DATE | 미션 날짜 |

### activity_log 테이블 (잔디 캘린더용)

| 컬럼 | 타입 | 설명 |
|------|------|------|
| id | UUID (PK) | 로그 ID |
| user_id | UUID (FK → users) | 소유자 |
| date | DATE (UNIQUE per user) | 날짜 |
| missions_completed | INTEGER | 그날 완료한 미션 수 |
| xp_earned | INTEGER | 그날 획득한 XP |

### XP & 레벨 시스템

- 미션 완료 = +10 XP (기본)
- 스트릭 보너스 = 연속일 × 2 XP 추가
- **하루 XP 상한선 = 100 XP** (거짓 대량 완료 방지)
- 레벨 공식: Level N에 필요한 누적 XP = 50 × N × (N+1)
  - Level 1: 0 XP
  - Level 2: 100 XP
  - Level 3: 300 XP
  - Level 5: 750 XP
  - Level 10: 2,750 XP

### 스트릭 중심 보상 (거짓말 억제)

- 스트릭이 핵심 지표: 매일 꾸준히 해야 유지되므로 지속적 거짓말이 어려움
- 스트릭 기반 배지 (MVP 이후 확장):
  - 7일 연속: "루키 모험가"
  - 30일 연속: "꾸준한 전사"
  - 100일 연속: "전설의 용사"
- 하루라도 빠지면 스트릭 리셋 → 장기 거짓말 부담 증가

---

## 3. 디자인 가이드

### 컬러 팔레트

| 용도 | 색상 | HEX |
|------|------|-----|
| Primary (메인) | 보라 | #7C5CFC |
| Secondary (보조) | 핑크 | #FF6B9D |
| Success (완료/잔디) | 민트 | #36D399 |
| Warning (XP) | 노랑 | #FBBD23 |
| Background | 크림 | #FFF8F0 |
| Card | 흰색 | #FFFFFF |
| Text | 다크 퍼플 | #2D2D3F |
| Text Light | 그레이 | #9CA3AF |

### 잔디 캘린더 색상 (4단계)

| 완료 수 | 색상 | HEX |
|---------|------|-----|
| 0개 | 연한 회색 | #F3F4F6 |
| 1~2개 | 연한 민트 | #D5F5E3 |
| 3~4개 | 민트 | #6EE7B7 |
| 5개 이상 | 진한 민트 | #36D399 |

### 스타일 원칙

- 톤: 밝고 따뜻한 캐주얼 RPG
- 모서리: 둥글게 (rounded-2xl, 16px)
- 그림자: 부드러운 그림자 (shadow-sm)
- 아이콘: 이모지 활용 (⚔️🔥⚡📋🗓️)
- 애니메이션: 미션 완료 시 가볍게 바운스
- 레이아웃: 모바일 퍼스트 (max-w-lg, 512px 가운데 정렬)
- 폰트: Pretendard (또는 시스템 폰트), Bold로 레벨/XP 강조
- 스트릭 배너: 보라 → 핑크 그라데이션

---

## 4. 페이지 구성 & UI 흐름

### 페이지 (총 5개)

1. `/login` — 로그인/회원가입 (Google 소셜) + JellySqueeze 인터랙티브 마스코트
2. `/dashboard` — 메인 대시보드 (핵심 페이지)
3. `/quest/new` — 새 퀘스트(D-Day) 생성
4. `/quest/[id]` — 퀘스트 상세 + 미션 관리
5. `/leaderboard` — 주간 XP 리더보드

### 메인 대시보드 레이아웃

```
┌─────────────────────────────────────────┐
│  QuestDay          Lv.5 ⚡ 1,250 XP  [👤] │  ← 상단 바
├─────────────────────────────────────────┤
│  🔥 12일 연속 달성 중!                      │  ← 스트릭 배너
├─────────────────────────────────────────┤
│  📋 오늘의 미션                  3/5 완료   │
│  ┌─────────────────────────────────┐    │
│  │ ☑ 단어 50개 외우기      +10 XP  │    │
│  │ ☑ 리스닝 1세트          +10 XP  │    │
│  │ ☑ 스쿼트 50개           +10 XP  │    │
│  │ ☐ 독서 30분             +10 XP  │    │
│  │ ☐ 가계부 쓰기           +10 XP  │    │
│  └─────────────────────────────────┘    │
├─────────────────────────────────────────┤
│  🗓️ 잔디 캘린더 (최근 3개월)               │
│  ┌─ 1월 ──┬─ 2월 ──┬─ 3월 ──┐          │
│  │ ■■■■□□■│■■■■■■■│■■■□□□□ │          │
│  │ ■■■■■■■│■■■□□■■│         │          │
│  └────────┴────────┴────────┘          │
├─────────────────────────────────────────┤
│  ⚔️ 진행중인 퀘스트                        │
│  │ 토익 900점     D-23  ████████░░ 73% │
│  │ 10kg 감량      D-45  ████░░░░░░ 40% │
│  │ [+ 새 퀘스트 추가]                     │
└─────────────────────────────────────────┘
```

### 로그인 페이지 레이아웃

```
┌─────────────────────────────────┐
│         🎮 QuestDay             │  ← 크림 배경 (#FFF8F0)
│                                 │
│      ┌─────────────┐           │
│      │             │           │
│      │  [JellySqueeze]  │      │  ← 인터랙티브 젤리 마스코트
│      │             │           │     (드래그로 꾹 눌러보기)
│      └─────────────┘           │
│                                 │
│   "목표를 꾹 눌러 달성하세요"      │  ← 서브 타이틀
│                                 │
│   ┌─ 🔑 Google로 시작하기 ───┐  │  ← 로그인 버튼
│   └──────────────────────────┘  │     (보라 #7C5CFC)
└─────────────────────────────────┘
```

- JellySqueeze: showControls=false, 배경을 크림(#FFF8F0)으로 변경
- 타이틀: "꾹 눌러보세요!" → 로그인 후 "목표를 꾹 눌러 달성하세요"
- 최대 너비 max-w-[400px]로 축소, 로그인 페이지에 맞게 조정

### UI 흐름

```
로그인 → 대시보드 → 오늘의 미션 체크 → XP 획득 애니메이션
                  → 퀘스트 추가/관리
                  → 잔디 캘린더 확인
                  → 리더보드 확인
```

---

## 5. 기술 아키텍처

### 스택

| 영역 | 기술 |
|------|------|
| 프론트엔드 | Next.js (App Router) |
| 배포 | Vercel |
| 백엔드/DB | Supabase (Auth + PostgreSQL + RLS) |
| 스타일링 | Tailwind CSS |
| 잔디 캘린더 | CSS Grid 직접 구현 |

### Supabase 활용

| 기능 | Supabase 서비스 |
|------|----------------|
| 로그인 | Auth (Google OAuth) |
| 데이터 저장 | PostgreSQL |
| 보안 | Row Level Security (내 데이터만 접근) |

### RLS 정책

- users: 본인 행만 SELECT/UPDATE
- quests: 본인 행만 CRUD
- missions: 본인 행만 CRUD
- activity_log: 본인 행만 SELECT/INSERT/UPDATE
- activity_log: 리더보드용 주간 XP 합산은 VIEW로 제공 (전체 SELECT 허용)

### 리더보드 구현

- 별도 테이블 없이 activity_log를 주간 집계하는 PostgreSQL VIEW 사용
- `SELECT user_id, nickname, SUM(xp_earned) as weekly_xp FROM activity_log WHERE date >= (now() - interval '7 days') GROUP BY user_id ORDER BY weekly_xp DESC LIMIT 10`
- Supabase에서 이 VIEW를 호출하여 리더보드 표시

---

## 6. 확장 로드맵

| 단계 | 기능 | 수익화 |
|------|------|--------|
| v2 | 배지/칭호 시스템, 프로필 공유 페이지 | — |
| v3 | 친구 추가, 파티 퀘스트(공동 목표) | — |
| v4 | 프리미엄 플랜 (무제한 퀘스트, 상세 통계) | 구독 월 3,900원 |
| v5 | 기업용 (팀 목표 관리, 대시보드) | B2B SaaS |
| v6 | AI 코치 (Claude로 맞춤 미션 추천) | 프리미엄 기능 |
