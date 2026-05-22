import { supabase } from './supabase'
import { Survey, Participant, Rating, SurveyAnalytics } from '../types'

const nowIso = () => new Date().toISOString()

const mapSurvey = (row: any): Survey => ({
  id: row.id,
  title: row.title,
  description: row.description,
  status: row.status,
  createdAt: row.created_at ? new Date(row.created_at) : new Date(),
  updatedAt: row.updated_at ? new Date(row.updated_at) : new Date(),
  startDate: row.start_date ? new Date(row.start_date) : undefined,
  endDate: row.end_date ? new Date(row.end_date) : undefined,
  photoIds: row.photo_ids || [],
  settings: row.settings || {},
  participantCount: row.participant_count ?? 0,
  completedCount: row.completed_count ?? 0,
})

const mapParticipant = (row: any): Participant => ({
  id: row.id,
  userId: row.user_id,
  surveyId: row.survey_id,
  status: row.status,
  photoOrder: row.photo_order || [],
  currentIndex: row.current_index ?? 0,
  completedPhotoIds: row.completed_photo_ids || [],
  skippedPhotoIds: row.skipped_photo_ids || [],
  startedAt: row.started_at ? new Date(row.started_at) : new Date(),
  completedAt: row.completed_at ? new Date(row.completed_at) : undefined,
  lastActiveAt: row.last_active_at ? new Date(row.last_active_at) : new Date(),
  qualityScore: row.quality_score ?? 100,
  isSuspicious: !!row.is_suspicious,
  suspiciousFlags: row.suspicious_flags || [],
  breaksTaken: row.breaks_taken ?? 0,
  totalTimeSeconds: row.total_time_seconds ?? 0,
  attentionCheckResults: row.attention_check_results || [],
})

const mapRating = (row: any): Rating => ({
  id: row.id,
  surveyId: row.survey_id,
  participantId: row.participant_id,
  userId: row.user_id,
  photoId: row.photo_id,
  personId: row.person_id,
  rating: row.rating,
  responseTimeMs: row.response_time_ms,
  isSkipped: !!row.is_skipped,
  editHistory: row.edit_history || [],
  timestamp: row.timestamp ? new Date(row.timestamp) : new Date(),
})

const mapParticipantUpdate = (data: Partial<Participant>) => ({
  status: data.status,
  photo_order: data.photoOrder,
  current_index: data.currentIndex,
  completed_photo_ids: data.completedPhotoIds,
  skipped_photo_ids: data.skippedPhotoIds,
  started_at: data.startedAt ? data.startedAt.toISOString() : undefined,
  completed_at: data.completedAt ? data.completedAt.toISOString() : undefined,
  last_active_at: nowIso(),
  quality_score: data.qualityScore,
  is_suspicious: data.isSuspicious,
  suspicious_flags: data.suspiciousFlags,
  breaks_taken: data.breaksTaken,
  total_time_seconds: data.totalTimeSeconds,
  attention_check_results: data.attentionCheckResults,
})

export const surveyService = {
  async getSurveys(): Promise<Survey[]> {
    const { data, error } = await supabase
      .from('surveys')
      .select('*')
      .order('created_at', { ascending: false })
    if (error) throw new Error(error.message)
    return (data || []).map(mapSurvey)
  },

  async getActiveSurveys(): Promise<Survey[]> {
    const { data, error } = await supabase
      .from('surveys')
      .select('*')
      .eq('status', 'active')
      .order('created_at', { ascending: false })
    if (error) throw new Error(error.message)
    return (data || []).map(mapSurvey)
  },

  async getSurvey(id: string): Promise<Survey | null> {
    const { data, error } = await supabase
      .from('surveys')
      .select('*')
      .eq('id', id)
      .single()
    if (error || !data) return null
    return mapSurvey(data)
  },

  async createSurvey(
    data: Omit<Survey, 'id' | 'createdAt' | 'updatedAt' | 'participantCount' | 'completedCount'>
  ): Promise<string> {
    const { data: inserted, error } = await supabase
      .from('surveys')
      .insert({
        title: data.title,
        description: data.description,
        status: data.status,
        created_at: nowIso(),
        updated_at: nowIso(),
        start_date: data.startDate ? data.startDate.toISOString() : null,
        end_date: data.endDate ? data.endDate.toISOString() : null,
        photo_ids: data.photoIds || [],
        settings: data.settings,
        participant_count: 0,
        completed_count: 0,
      })
      .select('id')
      .single()
    if (error || !inserted) throw new Error(error?.message || 'Failed to create survey')
    return inserted.id
  },

  async updateSurvey(id: string, data: Partial<Survey>): Promise<void> {
    const { error } = await supabase
      .from('surveys')
      .update({
        title: data.title,
        description: data.description,
        status: data.status,
        start_date: data.startDate ? data.startDate.toISOString() : undefined,
        end_date: data.endDate ? data.endDate.toISOString() : undefined,
        photo_ids: data.photoIds,
        settings: data.settings,
        participant_count: data.participantCount,
        completed_count: data.completedCount,
        updated_at: nowIso(),
      })
      .eq('id', id)
    if (error) throw new Error(error.message)
  },

  async deleteSurvey(id: string): Promise<void> {
    const { error } = await supabase
      .from('surveys')
      .delete()
      .eq('id', id)
    if (error) throw new Error(error.message)
  },

  async getOrCreateParticipant(surveyId: string, userId: string): Promise<Participant> {
    const { data: existing, error } = await supabase
      .from('participants')
      .select('*')
      .eq('survey_id', surveyId)
      .eq('user_id', userId)
      .limit(1)
      .maybeSingle()
    if (error) throw new Error(error.message)
    if (existing) return mapParticipant(existing)

    const survey = await surveyService.getSurvey(surveyId)
    if (!survey) throw new Error('Survey not found')
    let photoOrder = [...survey.photoIds]
    if (survey.settings.randomizeOrder) {
      photoOrder = photoOrder.sort(() => Math.random() - 0.5)
    }

    const { data: inserted, error: insertError } = await supabase
      .from('participants')
      .insert({
        user_id: userId,
        survey_id: surveyId,
        status: 'in-progress',
        photo_order: photoOrder,
        current_index: 0,
        completed_photo_ids: [],
        skipped_photo_ids: [],
        started_at: nowIso(),
        last_active_at: nowIso(),
        quality_score: 100,
        is_suspicious: false,
        suspicious_flags: [],
        breaks_taken: 0,
        total_time_seconds: 0,
        attention_check_results: [],
      })
      .select('*')
      .single()
    if (insertError || !inserted) throw new Error(insertError?.message || 'Failed to create participant')

    await supabase
      .from('surveys')
      .update({ participant_count: (survey.participantCount || 0) + 1 })
      .eq('id', surveyId)

    return mapParticipant(inserted)
  },

  async updateParticipant(id: string, data: Partial<Participant>): Promise<void> {
    const payload = mapParticipantUpdate(data)
    const { error } = await supabase
      .from('participants')
      .update(payload)
      .eq('id', id)
    if (error) throw new Error(error.message)
  },

  async getParticipants(surveyId: string): Promise<Participant[]> {
    const { data, error } = await supabase
      .from('participants')
      .select('*')
      .eq('survey_id', surveyId)
      .order('started_at', { ascending: false })
    if (error) throw new Error(error.message)
    return (data || []).map(mapParticipant)
  },

  async submitRating(data: Omit<Rating, 'id' | 'timestamp'>): Promise<string> {
    const { data: existing, error } = await supabase
      .from('ratings')
      .select('*')
      .eq('participant_id', data.participantId)
      .eq('photo_id', data.photoId)
      .limit(1)
      .maybeSingle()
    if (error) throw new Error(error.message)

    if (existing && !data.isSkipped) {
      const editHistory = existing.edit_history || []
      editHistory.push({
        previousRating: existing.rating,
        newRating: data.rating,
        editedAt: new Date(),
      })
      const { error: updateError } = await supabase
        .from('ratings')
        .update({ rating: data.rating, edit_history: editHistory })
        .eq('id', existing.id)
      if (updateError) throw new Error(updateError.message)
      return existing.id
    }

    const { data: inserted, error: insertError } = await supabase
      .from('ratings')
      .insert({
        survey_id: data.surveyId,
        participant_id: data.participantId,
        user_id: data.userId,
        photo_id: data.photoId,
        person_id: data.personId,
        rating: data.rating,
        response_time_ms: data.responseTimeMs,
        is_skipped: data.isSkipped,
        edit_history: [],
        timestamp: nowIso(),
      })
      .select('id')
      .single()
    if (insertError || !inserted) throw new Error(insertError?.message || 'Failed to submit rating')
    return inserted.id
  },

  async getRatings(surveyId: string): Promise<Rating[]> {
    const { data, error } = await supabase
      .from('ratings')
      .select('*')
      .eq('survey_id', surveyId)
    if (error) throw new Error(error.message)
    return (data || []).map(mapRating)
  },

  async getUserRatings(participantId: string): Promise<Rating[]> {
    const { data, error } = await supabase
      .from('ratings')
      .select('*')
      .eq('participant_id', participantId)
    if (error) throw new Error(error.message)
    return (data || []).map(mapRating)
  },

  async getSurveyAnalytics(surveyId: string): Promise<SurveyAnalytics> {
    const [participants, ratings] = await Promise.all([
      surveyService.getParticipants(surveyId),
      surveyService.getRatings(surveyId),
    ])
    const completed = participants.filter(p => p.status === 'completed')
    const active = participants.filter(p => p.status === 'in-progress')
    const suspicious = participants.filter(p => p.isSuspicious)
    const nonSkipped = ratings.filter(r => !r.isSkipped)
    const totalRating = nonSkipped.reduce((sum, r) => sum + r.rating, 0)
    const avgRating = nonSkipped.length > 0 ? totalRating / nonSkipped.length : 0
    const ratingDistribution: Record<number, number> = {}
    nonSkipped.forEach(r => {
      ratingDistribution[r.rating] = (ratingDistribution[r.rating] || 0) + 1
    })
    return {
      surveyId,
      totalParticipants: participants.length,
      completedParticipants: completed.length,
      activeParticipants: active.length,
      suspiciousParticipants: suspicious.length,
      dropoutRate: participants.length > 0
        ? ((participants.length - completed.length) / participants.length) * 100
        : 0,
      averageCompletionTimeMinutes: 0,
      averageRating: avgRating,
      totalPhotos: 0,
      ratingDistribution,
      genderBreakdown: {},
      ageGroupBreakdown: {},
      countryBreakdown: {},
      photoStats: [],
    }
  },

  subscribeToSurvey(surveyId: string, cb: (survey: Survey) => void) {
    const channel = supabase
      .channel(`survey:${surveyId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'surveys',
        filter: `id=eq.${surveyId}`,
      }, (payload) => {
        if (payload.new) cb(mapSurvey(payload.new))
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  },
}
