export interface QuizQuestion {
    id: number;
    question: string;
    options: string[];
    correctAnswer: number;
    difficulty: 'easy' | 'medium' | 'hard';
    explanation: string;
}

export const quizQuestions: QuizQuestion[] = [
    // Easy questions
    {
        id: 1,
        question: 'GDP는 무엇의 약자인가요?',
        options: [
            'Gross Domestic Product',
            'General Development Project',
            'Global Data Processing',
            'Government Distribution Plan'
        ],
        correctAnswer: 0,
        difficulty: 'easy',
        explanation: 'GDP는 Gross Domestic Product(국내총생산)의 약자로, 한 나라의 경제 규모를 나타내는 지표입니다.'
    },
    {
        id: 2,
        question: 'CPI는 무엇을 측정하는 지표인가요?',
        options: [
            '고용률',
            '물가 상승률',
            '금리',
            '환율'
        ],
        correctAnswer: 1,
        difficulty: 'easy',
        explanation: 'CPI(소비자물가지수)는 소비자가 구입하는 상품과 서비스의 가격 변동을 측정하는 지표입니다.'
    },
    {
        id: 3,
        question: '중앙은행이 기준금리를 인상하면 어떤 효과가 있나요?',
        options: [
            '물가 상승',
            '경기 과열',
            '대출 금리 상승',
            '환율 하락'
        ],
        correctAnswer: 2,
        difficulty: 'easy',
        explanation: '기준금리 인상은 시중 대출 금리를 높여 자금 조달 비용을 증가시킵니다.'
    },

    // Medium questions
    {
        id: 4,
        question: '양적완화(QE)의 주요 목적은 무엇인가요?',
        options: [
            '세금 인상',
            '시중 유동성 공급',
            '무역 규제',
            '재정 지출 감소'
        ],
        correctAnswer: 1,
        difficulty: 'medium',
        explanation: '양적완화는 중앙은행이 국채 등을 매입해 시중에 자금을 공급하고 금리를 낮추는 정책입니다.'
    },
    {
        id: 5,
        question: '경상수지 흑자가 의미하는 것은 무엇인가요?',
        options: [
            '수입이 수출보다 많음',
            '수출이 수입보다 많음',
            '외화 보유액 감소',
            '환율 상승'
        ],
        correctAnswer: 1,
        difficulty: 'medium',
        explanation: '경상수지 흑자는 상품·서비스 수출이 수입보다 많아 외화가 유입되는 상태를 의미합니다.'
    },
    {
        id: 6,
        question: 'PMI(구매관리자지수)가 50 이상일 때 의미하는 것은?',
        options: [
            '경기 침체',
            '경기 확장',
            '물가 하락',
            '실업률 증가'
        ],
        correctAnswer: 1,
        difficulty: 'medium',
        explanation: 'PMI 50 이상은 제조업 활동이 확장되고 있음을 의미하며, 경기 회복의 신호로 해석됩니다.'
    },

    // Hard questions
    {
        id: 7,
        question: '역전 수익률곡선(Inverted Yield Curve)이 시사하는 것은?',
        options: [
            '경기 호황',
            '인플레이션 가속화',
            '경기 침체 가능성',
            '금리 인하'
        ],
        correctAnswer: 2,
        difficulty: 'hard',
        explanation: '단기 금리가 장기 금리보다 높아지는 역전 수익률곡선은 경기 침체를 예고하는 신호로 여겨집니다.'
    },
    {
        id: 8,
        question: '테일러 준칙(Taylor Rule)은 무엇을 결정하기 위한 공식인가요?',
        options: [
            '환율',
            '기준금리',
            '주가지수',
            '무역수지'
        ],
        correctAnswer: 1,
        difficulty: 'hard',
        explanation: '테일러 준칙은 인플레이션과 경기 상황을 고려해 적정 기준금리를 계산하는 공식입니다.'
    },
    {
        id: 9,
        question: '필립스 곡선이 설명하는 관계는 무엇인가요?',
        options: [
            '금리와 환율',
            '실업률과 인플레이션',
            '수출과 수입',
            'GDP와 소비'
        ],
        correctAnswer: 1,
        difficulty: 'hard',
        explanation: '필립스 곡선은 실업률과 인플레이션 간의 역관계를 나타내는 경제 모델입니다.'
    },
    {
        id: 10,
        question: '스태그플레이션(Stagflation)의 특징은 무엇인가요?',
        options: [
            '높은 성장률과 낮은 물가',
            '낮은 성장률과 높은 물가',
            '높은 성장률과 높은 물가',
            '낮은 성장률과 낮은 물가'
        ],
        correctAnswer: 1,
        difficulty: 'hard',
        explanation: '스태그플레이션은 경기 침체(정체)와 물가 상승이 동시에 발생하는 현상입니다.'
    }
];
