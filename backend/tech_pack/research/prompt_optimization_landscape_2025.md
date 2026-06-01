# Prompt Optimization Landscape (2024-2025)

## Overview

The field of prompt optimization has shifted from manual engineering to automated, systematic, and LLM-driven approaches. Key trends include using LLMs to optimize their own prompts (OPRO), programmatically defining LLM behaviors (DSPy), and using multi-stage optimization for complex pipelines (MIPRO).

## Key Algorithms & Frameworks

### 1. OPRO (Optimization by PROmpting)

- **Concept**: Uses LLMs as optimizers. A "meta-prompt" guides the LLM to generate better prompts based on a history of previous prompts and their scores.
- **Mechanism**: Iterative process. `Optimizer(history) -> New Prompt -> Evaluate -> Add to History`.
- **Strengths**: leveraging the LLM's own reasoning capabilities; effective for open-ended tasks.
- **Relevance**: Selected as the baseline for the Macy's Tek Pak project due to its flexibility and single-model simplicity.

### 2. APE (Automatic Prompt Engineer)

- **Concept**: Treats prompt engineering as a "program synthesis" problem.
- **Mechanism**:
  1. **Proposal**: Generate candidate instruction sets from input/output pairs.
  2. **Selection**: Evaluate candidates on a validation set.
  3. **Refinement**: Iteratively improve the best candidates.
- **Key Insight**: Formalizes the search space of prompts.

### 3. DSPy (Declarative Self-improving Python)

- **Concept**: A framework that separates the "logic" (signatures) from the "wording" (prompts).
- **Mechanism**: Compiles high-level signatures into optimized prompts (or finetunes) using "Teleprompters" (optimizers).
- **Strengths**: Modular, reproducible, and handles complex multi-hop pipelines better than raw prompting.

### 4. MIPRO (Multi-Prompt Instruction PRoposal Optimizer)

- **Concept**: Optimizes both instructions and few-shot examples together across multiple stages of a pipeline.
- **Mechanism**: Uses Bayesian optimization or similar search strategies to find the best combination of prompts and examples.
- **Strengths**: specialized for RAG and multi-step agents where data dependencies exist.

## Selected Approach for Macy's Tek Pak: Trajectory-based OPRO

For the current phase of the Macy's Tek Pak project, we implemented an enhanced **Trajectory-based OPRO** algorithm.

### Enhancements over Basic OPRO

1.  **Trajectory Context**: Instead of just showing failure cases, the meta-prompt receives a summary of the _entire optimization trajectory_ (or recent window). This allows the optimizer to see what has been tried, preventing regression and loops.
2.  **Chain-of-Thought (CoT) Reasoning**: The optimizer is explicitly instructed to output a "Reasoning" block before the "Prompt". This forces the model to analyze _why_ a failure occurred (e.g., "The arrows were placed but the text was too small") before proposing a fix.
3.  **Structured Meta-Prompting**: The meta-prompt explicitly categorizes feedback into "Current Scores", "Failed Examples (Analysis)", and "Strategies to consider" (e.g., Knowledge Injection, Constraint Refinement).
