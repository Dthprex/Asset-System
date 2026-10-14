---
name: codex
description: >-
  Use this skill for code synthesis, algorithmic reasoning, AST manipulation, TypeScript/Python test generation, and AI-assisted pair-programming based on OpenAI Codex and GPT-4 code intelligence guidelines.
---

# Codex Code Intelligence & Synthesis Guidelines

This skill provides patterns and heuristics for high-quality code generation, algorithmic implementation, and automated refactoring inspired by OpenAI Codex and state-of-the-art code LLMs.

## 1. Principles of Robust Code Synthesis

1. **Type-Driven Development**:
   - Define exact data models, interfaces, and function signatures first before implementing logic.
   - Avoid `any` types; use discriminating unions and exhaustive pattern matching:
     ```typescript
     export type AssignmentType =
       | 'LOCATION_SHOWROOM'
       | 'DEPARTMENT_SHARED'
       | 'PERMANENT_EMPLOYEE'
       | 'TEMPORARY_BORROW';
     ```

2. **Self-Documenting Code**:
   - Write meaningful, domain-specific variable and function names.
   - Use TSDoc / JSDoc comments to document parameter expectations, units of measurement (e.g., currency in LKR, duration in days), and side-effects.

3. **Defensive Programming & Immutability**:
   - Validate API payloads at runtime (e.g., with Zod or type guards).
   - Return clean cloned copies of updated records rather than mutating arrays or objects in place.

4. **Zero-Hallucination API Usage**:
   - Use standard Web APIs, Next.js standard conventions (e.g., `NextRequest`, `NextResponse`), and verified library methods.
   - When building UI components, verify prop signatures against standard shadcn/ui or Radix UI specifications.

## 2. Code Synthesis Heuristics

* **Step 1: Input Validation**: Validate presence of required keys, dates, and number bounds.
* **Step 2: Core Domain Logic**: Execute clean pure functions where possible.
* **Step 3: Error Boundaries**: Wrap I/O operations (file writes, database reads, network calls) with structured error handling.
* **Step 4: Output Serialization**: Format currency, dates in `Asia/Colombo` locale, and return standardized JSON responses:
  ```typescript
  {
    success: boolean;
    data?: T;
    error?: string;
  }
  ```
