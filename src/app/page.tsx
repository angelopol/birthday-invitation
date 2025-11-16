import { redirect } from 'next/navigation';

export const metadata = {
  title: 'BirthdayInvitation — Inicio',
};

export default function Home() {
  redirect('/auth/login');
}
