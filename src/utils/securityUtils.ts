
import { supabase } from '@/integrations/supabase/client';
import { logAuditEvent, getCount } from '@/utils/supabaseOptimizer';

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

// Cache for vulnerability checks to avoid repeated database calls
const vulnerabilityCache = new Map<string, {
  data: any;
  timestamp: number;
}>();
const VULNERABILITY_CACHE_TTL = 5 * 60 * 1000; // 5 minutes

/**
 * Checks for potential security vulnerabilities
 * @param userId Current user ID for logging
 * @returns Object with security issues found
 */
export const checkSecurityVulnerabilities = async (userId: string): Promise<{
  vulnerabilities: Array<{ severity: 'high' | 'medium' | 'low'; issue: string; recommendation: string }>;
  score: number;
}> => {
  const cacheKey = `vulnerabilities:${userId}`;
  
  // Check cache first
  if (vulnerabilityCache.has(cacheKey)) {
    const cache = vulnerabilityCache.get(cacheKey)!;
    if (Date.now() - cache.timestamp < VULNERABILITY_CACHE_TTL) {
      return cache.data;
    }
    vulnerabilityCache.delete(cacheKey);
  }
  
  const vulnerabilities: Array<{ 
    severity: 'high' | 'medium' | 'low'; 
    issue: string; 
    recommendation: string 
  }> = [];
  
  // Log the security check for audit purposes - but only once per session
  await logAuditEvent(userId, 'SECURITY_CHECK', {
    timestamp: new Date().toISOString(),
    source: 'securityUtils.checkSecurityVulnerabilities'
  });
  
  // Check if multiple sessions are active - use optimized count query
  try {
    // Use direct query since apl_user_sessions is not in the TableName type
    const { count, error } = await supabase
      .from('apl_user_sessions')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId);
      
    if (!error && count && count > 1) {
      vulnerabilities.push({
        severity: 'medium',
        issue: `Multiple active sessions detected (${count})`,
        recommendation: 'Sign out of unused sessions for better security'
      });
    }
  } catch (error) {
    console.error('Error checking sessions:', error);
  }
  
  // Check for recent failed login attempts - use select with count only
  try {
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    
    const { data, error } = await supabase
      .from('apl_auth_logs')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('action', 'LOGIN_FAILED')
      .gt('created_at', oneDayAgo);
      
    const failedCount = data?.length || 0;
    
    if (!error && failedCount > 3) {
      vulnerabilities.push({
        severity: 'high',
        issue: `Multiple failed login attempts detected (${failedCount} in the last 24 hours)`,
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
  
  const result = {
    vulnerabilities,
    score
  };
  
  // Cache the result
  vulnerabilityCache.set(cacheKey, {
    data: result,
    timestamp: Date.now()
  });
  
  return result;
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

// Token validation cache to prevent repeated validation of the same token
const tokenCache = new Map<string, {
  isValid: boolean;
  expiry: number;
}>();

/**
 * Validates authentication token expiration
 * @param token JWT token to validate
 * @returns Boolean indicating if token is valid and not expired
 */
export const validateAuthToken = (token: string): boolean => {
  if (!token) return false;
  
  const tokenFingerprint = token.split('.')[2] || token; // Use signature part as cache key
  
  // Check cache first
  if (tokenCache.has(tokenFingerprint)) {
    const cache = tokenCache.get(tokenFingerprint)!;
    
    // If cached token is expired, remove from cache and return false
    if (Date.now() >= cache.expiry) {
      tokenCache.delete(tokenFingerprint);
      return false;
    }
    
    return cache.isValid;
  }
  
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
    const isValid = currentTime < expirationTime;
    
    // Cache the result
    tokenCache.set(tokenFingerprint, {
      isValid,
      expiry: expirationTime
    });
    
    return isValid;
  } catch (error) {
    console.error('Error validating token:', error);
    return false;
  }
};
