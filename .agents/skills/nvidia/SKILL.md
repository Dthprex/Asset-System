---
name: nvidia
description: >-
  Use this skill when integrating NVIDIA developer technologies, GPU computing (CUDA, TensorRT), NVIDIA NIM microservices, NeMo, DeepStream, or deploying AI model workloads on NVIDIA hardware and cloud infrastructure.
---

# NVIDIA Developer & AI Acceleration Guidelines

This skill provides architecture guidelines and best practices for developing software, AI models, and infrastructure powered by NVIDIA hardware, CUDA, TensorRT, and NVIDIA NIM microservices.

## 1. Core Ecosystem Overview

* **CUDA (Compute Unified Device Architecture)**: General purpose parallel computing platform and programming model for NVIDIA GPUs.
* **TensorRT**: High-performance deep learning inference optimizer and runtime for production deployment.
* **NVIDIA NIM (Inference Microservices)**: Containerized microservices offering optimized inference for open models (Llama, Mistral, Whisper, etc.) with standard OpenAI-compatible REST APIs.
* **NeMo Framework**: End-to-end platform for building, training, and fine-tuning generative AI and conversational AI models.

## 2. NVIDIA NIM Integration in Web Applications

When integrating NVIDIA NIM microservices with Next.js or Node.js backends:

```typescript
import OpenAI from "openai";

// NVIDIA NIM uses OpenAI-compatible client interface
export const nvidiaClient = new OpenAI({
  apiKey: process.env.NVIDIA_API_KEY,
  baseURL: "https://integrate.api.nvidia.com/v1",
});

export async function generateAssetDescription(assetSpecs: string) {
  const completion = await nvidiaClient.chat.completions.create({
    model: "meta/llama-3.1-70b-instruct",
    messages: [
      {
        role: "system",
        content: "You are an IT Asset Specialist for cosmetics.lk in Sri Lanka. Format technical hardware intake notes accurately."
      },
      {
        role: "user",
        content: `Summarize technical intake specification for: ${assetSpecs}`
      }
    ],
    temperature: 0.2,
    max_tokens: 500,
  });

  return completion.choices[0]?.message?.content;
}
```

## 3. Best Practices

1. **Precision & Quantization**:
   - Prefer FP16 or INT8 (AWQ/GPTQ) for inference to maximize throughput on RTX and datacenter GPUs.
2. **Batching & Concurrency**:
   - Use dynamic batching when serving multiple client requests to saturate Tensor Cores.
3. **Environment & Hardware Inspection**:
   - Check GPU availability using `nvidia-smi` before initializing intensive acceleration libraries.
   - Fall back gracefully to CPU compute when GPU devices are absent or busy.
