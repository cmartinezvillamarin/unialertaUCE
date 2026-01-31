import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useRegisterForm } from './useRegisterForm';
import { useValidateEmail } from './useValidateEmail';
import { useCreateUser } from '@/hooks/users/useCreateUser';
import { toast } from 'sonner';

interface UseFirstUserRegistrationReturn {
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
  isCheckingUsers: boolean;
  hasUsers: boolean | null;
  registrationError: string | null;
  // Actions
  handleSubmit: (e: React.FormEvent) => Promise<void>;
  checkHasUsers: () => Promise<boolean>;
}

export function useFirstUserRegistration(): UseFirstUserRegistrationReturn {
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

  // Local state
  const [isCheckingUsers, setIsCheckingUsers] = useState(true);
  const [hasUsers, setHasUsers] = useState<boolean | null>(null);
  const [registrationError, setRegistrationError] = useState<string | null>(null);

  // Check if there are any users in the system using database function
  const checkHasUsers = useCallback(async (): Promise<boolean> => {
    try {
      setIsCheckingUsers(true);
      const { data, error } = await supabase.rpc('has_any_users');
      
      if (error) {
        console.error('Error checking users:', error);
        setHasUsers(false);
        return false;
      }
      
      setHasUsers(data ?? false);
      return data ?? false;
    } catch (err) {
      console.error('Error checking users:', err);
      setHasUsers(false);
      return false;
    } finally {
      setIsCheckingUsers(false);
    }
  }, []);

  // Check for existing users on mount
  useEffect(() => {
    checkHasUsers().then((exists) => {
      if (exists) {
        // If users exist, redirect to login
        navigate('/login', { replace: true });
      }
    });
  }, [checkHasUsers, navigate]);

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
      // Double-check that no users exist before creating admin
      const usersExist = await checkHasUsers();
      if (usersExist) {
        toast.error('Ya existe un usuario en el sistema');
        navigate('/login', { replace: true });
        return;
      }

      // Create the first user (admin)
      const { user, error } = await createUser({
        email: email.trim(),
        password,
        name: fullName.trim(),
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
          toast.warning('Usuario creado. El correo de confirmación no se pudo enviar (SMTP). Confirma el email manualmente en Supabase.', {
            duration: 8000,
          });
        } else {
          toast.success('Cuenta de administrador creada. Revisa tu correo para confirmar.');
        }
        // Navigate to login after successful registration
        navigate('/login', { replace: true });
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al crear el usuario';
      setRegistrationError(message);
      toast.error(message);
    }
  }, [isFormValid, checkHasUsers, createUser, email, password, fullName, navigate]);

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
    isCheckingUsers,
    hasUsers,
    registrationError: registrationError || createUserError,
    // Actions
    handleSubmit,
    checkHasUsers,
  };
}
