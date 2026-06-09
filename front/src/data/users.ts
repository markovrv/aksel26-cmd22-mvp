export type UserRole = 'candidate' | 'hr';

export interface DemoUser {
  id: number;
  login: string;
  password: string;
  role: UserRole;
  name: string;
  description: string;
  demoVkId?: number;
}

export const ROLE_LABELS: Record<UserRole, string> = {
  candidate: 'Соискатель',
  hr: 'HR завода',
};

export const DEMO_USERS: DemoUser[] = [
  {
    id: 1,
    login: 'candidate',
    password: 'candidate123',
    role: 'candidate',
    name: 'Никита Морозов',
    description: 'Видит свой результат анкеты и подходящую позицию на заводе.',
    demoVkId: 900001,
  },
  {
    id: 2,
    login: 'hr',
    password: 'hr123',
    role: 'hr',
    name: 'HR Вахруши-Литобувь',
    description: 'Смотрит кандидатов, контакты и ранжирование под вакансии.',
  },
];
