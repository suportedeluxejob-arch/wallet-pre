# Solary Wallet v8 - Deployment & Testing Guide

## Pre-Deployment Checklist

### 1. Testing on Devnet ✓
- [ ] Create test wallet on devnet
- [ ] Test Swap functionality with test tokens
- [ ] Test Staking with devnet validators
- [ ] Verify APY calculations
- [ ] Test reward notifications
- [ ] Test price alerts

### 2. Security Review ✓
- [ ] Private keys never logged to console (production)
- [ ] All sensitive data encrypted
- [ ] RLS policies configured if using database
- [ ] Input validation on all forms
- [ ] XSS protection verified
- [ ] CSRF tokens present

### 3. Performance Testing ✓
- [ ] Load test with concurrent users
- [ ] Monitor RPC call response times
- [ ] Check memory usage on long sessions
- [ ] Verify polling intervals (5 min staking, 30 sec wallet)
- [ ] Cache hit rates acceptable

### 4. Browser Compatibility ✓
- [ ] Chrome/Chromium
- [ ] Firefox
- [ ] Safari
- [ ] Mobile browsers (iOS Safari, Chrome Android)

### 5. API & Integration Testing ✓
- [ ] Jupiter API quotes working
- [ ] Solana RPC endpoints responding
- [ ] Notification service functional
- [ ] Rate limiting handled gracefully
- [ ] Error messages user-friendly

## Mainnet Deployment Steps

### Phase 1: Staging (Production-like, Safe Network)

1. **Deploy to Staging Environment**
   \`\`\`bash
   npm run build
   vercel deploy --prod
   \`\`\`

2. **Configure Environment Variables**
   - Set `NEXT_PUBLIC_FIREBASE_*` variables
   - Verify RPC endpoints (use public for testnet)
   - Set fee wallet address
   - Configure notification settings

3. **Run Smoke Tests**
   - Create wallet → OK
   - Derive accounts → OK
   - Check balance → OK
   - View tokens → OK
   - Send test transaction → OK

4. **Load Testing (Optional)**
   - Simulate 100 concurrent users
   - Monitor response times
   - Check for memory leaks
   - Verify error handling

### Phase 2: Mainnet Launch (With Caution)

1. **Final Configuration**
   - Set mainnet fee wallet address
   - Configure mainnet RPC endpoints (Helius/QuickNode recommended)
   - Enable all security features
   - Set up monitoring/alerting

2. **Beta Release (Invite-only)**
   - 100 trusted users first
   - Monitor for 1-2 weeks
   - Collect feedback
   - Fix critical issues

3. **Full Release (Public)**
   - Announce on social media
   - Update documentation
   - Monitor support channels
   - Plan hotfixes if needed

## Testing Checklist - Mainnet

### Transaction Testing
- [ ] Send SOL to another wallet
- [ ] Receive SOL from another wallet
- [ ] Send SPL token (USDC, USDT)
- [ ] Swap tokens via Jupiter
- [ ] Create stake account
- [ ] Delegate stake
- [ ] Unstake and withdraw

### Feature Testing
- [ ] Staking shows real APY
- [ ] Reward notifications work
- [ ] Swap history persists
- [ ] Price alerts trigger correctly
- [ ] Real-time monitoring updates
- [ ] Fee configuration applies
- [ ] RPC failover works

### Security Testing
- [ ] Lock/unlock wallet works
- [ ] Private key never shown unencrypted
- [ ] Logout clears sensitive data
- [ ] Session timeout works
- [ ] No localStorage leaks

### Performance Testing
- [ ] Dashboard loads in < 2s
- [ ] Swap quotes fetch in < 1s
- [ ] Staking data updates timely
- [ ] No UI freezing during operations
- [ ] Mobile performance acceptable

## Monitoring & Alerts

### Key Metrics to Monitor
1. **User Metrics**
   - Active users per day
   - Feature usage rates
   - Error rates by feature

2. **System Metrics**
   - API response times
   - RPC endpoint latency
   - Network congestion indicators

3. **Financial Metrics**
   - Platform fee collection rate
   - Swap volume
   - Total staked amount

### Alert Thresholds
- API response time > 5s → Alert
- RPC endpoint down → Immediate alert
- Error rate > 1% → Alert
- Out of memory condition → Immediate restart

## Hotfix Procedure

If critical issues arise:

1. **Identify Issue**
   - Reproduce locally
   - Check error logs
   - Determine impact scope

2. **Create Fix**
   - Checkout hotfix branch
   - Make minimal changes
   - Test thoroughly

3. **Deploy Hotfix**
   - Merge to main
   - Deploy to production
   - Notify users if necessary

## Post-Launch

- Monitor support tickets
- Collect user feedback
- Plan feature updates
- Regular security audits
- Keep dependencies updated

## Key Contacts

- Emergency: v0-team@solana.dev
- Support: support@solary.app
- Security: security@solary.app

## Links

- Dashboard: https://solary.app
- Documentation: https://docs.solary.app
- Status Page: https://status.solary.app
