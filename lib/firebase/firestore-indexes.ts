/**
 * Firestore Indexes Documentation
 *
 * This file documents the required Firestore indexes for the application.
 * When deploying to production, make sure to create these indexes in the Firebase console.
 *
 * Required Indexes:
 *
 * 1. Collection: jobs
 *    Fields: status (ascending), postedAt (descending)
 *
 * 2. Collection: applications
 *    Fields: jobId (ascending), createdAt (descending)
 *
 * 3. Collection: applications
 *    Fields: candidateId (ascending), createdAt (descending)
 *
 * 4. Collection: conversations
 *    Fields: participants (array), lastMessageAt (descending)
 *
 * 5. Collection: notifications
 *    Fields: userId (ascending), createdAt (descending)
 *    Note: This index is not required with the current implementation as we sort client-side,
 *    but it would be needed if we want to sort on the server side.
 */

export const REQUIRED_INDEXES = [
  {
    collection: "jobs",
    fields: ["status", "postedAt"],
  },
  {
    collection: "applications",
    fields: ["jobId", "createdAt"],
  },
  {
    collection: "applications",
    fields: ["candidateId", "createdAt"],
  },
  {
    collection: "conversations",
    fields: ["participants", "lastMessageAt"],
  },
  {
    collection: "notifications",
    fields: ["userId", "createdAt"],
  },
]

// This is a utility function to help create the required indexes
// It's not used in the application, but can be helpful for documentation
export function getIndexCreationUrls() {
  // This would generate the URLs to create the indexes in the Firebase console
  // For now, it's just a placeholder
  return REQUIRED_INDEXES.map((index) => {
    return `https://console.firebase.google.com/project/_/firestore/indexes?create_composite=${index.collection}:${index.fields.join(",")}`
  })
}
