import { memo } from 'react';
import { Link } from 'react-router-dom';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { PasswordStrength } from '@/components/ui/password-strength';
import { usePublicRegistration } from '@/hooks/controlador/usePublicRegistration';
import { UserPlus, User, Mail, Lock, Loader2, ArrowLeft } from 'lucide-react';
import {
  useAnimations,
  useResponsive,
} from '@/hooks/optimizacion';

export const PublicRegisterForm = memo(function PublicRegisterForm() {
  const {
    fullName,
    setFullName,
    email,
    setEmail,
    password,
    setPassword,
    confirmPassword,
    setConfirmPassword,
    showPasswordMismatch,
    isEmailValid,
    emailError,
    isLoading,
    registrationError,
    handleSubmit,
  } = usePublicRegistration();

  const { transitionClasses } = useAnimations();
  const { isMobile } = useResponsive();

  return (
    <div className={`w-full max-w-md animate-fade-in ${isMobile ? 'px-2' : ''}`}>
      <div className={`rounded-xl border border-border bg-card p-6 sm:p-8 shadow-sm ${transitionClasses.card}`}>
        {/* Header */}
        <div className="flex flex-col items-center mb-6">
          <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mb-4">
            <UserPlus className="w-7 h-7 text-primary" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">Crear Cuenta</h1>
          <p className="text-sm text-muted-foreground mt-1 text-center">
            Regístrate para acceder al sistema
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Full Name */}
          <div className="space-y-2">
            <Label htmlFor="register-fullName" className="text-sm font-medium text-foreground">
              Nombre completo
            </Label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="register-fullName"
                type="text"
                placeholder="Tu nombre completo"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                disabled={isLoading}
                className={`h-11 pl-10 bg-background border-border focus:border-primary ${transitionClasses.input}`}
                autoComplete="name"
              />
            </div>
          </div>

          {/* Email */}
          <div className="space-y-2">
            <Label htmlFor="register-email" className="text-sm font-medium text-foreground">
              Correo electrónico
            </Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="register-email"
                type="email"
                placeholder="tu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isLoading}
                className={`h-11 pl-10 bg-background border-border focus:border-primary ${transitionClasses.input}`}
                autoComplete="email"
              />
            </div>
            {email.length > 0 && emailError && (
              <p className="text-xs text-destructive animate-fade-in">{emailError}</p>
            )}
          </div>

          {/* Password */}
          <div className="space-y-2">
            <Label htmlFor="register-password" className="text-sm font-medium text-foreground">
              Contraseña
            </Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="register-password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLoading}
                className={`h-11 pl-10 bg-background border-border focus:border-primary ${transitionClasses.input}`}
                autoComplete="new-password"
              />
            </div>
            <PasswordStrength password={password} />
          </div>

          {/* Confirm Password */}
          <div className="space-y-2">
            <Label htmlFor="register-confirmPassword" className="text-sm font-medium text-foreground">
              Confirmar contraseña
            </Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="register-confirmPassword"
                type="password"
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                disabled={isLoading}
                className={`h-11 pl-10 bg-background border-border focus:border-primary ${transitionClasses.input}`}
                autoComplete="new-password"
              />
            </div>
            {showPasswordMismatch && (
              <p className="text-xs text-destructive animate-fade-in">Las contraseñas no coinciden</p>
            )}
          </div>

          {/* Registration Error */}
          {registrationError && (
            <p className="text-sm text-destructive text-center animate-fade-in">{registrationError}</p>
          )}

          <Button 
            type="submit" 
            className={`w-full h-11 bg-primary hover:bg-primary/90 text-primary-foreground font-medium mt-2 ${transitionClasses.button}`}
            disabled={isLoading || (email.length > 0 && !isEmailValid)}
          >
            {isLoading ? (
              <span className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                Creando cuenta...
              </span>
            ) : (
              'Crear cuenta'
            )}
          </Button>
        </form>

        {/* Link to login */}
        <div className="mt-6 text-center">
          <Link 
            to="/login" 
            className="inline-flex items-center gap-1 text-sm text-primary hover:text-primary/80 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Volver a iniciar sesión
          </Link>
        </div>
      </div>
    </div>
  );
});

PublicRegisterForm.displayName = 'PublicRegisterForm';
