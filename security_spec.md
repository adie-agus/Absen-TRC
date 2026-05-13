# Security Specification for ABSENSI TRC BPBD KP

## Data Invariants
1. A user can only read their own profile.
2. A user can only create an attendance record for themselves.
3. An attendance record's `date` must match the server's current date.
4. An attendance record's `userId` must match the authenticated user's ID.
5. Users cannot modify the `masuk` time once created.
6. Users can only update their own record to add a `pulang` time and change status to 'pulang'.
7. Records older than current date should be immutable for regular users.

## The Dirty Dozen Payloads (Target: DENY)

1. **Identity Spoofing**: Attempt to create an attendance record for a different user.
   ```json
   { "userId": "victim_uid", "date": "2026-05-13", "masuk": "...", "status": "hadir" }
   ```
2. **State Shortcutting**: Create a record already marked as 'pulang'.
   ```json
   { "userId": "my_uid", "date": "2026-05-13", "masuk": "...", "pulang": "...", "status": "pulang" }
   ```
3. **Ghost Fields**: Add an unauthorized field `isAdmin: true` to a user profile.
4. **Time Travel**: Create an attendance record for a future or past date.
5. **NIK Poisoning**: Inject a 1MB string as a NIK field.
6. **Self-Promotion**: Attempt to update own user record to change `role` to 'Admin'.
7. **Orphaned Write**: Create a record without a valid `userId`.
8. **PII Leak**: A user attempts to 'get' another user's private profile.
9. **Bulk Scrape**: An authenticated user attempts a blanket list query on all attendance records without a filter.
10. **Shadow Update**: Attempt to change the `masuk` time of an existing record.
11. **ID Poisoning**: Use a 2KB string as `absensiId`.
12. **Double Clock-In**: Attempt to created a second record for the same date (managed by app logic, but rules should potentially guard if possible, though rules can't easily check for non-existence of another doc in the same collection without a query which is expensive in rules, so we rely on write-once logic for the doc ID if we used date as ID). 
    *Correction*: We will use generated IDs, but we can enforce uniqueness if we derived the ID from `userId_date`. For simplicity and better scalability, we use auto-IDs and rely on `list` filters.
