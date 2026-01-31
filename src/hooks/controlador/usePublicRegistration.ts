import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useRegisterForm } from './useRegisterForm';
import { useValidateEmail } from './useValidateEmail';
import { useCreateUser } from '@/hooks/users/useCreateUser';
import { useRolePermissions } from './useRolePermissions';
import { toast } from 'sonner';

interface UsePublicRegistrationReturn {
  // Form state from useRegisterForm
  fullName: string;
  setFullName: (value: string) => void;
  email: string;
  setEmail: (value: string) => void;
  password: string;
  setPassword: (value: string) => void;
  confirmPassword: string;
  setConfirmPassword: (value: string) => void;
  passwordsMatch: boolean;
  showPasswordMismatch: boolean;
  // Email validation from useValidateEmail
  isEmailValid: boolean;
  emailError: string | null;
  // Registration state
  isLoading: boolean;
  registrationError: string | null;
  // Actions
  handleSubmit: (e: React.FormEvent) => Promise<void>;
}

/**
 * Hook para registro público de usuarios.
 * Crea usuarios con el rol "usuario_regular" y sus permisos correspondientes.
 */
export function usePublicRegistration(): UsePublicRegistrationReturn {
  const navigate = useNavigate();
  
  // Use existing hooks
  const {
    fullName,
    setFullName,
    email,
    setEmail,
    password,
    setPassword,
    confirmPassword,
    setConfirmPassword,
    passwordsMatch,
    showPasswordMismatch,
  } = useRegisterForm();

  const { isValid: isEmailValid, error: emailError } = useValidateEmail(email);
  const { createUser, loading: isCreatingUser, error: createUserError } = useCreateUser();
  const { getPermissionsForRole } = useRolePermissions();

  // Local state
  const [registrationError, setRegistrationError] = useState<string | null>(null);

  // Form validation
  const isFormValid = useCallback(() => {
    if (!fullName.trim()) {
      setRegistrationError('El nombre completo es requerido');
      return false;
    }
    if (!isEmailValid) {
      setRegistrationError('Correo electrónico inválido');
      return false;
    }
    if (password.length < 6) {
      setRegistrationError('La contraseña debe tener al menos 6 caracteres');
      return false;
    }
    if (!passwordsMatch) {
      setRegistrationError('Las contraseñas no coinciden');
      return false;
    }
    setRegistrationError(null);
    return true;
  }, [fullName, isEmailValid, password, passwordsMatch]);

  // Handle form submission
  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setRegistrationError(null);

    if (!isFormValid()) {
      return;
    }

    try {
      // Get permissions for usuario_regular role
      const usuarioRegularPermissions = getPermissionsForRole('usuario_regular');

      // Create the user with usuario_regular role
      const { user, error } = await createUser({
        email: email.trim(),
        password,
        name: fullName.trim(),
        username: email.split('@')[0],
        roles: ['usuario_regular'],
        permisos: usuarioRegularPermissions,
      });

      // Check if it's an SMTP error (user was created but email failed)
      const isSmtpError = error?.includes('SMTP_ERROR:') || error?.includes('Error sending confirmation email');
      
      if (error && !isSmtpError) {
        setRegistrationError(error);
        toast.error(error);
        return;
      }

      if (user || isSmtpError) {
        if (isSmtpError) {
          toast.warning('Cuenta creada. El correo de confirmación no se pudo enviar. Contacta al administrador para confirmar tu cuenta.', {
            duration: 8000,
          });
        } else {
          toast.success('¡Cuenta creada exitosamente! Revisa tu correo para confirmar tu cuenta.');
        }
        // Navigate to login after successful registration
        navigate('/login', { replace: true });
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al crear la cuenta';
      setRegistrationError(message);
      toast.error(message);
    }
  }, [isFormValid, createUser, email, password, fullName, navigate, getPermissionsForRole]);

  return {
    // Form state
    fullName,
    setFullName,
    email,
    setEmail,
    password,
    setPassword,
    confirmPassword,
    setConfirmPassword,
    passwordsMatch,
    showPasswordMismatch,
    // Email validation
    isEmailValid,
    emailError,
    // Registration state
    isLoading: isCreatingUser,
    registrationError: registrationError || createUserError,
    // Actions
    handleSubmit,
  };
}
