import {
  mutations,
  Recording,
  RecordingEntry,
  setupRecording,
  SetupRecordingInput,
} from '@jupiterone/integration-sdk-testing';

export { Recording };

export const artifactoryMutations = {
  ...mutations,
};

export function setupArtifactoryRecording(
  input: SetupRecordingInput,
): Recording {
  return setupRecording({
    mutateEntry: mutateRecordingEntry,
    ...input,
  });
}

function mutateRecordingEntry(entry: RecordingEntry): void {
  artifactoryMutations.unzipGzippedRecordingEntry(entry);
}
