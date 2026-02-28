# Specification

## Summary
**Goal:** Add pre-login SOS emergency calling, post-login emergency contacts management, and SOS notification of stored contacts via tel: links.

**Planned changes:**
- When an unauthenticated user triggers SOS, display a modal with a prominent "Call Emergency Services (112)" `tel:` link button; still capture geolocation and record the SOS event anonymously in the backend.
- Add an Emergency Contacts page/section accessible to authenticated users from the navigation bar or profile area, with a form to add contacts (name, phone, relationship) and the ability to remove them.
- Extend the backend Motoko actor with stable storage for emergency contacts keyed by user principal, and expose `addEmergencyContact`, `removeEmergencyContact`, `getMyEmergencyContacts`, and `getEmergencyContactsByPrincipal` functions.
- When an authenticated user's SOS countdown completes, show a modal listing each stored emergency contact as a "Call [Name]" `tel:` link, plus a prominent "Call Emergency Services (112)" `tel:` link; record the SOS event with the user's principal, timestamp, and geolocation.
- If an authenticated user has no emergency contacts, prompt them to add contacts and still show the emergency dial button in the SOS modal.

**User-visible outcome:** Unauthenticated users can immediately call emergency services via a tel: link when triggering SOS. Logged-in users can manage a personal emergency contacts list and, upon triggering SOS, see direct call links for each contact alongside the emergency services dial button.
