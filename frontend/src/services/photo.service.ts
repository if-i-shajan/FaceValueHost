import { Photo, Person, PhotoSlot } from '../types'
import axios from 'axios'
import { supabase } from './supabase'

const AI_API_URL = import.meta.env.VITE_AI_API_URL || 'http://localhost:8000'
const UPLOAD_MODE = import.meta.env.VITE_UPLOAD_MODE || 'supabase'
const SUPABASE_BUCKET = import.meta.env.VITE_SUPABASE_STORAGE_BUCKET || 'photos'
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL

const toPublicUrl = (path: string) => `${SUPABASE_URL}/storage/v1/object/public/${SUPABASE_BUCKET}/${path}`

const mapPhoto = (row: any): Photo => ({
  id: row.id,
  surveyId: row.survey_id,
  personId: row.person_id,
  slotIndex: row.slot_index,
  originalUrl: row.original_url || '',
  processedUrl: row.processed_url || '',
  thumbnailUrl: row.thumbnail_url || '',
  status: row.status,
  aiValidation: row.ai_validation || {
    hasFace: false,
    faceCount: 0,
    isBlurry: false,
    isLowResolution: false,
    confidence: 0,
    warnings: [],
  },
  metadata: row.metadata || {
    originalFilename: '',
    width: 0,
    height: 0,
    fileSize: 0,
    format: '',
  },
  createdAt: row.created_at ? new Date(row.created_at) : new Date(),
})

const mapPerson = (row: any): Person => ({
  id: row.id,
  surveyId: row.survey_id,
  personCode: row.person_code,
  photoSlots: row.photo_slots || [],
  completionPercentage: row.completion_percentage ?? 0,
  createdAt: row.created_at ? new Date(row.created_at) : new Date(),
})

// Helper to construct proper image URLs
export const resolvePhotoUrl = (photoUrl: string): string => {
  if (!photoUrl) return ''
  if (photoUrl.includes('mock-storage.example.com')) return ''
  if (photoUrl.startsWith('http')) return photoUrl
  if (photoUrl.startsWith('//')) return `https:${photoUrl}`
  const normalizedPath = photoUrl.startsWith('/') ? photoUrl : `/${photoUrl}`
  return `${AI_API_URL}${normalizedPath}`
}

export const photoService = {
  // ─── Person Management ─────────────────────────────────────
  async getPersons(surveyId: string): Promise<Person[]> {
    const { data, error } = await supabase
      .from('persons')
      .select('*')
      .eq('survey_id', surveyId)
      .order('person_code')
    if (error) throw new Error(error.message)
    return (data || []).map(mapPerson)
  },

  async createPerson(surveyId: string, photoCount: number): Promise<string> {
    const persons = await photoService.getPersons(surveyId)
    const nextNum = persons.length + 1
    const personCode = `P${String(nextNum).padStart(3, '0')}`
    const slots: PhotoSlot[] = Array.from({ length: photoCount }, (_, i) => ({
      index: i,
      isEmpty: true,
    }))
    const { data, error } = await supabase
      .from('persons')
      .insert({
        survey_id: surveyId,
        person_code: personCode,
        photo_slots: slots,
        completion_percentage: 0,
        created_at: new Date().toISOString(),
      })
      .select('id')
      .single()
    if (error || !data) throw new Error(error?.message || 'Failed to create person')
    return data.id
  },

  // ─── Photo Upload ──────────────────────────────────────────
  async uploadPhoto(
    file: File,
    surveyId: string,
    personId: string,
    slotIndex: number,
    onProgress?: (p: number) => void
  ): Promise<Photo> {
    const ext = file.name.split('.').pop()
    const photoId = `${surveyId}_${personId}_slot${slotIndex}_${Date.now()}`

    let originalUrl = ''

    if (UPLOAD_MODE === 'backend') {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('photoId', photoId)
      formData.append('surveyId', surveyId)

      const uploadResponse = await axios.post(`${AI_API_URL}/api/upload-photo`, formData, {
        onUploadProgress: (event) => {
          if (event.total) {
            const progress = Math.round((event.loaded / event.total) * 100)
            onProgress?.(progress)
          }
        },
      })

      originalUrl = uploadResponse.data.photoUrl
    } else {
      const storagePath = `surveys/${surveyId}/originals/${photoId}.${ext || 'jpg'}`
      const { error } = await supabase.storage
        .from(SUPABASE_BUCKET)
        .upload(storagePath, file, {
          contentType: file.type || 'image/jpeg',
          upsert: true,
        })
      if (error) throw new Error(error.message)
      originalUrl = toPublicUrl(storagePath)
      onProgress?.(100)
    }
    const photoData = {
      survey_id: surveyId,
      person_id: personId,
      slot_index: slotIndex,
      originalUrl,
      processedUrl: '',
      thumbnailUrl: '',
      status: 'pending' as const,
      aiValidation: {
        hasFace: false, faceCount: 0, isBlurry: false,
        isLowResolution: false, confidence: 0, warnings: [],
      },
      metadata: {
        originalFilename: file.name,
        width: 0, height: 0,
        fileSize: file.size,
        format: ext || 'unknown',
      },
      created_at: new Date().toISOString(),
    }
    const { data: inserted, error } = await supabase
      .from('photos')
      .insert({
        survey_id: photoData.survey_id,
        person_id: photoData.person_id,
        slot_index: photoData.slot_index,
        original_url: originalUrl,
        processed_url: '',
        thumbnail_url: '',
        status: 'pending',
        ai_validation: photoData.aiValidation,
        metadata: photoData.metadata,
        created_at: photoData.created_at,
      })
      .select('*')
      .single()
    if (error || !inserted) throw new Error(error?.message || 'Failed to create photo')
    // Trigger AI processing only when backend is available
    if (AI_API_URL) {
      photoService.triggerAIProcessing(inserted.id, originalUrl, surveyId, personId, slotIndex).catch(console.error)
    }
    return mapPhoto(inserted)
  },

  async triggerAIProcessing(
    photoId: string, imageUrl: string, surveyId: string, personId: string, slotIndex: number
  ): Promise<void> {
    try {
      await supabase.from('photos').update({ status: 'processing' }).eq('id', photoId)

      // Convert relative URL to absolute if needed
      let absoluteUrl = imageUrl
      if (!imageUrl.startsWith('http')) {
        const normalizedPath = imageUrl.startsWith('/') ? imageUrl : `/${imageUrl}`
        absoluteUrl = `${AI_API_URL}${normalizedPath}`
      }

      const res = await axios.post(`${AI_API_URL}/api/process-photo`, {
        photoId, imageUrl: absoluteUrl, surveyId, personId, slotIndex
      })
      const { processedUrl, thumbnailUrl, validation, metadata } = res.data
      await supabase
        .from('photos')
        .update({
          processed_url: processedUrl,
          thumbnail_url: thumbnailUrl,
          status: validation.hasFace && validation.faceCount === 1 ? 'approved' : 'rejected',
          ai_validation: validation,
          metadata: { ...metadata },
        })
        .eq('id', photoId)
      // Update person slot
      const { data: personRow } = await supabase
        .from('persons')
        .select('*')
        .eq('id', personId)
        .single()
      if (personRow) {
        const slots = (personRow.photo_slots || []).map((s: PhotoSlot) =>
          s.index === slotIndex ? { ...s, photoId, isEmpty: false } : s
        )
        const filled = slots.filter((s: PhotoSlot) => !s.isEmpty).length
        await supabase
          .from('persons')
          .update({
            photo_slots: slots,
            completion_percentage: Math.round((filled / slots.length) * 100),
          })
          .eq('id', personId)
      }
    } catch (err) {
      await supabase.from('photos').update({ status: 'rejected' }).eq('id', photoId)
    }
  },

  async getPhotos(surveyId: string): Promise<Photo[]> {
    const { data, error } = await supabase
      .from('photos')
      .select('*')
      .eq('survey_id', surveyId)
      .order('created_at')
    if (error) throw new Error(error.message)
    return (data || []).map(mapPhoto)
  },

  async getPendingReview(surveyId: string): Promise<Photo[]> {
    const { data, error } = await supabase
      .from('photos')
      .select('*')
      .eq('survey_id', surveyId)
      .in('status', ['rejected', 'pending'])
    if (error) throw new Error(error.message)
    return (data || []).map(mapPhoto)
  },

  async approvePhoto(photoId: string): Promise<void> {
    const { error } = await supabase
      .from('photos')
      .update({ status: 'approved' })
      .eq('id', photoId)
    if (error) throw new Error(error.message)
  },

  async deletePhoto(photoId: string): Promise<void> {
    const { data: photoRow } = await supabase
      .from('photos')
      .select('*')
      .eq('id', photoId)
      .single()
    if (!photoRow) return

    try {
      await axios.delete(`${AI_API_URL}/api/delete-photo/${photoId}`)
    } catch { }

    await supabase.from('photos').delete().eq('id', photoId)
  },

  async swapPhotoSlots(
    personAId: string, slotA: number,
    personBId: string, slotB: number
  ): Promise<void> {
    const [personARes, personBRes] = await Promise.all([
      supabase.from('persons').select('*').eq('id', personAId).single(),
      supabase.from('persons').select('*').eq('id', personBId).single(),
    ])
    if (!personARes.data || !personBRes.data) throw new Error('Person not found')
    const personA = mapPerson(personARes.data)
    const personB = mapPerson(personBRes.data)
    const slotAData = personA.photoSlots.find(s => s.index === slotA)
    const slotBData = personB.photoSlots.find(s => s.index === slotB)
    const newSlotsA = personA.photoSlots.map(s =>
      s.index === slotA ? { ...s, photoId: slotBData?.photoId, isEmpty: !slotBData?.photoId } : s
    )
    const newSlotsB = personB.photoSlots.map(s =>
      s.index === slotB ? { ...s, photoId: slotAData?.photoId, isEmpty: !slotAData?.photoId } : s
    )
    await Promise.all([
      supabase.from('persons').update({ photo_slots: newSlotsA }).eq('id', personAId),
      supabase.from('persons').update({ photo_slots: newSlotsB }).eq('id', personBId),
    ])
  },

  // ─── AI Face Analysis ──────────────────────────────────────
  async findSimilarFaces(photoId: string, surveyId: string): Promise<Photo[]> {
    const res = await axios.post(`${AI_API_URL}/api/find-similar`, { photoId, surveyId })
    return res.data.similar
  },

  async detectDuplicates(surveyId: string): Promise<{ pairs: [string, string][], confidence: number[] }> {
    const res = await axios.post(`${AI_API_URL}/api/detect-duplicates`, { surveyId })
    return res.data
  },
}
