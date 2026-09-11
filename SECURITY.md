# Security Policy

Internet Court handles user accounts, public user generated content, votes, reports, and subscription state. Security issues must be treated as production issues.

## Reporting

Do not publish sensitive security findings in a public issue. Report them privately through the repository security reporting mechanism once enabled.

## Secrets

Never commit Supabase secret keys, PayPal client secrets, webhook secrets, service role keys, database passwords, or authentication credentials.

Client applications may use only the Supabase publishable key with appropriate Row Level Security policies.

## Production rule

Database schema changes must be version controlled and reviewed before production deployment.
