
import { supabase } from '@/lib/supabase';

export type NotificationType =
  | 'budget'
  | 'depense'
  | 'recette'
  | 'habitude'
  | 'ia'
  | 'general';

export async function sendNotification(
  message: string,
  type: NotificationType = 'general'
) {
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new Error('Utilisateur non connecté');
  }

  const { error } = await supabase
    .from('notifications')
    .insert({
      etudiant_id: user.id,
      message,
      type,
    });

  if (error) {
    throw new Error(error.message);
  }
}
