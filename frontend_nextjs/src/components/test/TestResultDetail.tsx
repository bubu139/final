// frontend_nextjs/src/components/test/TestResultDetail.tsx
'use client';

import type { TestAttempt, WeakTopic, TestAnswer } from '@/types/test-history';
import type { Test, Question } from '@/types/test-schema';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { CheckCircle, XCircle, BarChart2, Zap, Target, BookOpen, Brain, Lightbulb, ArrowLeft, Home, Check, X } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import 'katex/dist/katex.min.css';

interface AiAnalysisResult {
  analysis: string;
  strengths: string[];
  weaknesses: string[];
  recommendations: string[];
  suggestedTopics: string[];
}

interface Props {
  attempt: TestAttempt;
  testData: Test;
  weakTopics: WeakTopic[];
  aiAnalysis?: AiAnalysisResult;
  onRetakeTest: () => void;
  onTakeAdaptiveTest: () => void;
}

export function TestResultDetail({ attempt, testData, weakTopics, aiAnalysis, onRetakeTest, onTakeAdaptiveTest }: Props) {
  
  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 50) return 'text-yellow-600';
    return 'text-red-600';
  };
  
  const getProgressColor = (score: number) => {
    if (score >= 80) return 'bg-green-600';
    if (score >= 50) return 'bg-yellow-600';
    return 'bg-red-600';
  };

  const handleNavigate = (path: string) => {
    window.location.href = path;
  };

  const normalize = (val: any): string => {
    if (val === null || val === undefined) return '';
    return String(val).trim().toLowerCase();
  };

  const getOriginalQuestion = (questionId: string): Question | undefined => {
    if (!testData || !testData.parts) return undefined;

    const mcqs = testData.parts.multipleChoice?.questions || [];
    const tfqs = testData.parts.trueFalse?.questions || [];
    const saqs = testData.parts.shortAnswer?.questions || [];

    const allQuestions = [...mcqs, ...tfqs, ...saqs] as Question[];
    return allQuestions.find(q => q && String(q.id) === String(questionId));
  };

  const isComplexAnswer = (val: any): boolean => {
    const str = String(val || '');
    return str.includes('\\') || str.includes('^') || str.includes('{') || str.length > 6;
  };

  const renderSafeText = (text: any) => {
    return (
      <ReactMarkdown
        components={{
          p: ({ node: _, ...props }) => <span {...props} />
        }}
      >
        {String(text || '')}
      </ReactMarkdown>
    );
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 p-4">
      
      {/* 1. KẾT QUẢ TỔNG QUAN */}
      <Card className="shadow-lg border-primary/20">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-bold">Kết quả bài kiểm tra</CardTitle>
          <CardDescription className="text-lg">{attempt.testTitle}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex flex-col items-center">
            <p className="text-sm text-muted-foreground">Tổng điểm</p>
            <h2 className={`text-7xl font-extrabold ${getScoreColor(attempt.score || 0)}`}>
              {(attempt.score || 0).toFixed(1)}
            </h2>
            <p className="text-muted-foreground">
              Đúng: <strong>{attempt.correctAnswers} / {attempt.totalQuestions}</strong> câu
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
            <StatCard title="Trắc nghiệm" score={attempt.multipleChoiceScore || 0} />
            <StatCard title="Đúng/Sai" score={attempt.trueFalseScore || 0} />
            <StatCard title="Trả lời ngắn" score={attempt.shortAnswerScore || 0} />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Button onClick={onRetakeTest} variant="outline" size="lg">Làm lại bài này</Button>
            <Button onClick={onTakeAdaptiveTest} size="lg" className="bg-blue-600 hover:bg-blue-700">
              <Zap className="w-4 h-4 mr-2" />
              Luyện tập thích ứng
            </Button>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-3 mt-4 pt-4 border-t border-slate-100">
            <Button 
              onClick={() => handleNavigate('/')} 
              variant="ghost" 
              className="flex-1 text-slate-500 hover:text-slate-700 hover:bg-slate-50"
            >
              <Home className="w-4 h-4 mr-2" />
              Về Trang chủ
            </Button>

            <Button 
              onClick={() => handleNavigate('/mindmap')} 
              variant="ghost" 
              className="flex-1 text-muted-foreground hover:text-primary"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Về Sơ đồ tư duy
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* 2. PHÂN TÍCH AI */}
      {aiAnalysis && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Brain className="w-6 h-6 text-primary" />
              Phân tích & Lời khuyên từ AI
            </CardTitle>
            <CardDescription>
              AI đã phân tích bài làm của bạn và đưa ra một số nhận xét.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Accordion type="multiple" defaultValue={['analysis', 'recommendations']}>
              <AccordionItem value="analysis">
                <AccordionTrigger className="font-semibold">Đánh giá chung</AccordionTrigger>
                <AccordionContent className="prose prose-sm max-w-none">
                  <p>{aiAnalysis.analysis}</p>
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="strengths">
                <AccordionTrigger className="font-semibold text-green-700">Điểm mạnh</AccordionTrigger>
                <AccordionContent>
                  <ul className="list-disc space-y-2 pl-6">
                    {aiAnalysis.strengths.map((item, idx) => (
                      <li key={idx} className="text-green-800">{item}</li>
                    ))}
                  </ul>
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="weaknesses">
                <AccordionTrigger className="font-semibold text-red-700">Điểm cần cải thiện</AccordionTrigger>
                <AccordionContent>
                  <ul className="list-disc space-y-2 pl-6">
                    {aiAnalysis.weaknesses.map((item, idx) => (
                      <li key={idx} className="text-red-800">{item}</li>
                    ))}
                  </ul>
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="recommendations">
                <AccordionTrigger className="font-semibold text-blue-700">Lời khuyên</AccordionTrigger>
                <AccordionContent>
                  <ul className="list-disc space-y-2 pl-6">
                    {aiAnalysis.recommendations.map((item, idx) => (
                      <li key={idx} className="text-blue-800">{item}</li>
                    ))}
                  </ul>
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="suggestedTopics">
                <AccordionTrigger className="font-semibold">Chủ đề nên ôn tập</AccordionTrigger>
                <AccordionContent>
                  <div className="flex flex-wrap gap-2">
                    {aiAnalysis.suggestedTopics.map((topic, idx) => (
                      <Badge key={idx} variant="secondary">{topic}</Badge>
                    ))}
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </CardContent>
        </Card>
      )}

      {/* 3. THỐNG KÊ ĐIỂM YẾU */}
      {weakTopics && weakTopics.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="w-6 h-6 text-destructive" />
              Thống kê chủ đề yếu
            </CardTitle>
            <CardDescription>
              Kết quả chi tiết theo từng chủ đề có trong bài làm.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {weakTopics.map((topic) => (
              <div key={topic.topic}>
                <div className="flex justify-between mb-1">
                  <span className="font-medium">{topic.topic}</span>
                  <span className={`font-semibold ${getScoreColor(topic.accuracy)}`}>
                    {topic.accuracy.toFixed(1)}% 
                    <span className="text-sm text-muted-foreground ml-2">({topic.correctAnswers}/{topic.totalQuestions})</span>
                  </span>
                </div>
                <Progress value={topic.accuracy} className={`h-2 ${getProgressColor(topic.accuracy)}`} />
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* 4. XEM LẠI ĐÁP ÁN CHI TIẾT */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="w-6 h-6 text-indigo-600" />
            Xem lại đáp án chi tiết
          </CardTitle>
          <CardDescription>
            Xem lại các câu trả lời của bạn. Màu xanh là đáp án đúng, màu vàng là đáp án bạn chọn sai.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Accordion type="single" collapsible className="w-full">
            {attempt.answers?.map((answer, index) => {
              const originalQuestion = getOriginalQuestion(String(answer.questionId));
              const promptText = originalQuestion?.prompt || answer.prompt || `Câu hỏi ${index + 1}`;

              return (
                <AccordionItem key={answer.questionId} value={String(answer.questionId)}>
                  <AccordionTrigger className={answer.isCorrect ? "text-green-700 hover:text-green-800" : "text-red-700 hover:text-red-800"}>
                    <div className="flex items-center gap-2 text-left w-full">
                      {answer.isCorrect ? <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" /> : <XCircle className="w-5 h-5 text-red-600 flex-shrink-0" />}
                      <span className="font-semibold whitespace-nowrap">Câu {index + 1}:</span>
                      <span className="line-clamp-1 font-normal text-sm text-slate-700 flex-1 mr-4">
                        {renderSafeText(promptText)}
                      </span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="pt-2 pb-6 px-4 bg-slate-50/50 rounded-b-lg">
                    <div className="space-y-4">
                      <div className="font-medium text-base text-slate-800 bg-white p-4 rounded-lg border shadow-sm">
                        {renderSafeText(promptText)}
                      </div>
                      
                      {/* TRẮC NGHIỆM */}
                      {answer.questionType === 'multiple-choice' && (originalQuestion as any)?.options && (
                        <div className="space-y-2">
                          {(originalQuestion as any).options.map((option: string, idx: number) => {
                            const userAns = normalize(answer.userAnswer);
                            const correctAns = normalize(answer.correctAnswer);
                            const optionText = normalize(option);
                            const optionIndex = String(idx);
                            const optionChar = String.fromCharCode(97 + idx);

                            const isSelected = userAns === optionText || userAns === optionIndex || userAns === optionChar;
                            const isCorrect = correctAns === optionText || correctAns === optionIndex || correctAns === optionChar;

                            let optionClass = "border border-slate-300 bg-white";
                            if (isCorrect) {
                              optionClass = "border-2 border-green-600 bg-white";
                            }
                            if (isSelected && !isCorrect) {
                              optionClass = "border-2 border-yellow-500 bg-yellow-50";
                            }

                            return (
                              <div key={idx} className={`p-3 rounded-lg flex items-center gap-3 transition-all ${optionClass}`}>
                                <div className={`w-7 h-7 flex items-center justify-center rounded-full font-bold border ${
                                  isCorrect ? "border-green-600 text-green-600" : isSelected ? "border-yellow-600 text-yellow-600" : "border-slate-400 text-slate-500"
                                }`}>
                                  {String.fromCharCode(65 + idx)}
                                </div>
                                <span className="font-medium">{renderSafeText(option)}</span>
                              </div>
                            );
                          })}
                        </div>
                      )}

{/* ĐÚNG/SAI */}
{answer.questionType === 'true-false' && (
  <div className="space-y-3">
    {(((originalQuestion as any)?.subQuestions || (originalQuestion as any)?.questions) || []).map(
      (subQ: string, idx: number) => {
        const userChoice = Array.isArray(answer.userAnswer) ? answer.userAnswer[idx] : null;
        const correctChoice = Array.isArray(answer.correctAnswer) ? answer.correctAnswer[idx] : null;

        return (
          <div key={idx} className="border rounded-lg bg-gray-50 p-4">
            <div className="flex items-center gap-4">
              {/* Mệnh đề bên trái */}
              <div className="flex-1">
                <p className="text-sm font-semibold text-slate-600">Mệnh đề {idx + 1}:</p>
                <div className="text-slate-900 mt-1">
                  {renderSafeText(subQ)}
                </div>
              </div>

              {/* 2 button Đúng/Sai bên phải */}
              <div className="flex gap-3 flex-shrink-0">
                {/* Button ĐÚNG */}
                <button
                  disabled
                  className={`min-w-[90px] px-5 py-2.5 rounded-lg border font-semibold text-sm flex items-center justify-center gap-2 ${
                    correctChoice === true
                      ? 'bg-green-100 border-green-500 text-green-700'
                      : userChoice === true
                      ? 'bg-yellow-100 border-yellow-500 text-yellow-700'
                      : 'bg-white border-gray-300 text-gray-600'
                  }`}
                >
                  {correctChoice === true && (
                    <Check className="w-4 h-4" />
                  )}
                  Đúng
                </button>

                {/* Button SAI */}
                <button
                  disabled
                  className={`min-w-[90px] px-5 py-2.5 rounded-lg border font-semibold text-sm flex items-center justify-center gap-2 ${
                    correctChoice === false
                      ? 'bg-green-100 border-green-500 text-green-700'
                      : userChoice === false
                      ? 'bg-yellow-100 border-yellow-500 text-yellow-700'
                      : 'bg-white border-gray-300 text-gray-600'
                  }`}
                >
                  {correctChoice === false && (
                    <X className="w-4 h-4" />
                  )}
                  Sai
                </button>
              </div>
            </div>
          </div>
        );
      }
    )}
  </div>
)}

                      {/* TRẢ LỜI NGẮN */}
                      {answer.questionType === 'short-answer' && (
                        <div className="space-y-6 bg-white p-6 rounded-lg border shadow-sm">
                          <div>
                            <p className="text-sm font-bold text-slate-500 mb-3 uppercase tracking-wide">Câu trả lời của bạn:</p>
                            
                            {/* Hiển thị câu trả lời của học sinh trong 6 ô vuông */}
                            <div className="flex gap-2 mb-4">
                              {Array.from({ length: 6 }).map((_, idx) => {
                                let userChar = '';
                                
                                if (Array.isArray(answer.userAnswer)) {
                                  userChar = answer.userAnswer[idx] || '';
                                } else {
                                  const userAnswerStr = String(answer.userAnswer || '');
                                  userChar = userAnswerStr[idx] || '';
                                }
                                
                                // Bỏ qua các ký tự đặc biệt
                                if (userChar === ',' || userChar === ' ') {
                                  userChar = '';
                                }
                                
                                return (
                                  <div key={idx} className={`w-10 h-12 flex items-center justify-center border-2 rounded-md text-xl font-bold shadow-sm ${
                                    answer.isCorrect 
                                      ? 'border-green-500 bg-green-100 text-green-800' 
                                      : 'border-yellow-500 bg-yellow-50 text-yellow-800'
                                  }`}>
                                    {userChar}
                                  </div>
                                );
                              })}
                            </div>
                          </div>

                          {!answer.isCorrect && (
                            <div className="pt-4 border-t border-dashed border-slate-200">
                              <p className="text-sm font-bold text-green-600 mb-3 uppercase tracking-wide flex items-center gap-2">
                                <CheckCircle className="w-4 h-4" /> Đáp án đúng:
                              </p>
                              
                              {/* Hiển thị đáp án đúng trong 6 ô vuông */}
                              <div className="flex gap-2">
                                {Array.from({ length: 6 }).map((_, idx) => {
                                  let correctChar = '';
                                  
                                  if (Array.isArray(answer.correctAnswer)) {
                                    correctChar = answer.correctAnswer[idx] || '';
                                  } else {
                                    const correctAnswerStr = String(answer.correctAnswer || '');
                                    correctChar = correctAnswerStr[idx] || '';
                                  }
                                  
                                  // Bỏ qua các ký tự đặc biệt
                                  if (correctChar === ',' || correctChar === ' ') {
                                    correctChar = '';
                                  }
                                  
                                  return (
                                    <div key={idx} className="w-10 h-12 flex items-center justify-center border-2 border-green-500 bg-green-100 text-green-800 rounded-md text-xl font-bold shadow-sm">
                                      {correctChar}
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              );
            })}
          </Accordion>
        </CardContent>
      </Card>
    </div>
  );
}

function StatCard({ title, score }: { title: string, score: number }) {
  const getScoreColor = (s: number) => {
    if (s >= 80) return 'text-green-600';
    if (s >= 50) return 'text-yellow-600';
    return 'text-red-600';
  };
  const getBorderColor = (s: number) => {
    if (s >= 80) return 'border-green-100';
    if (s >= 50) return 'border-yellow-100';
    return 'border-red-100';
  };
  
  return (
    <div className={`p-4 bg-background rounded-lg border-2 ${getBorderColor(score)}`}>
      <p className="text-sm font-medium text-muted-foreground">{title}</p>
      <p className={`text-3xl font-bold ${getScoreColor(score)}`}>{score.toFixed(1)}%</p>
    </div>
  );
}