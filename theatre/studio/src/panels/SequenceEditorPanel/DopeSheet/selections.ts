import type {IDerivation} from '@theatre/dataverse'
import {prism, val} from '@theatre/dataverse'
import type {
  KeyframeId,
  ObjectAddressKey,
  ProjectId,
  SequenceTrackId,
  SheetId,
} from '@theatre/shared/utils/ids'
import getStudio from '@theatre/studio/getStudio'
import type {DopeSheetSelection} from '@theatre/studio/panels/SequenceEditorPanel/layout/layout'
import type {Keyframe} from '@theatre/core/projects/store/types/SheetState_Historic'

/**
 * Keyframe connections are considered to be selected if the first
 * keyframe in the connection is selected
 */
export function isKeyframeConnectionInSelection(
  keyframeConnection: [Keyframe, Keyframe],
  selection: DopeSheetSelection,
): boolean {
  for (const {keyframeId} of flatSelectionKeyframeIds(selection)) {
    if (keyframeConnection[0].id === keyframeId) return true
  }
  return false
}

export function selectedKeyframeConnections(
  projectId: ProjectId,
  sheetId: SheetId,
  selection: DopeSheetSelection | undefined,
): IDerivation<Array<[Keyframe, Keyframe]>> {
  return prism(() => {
    if (selection === undefined) return []

    let ckfs: Array<[Keyframe, Keyframe]> = []

    for (const {objectKey, trackId} of flatSelectionTrackIds(selection)) {
      const track = val(
        getStudio().atomP.historic.coreByProject[projectId].sheetsById[sheetId]
          .sequence.tracksByObject[objectKey].trackData[trackId],
      )

      if (track) {
        ckfs = ckfs.concat(
          keyframeConnections(track.keyframes).filter((kfc) =>
            isKeyframeConnectionInSelection(kfc, selection),
          ),
        )
      }
    }
    return ckfs
  })
}

export function keyframeConnections(
  keyframes: Array<Keyframe>,
): Array<[Keyframe, Keyframe]> {
  return keyframes
    .map((kf, i) => [kf, keyframes[i + 1]] as [Keyframe, Keyframe])
    .slice(0, -1) // remmove the last entry because it is [kf, undefined]
}

export function flatSelectionKeyframeIds(selection: DopeSheetSelection): Array<{
  objectKey: ObjectAddressKey
  trackId: SequenceTrackId
  keyframeId: KeyframeId
}> {
  const result = []
  for (const [objectKey, maybeObjectRecord] of Object.entries(
    selection?.byObjectKey ?? {},
  )) {
    for (const [trackId, maybeTrackRecord] of Object.entries(
      maybeObjectRecord?.byTrackId ?? {},
    )) {
      for (const keyframeId of Object.keys(
        maybeTrackRecord?.byKeyframeId ?? {},
      )) {
        result.push({objectKey, trackId, keyframeId})
      }
    }
  }
  return result
}

export function flatSelectionTrackIds(selection: DopeSheetSelection): Array<{
  objectKey: ObjectAddressKey
  trackId: SequenceTrackId
  keyframeIds: Array<KeyframeId>
}> {
  const result = []
  for (const [objectKey, maybeObjectRecord] of Object.entries(
    selection?.byObjectKey ?? {},
  )) {
    for (const [trackId, maybeTrackRecord] of Object.entries(
      maybeObjectRecord?.byTrackId ?? {},
    )) {
      result.push({
        objectKey,
        trackId,
        keyframeIds: Object.keys(maybeTrackRecord?.byKeyframeId ?? {}),
      })
    }
  }
  return result
}