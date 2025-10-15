# Email Templates

This folder contains HTML email templates for VibrationFit's transactional emails.

## Templates

### `magic-link-template.html`
Beautiful branded template for Supabase magic link authentication emails.

**Features:**
- VibrationFit logo and branding
- Clear call-to-action button
- Prominent 6-digit verification code
- Fallback instructions for both link and code
- Professional styling with gradients and shadows

**Usage:**
1. Copy the HTML content
2. Paste into Supabase Dashboard → Authentication → Templates → Magic Link
3. Save changes

**Template Variables:**
- `{{ .ConfirmationURL }}` - Magic link URL
- `{{ .Token }}` - 6-digit verification code

## Design System

The templates follow VibrationFit's design system:
- **Primary Green:** `#199D67` (brand color)
- **Secondary Teal:** `#14B8A6` (accent)
- **Typography:** System fonts (San Francisco, Segoe UI, etc.)
- **Spacing:** Consistent padding and margins
- **Shadows:** Subtle depth with `rgba(25,157,103,0.25)`

## Future Templates

Additional templates can be added here for:
- Password reset emails
- Welcome emails
- Intensive onboarding emails
- Billing notifications
- Account updates
