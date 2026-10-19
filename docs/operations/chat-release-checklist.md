# Public beta release checklist

- [ ] Set Netlify Functions/Builds secrets and a real shared Redis endpoint; verify no secrets in public assets.
- [ ] Verify worker is authorized, unauthorized calls cannot generate, two invocations cannot run the same job twice, and one user cannot read/cancel another session's job.
- [ ] Exercise two deployed instances racing for the last global/session slot and daily token allowance. Confirm denied requests never reach NVIDIA.
- [ ] Verify interrupted and stopped jobs preserve text, cancel upstream, and settle active slots; crash/expiry recovers leases conservatively.
- [ ] Pass `npm run test`, `npm run typecheck`, `npm run lint`, `npm run test:e2e`, and a production build.
- [ ] Inspect actual desktop/mobile diagrams, selection toolbar, table overflow and notes drawer focus. Run a real Bangla IME and Android/iOS virtual-keyboard check; browser emulation is not a physical-device check.
- [ ] Review the 32 synthetic evaluation outputs with the rubric. No invented sources, unsupported current legal exemptions or guaranteed returns; at least 28/32 useful responses. Record failures and limitations honestly.
- [ ] Perform one real Netlify short answer, one detailed roadmap and one Stop; observe progressive job state and correct final reveal within host limits.
- [ ] Confirm privacy/provider/persistence copy matches the deployed configuration.
- [ ] Publish only when deployment is authorized. Measure at least 100 beta attempts before claiming availability/latency targets; exclude deliberate Stops from provider failure rate.
