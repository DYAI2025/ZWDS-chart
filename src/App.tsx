import { AppProvider } from '@/app/appContext';
import { AppShell } from '@/app/AppShell';

export default function App() {
  return <AppProvider><AppShell/></AppProvider>;
}