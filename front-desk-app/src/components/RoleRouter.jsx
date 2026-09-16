import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../lib/auth';

/**
 * RoleRouter — redirects users based on their role.
 * This component does NOT render any page; it only applies side-effect navigation.
 */
export default function RoleRouter() {
  const { user, profile, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (loading) return;

    if (!user) {
      navigate('/login', { replace: true });
      return;
    }

    const role = profile?.role;

    if (!role) {
      navigate('/pending', { replace: true });
      return;
    }

    switch (role) {
      case 'admin':
        navigate('/admin', { replace: true });
        break;
      case 'designer':
        navigate('/designers', { replace: true });
        break;
      case 'front_desk':
        navigate('/frontdesk', { replace: true });
        break;
      case 'admin_marketer':
        navigate('/frontdesk', { replace: true });
        break;
      default:
        navigate('/pending', { replace: true });
    }
  }, [user, profile, loading, navigate]);

  return null;
}