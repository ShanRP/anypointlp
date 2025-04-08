
-- Function to send welcome email to a subscriber
CREATE OR REPLACE FUNCTION public.send_welcome_email(subscriber_email TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result JSONB;
  email_html TEXT;
  email_subject TEXT := 'Welcome to the Anypoint Learning Platform Newsletter!';
  from_email TEXT := 'Anypoint Learning Platform <noreply@anypointlearningplatform.com>';
  service_role_key TEXT;
  api_url TEXT;
  resend_key TEXT;
BEGIN
  -- Get the required secrets from database settings
  service_role_key := current_setting('app.settings.SUPABASE_SERVICE_ROLE_KEY', true);
  resend_key := current_setting('app.settings.RESEND_API_KEY', true);
  api_url := current_setting('app.settings.SUPABASE_URL', true);
  
  -- Create email HTML content
  email_html := '
    <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
          h1 { color: #5a67d8; }
          h2 { color: #4c51bf; margin-top: 24px; }
          .footer { margin-top: 30px; padding-top: 15px; border-top: 1px solid #ddd; font-size: 14px; color: #666; }
        </style>
      </head>
      <body>
        <h1>Welcome to the Anypoint Learning Platform!</h1>
        <p>Thank you for subscribing to our newsletter! We''re excited to have you join our community of MuleSoft enthusiasts and API developers.</p>
        
        <h2>Here''s what you can expect:</h2>
        <ul>
          <li>Latest updates on MuleSoft and API development best practices</li>
          <li>Exclusive tutorials and guides for building better integrations</li>
          <li>Early access to new features and tools we''re developing</li>
          <li>Invitations to webinars and online events</li>
          <li>Tips and tricks from industry experts</li>
        </ul>
        
        <h2>Coming soon to our platform:</h2>
        <ul>
          <li>Advanced AI-powered MuleSoft flow generation</li>
          <li>Interactive DataWeave transformation tools</li>
          <li>Comprehensive API documentation generators</li>
          <li>Integration with popular CI/CD pipelines</li>
          <li>Enhanced visualization tools for your API ecosystem</li>
        </ul>
        
        <p>You''ll be the first to know when these exciting features are released!</p>
        
        <p>If you have any questions or feedback, feel free to reply to this email or contact our support team.</p>
        
        <div class="footer">
          <p>Thank you again for subscribing, and welcome to the Anypoint Learning Platform community!</p>
          <p>Best regards,<br>The Anypoint Learning Platform Team</p>
        </div>
      </body>
    </html>';

  -- Log key information for debugging
  RAISE NOTICE 'Preparing to send email to: %', subscriber_email;
  
  -- Send email using Resend API directly from the database function
  SELECT 
    COALESCE(
      content::jsonb,
      jsonb_build_object('error', 'Failed to send email')
    )
  INTO result
  FROM http((
    'POST',
    'https://api.resend.com/emails',
    ARRAY[
      ('Content-Type', 'application/json'),
      ('Authorization', 'Bearer ' || resend_key)
    ],
    jsonb_build_object(
      'from', from_email,
      'to', subscriber_email,
      'subject', email_subject,
      'html', email_html
    )::TEXT,
    NULL
  )::http_request);
  
  -- Log the response for debugging
  RAISE NOTICE 'Resend API response: %', result;
  
  -- Update the last_email_sent timestamp in the database
  PERFORM pg_sleep(0.1); -- Small delay to ensure email is sent first
  UPDATE public.apl_newsletter_subscribers 
  SET last_email_sent = now() 
  WHERE email = subscriber_email;
  
  RETURN result;
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'Error sending email: %', SQLERRM;
    RETURN jsonb_build_object(
      'success', false,
      'error', SQLERRM
    );
END;
$$;
