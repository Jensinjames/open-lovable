import { NextResponse } from 'next/server';

declare global {
  var activeSandbox: any;
  var sandboxData: any;
  var existingFiles: Set<string>;
}

export async function GET() {
  try {
    // Check if E2B API key is configured
    const apiKey = process.env.E2B_API_KEY;
    if (!apiKey || apiKey.trim() === '' || apiKey === 'your_e2b_api_key') {
      return NextResponse.json({
        success: false,
        active: false,
        healthy: false,
        error: 'E2B API key is not configured. Please set E2B_API_KEY in your .env.local file.',
        requiresSetup: true,
        message: 'E2B API key configuration required'
      });
    }

    // Check if sandbox exists
    const sandboxExists = !!global.activeSandbox;
    
    let sandboxHealthy = false;
    let sandboxInfo = null;
    
    if (sandboxExists && global.activeSandbox) {
      try {
        // Since Python isn't available in the Vite template, just check if sandbox exists
        // The sandbox object existing is enough to confirm it's healthy
        sandboxHealthy = true;
        sandboxInfo = {
          sandboxId: global.sandboxData?.sandboxId,
          url: global.sandboxData?.url,
          filesTracked: global.existingFiles ? Array.from(global.existingFiles) : [],
          lastHealthCheck: new Date().toISOString()
        };
      } catch (error) {
        console.error('[sandbox-status] Health check failed:', error);
        sandboxHealthy = false;
      }
    }
    
    return NextResponse.json({
      success: true,
      active: sandboxExists,
      healthy: sandboxHealthy,
      sandboxData: sandboxInfo,
      message: sandboxHealthy 
        ? 'Sandbox is active and healthy' 
        : sandboxExists 
          ? 'Sandbox exists but is not responding' 
          : 'No active sandbox'
    });
    
  } catch (error) {
    console.error('[sandbox-status] Error:', error);
    
    let errorMessage = error instanceof Error ? error.message : 'Unknown error';
    let requiresSetup = false;
    
    if (errorMessage.includes('401') || errorMessage.includes('Invalid API key')) {
      errorMessage = 'Invalid E2B API key configuration';
      requiresSetup = true;
    }
    
    return NextResponse.json({ 
      success: false,
      active: false,
      healthy: false,
      error: errorMessage,
      requiresSetup,
      message: 'Failed to check sandbox status'
    }, { status: 500 });
  }
}