import { useLocation } from 'react-router-dom';
import { SmartReportCapture } from '@/components/report/SmartReportCapture';

export default function CrearReporte() {
  const location = useLocation();
  const navState = (location.state || {}) as { backTo?: string };
  const backRoute = navState.backTo || '/mis-reportes';
  
  return <SmartReportCapture defaultBackRoute={backRoute} />;
}
