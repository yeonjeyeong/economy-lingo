export type QuizDifficulty = 'easy' | 'medium' | 'hard';

export interface QuizQuestion {
    id: number;
    question: string;
    options: [string, string, string, string];
    correctAnswer: number;
    difficulty: QuizDifficulty;
    explanation: string;
}

export const quizQuestions: QuizQuestion[] = [
    {
        id: 1,
        question: '국내총생산(GDP)은 무엇을 나타내는 지표일까요?',
        options: ['한 나라의 일정 기간 최종 생산물 가치', '정부가 보유한 외환의 양', '가계가 받은 임금의 합계', '주식시장에 상장된 기업 수'],
        correctAnswer: 0,
        difficulty: 'easy',
        explanation: 'GDP는 한 나라 안에서 일정 기간 생산된 최종 재화와 서비스의 시장가치를 합한 값입니다.'
    },
    {
        id: 2,
        question: '소비자물가지수(CPI)가 주로 측정하는 것은 무엇일까요?',
        options: ['기업의 수출량', '가계가 구입하는 상품과 서비스의 가격 변화', '시중 통화량', '정부의 세수'],
        correctAnswer: 1,
        difficulty: 'easy',
        explanation: 'CPI는 대표적인 소비 품목 묶음의 가격이 기준 시점과 비교해 얼마나 변했는지 보여 줍니다.'
    },
    {
        id: 3,
        question: '중앙은행이 기준금리를 올릴 때 일반적으로 기대하는 효과는 무엇일까요?',
        options: ['대출 수요 증가', '물가 상승 압력 완화', '통화 가치의 무조건적 하락', '정부 지출의 자동 증가'],
        correctAnswer: 1,
        difficulty: 'easy',
        explanation: '금리 인상은 차입과 소비·투자를 둔화시켜 과도한 수요와 물가 상승 압력을 낮추는 데 쓰입니다.'
    },
    {
        id: 4,
        question: '실업률은 어떤 비율을 뜻할까요?',
        options: ['전체 인구 중 학생의 비율', '경제활동인구 중 실업자의 비율', '취업자 중 자영업자의 비율', '생산가능인구 중 은퇴자의 비율'],
        correctAnswer: 1,
        difficulty: 'easy',
        explanation: '실업률은 일할 의사와 능력이 있어 구직 중인 실업자를 경제활동인구로 나눈 비율입니다.'
    },
    {
        id: 5,
        question: '환율이 1달러당 1,300원에서 1,400원으로 오르면 어떤 의미일까요?',
        options: ['원화 가치 상승', '원화 가치 하락', '달러 가치 하락만 의미', '물가가 반드시 하락'],
        correctAnswer: 1,
        difficulty: 'easy',
        explanation: '같은 1달러를 사는 데 더 많은 원화가 필요하므로 달러 대비 원화 가치가 하락한 것입니다.'
    },
    {
        id: 6,
        question: '복리는 어떤 방식으로 이자가 붙는 것일까요?',
        options: ['원금에만 이자가 붙는다', '원금과 이미 붙은 이자에 다시 이자가 붙는다', '물가가 오를 때만 이자가 붙는다', '매년 이율이 반드시 두 배가 된다'],
        correctAnswer: 1,
        difficulty: 'easy',
        explanation: '복리는 이전 기간까지 쌓인 이자를 원금에 더한 금액을 기준으로 다음 이자를 계산합니다.'
    },
    {
        id: 7,
        question: '명목 GDP와 실질 GDP의 가장 중요한 차이는 무엇일까요?',
        options: ['실질 GDP는 해외 생산을 포함한다', '실질 GDP는 물가 변동의 영향을 제거한다', '명목 GDP는 서비스업을 제외한다', '명목 GDP는 인구수를 반영한다'],
        correctAnswer: 1,
        difficulty: 'medium',
        explanation: '실질 GDP는 기준연도 가격을 사용해 물가 변화가 아닌 생산량 변화를 비교할 수 있게 합니다.'
    },
    {
        id: 8,
        question: '중앙은행의 양적완화(QE)는 일반적으로 어떤 정책일까요?',
        options: ['세율을 인상하는 재정정책', '장기 자산을 매입해 유동성을 공급하는 통화정책', '수입 관세를 낮추는 무역정책', '최저임금을 결정하는 노동정책'],
        correctAnswer: 1,
        difficulty: 'medium',
        explanation: '양적완화는 중앙은행이 국채 같은 자산을 매입해 시중 유동성을 늘리고 장기금리 하락을 유도하는 정책입니다.'
    },
    {
        id: 9,
        question: '경상수지에 포함되지 않는 항목은 무엇일까요?',
        options: ['상품수지', '서비스수지', '본원소득수지', '주식·채권 투자에 따른 금융계정'],
        correctAnswer: 3,
        difficulty: 'medium',
        explanation: '경상수지는 상품·서비스·본원소득·이전소득 수지로 구성되며, 증권투자는 금융계정에 기록됩니다.'
    },
    {
        id: 10,
        question: '구매관리자지수(PMI)가 50보다 높을 때 보통 어떻게 해석할까요?',
        options: ['관련 산업 활동의 위축', '관련 산업 활동의 확장', '소비자물가의 하락 확정', '완전고용 달성'],
        correctAnswer: 1,
        difficulty: 'medium',
        explanation: 'PMI는 보통 50을 기준으로 그보다 높으면 전월 대비 경기 확장, 낮으면 위축으로 해석합니다.'
    },
    {
        id: 11,
        question: '재정적자가 발생한 상태를 가장 정확하게 설명한 것은 무엇일까요?',
        options: ['정부 수입이 지출보다 많다', '정부 지출이 수입보다 많다', '수출이 수입보다 많다', '가계 저축이 소비보다 많다'],
        correctAnswer: 1,
        difficulty: 'medium',
        explanation: '재정적자는 일정 기간 정부의 총지출이 조세 등 총수입을 초과한 상태입니다.'
    },
    {
        id: 12,
        question: '수요의 가격탄력성 절댓값이 1보다 크다는 뜻은 무엇일까요?',
        options: ['가격 변화율보다 수요량 변화율이 더 크다', '가격과 수요량이 같은 방향으로 움직인다', '가격이 변해도 수요량은 변하지 않는다', '공급량이 항상 부족하다'],
        correctAnswer: 0,
        difficulty: 'medium',
        explanation: '가격탄력성의 절댓값이 1보다 크면 수요량이 가격 변화에 상대적으로 민감한 탄력적 수요입니다.'
    },
    {
        id: 13,
        question: '장단기 금리차가 역전됐다는 말의 의미는 무엇일까요?',
        options: ['장기금리가 단기금리보다 낮다', '모든 만기의 금리가 같다', '실질금리가 항상 음수다', '회사채 금리가 국채보다 낮다'],
        correctAnswer: 0,
        difficulty: 'hard',
        explanation: '수익률곡선 역전은 장기 국채금리가 단기 국채금리보다 낮아진 상태로, 경기 둔화 우려와 함께 관찰되곤 합니다.'
    },
    {
        id: 14,
        question: '피셔 방정식이 설명하는 관계로 가장 알맞은 것은 무엇일까요?',
        options: ['명목금리 ≈ 실질금리 + 기대인플레이션', '실질 GDP = 명목 GDP + 환율', '소비 = 소득 + 세금', '환율 = 수출 - 수입'],
        correctAnswer: 0,
        difficulty: 'hard',
        explanation: '피셔 방정식은 명목금리가 실질금리와 기대인플레이션의 합으로 근사된다는 관계를 보여 줍니다.'
    },
    {
        id: 15,
        question: '테일러 준칙에서 중앙은행의 정책금리 결정에 핵심적으로 쓰이는 두 격차는 무엇일까요?',
        options: ['무역수지와 재정수지', '인플레이션 격차와 산출 격차', '저축률과 투자율', '환율과 외환보유액'],
        correctAnswer: 1,
        difficulty: 'hard',
        explanation: '테일러 준칙은 실제 물가상승률의 목표 대비 격차와 실제 산출의 잠재산출 대비 격차를 정책금리에 반영합니다.'
    },
    {
        id: 16,
        question: '스태그플레이션을 가장 잘 설명한 것은 무엇일까요?',
        options: ['높은 성장과 낮은 물가', '경기 침체와 높은 물가의 동시 발생', '물가와 실업률의 동시 하락', '수출과 수입의 동시 증가'],
        correctAnswer: 1,
        difficulty: 'hard',
        explanation: '스태그플레이션은 경제활동이 정체되거나 위축되는 가운데 높은 인플레이션이 함께 나타나는 현상입니다.'
    },
    {
        id: 17,
        question: '비교우위에 따른 무역의 기준은 무엇일까요?',
        options: ['절대 생산량이 더 많은가', '기회비용이 상대적으로 더 낮은가', '임금이 더 높은가', '인구가 더 많은가'],
        correctAnswer: 1,
        difficulty: 'hard',
        explanation: '비교우위는 다른 재화를 포기해야 하는 기회비용이 상대적으로 낮은 재화에 특화하는 개념입니다.'
    },
    {
        id: 18,
        question: '채권의 듀레이션이 길수록 다른 조건이 같을 때 어떤 특성이 있나요?',
        options: ['금리 변화에 대한 가격 민감도가 커진다', '부도 위험이 자동으로 사라진다', '표면금리가 반드시 높아진다', '만기수익률이 고정된다'],
        correctAnswer: 0,
        difficulty: 'hard',
        explanation: '듀레이션은 금리 변화에 대한 채권 가격 민감도의 근사치이며, 길수록 같은 금리 변화에 가격이 더 크게 움직입니다.'
    }
];
