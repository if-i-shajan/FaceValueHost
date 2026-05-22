// ─── User Types ──────────────────────────────────────────────
export interface User {
  uid: string
  email: string
  name: string
  age: number
  gender: 'male' | 'female' | 'non-binary' | 'prefer-not-to-say'
  country?: string
  role: 'user' | 'admin'
  createdAt: Date
  participationCount: number
  qualityScore: number
  isFlagged: boolean
}

// ─── Survey Types ─────────────────────────────────────────────
export interface Survey {
  id: string
  title: string
  description: string
  status: 'draft' | 'active' | 'paused' | 'completed'
  createdAt: Date
  updatedAt: Date
  startDate?: Date
  endDate?: Date
  photoIds: string[]
  settings: SurveySettings
  participantCount: number
  completedCount: number
}

export interface SurveySettings {
  ratingScale: '1-5' | '1-10' | 'slider' | 'emoji'
  randomizeOrder: boolean
  photosPerPerson: number
  mandatoryViewingTime: number // seconds
  skipSettings: SkipSettings
  prevPhotoSettings: PrevPhotoSettings
  breakSettings: BreakSettings
  attentionChecks: AttentionCheck[]
  rules: SurveyRules
  antiFastRating: AntiFastRatingSettings
  maxDurationMinutes?: number
  estimatedDuration?: string
  allowResume: boolean
}

export interface SkipSettings {
  enabled: boolean
  maxSkips: number
  skipDelay: number // seconds
  reappearLater: boolean
  cooldownSeconds: number
}

export interface PrevPhotoSettings {
  enabled: boolean
  maxPrev: number | 'unlimited'
}

export interface BreakSettings {
  enabled: boolean
  breakAfterCount: number
  breakDurationSeconds: number
  allowSkipAfterSeconds: number
  message: string
}

export interface AttentionCheck {
  id: string
  photoId: string
  requiredRating: number
  failureAction: 'warn' | 'flag' | 'disqualify'
}

export interface SurveyRules {
  instructions: string
  ratingGuidelines: string
  viewingTimePolicy: string
  skipPolicy: string
  prevPhotoPolicy: string
  breakPolicy: string
  estimatedDuration: string
  consentText: string
  warningMessages: string[]
}

export interface AntiFastRatingSettings {
  enabled: boolean
  minimumRatingTimeMs: number
  identicalRatingThreshold: number
  maxSkipRate: number
  penaltyAction: 'warn' | 'cooldown' | 'disqualify'
  cooldownSeconds: number
}

// ─── Photo Types ──────────────────────────────────────────────
export interface Photo {
  id: string
  surveyId: string
  personId: string
  slotIndex: number
  originalUrl: string
  processedUrl: string
  thumbnailUrl: string
  status: 'pending' | 'processing' | 'approved' | 'rejected'
  aiValidation: AIValidation
  metadata: PhotoMetadata
  createdAt: Date
}

export interface AIValidation {
  hasFace: boolean
  faceCount: number
  isBlurry: boolean
  isLowResolution: boolean
  confidence: number
  warnings: string[]
  faceEmbedding?: number[]
}

export interface PhotoMetadata {
  originalFilename: string
  width: number
  height: number
  fileSize: number
  format: string
}

export interface Person {
  id: string
  surveyId: string
  personCode: string
  photoSlots: PhotoSlot[]
  completionPercentage: number
  createdAt: Date
}

export interface PhotoSlot {
  index: number
  photoId?: string
  photo?: Photo
  isEmpty: boolean
}

// ─── Participant Types ─────────────────────────────────────────
export interface Participant {
  id: string
  userId: string
  surveyId: string
  status: 'in-progress' | 'completed' | 'abandoned' | 'flagged'
  photoOrder: string[]
  currentIndex: number
  completedPhotoIds: string[]
  skippedPhotoIds: string[]
  startedAt: Date
  completedAt?: Date
  lastActiveAt: Date
  qualityScore: number
  isSuspicious: boolean
  suspiciousFlags: SuspiciousFlag[]
  breaksTaken: number
  totalTimeSeconds: number
  attentionCheckResults: AttentionCheckResult[]
}

export interface SuspiciousFlag {
  type: 'fast-rating' | 'identical-ratings' | 'excessive-skips' | 'rapid-clicks'
  count: number
  timestamp: Date
  details: string
}

export interface AttentionCheckResult {
  checkId: string
  passed: boolean
  givenRating: number
  timestamp: Date
}

// ─── Rating Types ─────────────────────────────────────────────
export interface Rating {
  id: string
  surveyId: string
  participantId: string
  userId: string
  photoId: string
  personId: string
  rating: number
  responseTimeMs: number
  isSkipped: boolean
  editHistory: RatingEdit[]
  timestamp: Date
}

export interface RatingEdit {
  previousRating: number
  newRating: number
  editedAt: Date
}

// ─── Analytics Types ──────────────────────────────────────────
export interface SurveyAnalytics {
  surveyId: string
  totalParticipants: number
  completedParticipants: number
  activeParticipants: number
  suspiciousParticipants: number
  dropoutRate: number
  averageCompletionTimeMinutes: number
  averageRating: number
  totalPhotos: number
  ratingDistribution: Record<number, number>
  genderBreakdown: Record<string, number>
  ageGroupBreakdown: Record<string, number>
  countryBreakdown: Record<string, number>
  photoStats: PhotoStats[]
}

export interface PhotoStats {
  photoId: string
  personId: string
  averageRating: number
  medianRating: number
  modeRating: number
  variance: number
  stdDeviation: number
  minRating: number
  maxRating: number
  ratingCount: number
  skipCount: number
}

// ─── API Types ────────────────────────────────────────────────
export interface APIResponse<T> {
  data: T
  success: boolean
  message?: string
  error?: string
}

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  pageSize: number
  hasMore: boolean
}

// ─── UI State Types ───────────────────────────────────────────
export interface SurveySessionState {
  surveyId: string
  participantId: string
  currentIndex: number
  photoOrder: string[]
  completedIds: Set<string>
  skippedIds: Set<string>
  skipCount: number
  isOnBreak: boolean
  breakEndTime?: Date
  lastRatingTime?: Date
  consecutiveIdenticalRatings: number
  lastRating?: number
}

export interface NotificationState {
  id: string
  type: 'success' | 'error' | 'warning' | 'info'
  message: string
  duration?: number
}
