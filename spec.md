# Specification

## Summary
**Goal:** Fix volunteer registration so new volunteers are correctly saved and displayed, and add volunteer markers (or a sidebar fallback) to the ResourceMapPage map.

**Planned changes:**
- Fix the volunteer registration form on VolunteerPage to correctly call the backend `addVolunteer` mutation with the proper payload (name, skills, city, availability status).
- After successful submission, invalidate/refetch the volunteer list so the new volunteer appears immediately without a page reload.
- Show a success message on successful registration and a visible error message (with form data preserved) on failure.
- Ensure the Dashboard volunteer count stat card reflects the newly added volunteer.
- On ResourceMapPage, fetch volunteers using the existing `useGetVolunteers` hook and render volunteer markers on the Leaflet map, visually distinct from hospital markers.
- Each volunteer marker popup shows the volunteer's name, city, skills (as badges), and availability status.
- If volunteer records lack coordinate data, derive approximate positions from the city field using a best-effort approach, or display a sidebar list of volunteers as a graceful fallback.
- Add a map legend or section distinguishing hospital markers from volunteer markers.

**User-visible outcome:** Users can register volunteers and see them appear instantly in the directory and on the resource map (or sidebar), with clear success/error feedback throughout.
