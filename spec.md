# Specification

## Summary
**Goal:** Integrate real-time Overpass API hospital detection with routing into ResourceMapPage and HospitalFinderPage, and fix blood type detection logic in BloodDonorPage.

**Planned changes:**
- Rewrite `ResourceMapPage.tsx` to fetch nearby hospitals from the Overpass API (amenity=hospital or healthcare=hospital within 10 km) using the user's live GPS coordinates via the existing `useGeolocation` hook, display only hospitals within 5 km as map markers and sidebar items sorted by distance, and merge with existing backend hospital data.
- Add leaflet-routing-machine integration to `ResourceMapPage.tsx`: clicking "Get Directions" on a marker popup or sidebar item draws a turn-by-turn route from the user's location to the selected hospital using the public OSRM endpoint, styled with the app's red/amber accent color, with a "Close Directions" button to remove the route.
- Enrich hospital marker popups and sidebar items on `ResourceMapPage.tsx` with address, phone number, opening hours, and a 24/7 Emergency badge parsed from Overpass API tags, all styled with the emergency dark theme.
- Update `HospitalFinderPage.tsx` to also fetch hospitals from the Overpass API, merge with backend results, display distance and Overpass-extracted address/phone, and preserve existing filters and HospitalCard styling.
- Rewrite blood type detection in `BloodDonorPage.tsx`: for text/PDF files, apply strict priority-ordered regex (AB+, AB-, A+, A-, B+, B-, O+, O-) covering bare symbols, labeled formats, and spelled-out forms; for image files, skip regex and show a manual blood type selector that must be confirmed before submission; block submission if detection fails on text files.

**User-visible outcome:** Users see real nearby hospitals on the map and hospital finder page with accurate distances, addresses, phone numbers, and emergency info sourced live from OpenStreetMap. They can get in-map turn-by-turn directions to any hospital. Blood donor uploads now correctly detect the blood type from documents, and image uploads prompt a manual selector instead of guessing from binary data.
