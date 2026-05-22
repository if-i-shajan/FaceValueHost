import { useEffect, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Upload, Plus, Grid, AlertTriangle, CheckCircle, XCircle, RefreshCw, Trash2, Search } from 'lucide-react'
import { useDropzone } from 'react-dropzone'
import { surveyService } from '../../services/survey.service'
import { photoService, resolvePhotoUrl } from '../../services/photo.service'
import { Survey, Person, Photo } from '../../types'
import toast from 'react-hot-toast'
import clsx from 'clsx'

function PhotoSlotCard({
  person,
  photos,
  photosPerPerson,
  onUpload,
  onDelete,
  onApprove,
}: {
  person: Person
  photos: Photo[]
  photosPerPerson: number
  onUpload: (personId: string, slotIndex: number, file: File) => void
  onDelete: (photoId: string) => void
  onApprove: (photoId: string) => void
}) {
  const getSlotPhoto = (idx: number) =>
    photos.find(p => p.personId === person.id && p.slotIndex === idx)

  const onDrop = useCallback((files: File[], slotIdx: number) => {
    if (files[0]) onUpload(person.id, slotIdx, files[0])
  }, [person.id, onUpload])

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="card"
    >
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-semibold text-surface-100 font-mono text-sm">{person.personCode}</h3>
          <p className="text-xs text-surface-500">
            {photos.filter(p => p.personId === person.id).length}/{photosPerPerson} slots filled
          </p>
        </div>
        <div className="w-8 h-8 rounded-lg bg-surface-800 flex items-center justify-center">
          <span className="text-xs font-bold text-brand-400">
            {Math.round(person.completionPercentage)}%
          </span>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2">
        {Array.from({ length: photosPerPerson }, (_, i) => {
          const photo = getSlotPhoto(i)
          return (
            <SlotDropzone
              key={i}
              slotIndex={i}
              photo={photo}
              onDrop={(files) => onDrop(files, i)}
              onDelete={() => photo && onDelete(photo.id)}
              onApprove={() => photo && onApprove(photo.id)}
            />
          )
        })}
      </div>
    </motion.div>
  )
}

function SlotDropzone({
  slotIndex,
  photo,
  onDrop,
  onDelete,
  onApprove,
}: {
  slotIndex: number
  photo?: Photo
  onDrop: (files: File[]) => void
  onDelete: () => void
  onApprove: () => void
}) {
  const processedUrl = photo ? resolvePhotoUrl(photo.processedUrl) : ''
  const originalUrl = photo ? resolvePhotoUrl(photo.originalUrl) : ''
  const displayUrl = processedUrl || originalUrl
  const fallbackUrl = originalUrl
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': ['.jpg', '.jpeg', '.png', '.webp'] },
    multiple: false,
    noClick: !!photo,
  })

  const statusIcon = photo
    ? photo.status === 'approved'
      ? <CheckCircle className="w-3 h-3 text-emerald-400" />
      : photo.status === 'rejected'
        ? <XCircle className="w-3 h-3 text-red-400" />
        : <RefreshCw className="w-3 h-3 text-amber-400 animate-spin" />
    : null

  return (
    <div
      {...getRootProps()}
      className={clsx(
        'relative aspect-square rounded-xl border-2 overflow-hidden transition-all duration-200',
        photo
          ? photo.status === 'approved'
            ? 'border-emerald-500/40 border-solid'
            : photo.status === 'rejected'
              ? 'border-red-500/40 border-solid'
              : 'border-amber-500/40 border-solid border-dashed'
          : isDragActive
            ? 'border-brand-400 bg-brand-500/10 border-solid'
            : 'border-surface-700 border-dashed bg-surface-800/50 hover:border-brand-500/50 cursor-pointer'
      )}
    >
      <input {...getInputProps()} />

      {photo && displayUrl ? (
        <>
          <img
            src={displayUrl}
            alt={`Slot ${slotIndex + 1}`}
            className="w-full h-full object-cover"
            onError={(e) => {
              const img = e.currentTarget
              if (fallbackUrl && img.dataset.fallback !== '1' && img.src !== fallbackUrl) {
                img.dataset.fallback = '1'
                img.src = fallbackUrl
              }
            }}
          />
          {/* Overlay */}
          <div className="absolute inset-0 bg-black/0 hover:bg-black/50 transition-all flex items-center justify-center gap-1 opacity-0 hover:opacity-100">
            {photo.status === 'rejected' && (
              <button onClick={onApprove}
                className="p-1 rounded-lg bg-emerald-500/80 hover:bg-emerald-500 transition-all"
                title="Approve">
                <CheckCircle className="w-3.5 h-3.5 text-white" />
              </button>
            )}
            <button onClick={onDelete}
              className="p-1 rounded-lg bg-red-500/80 hover:bg-red-500 transition-all"
              title="Delete">
              <Trash2 className="w-3.5 h-3.5 text-white" />
            </button>
          </div>
          {/* Status badge */}
          <div className="absolute top-1 right-1 bg-surface-900/80 rounded p-0.5">
            {statusIcon}
          </div>
          <div className="absolute bottom-1 left-1 bg-surface-900/80 rounded px-1">
            <span className="text-xs text-surface-400">{slotIndex + 1}</span>
          </div>
        </>
      ) : (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-1">
          <Plus className="w-5 h-5 text-surface-600" />
          <span className="text-xs text-surface-600">{slotIndex + 1}</span>
        </div>
      )}
    </div>
  )
}

export default function AdminPhotoManager() {
  const [surveys, setSurveys] = useState<Survey[]>([])
  const [selectedSurvey, setSelectedSurvey] = useState<string>('')
  const [persons, setPersons] = useState<Person[]>([])
  const [photos, setPhotos] = useState<Photo[]>([])
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState<Record<string, number>>({})
  const [search, setSearch] = useState('')
  const [photosPerPerson, setPhotosPerPerson] = useState(3)

  useEffect(() => {
    surveyService.getSurveys().then(setSurveys)
  }, [])

  useEffect(() => {
    if (!selectedSurvey) return
    setLoading(true)
    Promise.all([
      photoService.getPersons(selectedSurvey),
      photoService.getPhotos(selectedSurvey),
    ]).then(([p, ph]) => {
      setPersons(p)
      setPhotos(ph)
      setLoading(false)
    })
  }, [selectedSurvey])

  const handleAddPerson = async () => {
    if (!selectedSurvey) return
    await photoService.createPerson(selectedSurvey, photosPerPerson)
    const p = await photoService.getPersons(selectedSurvey)
    setPersons(p)
    toast.success('Person slot added')
  }

  const handleUpload = async (personId: string, slotIndex: number, file: File) => {
    const key = `${personId}-${slotIndex}`
    setUploading(u => ({ ...u, [key]: 0 }))
    try {
      await photoService.uploadPhoto(file, selectedSurvey, personId, slotIndex, (p) => {
        setUploading(u => ({ ...u, [key]: p }))
      })
      const [p, ph] = await Promise.all([
        photoService.getPersons(selectedSurvey),
        photoService.getPhotos(selectedSurvey),
      ])
      setPersons(p)
      setPhotos(ph)
      toast.success('Photo uploaded & queued for AI processing')
    } catch {
      toast.error('Upload failed')
    } finally {
      setUploading(u => { const n = { ...u }; delete n[key]; return n })
    }
  }

  const handleBulkUpload = async (files: File[]) => {
    if (!selectedSurvey) {
      toast.error('Please select a survey first')
      return
    }

    try {
      let currentPersons = [...persons]
      let personIdx = 0
      let slotIdx = 0
      let uploadedCount = 0
      let failedCount = 0

      for (const file of files) {
        try {
          // Check if we need a new person
          if (slotIdx >= photosPerPerson) {
            slotIdx = 0
            personIdx++
          }

          // Create person if needed
          if (personIdx >= currentPersons.length) {
            const newPersonId = await photoService.createPerson(selectedSurvey, photosPerPerson)
            const updated = await photoService.getPersons(selectedSurvey)
            currentPersons = updated
            setPersons(updated)
            toast.success(`Created new person: ${updated[updated.length - 1]?.personCode}`)
          }

          const person = currentPersons[personIdx]
          if (!person) {
            failedCount++
            continue
          }

          // Upload the photo
          await handleUpload(person.id, slotIdx, file)
          uploadedCount++
          slotIdx++
        } catch (err) {
          console.error('Failed to upload file:', err)
          failedCount++
        }
      }

      // Refresh data
      const [updatedPersons, updatedPhotos] = await Promise.all([
        photoService.getPersons(selectedSurvey),
        photoService.getPhotos(selectedSurvey),
      ])
      setPersons(updatedPersons)
      setPhotos(updatedPhotos)

      if (uploadedCount > 0) {
        toast.success(`Uploaded ${uploadedCount} photo${uploadedCount !== 1 ? 's' : ''}${failedCount > 0 ? ` (${failedCount} failed)` : ''}`)
      } else if (failedCount > 0) {
        toast.error(`Failed to upload ${failedCount} photo${failedCount !== 1 ? 's' : ''}`)
      }
    } catch (err) {
      console.error('Bulk upload error:', err)
      toast.error('Bulk upload failed')
    }
  }

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: (files) => handleBulkUpload(files),
    accept: { 'image/*': ['.jpg', '.jpeg', '.png', '.webp'] },
    multiple: true,
    noClick: false,
  })

  const filteredPersons = persons.filter(p =>
    p.personCode.toLowerCase().includes(search.toLowerCase())
  )

  const pendingCount = photos.filter(p => p.status === 'pending' || p.status === 'processing').length
  const rejectedCount = photos.filter(p => p.status === 'rejected').length
  const approvedCount = photos.filter(p => p.status === 'approved').length

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-surface-100">Photo Manager</h1>
          <p className="text-surface-500 text-sm">Upload and manage face photos by person and slot</p>
        </div>
        <div className="flex gap-3">
          <select value={selectedSurvey} onChange={e => setSelectedSurvey(e.target.value)}
            className="input-field w-48">
            <option value="">Select survey...</option>
            {surveys.map(s => <option key={s.id} value={s.id}>{s.title}</option>)}
          </select>
        </div>
      </div>

      {selectedSurvey && (
        <>
          {/* Stats */}
          <div className="grid grid-cols-3 gap-4">
            {[
              { label: 'Approved', value: approvedCount, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
              { label: 'Processing', value: pendingCount, color: 'text-amber-400', bg: 'bg-amber-500/10' },
              { label: 'Rejected', value: rejectedCount, color: 'text-red-400', bg: 'bg-red-500/10' },
            ].map(stat => (
              <div key={stat.label} className={`stat-card ${stat.bg}`}>
                <p className={`text-2xl font-bold font-display ${stat.color}`}>{stat.value}</p>
                <p className="text-xs text-surface-500">{stat.label}</p>
              </div>
            ))}
          </div>

          {/* Bulk upload zone */}
          <div {...getRootProps()}
            className={clsx(
              'border-2 border-dashed rounded-2xl p-8 text-center transition-all cursor-pointer',
              isDragActive ? 'border-brand-400 bg-brand-500/10' : 'border-surface-700 hover:border-surface-600'
            )}>
            <input {...getInputProps()} />
            <Upload className="w-8 h-8 text-surface-500 mx-auto mb-3" />
            <p className="text-surface-300 font-medium">Drag & drop photos here</p>
            <p className="text-sm text-surface-500 mt-1">Auto-assigns to person slots. JPG, PNG, WEBP supported.</p>
          </div>

          {/* Controls */}
          <div className="flex items-center gap-4 flex-wrap">
            <div className="relative flex-1 min-w-48">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-500" />
              <input value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Search by person code..." className="input-field pl-10" />
            </div>
            <div className="flex items-center gap-2">
              <label className="text-sm text-surface-400">Slots/person:</label>
              <select value={photosPerPerson} onChange={e => setPhotosPerPerson(parseInt(e.target.value))}
                className="input-field w-20">
                {[1, 3, 5, 7, 10].map(n => <option key={n} value={n}>{n}</option>)}
              </select>
            </div>
            <button onClick={handleAddPerson} className="btn-secondary flex items-center gap-2 text-sm">
              <Plus className="w-4 h-4" /> Add Person
            </button>
          </div>

          {/* Person grid */}
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3, 4, 5, 6].map(i => <div key={i} className="card h-48 animate-pulse" />)}
            </div>
          ) : filteredPersons.length === 0 ? (
            <div className="card text-center py-12">
              <Grid className="w-12 h-12 text-surface-700 mx-auto mb-3" />
              <p className="text-surface-400">No persons yet. Add a person or upload photos to get started.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredPersons.map(person => (
                <PhotoSlotCard
                  key={person.id}
                  person={person}
                  photos={photos}
                  photosPerPerson={photosPerPerson}
                  onUpload={handleUpload}
                  onDelete={async (photoId) => {
                    try {
                      await photoService.deletePhoto(photoId)
                      // Refresh both persons and photos to update counts
                      const [updatedPersons, updatedPhotos] = await Promise.all([
                        photoService.getPersons(selectedSurvey),
                        photoService.getPhotos(selectedSurvey),
                      ])
                      setPersons(updatedPersons)
                      setPhotos(updatedPhotos)
                      toast.success('Photo deleted successfully')
                    } catch (err) {
                      console.error('Delete failed:', err)
                      toast.error('Failed to delete photo')
                    }
                  }}
                  onApprove={async (photoId) => {
                    try {
                      await photoService.approvePhoto(photoId)
                      const updatedPhotos = await photoService.getPhotos(selectedSurvey)
                      setPhotos(updatedPhotos)
                      toast.success('Photo approved')
                    } catch (err) {
                      console.error('Approval failed:', err)
                      toast.error('Failed to approve photo')
                    }
                  }}
                />
              ))}
            </div>
          )}
        </>
      )}

      {!selectedSurvey && (
        <div className="card text-center py-16">
          <Grid className="w-14 h-14 text-surface-700 mx-auto mb-4" />
          <p className="text-surface-400 font-medium">Select a survey to manage photos</p>
        </div>
      )}
    </div>
  )
}
