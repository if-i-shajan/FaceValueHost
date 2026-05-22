# Firestore Database Schema

## Collection: `users`
```
users/{uid}
  - uid: string
  - email: string
  - name: string
  - age: number
  - gender: "male" | "female" | "non-binary" | "prefer-not-to-say"
  - country: string (optional)
  - role: "user" | "admin"
  - createdAt: timestamp
  - participationCount: number
  - qualityScore: number (0-100)
  - isFlagged: boolean
```

## Collection: `surveys`
```
surveys/{surveyId}
  - title: string
  - description: string
  - status: "draft" | "active" | "paused" | "completed"
  - createdAt: timestamp
  - updatedAt: timestamp
  - startDate: timestamp (optional)
  - endDate: timestamp (optional)
  - photoIds: string[]
  - participantCount: number
  - completedCount: number
  - settings: {
      ratingScale: "1-5" | "1-10" | "slider" | "emoji"
      randomizeOrder: boolean
      photosPerPerson: number
      mandatoryViewingTime: number
      skipSettings: { enabled, maxSkips, skipDelay, reappearLater, cooldownSeconds }
      prevPhotoSettings: { enabled, maxPrev }
      breakSettings: { enabled, breakAfterCount, breakDurationSeconds, allowSkipAfterSeconds, message }
      attentionChecks: AttentionCheck[]
      rules: { instructions, ratingGuidelines, viewingTimePolicy, skipPolicy, prevPhotoPolicy, breakPolicy, estimatedDuration, consentText, warningMessages }
      antiFastRating: { enabled, minimumRatingTimeMs, identicalRatingThreshold, maxSkipRate, penaltyAction, cooldownSeconds }
      allowResume: boolean
    }
```

## Collection: `persons`
```
persons/{personId}
  - surveyId: string
  - personCode: string (e.g. "P001")
  - photoSlots: PhotoSlot[]  [{ index, photoId?, isEmpty }]
  - completionPercentage: number
  - createdAt: timestamp
```

## Collection: `photos`
```
photos/{photoId}
  - surveyId: string
  - personId: string
  - slotIndex: number
  - originalUrl: string
  - processedUrl: string (512x512 WEBP)
  - thumbnailUrl: string (128x128 WEBP)
  - status: "pending" | "processing" | "approved" | "rejected"
  - aiValidation: {
      hasFace: boolean
      faceCount: number
      isBlurry: boolean
      isLowResolution: boolean
      confidence: number
      warnings: string[]
      faceEmbedding: number[] (optional, 512-dim)
    }
  - metadata: { originalFilename, width, height, fileSize, format }
  - createdAt: timestamp
```

## Collection: `participants`
```
participants/{participantId}
  - userId: string
  - surveyId: string
  - status: "in-progress" | "completed" | "abandoned" | "flagged"
  - photoOrder: string[]
  - currentIndex: number
  - completedPhotoIds: string[]
  - skippedPhotoIds: string[]
  - startedAt: timestamp
  - completedAt: timestamp (optional)
  - lastActiveAt: timestamp
  - qualityScore: number
  - isSuspicious: boolean
  - suspiciousFlags: SuspiciousFlag[]
  - breaksTaken: number
  - totalTimeSeconds: number
  - attentionCheckResults: AttentionCheckResult[]
```

## Collection: `ratings`
```
ratings/{ratingId}
  - surveyId: string
  - participantId: string
  - userId: string
  - photoId: string
  - personId: string
  - rating: number
  - responseTimeMs: number
  - isSkipped: boolean
  - editHistory: RatingEdit[]
  - timestamp: timestamp
```

## Indexes Required
- participants: (surveyId ASC, startedAt DESC)
- ratings: (surveyId ASC, timestamp DESC)
- ratings: (participantId ASC, photoId ASC)
- photos: (surveyId ASC, status ASC)
- persons: (surveyId ASC, personCode ASC)
