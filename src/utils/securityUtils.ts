
import { supabase } from '@/integrations/supabase/client';
import { logAuditEvent } from '@/utils/supabaseOptimizer';

/**
 * Security utilities for SOC 2 compliance
 */

// Password strength requirements
const PASSWORD_MIN_LENGTH = 12;
const REQUIRES_UPPERCASE = true;
const REQUIRES_LOWERCASE = true; 
const REQUIRES_NUMBER = true;
const REQUIRES_SPECIAL = true;

/**
 * Checks password strength according to SOC 2 requirements
 * @param password The password to check
 * @returns Object with validation result and reason if invalid
 */
export const checkPasswordStrength = (password: string): { isValid: boolean; reason?: string } => {
  if (password.length < PASSWORD_MIN_LENGTH) {
    return { 
      isValid: false, 
      reason: `Password must be at least ${PASSWORD_MIN_LENGTH} characters long` 
    };
  }
  
  if (REQUIRES_UPPERCASE && !/[A-Z]/.test(password)) {
    return { 
      isValid: false, 
      reason: 'Password must contain at least one uppercase letter' 
    };
  }
  
  if (REQUIRES_LOWERCASE && !/[a-z]/.test(password)) {
    return { 
      isValid: false, 
      reason: 'Password must contain at least one lowercase letter' 
    };
  }
  
  if (REQUIRES_NUMBER && !/[0-9]/.test(password)) {
    return { 
      isValid: false, 
      reason: 'Password must contain at least one number' 
    };
  }
  
  if (REQUIRES_SPECIAL && !/[^A-Za-z0-9]/.test(password)) {
    return { 
      isValid: false, 
      reason: 'Password must contain at least one special character' 
    };
  }
  
  return { isValid: true };
};

/**
 * Checks for potential security vulnerabilities
 * @param userId Current user ID for logging
 * @returns Object with security issues found
 */
export const checkSecurityVulnerabilities = async (userId: string): Promise<{
  vulnerabilities: Array<{ severity: 'high' | 'medium' | 'low'; issue: string; recommendation: string }>;
  score: number;
}> => {
  const vulnerabilities: Array<{ 
    severity: 'high' | 'medium' | 'low'; 
    issue: string; 
    recommendation: string 
  }> = [];
  
  // Log the security check for audit purposes
  await logAuditEvent(userId, 'SECURITY_CHECK', {
    timestamp: new Date().toISOString(),
    source: 'securityUtils.checkSecurityVulnerabilities'
  });
  
  // Check if multiple sessions are active
  try {
    const { data: sessions, error } = await supabase.from('apl_user_sessions')
      .select('id')
      .eq('user_id', userId);
      
    if (!error && sessions && sessions.length > 1) {
      vulnerabilities.push({
        severity: 'medium',
        issue: `Multiple active sessions detected (${sessions.length})`,
        recommendation: 'Sign out of unused sessions for better security'
      });
    }
  } catch (error) {
    console.error('Error checking sessions:', error);
  }
  
  // Check for recent failed login attempts
  try {
    const { data: failedLogins, error } = await supabase.from('apl_auth_logs')
      .select('created_at')
      .eq('user_id', userId)
      .eq('action', 'LOGIN_FAILED')
      .gt('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()); // Last 24 hours
      
    if (!error && failedLogins && failedLogins.length > 3) {
      vulnerabilities.push({
        severity: 'high',
        issue: `Multiple failed login attempts detected (${failedLogins.length} in the last 24 hours)`,
        recommendation: 'Consider changing your password and enabling two-factor authentication'
      });
    }
  } catch (error) {
    console.error('Error checking failed logins:', error);
  }
  
  // Calculate security score (0-100)
  const score = Math.max(0, 100 - (vulnerabilities.reduce((total, vuln) => {
    if (vuln.severity === 'high') return total + 30;
    if (vuln.severity === 'medium') return total + 15;
    return total + 5;
  }, 0)));
  
  return {
    vulnerabilities,
    score
  };
};

/**
 * Sanitizes user input to prevent XSS attacks
 * @param input Raw user input
 * @returns Sanitized string
 */
export const sanitizeInput = (input: string): string => {
  if (!input) return '';
  
  // Basic XSS protection - replace HTML special characters
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
};

/**
 * Validates authentication token expiration
 * @param token JWT token to validate
 * @returns Boolean indicating if token is valid and not expired
 */
export const validateAuthToken = (token: string): boolean => {
  if (!token) return false;
  
  try {
    // Extract the payload part of the JWT (second part)
    const parts = token.split('.');
    if (parts.length !== 3) return false;
    
    // Decode the payload
    const payload = JSON.parse(atob(parts[1]));
    
    // Check if token is expired
    if (!payload.exp) return false;
    
    const expirationTime = payload.exp * 1000; // Convert to milliseconds
    const currentTime = Date.now();
    
    return currentTime < expirationTime;
  } catch (error) {
    console.error('Error validating token:', error);
    return false;
  }
};
