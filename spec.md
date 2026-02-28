# Specification

## Summary
**Goal:** Remove the "Built with using caffeine.ai" footer attribution text from all pages in the CrisisConnect application.

**Planned changes:**
- Search all frontend layout and page components (including `AppLayout.tsx`, `LoginPage.tsx`, and any other page-level files) for any element rendering the "Built with using caffeine.ai" text and delete it entirely
- Remove the footer element or container that held this text if it serves no other purpose

**User-visible outcome:** No page in the application displays the "Built with using caffeine.ai" attribution text, and no other content or layout is affected.
