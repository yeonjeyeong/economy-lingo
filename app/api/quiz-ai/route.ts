import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from "@google/generative-ai";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const count = parseInt(searchParams.get('count') || '5');

    try {
        const difficulty = searchParams.get('difficulty') || 'medium';

        const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-lite" });

        const prompt = `경제 용어 퀴즈 ${count}개를 JSON 배열로만 반환하세요. 난이도: ${difficulty}. 형식: [{"question":"질문","options":["1","2","3","4"],"correctAnswer":0,"explanation":"설명"}]`;

        const result = await model.generateContent(prompt);
        const text = result.response.text().trim().replace(/```json\n?|\n?```/g, '');

        const aiQuestions = JSON.parse(text);
        const questions = aiQuestions.map((q: any, i: number) => ({
            id: Date.now() + i,
            ...q,
            difficulty
        }));

        return NextResponse.json({ questions, source: 'ai' });
    } catch (error) {
        console.error('AI Error:', error);
        const fallback = [
            { id: 1, question: "GDP는 무엇의 약자인가요?", options: ["Gross Domestic Product", "General Development Project", "Global Data Processing", "Government Distribution Plan"], correctAnswer: 0, difficulty: "easy", explanation: "GDP는 Gross Domestic Product(국내총생산)의 약자입니다." },
            { id: 2, question: "중앙은행이 기준금리를 인상하면?", options: ["물가 상승", "경기 과열", "대출 금리 상승", "환율 하락"], correctAnswer: 2, difficulty: "easy", explanation: "기준금리 인상은 대출 금리를 높입니다." },
            { id: 3, question: "CPI는 무엇을 측정하나요?", options: ["고용률", "물가 상승률", "금리", "환율"], correctAnswer: 1, difficulty: "easy", explanation: "CPI는 소비자물가지수입니다." },
            { id: 4, question: "양적완화의 목적은?", options: ["세금 인상", "시중 유동성 공급", "무역 규제", "재정 감소"], correctAnswer: 1, difficulty: "medium", explanation: "양적완화는 시중에 자금을 공급합니다." },
            { id: 5, question: "PMI 50 이상은?", options: ["침체", "확장", "하락", "증가"], correctAnswer: 1, difficulty: "medium", explanation: "PMI 50 이상은 제조업 확장을 의미합니다." }
        ];
        return NextResponse.json({ questions: fallback.slice(0, count), source: 'fallback' });
    }
}
