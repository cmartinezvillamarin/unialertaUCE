import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { PasswordStrength } from '@/components/ui/password-strength';
import { toast } from 'sonner';
import { Eye, EyeOff, Lock, CheckCircle2, AlertCircle } from 'lucide-react';

export default function ResetPassword() {
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [isValidRecovery, setIsValidRecovery] = useState<boolean | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  
  // Ref para evitar procesar múltiples veces
  const processedRef = useRef(false);

  useEffect(() => {
    if (processedRef.current) return;
    
    // Escuchar específicamente el evento PASSWORD_RECOVERY
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, _session) => {
      console.log('[ResetPassword] Auth event:', event);
      
      if (event === 'PASSWORD_RECOVERY') {
        // Este es el evento correcto para recuperación de contraseña
        processedRef.current = true;
        setIsValidRecovery(true);
        setErrorMessage(null);
      } else if (event === 'SIGNED_IN' && !processedRef.current) {
        // Si llega un SIGNED_IN sin haber procesado PASSWORD_RECOVERY,
        // verificamos si hay un hash con type=recovery en la URL
        const hash = window.location.hash;
        if (hash.includes('type=recovery')) {
          processedRef.current = true;
          setIsValidRecovery(true);
          setErrorMessage(null);
        }
      }
    });

    // Verificar si hay parámetros de recuperación en la URL
    const checkUrlParams = () => {
      const hash = window.location.hash;
      const searchParams = new URLSearchParams(window.location.search);
      
      // Supabase puede usar hash fragments o query params
      if (hash) {
        // Parsear el hash como query string (sin el #)
        const hashParams = new URLSearchParams(hash.substring(1));
        const type = hashParams.get('type');
        const error = hashParams.get('error');
        const errorDescription = hashParams.get('error_description');
        
        if (error) {
          processedRef.current = true;
          setIsValidRecovery(false);
          setErrorMessage(errorDescription || 'El enlace de recuperación es inválido o ha expirado');
          return;
        }
        
        if (type === 'recovery') {
          // Hay un token de recuperación válido, esperar el evento
          return;
        }
      }
      
      // Si no hay hash con recovery, verificar si ya hay una sesión pendiente
      // con el contexto de recuperación
      const error = searchParams.get('error');
      const errorDescription = searchParams.get('error_description');
      
      if (error) {
        processedRef.current = true;
        setIsValidRecovery(false);
        setErrorMessage(errorDescription || 'El enlace de recuperación es inválido o ha expirado');
        return;
      }
      
      // Dar un tiempo para que el evento llegue
      setTimeout(() => {
        if (!processedRef.current) {
          setIsValidRecovery(false);
          setErrorMessage('No se encontró un enlace de recuperación válido. Por favor, solicita uno nuevo.');
        }
      }, 3000);
    };
    
    checkUrlParams();

    return () => subscription.unsubscribe();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      toast.error('Las contraseñas no coinciden');
      return;
    }

    if (password.length < 8) {
      toast.error('La contraseña debe tener al menos 8 caracteres');
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase.auth.updateUser({ password });

      if (error) throw error;

      // Actualizar el flag en profiles si existe
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase
          .from('profiles')
          .update({ 
            must_change_password: false,
            temp_password_used: false 
          })
          .eq('user_id', user.id);
      }

      setSuccess(true);
      toast.success('Contraseña actualizada correctamente');
      
      // Cerrar sesión y redirigir al login para que inicie con la nueva contraseña
      await supabase.auth.signOut();
      
      setTimeout(() => {
        navigate('/login');
      }, 2000);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error al actualizar la contraseña';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  // Estado de carga inicial
  if (isValidRecovery === null) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center gap-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              <p className="text-sm text-muted-foreground">Verificando enlace de recuperación...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Enlace inválido o expirado
  if (!isValidRecovery) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
              <AlertCircle className="h-6 w-6 text-destructive" />
            </div>
            <CardTitle className="text-destructive">Enlace inválido o expirado</CardTitle>
            <CardDescription>
              {errorMessage || 'Este enlace de recuperación ya no es válido. Por favor, solicita uno nuevo.'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={() => navigate('/forgot-password')} 
              className="w-full"
            >
              Solicitar nuevo enlace
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Éxito al cambiar contraseña
  if (success) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center gap-4 text-center">
              <CheckCircle2 className="h-16 w-16 text-primary" />
              <h2 className="text-xl font-semibold">¡Contraseña actualizada!</h2>
              <p className="text-muted-foreground">
                Tu contraseña ha sido cambiada exitosamente. Serás redirigido al inicio de sesión...
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Formulario de nueva contraseña
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            <Lock className="h-6 w-6 text-primary" />
          </div>
          <CardTitle>Nueva contraseña</CardTitle>
          <CardDescription>
            Ingresa tu nueva contraseña para completar la recuperación
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="password">Nueva contraseña</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  minLength={8}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <Eye className="h-4 w-4 text-muted-foreground" />
                  )}
                </Button>
              </div>
              {password && <PasswordStrength password={password} />}
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirmar contraseña</Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  minLength={8}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <Eye className="h-4 w-4 text-muted-foreground" />
                  )}
                </Button>
              </div>
              {confirmPassword && password !== confirmPassword && (
                <p className="text-sm text-destructive">Las contraseñas no coinciden</p>
              )}
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Actualizando...' : 'Actualizar contraseña'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
