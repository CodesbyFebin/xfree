import { NextRequest, NextResponse } from 'next/server';
import { TOOLS } from '@/lib/data/tools';

export const runtime = 'edge';

const WORKFLOWS = [
  {
    id: 'seo-audit',
    name: 'SEO Audit Workflow',
    description: 'Complete SEO audit using multiple XFree tools',
    steps: [
      { toolId: 'bulk-url-extractor', action: 'Extract URLs from raw HTML', order: 1 },
      { toolId: 'xml-sitemap-generator', action: 'Generate XML sitemap', order: 2 },
      { toolId: 'meta-tag-generator', action: 'Generate meta tags', order: 3 },
    ],
    category: 'seo',
    estimatedTime: '2-5 minutes',
  },
  {
    id: 'data-format-conversion',
    name: 'Data Format Conversion',
    description: 'Convert between JSON, CSV, YAML, and XML formats',
    steps: [
      { toolId: 'json-formatter', action: 'Format and validate JSON', order: 1 },
      { toolId: 'json-to-csv-converter', action: 'Convert to CSV', order: 2 },
      { toolId: 'yaml-validator', action: 'Validate and convert to YAML', order: 3 },
    ],
    category: 'developer',
    estimatedTime: '1-2 minutes',
  },
  {
    id: 'security-check',
    name: 'Security Checklist',
    description: 'Validate tokens, hashes, and encoded data',
    steps: [
      { toolId: 'jwt-decoder', action: 'Decode and validate JWT', order: 1 },
      { toolId: 'hash-generator', action: 'Generate SHA hashes', order: 2 },
      { toolId: 'base64-tool', action: 'Encode/decode Base64', order: 3 },
    ],
    category: 'security',
    estimatedTime: '1-3 minutes',
  },
  {
    id: 'code-quality',
    name: 'Code Quality Check',
    description: 'Format and validate code snippets',
    steps: [
      { toolId: 'json-formatter', action: 'Format JSON', order: 1 },
      { toolId: 'regex-tester', action: 'Test regex patterns', order: 2 },
      { toolId: 'sql-formatter', action: 'Format SQL queries', order: 3 },
    ],
    category: 'developer',
    estimatedTime: '2-4 minutes',
  },
  {
    id: 'api-prep',
    name: 'API Preparation',
    description: 'Prepare and validate API-related data',
    steps: [
      { toolId: 'json-formatter', action: 'Format JSON payload', order: 1 },
      { toolId: 'url-encoder', action: 'Encode URL parameters', order: 2 },
      { toolId: 'base64-tool', action: 'Encode/decode body content', order: 3 },
    ],
    category: 'developer',
    estimatedTime: '1-2 minutes',
  },
  {
    id: 'privacy-check',
    name: 'Privacy Security Check',
    description: 'Verify data encoding and hashing for privacy',
    steps: [
      { toolId: 'hash-generator', action: 'Generate secure hashes', order: 1 },
      { toolId: 'password-generator', action: 'Generate strong passwords', order: 2 },
      { toolId: 'uuid-generator', action: 'Generate unique identifiers', order: 3 },
    ],
    category: 'security',
    estimatedTime: '30 seconds - 1 minute',
  },
];

export async function GET() {
  const workflowsWithTools = WORKFLOWS.map(workflow => ({
    ...workflow,
    steps: workflow.steps.map(step => {
      const tool = TOOLS.find(t => t.id === step.toolId);
      return {
        ...step,
        toolName: tool?.title ?? step.toolId,
        toolUrl: tool ? `https://www.xfree.in/tools/${tool.slug}` : null,
      };
    }),
  }));

  return new NextResponse(JSON.stringify({
    version: '1.0',
    lastUpdated: new Date().toISOString(),
    totalWorkflows: workflowsWithTools.length,
    workflows: workflowsWithTools,
  }, null, 2), {
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'public, max-age=86400',
    },
  });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { workflowId, stepIndex } = body;

    if (!workflowId) {
      return NextResponse.json(
        { error: 'Missing workflowId parameter' },
        { status: 400 }
      );
    }

    const workflow = WORKFLOWS.find(w => w.id === workflowId);

    if (!workflow) {
      return NextResponse.json(
        { error: `Workflow ${workflowId} not found` },
        { status: 404 }
      );
    }

    const stepsWithTools = workflow.steps.map(step => {
      const tool = TOOLS.find(t => t.id === step.toolId);
      return {
        ...step,
        toolName: tool?.title ?? step.toolId,
        toolUrl: tool ? `https://www.xfree.in/tools/${tool.slug}` : null,
        toolDescription: tool?.shortDescription,
      };
    });

    return NextResponse.json({
      workflowId,
      workflowName: workflow.name,
      description: workflow.description,
      category: workflow.category,
      estimatedTime: workflow.estimatedTime,
      currentStep: stepIndex ?? 0,
      totalSteps: workflow.steps.length,
      steps: stepsWithTools,
      nextStep: stepIndex !== undefined && stepIndex < workflow.steps.length - 1
        ? stepsWithTools[stepIndex + 1]
        : null,
    }, {
      headers: {
        'Cache-Control': 'no-store',
      },
    });
  } catch {
    return NextResponse.json(
      { error: 'Invalid request body' },
      { status: 400 }
    );
  }
}
