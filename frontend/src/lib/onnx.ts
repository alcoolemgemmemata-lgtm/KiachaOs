import * as ort from 'onnxruntime-web'

export async function loadOnnxModel(modelPath: string) {
  try {
    const session = await ort.InferenceSession.create(modelPath)
    return session
  } catch (error) {
    console.error('Failed to load ONNX model:', error)
    return null
  }
}

export async function runInference(session: ort.InferenceSession, input: any) {
  try {
    const results = await session.run(input)
    return results
  } catch (error) {
    console.error('Inference failed:', error)
    return null
  }
}
