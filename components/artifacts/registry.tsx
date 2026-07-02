import type { ComponentType } from 'react'
import { ThirteenFReport } from '@/components/thirteen-f-report'
import type { ArtifactChrome } from '@/lib/artifact-types'

export type ArtifactNote = {
  slug: string
  title: string
  date: string
  summary: string
  tags: string[]
  html: string
  artifact?: string
  artifactChrome?: ArtifactChrome
}

export type ArtifactProps = {
  note: ArtifactNote
  productionUrl: string
}

export type ArtifactDefinition = {
  id: string
  label: string
  chrome: ArtifactChrome
  notesHeading?: string
  Component: ComponentType<ArtifactProps>
}

const artifactRegistry: Record<string, ArtifactDefinition> = {
  'thirteen-f-report': {
    id: 'thirteen-f-report',
    label: '13F Institutional Holdings Report',
    chrome: 'immersive',
    notesHeading: '数据口径和后续判断。',
    Component: () => <ThirteenFReport />,
  },
}

export function getArtifactDefinition(id?: string): ArtifactDefinition | null {
  if (!id) {
    return null
  }

  return artifactRegistry[id] || null
}
