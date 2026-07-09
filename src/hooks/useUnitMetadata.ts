import { useEffect, useState } from 'react'
import type { Unit } from '../types/unit'
import {
  type UnitMetadata,
  type UnitMetadataByUnitKey,
  type UnitMetadataTag,
  unitMetadataTagPresets,
} from '../types/unitMetadata'

const UNIT_METADATA_STORAGE_KEY = 'crusader-archive-unit-metadata'
const UNIT_METADATA_UPDATED_EVENT = 'crusader-archive-unit-metadata-updated'

const emptyMetadata: UnitMetadata = {
  note: '',
  tags: [],
}

interface UseUnitMetadataResult {
  metadata: UnitMetadata
  metadataByUnitKey: UnitMetadataByUnitKey
  getMetadataForKey: (selectedUnitKey: string) => UnitMetadata
  saveMetadataForKey: (
    selectedUnitKey: string,
    metadata: UnitMetadata,
  ) => void
  saveNote: (note: string) => void
  clearNote: () => void
  toggleTag: (tag: UnitMetadataTag) => void
}

function isUnitMetadataTag(value: unknown): value is UnitMetadataTag {
  return (
    typeof value === 'string' &&
    unitMetadataTagPresets.includes(value as UnitMetadataTag)
  )
}

function parseUnitMetadata(value: unknown): UnitMetadata | null {
  if (typeof value !== 'object' || value === null) {
    return null
  }

  const metadata = value as Record<string, unknown>
  const tags = Array.isArray(metadata.tags)
    ? metadata.tags.filter(isUnitMetadataTag)
    : []

  return {
    note: typeof metadata.note === 'string' ? metadata.note : '',
    tags,
    updatedAt:
      typeof metadata.updatedAt === 'string' ? metadata.updatedAt : undefined,
  }
}

function hasSavedMetadata(metadata: UnitMetadata): boolean {
  return metadata.note.trim().length > 0 || metadata.tags.length > 0
}

function readUnitMetadata(): UnitMetadataByUnitKey {
  try {
    const storedMetadata = localStorage.getItem(UNIT_METADATA_STORAGE_KEY)

    if (!storedMetadata) {
      return {}
    }

    const parsedMetadata: unknown = JSON.parse(storedMetadata)

    if (typeof parsedMetadata !== 'object' || parsedMetadata === null) {
      return {}
    }

    return Object.entries(parsedMetadata).reduce<UnitMetadataByUnitKey>(
      (metadataByUnitKey, [unitKey, metadataValue]) => {
        const metadata = parseUnitMetadata(metadataValue)

        if (metadata && hasSavedMetadata(metadata)) {
          metadataByUnitKey[unitKey] = metadata
        }

        return metadataByUnitKey
      },
      {},
    )
  } catch {
    return {}
  }
}

function saveUnitMetadata(metadataByUnitKey: UnitMetadataByUnitKey): void {
  localStorage.setItem(
    UNIT_METADATA_STORAGE_KEY,
    JSON.stringify(metadataByUnitKey),
  )
  window.dispatchEvent(new Event(UNIT_METADATA_UPDATED_EVENT))
}

export function getUnitMetadataKey(unit: Pick<Unit, 'id' | 'name'>): string {
  return unit.id ?? unit.name
}

export function getEmptyUnitMetadata(): UnitMetadata {
  return emptyMetadata
}

export function useUnitMetadata(unitKey?: string): UseUnitMetadataResult {
  const [metadataByUnitKey, setMetadataByUnitKey] =
    useState<UnitMetadataByUnitKey>(readUnitMetadata)

  useEffect(() => {
    function refreshMetadata() {
      setMetadataByUnitKey(readUnitMetadata())
    }

    window.addEventListener('storage', refreshMetadata)
    window.addEventListener(UNIT_METADATA_UPDATED_EVENT, refreshMetadata)

    return () => {
      window.removeEventListener('storage', refreshMetadata)
      window.removeEventListener(UNIT_METADATA_UPDATED_EVENT, refreshMetadata)
    }
  }, [])

  function getMetadataForKey(selectedUnitKey: string): UnitMetadata {
    return metadataByUnitKey[selectedUnitKey] ?? emptyMetadata
  }

  function saveMetadataForKey(
    selectedUnitKey: string,
    metadata: UnitMetadata,
  ): void {
    const cleanMetadata: UnitMetadata = {
      note: metadata.note,
      tags: metadata.tags.filter(isUnitMetadataTag),
      updatedAt: new Date().toISOString(),
    }
    const currentMetadata = readUnitMetadata()

    if (hasSavedMetadata(cleanMetadata)) {
      currentMetadata[selectedUnitKey] = cleanMetadata
    } else {
      delete currentMetadata[selectedUnitKey]
    }

    saveUnitMetadata(currentMetadata)
  }

  function saveNote(note: string): void {
    if (!unitKey) {
      return
    }

    saveMetadataForKey(unitKey, {
      ...getMetadataForKey(unitKey),
      note,
    })
  }

  function clearNote(): void {
    saveNote('')
  }

  function toggleTag(tag: UnitMetadataTag): void {
    if (!unitKey) {
      return
    }

    const currentMetadata = getMetadataForKey(unitKey)
    const tags = currentMetadata.tags.includes(tag)
      ? currentMetadata.tags.filter((currentTag) => currentTag !== tag)
      : [...currentMetadata.tags, tag]

    saveMetadataForKey(unitKey, {
      ...currentMetadata,
      tags,
    })
  }

  return {
    metadata: unitKey ? getMetadataForKey(unitKey) : emptyMetadata,
    metadataByUnitKey,
    getMetadataForKey,
    saveMetadataForKey,
    saveNote,
    clearNote,
    toggleTag,
  }
}
