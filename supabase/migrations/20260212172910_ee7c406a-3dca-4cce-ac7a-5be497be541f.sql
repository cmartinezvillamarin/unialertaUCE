
-- Fix search_path for all custom functions missing it

ALTER FUNCTION public.cleanup_expired_estados()
SET search_path = public;

ALTER FUNCTION public.generate_unique_username(email_input text)
SET search_path = public;

ALTER FUNCTION public.get_user_agent()
SET search_path = public;

ALTER FUNCTION public.is_authenticated()
SET search_path = public;

ALTER FUNCTION public.is_first_user()
SET search_path = public;

ALTER FUNCTION public.notify_comment_mention()
SET search_path = public;

ALTER FUNCTION public.notify_post_mention()
SET search_path = public;

ALTER FUNCTION public.set_updated_at()
SET search_path = public;

ALTER FUNCTION public.sync_profile_role_with_user_roles()
SET search_path = public;

ALTER FUNCTION public.update_hashtag_count()
SET search_path = public;
