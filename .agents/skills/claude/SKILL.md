---
name: claude
description: >-
  Use this skill when developing, refactoring, or optimizing code using Anthropic Claude models (Claude 3.5 Sonnet, Claude 3 Opus, Claude 3.7 Sonnet) and Claude Code workflows. Covers prompt engineering, XML tag structuring, artifact patterns, and reasoning-driven development.
---

# Claude Engineering & Development Guidelines

This skill provides comprehensive standards, prompt architectures, and implementation patterns for Anthropic Claude models (including Claude 3.5 Sonnet, Claude 3.7 Sonnet, and Claude Opus).

## 1. Core Principles

1. **Explicit Thinking & Chain of Thought**:
   - Claude excels when prompted to reflect before responding.
   - For complex architecture or bug analysis, structure instructions with deliberate thinking blocks:
     ```markdown
     <thinking>
     Analyze requirements, constraints, edge cases, and architectural tradeoffs.
     </thinking>
     ```

2. **Semantic XML Tag Structuring**:
   - Claude parses XML tags with exceptional accuracy.
   - Use descriptive tags to delineate inputs, instructions, constraints, and schemas:
     ```xml
     <context>
       Cosmetics.lk IT Asset Tracking System
     </context>
     <instructions>
       Validate IMEI format, dual SIM registration, and LKR currency formatting.
     </instructions>
     <expected_output>
       TypeScript interface with Zod validation schema.
     </expected_output>
     ```

3. **Artifact-First Code Delivery**:
   - Deliver self-contained, modular, production-ready code.
   - Avoid placeholder comments such as `// TODO: implement later` or `/* ... rest of code here ... */`. Provide complete, working code blocks with explicit imports, type safety, and error handling.

## 2. Frontend & Next.js Patterns for Claude

* **App Router Architecture**:
  * Keep Server Components as the default for data fetching and database operations.
  * Use `'use client'` only when state, browser APIs, or event listeners (forms, modals, interactive dropdowns) are required.
* **Component Modularity**:
  * Single Responsibility Principle (SRP): keep cards, dialogs, forms, and tables separated.
  * Colocate sub-components or place in `components/ui` or domain-specific folders (`components/assets`, `components/history`).
* **Design Systems (Tailwind + shadcn/ui)**:
  * Use semantic color tokens (`bg-background`, `text-foreground`, `border-border`, `bg-primary/10`).
  * Add micro-interactions: smooth transitions, hover states, status pills, and keyboard navigation.

## 3. Best Practices Checklist

- [ ] Clear delimiter tags (`<task>`, `<constraints>`, `<output_format>`).
- [ ] Strict TypeScript typing without `any`.
- [ ] Graceful null checks for optional hardware properties (e.g., SIM slots, warranty notes).
- [ ] Human-readable timestamps and localized formatting (Asia/Colombo timezone).
