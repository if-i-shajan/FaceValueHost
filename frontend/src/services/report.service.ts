import { surveyService } from './survey.service'
import { photoService } from './photo.service'
import { Rating, PhotoStats } from '../types'

function computeStats(ratings: number[]): Omit<PhotoStats, 'photoId' | 'personId' | 'ratingCount' | 'skipCount'> {
  if (ratings.length === 0) return { averageRating: 0, medianRating: 0, modeRating: 0, variance: 0, stdDeviation: 0, minRating: 0, maxRating: 0 }
  const sorted = [...ratings].sort((a, b) => a - b)
  const avg = ratings.reduce((s, r) => s + r, 0) / ratings.length
  const median = sorted.length % 2 === 0
    ? (sorted[sorted.length / 2 - 1] + sorted[sorted.length / 2]) / 2
    : sorted[Math.floor(sorted.length / 2)]
  const freq: Record<number, number> = {}
  ratings.forEach(r => freq[r] = (freq[r] || 0) + 1)
  const mode = parseInt(Object.entries(freq).sort((a, b) => b[1] - a[1])[0][0])
  const variance = ratings.reduce((s, r) => s + Math.pow(r - avg, 2), 0) / ratings.length
  return {
    averageRating: Math.round(avg * 100) / 100,
    medianRating: median,
    modeRating: mode,
    variance: Math.round(variance * 100) / 100,
    stdDeviation: Math.round(Math.sqrt(variance) * 100) / 100,
    minRating: sorted[0],
    maxRating: sorted[sorted.length - 1],
  }
}

export const reportService = {
  async exportCSV(surveyId: string): Promise<string> {
    const [ratings, photos] = await Promise.all([
      surveyService.getRatings(surveyId),
      photoService.getPhotos(surveyId),
    ])
    const photoMap = new Map(photos.map(p => [p.id, p]))
    const participantIds = [...new Set(ratings.map(r => r.participantId))]
    const photoIds = [...new Set(photos.map(p => p.id))]
    const ratingMap: Record<string, Record<string, number | string>> = {}
    ratings.forEach(r => {
      if (!ratingMap[r.photoId]) ratingMap[r.photoId] = {}
      ratingMap[r.photoId][r.participantId] = r.isSkipped ? 'SKIP' : r.rating
    })
    const headers = ['Photo ID', 'Person ID', 'Average', 'Median', 'Mode', 'Std Dev', 'Min', 'Max', 'Count', ...participantIds]
    const rows: string[][] = [headers]
    photoIds.forEach(photoId => {
      const photo = photoMap.get(photoId)
      const photoRatings = ratings.filter(r => r.photoId === photoId && !r.isSkipped).map(r => r.rating)
      const stats = computeStats(photoRatings)
      const row: string[] = [
        photoId,
        photo?.personId || '',
        String(stats.averageRating),
        String(stats.medianRating),
        String(stats.modeRating),
        String(stats.stdDeviation),
        String(stats.minRating),
        String(stats.maxRating),
        String(photoRatings.length),
        ...participantIds.map(pid => String(ratingMap[photoId]?.[pid] ?? '')),
      ]
      rows.push(row)
    })
    return rows.map(r => r.join(',')).join('\n')
  },

  downloadCSV(content: string, filename: string): void {
    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    link.click()
    URL.revokeObjectURL(url)
  },
}
