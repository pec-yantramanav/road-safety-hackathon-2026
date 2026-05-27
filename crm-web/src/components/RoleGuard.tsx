import React from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../state/store';
import { OfficerRole } from '../types';

interface RoleGuardProps {
  allowed: OfficerRole[];
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export const RoleGuard: React.FC<RoleGuardProps> = ({ allowed, children, fallback = null }) => {
  const currentUser = useSelector((state: RootState) => state.auth.user);

  // Check if current user has any of the allowed roles
  const hasAccess = currentUser?.roles.some((role) => allowed.includes(role));

  if (!hasAccess) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
};
export default RoleGuard;
