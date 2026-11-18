import { NextRequest, NextResponse } from 'next/server';
import { getPortalAuthConfig, savePortalAuthConfig } from '@/lib/db';

export async function GET() {
  try {
    const config = await getPortalAuthConfig();
    return NextResponse.json({
      success: true,
      securityQuestion: config.securityQuestion,
      updatedAt: config.updatedAt,
    });
  } catch (error) {
    console.error('GET /api/auth error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to load portal authentication metadata' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action } = body;
    const config = await getPortalAuthConfig();

    if (action === 'login') {
      const inputPassword = String(body.password || '').trim();
      if (inputPassword === config.password) {
        return NextResponse.json({
          success: true,
          securityQuestion: config.securityQuestion,
          recoveryKey: config.recoveryKey,
          updatedAt: config.updatedAt,
        });
      }
      return NextResponse.json(
        {
          success: false,
          error: 'Incorrect password. Please try again or click "Forgot Password?" below.',
        },
        { status: 401 }
      );
    }

    if (action === 'reset_password') {
      const { recoveryMethod, securityAnswer, recoveryKey, newPassword } = body;
      const trimmedNewPassword = String(newPassword || '').trim();

      if (!trimmedNewPassword || trimmedNewPassword.length < 4) {
        return NextResponse.json(
          { success: false, error: 'New password must be at least 4 characters long.' },
          { status: 400 }
        );
      }

      if (recoveryMethod === 'security_question') {
        const inputAnswer = String(securityAnswer || '').trim().toLowerCase();
        const expectedAnswer = config.securityAnswer.trim().toLowerCase();
        const isDefaultHqAnswer =
          expectedAnswer === 'pepiliyana' || expectedAnswer === 'nawala';
        const isValidAnswer = isDefaultHqAnswer
          ? inputAnswer === 'pepiliyana' || inputAnswer === 'nawala' || inputAnswer === 'pepiliyana head office'
          : inputAnswer === expectedAnswer;
        if (!inputAnswer || !isValidAnswer) {
          return NextResponse.json(
            {
              success: false,
              error: 'Incorrect security answer. Try again or switch to the Master Recovery Key tab.',
            },
            { status: 401 }
          );
        }
      } else if (recoveryMethod === 'recovery_key') {
        const inputKey = String(recoveryKey || '').trim().toUpperCase();
        const expectedKey = config.recoveryKey.trim().toUpperCase();
        if (!inputKey || inputKey !== expectedKey) {
          return NextResponse.json(
            {
              success: false,
              error: 'Invalid Master Recovery Key. Please check the key and try again.',
            },
            { status: 401 }
          );
        }
      } else {
        return NextResponse.json(
          { success: false, error: 'Invalid recovery verification method.' },
          { status: 400 }
        );
      }

      const updated = await savePortalAuthConfig({
        ...config,
        password: trimmedNewPassword,
      });

      return NextResponse.json({
        success: true,
        message: 'Password reset successfully!',
        securityQuestion: updated.securityQuestion,
        recoveryKey: updated.recoveryKey,
        updatedAt: updated.updatedAt,
      });
    }

    if (action === 'update_security') {
      const { currentPassword, newPassword, securityQuestion, securityAnswer, recoveryKey } = body;

      if (String(currentPassword || '').trim() !== config.password) {
        return NextResponse.json(
          { success: false, error: 'Current password is incorrect.' },
          { status: 401 }
        );
      }

      const nextPassword =
        newPassword && String(newPassword).trim().length > 0
          ? String(newPassword).trim()
          : config.password;

      if (nextPassword.length < 4) {
        return NextResponse.json(
          { success: false, error: 'Password must be at least 4 characters long.' },
          { status: 400 }
        );
      }

      const nextQuestion =
        securityQuestion && String(securityQuestion).trim().length > 0
          ? String(securityQuestion).trim()
          : config.securityQuestion;

      const nextAnswer =
        securityAnswer && String(securityAnswer).trim().length > 0
          ? String(securityAnswer).trim().toLowerCase()
          : config.securityAnswer;

      const nextRecoveryKey =
        recoveryKey && String(recoveryKey).trim().length > 0
          ? String(recoveryKey).trim().toUpperCase()
          : config.recoveryKey;

      const updated = await savePortalAuthConfig({
        ...config,
        password: nextPassword,
        securityQuestion: nextQuestion,
        securityAnswer: nextAnswer,
        recoveryKey: nextRecoveryKey,
      });

      return NextResponse.json({
        success: true,
        message: 'Security settings updated in Supabase Cloud!',
        securityQuestion: updated.securityQuestion,
        recoveryKey: updated.recoveryKey,
        updatedAt: updated.updatedAt,
      });
    }

    return NextResponse.json({ success: false, error: 'Unknown auth action' }, { status: 400 });
  } catch (error) {
    console.error('POST /api/auth error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to process authentication request' },
      { status: 500 }
    );
  }
}
