# Digital Shadow SOC: Attack Surface Management & Privacy Engine

A full-stack cybersecurity application designed for personal Attack Surface Management (ASM), CVSS-aligned risk posture scoring, and automated statutory data-privacy enforcement (GDPR Art. 17 / CCPA).

---

## Architecture Overview

- **Frontend**: React, Vite, Tailwind CSS / Custom Design System, Lucide Icons
- **Backend**: Node.js, Express.js (REST API architecture)
- **Database**: MongoDB Atlas (Mongoose ODM)
- **Security**: JWT Authentication, Protected Routes, Environment Credential Isolation

---

## Core Capabilities

- **Attack Surface Telemetry**: Dynamic registry of third-party SaaS accounts, active OAuth scopes, and domain endpoints.
- **Risk Posture Engine**: Quantitative exposure scoring (0–100) calibrated against multi-factor authentication (MFA) disciplines and verified data exfiltration events.
- **Incident Mitigation Playbook**: Standard Operating Procedures (SOPs) with real-time state persistence to MongoDB Atlas.
- **Statutory Erasure Generator**: One-click generation of legally compliant Art. 17 Right-to-be-Forgotten data purge requests.

---

## Quickstart & Local Setup

### 1. Clone the repository

```bash
git clone [https://github.com/deekshithaja/digital-shadow-soc.git](https://github.com/deekshithaja/digital-shadow-soc.git)
cd digital-shadow-soc
```
