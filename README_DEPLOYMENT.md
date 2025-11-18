# Solary Wallet v8 - Production Deployment

## Quick Start

### Prerequisites
- Node.js 18+
- Vercel CLI
- Firebase project setup (optional for analytics)

### Build & Deploy

\`\`\`bash
# Install dependencies
npm install

# Run pre-deployment tests
npm run test:pre-deploy

# Build for production
npm run build

# Deploy to Vercel
vercel deploy --prod
\`\`\`

## Environment Configuration

### Required Variables for Production

\`\`\`env
# Solana RPC Endpoint (use private endpoint for better reliability)
NEXT_PUBLIC_SOLANA_RPC=https://api.mainnet-beta.solana.com

# Jupiter API (public)
NEXT_PUBLIC_JUPITER_API=https://quote-api.jup.ag/v6

# Solary Fee Wallet
NEXT_PUBLIC_SOLARY_FEE_WALLET=2gNsFkvySmj3JVuabfy6W9u8sbyLbqePp7wgGeFaxr46

# Firebase (optional)
NEXT_PUBLIC_FIREBASE_API_KEY=xxx
NEXT_PUBLIC_FIREBASE_PROJECT_ID=xxx
\`\`\`

## Performance Optimization

### Recommended RPC Endpoints
- **Helius** - Best for Solana, 100k RPS
- **QuickNode** - Good uptime, lower cost
- **Alchemy** - Comprehensive suite
- **Magic Eden** - Community-focused

### CDN Configuration
- Enable Vercel Edge Functions
- Configure image optimization
- Enable Next.js automatic static optimization

## Security Hardening

- [ ] Enable HTTPS only
- [ ] Set up WAF rules (DDoS protection)
- [ ] Configure CORS headers properly
- [ ] Implement rate limiting on API routes
- [ ] Regular security audits

## Monitoring & Observability

### Log Aggregation
\`\`\`bash
# Vercel Logs
vercel logs
\`\`\`

### Performance Monitoring
- Monitor Core Web Vitals
- Track API response times
- Monitor error rates

### Alerting
- Set up Vercel alerting
- Configure critical issue notifications
- Daily health reports

## Scaling Considerations

### Current Limits (v8)
- 1000 concurrent users
- 100 requests/sec per user
- 5MB session storage

### Scaling Plan (Future)
- Backend API for account management
- PostgreSQL for data persistence
- Redis for caching & sessions
- Load balancing across regions

## Support & Maintenance

### Weekly Tasks
- Review error logs
- Update dependencies (security patches)
- Monitor performance metrics

### Monthly Tasks
- Security audit
- Feature evaluation
- User feedback review

### Quarterly Tasks
- Major version updates
- Performance benchmarking
- Strategic planning

## Rollback Procedure

If critical issues occur after deploy:

\`\`\`bash
# Revert to previous version
vercel rollback

# Or manually specify version
vercel promote <deployment-id>
\`\`\`

## License

Solary Wallet © 2025. All rights reserved.
