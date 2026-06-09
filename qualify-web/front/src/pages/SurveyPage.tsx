import { Link } from '@tanstack/react-router';
import type { FormEvent } from 'react';
import { useEffect, useRef, useState } from 'react';
import { ArrowLeft, CheckCircle2 } from 'lucide-react';

import { API_URL } from '../config';
import { QUESTIONS } from '../data/questions';
import { useCurrentUser } from '../auth';

interface Recommendation {
  job_id: number;
  job_title: string;
  match_percentage: number;
}

interface SubmitResult {
  attempt_id: number;
  recommendations: Recommendation[];
  best_match: Recommendation | null;
  strengths?: string[];
  risks?: string[];
  match_summary?: string;
}

function formatRussianPhone(value: string) {
  const digits = value.replace(/\D/g, '');
  const normalized = digits.startsWith('8') ? `7${digits.slice(1)}` : digits.startsWith('7') ? digits : `7${digits}`;
  const phoneDigits = normalized.slice(0, 11);
  const national = phoneDigits.slice(1);

  if (!national.length) {
    return '+7';
  }

  const parts = [
    national.slice(0, 3),
    national.slice(3, 6),
    national.slice(6, 8),
    national.slice(8, 10),
  ].filter(Boolean);

  let result = '+7';
  if (parts[0]) {
    result += ` ${parts[0]}`;
  }
  if (parts[1]) {
    result += ` ${parts[1]}`;
  }
  if (parts[2]) {
    result += `-${parts[2]}`;
  }
  if (parts[3]) {
    result += `-${parts[3]}`;
  }

  return result;
}

export function SurveyPage() {
  const currentUser = useCurrentUser();
  const [fullName, setFullName] = useState(() => currentUser?.role === 'candidate' ? currentUser.name : '');
  const [phone, setPhone] = useState('');
  const [answers, setAnswers] = useState<string[]>(() => Array(QUESTIONS.length).fill(''));
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
  const [error, setError] = useState('');
  const [isProgressStuck, setIsProgressStuck] = useState(false);
  const [result, setResult] = useState<SubmitResult | null>(null);
  const progressRef = useRef<HTMLDivElement>(null);

  const answeredCount = answers.filter(Boolean).length;
  const progress = Math.round((answeredCount / QUESTIONS.length) * 100);
  const phoneDigits = phone.replace(/\D/g, '');
  const remainingQuestions = QUESTIONS.length - answeredCount;
  const hasContactInfo = fullName.trim().length > 2 && phoneDigits.length === 11;
  const canSubmit = fullName.trim().length > 2 && phoneDigits.length === 11 && answeredCount === QUESTIONS.length;
  const submitHint = !hasContactInfo
    ? 'Заполните ФИО и телефон'
    : remainingQuestions > 0
      ? `Осталось ответить: ${remainingQuestions}`
      : 'Все готово к отправке';

  useEffect(() => {
    const handleScroll = () => {
      const progressElement = progressRef.current;
      if (!progressElement) {
        return;
      }

      setIsProgressStuck(progressElement.getBoundingClientRect().top <= 65);
    };

    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('resize', handleScroll);

    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleScroll);
    };
  }, []);

  useEffect(() => {
    if (currentUser?.role === 'candidate' && !fullName.trim()) {
      setFullName(currentUser.name);
    }
  }, [currentUser, fullName]);

  const setAnswer = (questionIndex: number, value: string) => {
    setAnswers((current) => current.map((answer, index) => (index === questionIndex ? value : answer)));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!canSubmit || status === 'submitting') {
      setError('Заполните контактные данные и ответьте на все вопросы.');
      return;
    }

    setStatus('submitting');
    setError('');

    try {
      const submittedAnswers = answers.map((answer, index) => ({
        question_index: index + 1,
        answer,
      }));
      const response = await fetch(`${API_URL}/api/submit-test`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          vk_id: currentUser?.role === 'candidate' && currentUser.demoVkId ? currentUser.demoVkId : Date.now(),
          full_name: `${fullName.trim()} (${phone.trim()})`,
          answers: submittedAnswers,
        }),
      });

      if (!response.ok) {
        throw new Error('Submit failed');
      }

      setResult(await response.json());
      setStatus('success');
    } catch {
      setStatus('error');
      setError('Не удалось отправить анкету. Попробуйте еще раз.');
    }
  };

  if (status === 'success') {
    const bestMatch = result?.best_match;
    const recommendations = result?.recommendations ?? [];

    return (
      <section className="mx-auto max-w-3xl rounded-3xl border border-green-100 bg-white p-6 shadow-sm sm:rounded-[32px] sm:p-10">
        <CheckCircle2 className="mx-auto mb-5 text-green-500" size={48} />
        <div className="text-center">
          <h2 className="mb-4 text-3xl font-black tracking-tight sm:text-4xl">Анкета отправлена</h2>
          <p className="mb-8 text-base leading-7 text-slate-500 sm:text-lg">
            Спасибо. Мы сохранили ответы и рассчитали подходящие позиции на предприятии.
          </p>
        </div>

        {bestMatch && (
          <div className="mb-6 rounded-3xl border border-blue-100 bg-blue-50 p-6">
            <p className="mb-2 text-xs font-black uppercase tracking-widest text-blue-500">Лучшее совпадение</p>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h3 className="text-2xl font-black leading-tight text-blue-950">{bestMatch.job_title}</h3>
                <p className="mt-2 text-sm font-bold text-blue-700">Рекомендуем рассмотреть эту позицию в первую очередь.</p>
              </div>
              <div className="text-4xl font-black text-blue-600">{bestMatch.match_percentage}%</div>
            </div>
          </div>
        )}

        {(result?.match_summary || result?.strengths?.length || result?.risks?.length) && (
          <div className="mb-8 grid gap-4 sm:grid-cols-2">
            <div className="rounded-2xl border border-green-100 bg-green-50 p-5">
              <p className="mb-3 text-xs font-black uppercase tracking-widest text-green-600">Почему подходит</p>
              <p className="mb-3 text-sm font-bold leading-6 text-green-900">{result.match_summary}</p>
              <ul className="space-y-2 text-sm font-bold leading-5 text-green-800">
                {(result.strengths ?? []).map((item) => <li key={item}>{item}</li>)}
              </ul>
            </div>
            <div className="rounded-2xl border border-amber-100 bg-amber-50 p-5">
              <p className="mb-3 text-xs font-black uppercase tracking-widest text-amber-600">Что проверить</p>
              <ul className="space-y-2 text-sm font-bold leading-5 text-amber-900">
                {(result.risks ?? []).map((item) => <li key={item}>{item}</li>)}
              </ul>
            </div>
          </div>
        )}

        {recommendations.length > 0 && (
          <div className="mb-8 space-y-3">
            {recommendations.map((recommendation) => (
              <div key={recommendation.job_id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <div className="mb-2 flex items-center justify-between gap-4">
                  <span className="font-black text-slate-800">{recommendation.job_title}</span>
                  <span className="shrink-0 font-black text-slate-900">{recommendation.match_percentage}%</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-white">
                  <div
                    className="h-full rounded-full bg-blue-600"
                    style={{ width: `${recommendation.match_percentage}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}

        <Link to="/" className="block w-full rounded-2xl bg-slate-900 px-8 py-4 text-center font-black text-white transition hover:bg-blue-600 sm:inline-block sm:w-auto">
          Вернуться к экскурсиям
        </Link>
      </section>
    );
  }

  return (
    <section className="space-y-6 sm:space-y-8">
      <div className="flex flex-col justify-between gap-5 md:flex-row md:items-end">
        <div className="min-w-0">
          <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-5">
            <Link to="/" className="inline-flex items-center gap-2 text-sm font-black text-blue-600 transition hover:text-blue-700">
              <ArrowLeft size={18} strokeWidth={3} />
              <span>Назад к экскурсиям</span>
            </Link>
            <div className="inline-flex w-fit max-w-full rounded-full bg-blue-100 px-4 py-1.5 text-[10px] font-black uppercase tracking-widest text-blue-700">
              Анкетирование Вахруши-Литобувь
            </div>
          </div>
          <h2 className="max-w-3xl text-4xl font-black leading-none tracking-tight sm:text-5xl">
            Ответьте на вопросы перед записью
          </h2>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_280px] lg:items-start">
        <div
          ref={progressRef}
          className={`sticky top-[65px] z-40 -mx-4 bg-white/95 px-6 pb-3 pt-5 shadow-md shadow-slate-200/60 backdrop-blur md:hidden ${
            isProgressStuck
              ? 'rounded-b-2xl border-x border-b border-slate-200'
              : 'rounded-2xl border border-slate-200'
          }`}
        >
          <div className="mb-2 flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Прогресс</span>
            <span className="text-base font-black text-slate-900">{progress}%</span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-slate-100">
            <div className="h-full rounded-full bg-blue-600 transition-all" style={{ width: `${progress}%` }} />
          </div>
        </div>

        <div className="space-y-5 sm:space-y-6">
          <div className="grid gap-4 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6 md:grid-cols-2">
            <label className="space-y-2">
              <span className="text-sm font-black text-slate-500">ФИО</span>
              <input
                value={fullName}
                onChange={(event) => setFullName(event.target.value)}
                className="h-12 w-full rounded-2xl border border-slate-200 px-4 text-base font-bold outline-none transition focus:border-blue-500"
                placeholder="Иванов Иван"
              />
            </label>
            <label className="space-y-2">
              <span className="text-sm font-black text-slate-500">Телефон</span>
              <input
                value={phone}
                onChange={(event) => setPhone(formatRussianPhone(event.target.value))}
                inputMode="tel"
                className="h-12 w-full rounded-2xl border border-slate-200 px-4 text-base font-bold outline-none transition focus:border-blue-500"
                placeholder="+7 900 000-00-00"
              />
            </label>
          </div>

          <div className="space-y-4 sm:space-y-5">
            {QUESTIONS.map((question, questionIndex) => (
              <fieldset key={question.text} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:rounded-[28px] sm:p-6">
                <legend className="mb-2 px-1 text-base font-black leading-6 text-slate-900 sm:text-lg">
                  <span>{questionIndex + 1}. {question.text}</span>
                </legend>
                {question.kind === 'case' && (
                  <div className="mb-4 flex sm:mb-5">
                    <span className="inline-flex rounded-full bg-amber-100 px-3 py-1 text-[10px] font-black uppercase leading-none tracking-widest text-amber-700">
                      кейс
                    </span>
                  </div>
                )}
                {question.kind !== 'case' && <div className="mb-4 sm:mb-5" />}
                <div className="grid gap-3 sm:grid-cols-2">
                  {question.options.map((option) => {
                    const inputId = `question-${questionIndex}-${option}`;
                    const checked = answers[questionIndex] === option;

                    return (
                      <label
                        key={option}
                        htmlFor={inputId}
                        className={`flex min-h-12 cursor-pointer items-center gap-3 rounded-2xl border px-4 py-3 font-bold transition ${
                          checked
                            ? 'border-blue-500 bg-blue-50 text-blue-700'
                            : 'border-slate-200 bg-slate-50 text-slate-600 hover:border-blue-200'
                        }`}
                      >
                        <input
                          id={inputId}
                          type="radio"
                          name={`question-${questionIndex}`}
                          value={option}
                          checked={checked}
                          onChange={() => setAnswer(questionIndex, option)}
                          className="h-5 w-5 shrink-0 accent-blue-600"
                        />
                        <span className="leading-5">{option}</span>
                      </label>
                    );
                  })}
                </div>
              </fieldset>
            ))}
          </div>
        </div>

        <aside className="space-y-4 lg:sticky lg:top-32">
          <div className="hidden rounded-3xl border border-slate-200 bg-white p-5 shadow-sm lg:block">
            <div className="mb-4 flex items-center justify-between">
              <p className="text-xs font-black uppercase tracking-widest text-slate-400">Прогресс</p>
              <p className="text-3xl font-black text-slate-900">{progress}%</p>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-slate-100">
              <div className="h-full rounded-full bg-blue-600 transition-all" style={{ width: `${progress}%` }} />
            </div>
            <p className="mt-4 text-sm font-bold leading-5 text-slate-500">{submitHint}</p>
          </div>

          {error && (
            <div className="rounded-2xl border border-red-100 bg-red-50 px-5 py-4 font-bold text-red-700">
              {error}
            </div>
          )}

          <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className={`mb-3 text-center text-sm font-black ${canSubmit ? 'text-green-600' : 'text-slate-400'}`}>
              {submitHint}
            </p>
            <button
              type="submit"
              disabled={!canSubmit || status === 'submitting'}
              className="w-full rounded-3xl bg-slate-900 px-5 py-5 text-lg font-black leading-tight text-white transition enabled:hover:bg-blue-600 disabled:cursor-not-allowed disabled:bg-slate-300 sm:rounded-[32px] sm:py-6 sm:text-2xl lg:py-4 lg:text-base"
            >
              {status === 'submitting' ? 'Отправляем...' : 'Отправить анкету'}
            </button>
          </div>
        </aside>
      </form>
    </section>
  );
}
