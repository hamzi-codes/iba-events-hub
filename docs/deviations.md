# Deviations log

| Date | What differs (built vs SRS or wireframe) | Why | Decided by | Fixed in |
| 16 Nov 2026 | Student, organiser, approver and admin tab bars show only the Sprint 1 tabs (no Search, My events or Alerts). | Those tabs are Sprint 2 (Master Document 3.5, 7.2). | Master Document | Sprint 2 |
| 16 Nov 2026 | Login has no "Forgot password" link. | Password reset is Sprint 2 (AUT-06). | Master Document 7.3 | Sprint 2 |
| 16 Nov 2026 | Logo, colours and fonts are neutral placeholders. | IBA branding files (BR-05) not supplied. Colours are in mobile/src/theme/theme.js. | Umer | When assets arrive |
| 18 Nov 2026 | Login and Sign up checked against Team08_Wireframes.pdf page 3. Placeholders show example text (name@iba.edu.pk) instead of <Email>. Verify your email is code only, no link. | Master Document 3.5, 7.3. | Umer | Sprint 2 if needed |
| 18 Nov 2026 | Verify your email: "Resend Link" is "Resend code", the text says "We sent a code to <email>" (no link), the Code box is the 6-digit field. After a correct code the app goes to Log in with a "verified" note and the email filled in. | Sprint 1 uses a code only (Master Document 3.5, D6). The app has no password after sign-up, and a login token only comes from POST /auth/login. | Umer | Sprint 2 if needed |
| 18 Nov 2026 | Profile: Full Name and Email shown read-only, a Role line added, Change Password and the Notifications switches not shown. | Change password and notification switches are Sprint 2 (Master Document 7.3). Role line is in Section 7.3 screen 4. | Master Document | Sprint 2 |
