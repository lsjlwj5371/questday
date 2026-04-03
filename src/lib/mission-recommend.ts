// 카테고리 + 목표 + 남은 기간에 따른 미션 추천

interface RecommendInput {
  title: string;
  category: string;
  daysLeft: number;
}

const MISSION_TEMPLATES: Record<string, string[][]> = {
  "공부": [
    // [단기 미션, 중기 미션, 장기 미션]
    ["핵심 개념 요약 노트 작성", "오답노트 정리", "모의시험 1회 풀기"],
    ["단어/용어 30개 암기", "기출문제 1세트 풀기", "요약 복습 30분"],
    ["강의 1강 수강", "문제집 10페이지 풀기", "취약 파트 집중 복습"],
    ["플래시카드 복습 15분", "스터디 그룹 참여", "오늘 배운 내용 정리"],
    ["아침 30분 집중 공부", "점심시간 단어 복습", "저녁 1시간 문제 풀기"],
  ],
  "운동": [
    ["스트레칭 10분", "홈트레이닝 20분", "런닝 30분"],
    ["스쿼트 30개", "플랭크 3세트", "푸시업 20개"],
    ["만보 걷기", "계단 오르기 10층", "자전거 30분"],
    ["식단 기록하기", "물 2L 마시기", "간식 줄이기"],
    ["아침 스트레칭", "점심 산책 15분", "저녁 운동 루틴"],
  ],
  "재테크": [
    ["가계부 쓰기", "불필요한 소비 1개 줄이기", "절약 팁 1개 실천"],
    ["투자 뉴스 읽기 10분", "자산 현황 체크", "저축 목표 확인"],
    ["재테크 책/영상 1개 보기", "소비 패턴 분석", "예산 계획 세우기"],
    ["커피 대신 텀블러", "구독 서비스 정리", "중고 판매 1개"],
    ["자동이체 확인", "포인트/마일리지 정리", "할인 쿠폰 체크"],
  ],
  "자기계발": [
    ["독서 30분", "일기 쓰기", "새로운 것 1개 배우기"],
    ["명상 10분", "감사일기 3줄", "TED 강연 1개 시청"],
    ["블로그/기록 작성", "외국어 학습 15분", "사이드 프로젝트 30분"],
    ["뉴스레터 읽기", "네트워킹 1명 연락", "온라인 강의 1강"],
    ["아침 루틴 실천", "디지털 디톡스 1시간", "주간 회고 작성"],
  ],
  "기타": [
    ["오늘 할 일 1개 완료", "10분 집중 실행", "진행 상황 기록"],
    ["관련 자료 조사 15분", "체크리스트 정리", "작은 목표 1개 달성"],
    ["타이머 25분 집중", "메모 정리", "내일 계획 세우기"],
  ],
};

// 제목에서 키워드 매칭으로 더 구체적인 미션 생성
const KEYWORD_MISSIONS: Record<string, string[]> = {
  "토익": ["LC Part 1-2 풀기", "RC Part 5 문법 30문제", "토익 단어 50개 암기", "LC 쉐도잉 15분", "실전 모의고사 파트별 풀기"],
  "토플": ["토플 리딩 1지문 풀기", "토플 라이팅 연습", "토플 스피킹 녹음 연습", "학술 단어 30개 암기"],
  "코딩": ["알고리즘 문제 1개 풀기", "프로젝트 코드 30분 작성", "기술 블로그 읽기", "코드 리뷰 참여"],
  "다이어트": ["식단 사진 기록", "간식 대신 과일 먹기", "물 2L 마시기", "야식 참기", "칼로리 기록하기"],
  "감량": ["체중 기록하기", "운동 30분", "식단 관리", "물 2L 마시기", "간헐적 단식 실천"],
  "영어": ["영어 뉴스 1개 읽기", "영어 일기 3문장", "팟캐스트 15분 듣기", "단어 30개 암기", "영어 회화 연습 10분"],
  "자격증": ["기출문제 1회 풀기", "이론 정리 30분", "오답노트 작성", "핵심 요약 복습", "모의시험 풀기"],
  "독서": ["30분 읽기", "읽은 내용 요약 3줄", "독서 노트 작성", "다음 읽을 책 고르기"],
  "러닝": ["5km 러닝", "인터벌 트레이닝 20분", "스트레칭 10분", "러닝 기록 체크", "러닝화 관리"],
  "헬스": ["웨이트 트레이닝 40분", "유산소 20분", "프로틴 섭취", "운동 일지 기록", "스트레칭 10분"],
};

/** 특정 날짜 하루치 미션을 추천 (매일 다른 조합) */
export function recommendDailyMissions({ title, category, daysLeft }: RecommendInput, seed: number = 0): string[] {
  const results: string[] = [];

  // seed 기반 셔플 (같은 seed → 같은 결과, 다른 날짜 → 다른 조합)
  function seededShuffle<T>(arr: T[], s: number): T[] {
    const a = [...arr];
    let current = s;
    for (let i = a.length - 1; i > 0; i--) {
      current = (current * 1103515245 + 12345) & 0x7fffffff;
      const j = current % (i + 1);
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  // 1. 제목 키워드 매칭으로 구체적 미션 추가
  const titleLower = title.toLowerCase();
  for (const [keyword, missions] of Object.entries(KEYWORD_MISSIONS)) {
    if (titleLower.includes(keyword.toLowerCase())) {
      const count = daysLeft <= 7 ? 5 : daysLeft <= 30 ? 4 : 3;
      const shuffled = seededShuffle(missions, seed);
      results.push(...shuffled.slice(0, count));
      break;
    }
  }

  // 2. 키워드 매칭이 없으면 카테고리 기반 추천
  if (results.length === 0) {
    const templates = MISSION_TEMPLATES[category] ?? MISSION_TEMPLATES["기타"];
    const allMissions = templates.flat();
    const shuffled = seededShuffle(allMissions, seed);

    if (daysLeft <= 7) {
      results.push(...shuffled.slice(0, 5));
    } else if (daysLeft <= 30) {
      results.push(...shuffled.slice(0, 4));
    } else {
      results.push(...shuffled.slice(0, 3));
    }
  }

  return results;
}

/** 기존 호환용 (랜덤) */
export function recommendMissions(input: RecommendInput): string[] {
  return recommendDailyMissions(input, Math.floor(Math.random() * 100000));
}

/** 퀘스트 생성 시 오늘부터 목표일까지 모든 날짜의 미션을 한번에 생성 */
export function generateAllMissions(
  title: string,
  category: string,
  targetDate: string
): { date: string; missions: string[] }[] {
  const target = new Date(targetDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  target.setHours(0, 0, 0, 0);

  const totalDays = Math.ceil((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  if (totalDays <= 0) return [];

  const result: { date: string; missions: string[] }[] = [];

  for (let i = 0; i < totalDays; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() + i);
    const dateStr = d.toISOString().split("T")[0];
    const daysLeft = totalDays - i;

    // 날짜 기반 seed → 같은 날짜에는 같은 미션, 다른 날짜는 다른 조합
    const seed = d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate() + i * 7;
    const missions = recommendDailyMissions({ title, category, daysLeft }, seed);

    result.push({ date: dateStr, missions });
  }

  return result;
}
