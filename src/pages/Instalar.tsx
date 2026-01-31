/**
 * Página de Instalación PWA
 * Guía al usuario para instalar la app en su dispositivo
 */
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Download, 
  Smartphone, 
  Monitor, 
  Share, 
  Plus, 
  CheckCircle2,
  ArrowRight,
  Bell,
  Shield,
  Zap,
  Wifi
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export default function Instalar() {
  const navigate = useNavigate();
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    // Detectar si ya está instalada
    const isInStandaloneMode = window.matchMedia('(display-mode: standalone)').matches 
      || (window.navigator as any).standalone === true;
    setIsStandalone(isInStandaloneMode);

    // Detectar iOS
    const iOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    setIsIOS(iOS);

    // Escuchar evento de instalación
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      setIsInstalled(true);
    }
    setDeferredPrompt(null);
  };

  const features = [
    {
      icon: Bell,
      title: 'Notificaciones Push',
      description: 'Recibe alertas instantáneas de nuevos reportes'
    },
    {
      icon: Wifi,
      title: 'Funciona Offline',
      description: 'Accede a la app incluso sin conexión a internet'
    },
    {
      icon: Zap,
      title: 'Carga Rápida',
      description: 'Inicio instantáneo desde tu pantalla de inicio'
    },
    {
      icon: Shield,
      title: 'Segura',
      description: 'Tus datos están protegidos y encriptados'
    }
  ];

  // Si ya está instalada, mostrar mensaje de éxito
  if (isStandalone || isInstalled) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-md w-full text-center">
          <CardHeader>
            <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-green-500/10 flex items-center justify-center">
              <CheckCircle2 className="h-8 w-8 text-green-500" />
            </div>
            <CardTitle className="text-2xl">¡App Instalada!</CardTitle>
            <CardDescription>
              UniAlerta UCE ya está instalada en tu dispositivo
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Puedes acceder desde tu pantalla de inicio como cualquier otra app.
            </p>
            <Button onClick={() => navigate('/bienvenida')} className="w-full gap-2">
              Ir al Inicio
              <ArrowRight className="h-4 w-4" />
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background overflow-y-auto">
      <div className="container max-w-4xl mx-auto py-8 px-4 space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="mx-auto h-20 w-20 rounded-2xl bg-primary/10 flex items-center justify-center">
            <Download className="h-10 w-10 text-primary" />
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-foreground">
            Instala UniAlerta UCE
          </h1>
          <p className="text-muted-foreground max-w-md mx-auto">
            Agrega la app a tu pantalla de inicio para una experiencia más rápida y completa
          </p>
        </div>

        {/* Beneficios */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {features.map((feature) => (
            <Card key={feature.title} className="text-center p-4">
              <feature.icon className="h-8 w-8 mx-auto text-primary mb-2" />
              <h3 className="font-medium text-sm">{feature.title}</h3>
              <p className="text-xs text-muted-foreground mt-1">{feature.description}</p>
            </Card>
          ))}
        </div>

        {/* Instrucciones según dispositivo */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* Android / Chrome */}
          <Card className={cn(
            "relative overflow-hidden",
            deferredPrompt && "ring-2 ring-primary"
          )}>
            {deferredPrompt && (
              <Badge className="absolute top-4 right-4 bg-primary">
                Disponible
              </Badge>
            )}
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-green-500/10 flex items-center justify-center">
                  <Smartphone className="h-5 w-5 text-green-500" />
                </div>
                <div>
                  <CardTitle className="text-lg">Android / Chrome</CardTitle>
                  <CardDescription>Instalación automática</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {deferredPrompt ? (
                <Button onClick={handleInstallClick} className="w-full gap-2" size="lg">
                  <Download className="h-5 w-5" />
                  Instalar Ahora
                </Button>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                      <span className="text-xs font-bold text-primary">1</span>
                    </div>
                    <p className="text-sm">Abre el menú del navegador (⋮)</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                      <span className="text-xs font-bold text-primary">2</span>
                    </div>
                    <p className="text-sm">Selecciona "Instalar aplicación" o "Añadir a pantalla de inicio"</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                      <span className="text-xs font-bold text-primary">3</span>
                    </div>
                    <p className="text-sm">Confirma la instalación</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* iOS / Safari */}
          <Card className={cn(isIOS && "ring-2 ring-primary")}>
            {isIOS && (
              <Badge className="absolute top-4 right-4 bg-primary">
                Tu dispositivo
              </Badge>
            )}
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-gray-500/10 flex items-center justify-center">
                  <Smartphone className="h-5 w-5 text-gray-500" />
                </div>
                <div>
                  <CardTitle className="text-lg">iPhone / iPad</CardTitle>
                  <CardDescription>Usando Safari</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                  <span className="text-xs font-bold text-primary">1</span>
                </div>
                <div className="text-sm">
                  <p>Toca el botón <strong>Compartir</strong></p>
                  <Share className="h-5 w-5 text-muted-foreground mt-1" />
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                  <span className="text-xs font-bold text-primary">2</span>
                </div>
                <div className="text-sm">
                  <p>Desplázate y selecciona <strong>"Añadir a pantalla de inicio"</strong></p>
                  <div className="flex items-center gap-1 mt-1 text-muted-foreground">
                    <Plus className="h-4 w-4" />
                    <span className="text-xs">Añadir a pantalla de inicio</span>
                  </div>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                  <span className="text-xs font-bold text-primary">3</span>
                </div>
                <p className="text-sm">Toca <strong>"Añadir"</strong> para confirmar</p>
              </div>
            </CardContent>
          </Card>

          {/* Desktop */}
          <Card className="md:col-span-2">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                  <Monitor className="h-5 w-5 text-blue-500" />
                </div>
                <div>
                  <CardTitle className="text-lg">Escritorio (Windows / Mac / Linux)</CardTitle>
                  <CardDescription>Chrome, Edge, o navegadores compatibles</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap items-center gap-6">
                <div className="flex items-center gap-3">
                  <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <span className="text-xs font-bold text-primary">1</span>
                  </div>
                  <p className="text-sm">Busca el ícono de instalación en la barra de direcciones</p>
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground hidden sm:block" />
                <div className="flex items-center gap-3">
                  <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <span className="text-xs font-bold text-primary">2</span>
                  </div>
                  <p className="text-sm">Haz clic en "Instalar"</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Botón para continuar sin instalar */}
        <div className="text-center pt-4">
          <Button 
            variant="ghost" 
            onClick={() => navigate('/login')}
            className="text-muted-foreground"
          >
            Continuar sin instalar
          </Button>
        </div>
      </div>
    </div>
  );
}
